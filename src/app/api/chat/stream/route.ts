import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { CLINICAL_CHAT_SYSTEM_PROMPT, CONVENTIONAL_LENS_ADDENDUM, COMPARISON_LENS_ADDENDUM } from "@/lib/ai/anthropic";
import { buildSourceFilterAddendum, type SourceId } from "@/lib/ai/source-filter";
import { filterAllowedSources, isFeatureAvailable } from "@/lib/tier/gates";
import { chatMessageSchema } from "@/lib/validations/chat";
import { validateCsrf } from "@/lib/api/csrf";
import { auditLog } from "@/lib/api/audit";
import { validateInputSafety, PromptInjectionError } from "@/lib/api/validate-input";
import { groundCitations, type ReferenceChunk } from "@/lib/citations/ground";
import { retrieveEvidence } from "@/lib/evidence/retrieve";
import { formatEvidenceContext } from "@/lib/evidence/format-context";
import { shouldFallbackToLiveSearch, searchPubMedLive, mergeEvidence } from "@/lib/evidence/pubmed-live-search";
import { retrieveContext } from "@/lib/rag/retrieve";
import { formatRagContext } from "@/lib/rag/format-context";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  console.log("[Chat] POST /api/chat/stream — v2 with PubMed fallback + grounding debug");
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get practitioner profile
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, daily_query_count, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) {
      return new Response(
        JSON.stringify({ error: "Practitioner profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check query limits
    const { data: allowed } = await supabase.rpc(
      "check_and_increment_query",
      { p_practitioner_id: practitioner.id }
    );

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Daily query limit reached",
          limit: practitioner.subscription_tier === "free" ? 2 : "unlimited",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }
    const { message, conversation_id, patient_id, is_deep_consult, clinical_lens, source_filter, attachments } = parsed.data;

    // Prompt injection detection
    validateInputSafety(message, {
      request,
      practitionerId: practitioner.id,
      resourceType: "conversation",
      resourceId: conversation_id ?? undefined,
    });

    // Get or create conversation
    const model = is_deep_consult ? MODELS.advanced : MODELS.standard;
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          practitioner_id: practitioner.id,
          patient_id: patient_id || null,
          title: message.slice(0, 100),
          is_deep_consult,
          model_used: model,
        })
        .select()
        .single();

      if (convError) {
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      convId = newConv.id;
    }

    // Build user message content — inject attachment text if present
    let userContent = message;
    if (attachments?.length) {
      const attachmentBlock = attachments
        .filter((a) => a.extracted_text)
        .map((a) => `--- ${a.name} ---\n${a.extracted_text}\n---`)
        .join("\n\n");
      if (attachmentBlock) {
        userContent = `[Attached Files]\n${attachmentBlock}\n\n${message}`;
      }
    }

    // Save user message (store attachment metadata without extracted_text)
    const attachmentMeta = attachments?.map(({ extracted_text: _, ...rest }) => rest) ?? [];
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user" as const,
      content: message,
      attachments: attachmentMeta,
    });

    // Build conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build patient context
    let patientContext = "";
    if (patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("sex, date_of_birth, chief_complaints, current_medications, supplements, allergies, medical_history")
        .eq("id", patient_id)
        .single();

      if (patient) {
        patientContext = `\n\n## Patient Context\n- Sex: ${patient.sex || "Not specified"}\n- DOB: ${patient.date_of_birth || "Not specified"}\n- Chief Complaints: ${patient.chief_complaints?.join(", ") || "None listed"}\n- Current Medications: ${patient.current_medications || "None listed"}\n- Supplements: ${patient.supplements || "None listed"}\n- Allergies: ${patient.allergies?.join(", ") || "NKDA"}\n- History: ${patient.medical_history || "Not provided"}`;
      }
    }

    // Build messages array — replace last user message with attachment-enriched content
    const messages = (history || [])
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }));
    // Replace the final user message content with the attachment-enriched version
    if (attachments?.length && messages.length > 0) {
      const lastIdx = messages.length - 1;
      if (messages[lastIdx].role === "user") {
        messages[lastIdx] = { ...messages[lastIdx], content: userContent };
      }
    }

    // RAG: Retrieve relevant evidence (best-effort, non-blocking on failure)
    let evidenceContext = "";
    let ragChunkCount = 0;
    const referenceChunks: ReferenceChunk[] = [];
    try {
      const evidence = await retrieveEvidence(message, {
        sources: (source_filter ?? []) as string[],
        matchCount: is_deep_consult ? 12 : 8,
      });

      // Live PubMed fallback when local evidence is insufficient
      let allChunks = evidence.chunks;
      if (shouldFallbackToLiveSearch(evidence)) {
        try {
          const liveChunks = await searchPubMedLive(message, 5);
          if (liveChunks.length > 0) {
            allChunks = mergeEvidence(evidence.chunks, liveChunks);
            console.log(`[RAG] PubMed live fallback: ${liveChunks.length} articles found, ${allChunks.length} total chunks`);
          }
        } catch (liveErr) {
          console.warn("[RAG] PubMed live fallback failed:", liveErr);
        }
      }

      evidenceContext = formatEvidenceContext({ chunks: allChunks, queryTimeMs: evidence.queryTimeMs }, 1);
      ragChunkCount = allChunks.length;
      console.log(`[Chat] Evidence: ${ragChunkCount} chunks, context length: ${evidenceContext.length} chars, fallback triggered: ${shouldFallbackToLiveSearch(evidence)}`);
      for (const chunk of allChunks) {
        referenceChunks.push({
          refNum: referenceChunks.length + 1,
          title: chunk.title,
          authors: chunk.authors,
          year: chunk.publishedDate?.split("-")[0] || "",
          doi: chunk.doi || "",
          source: chunk.source,
          publication: chunk.publication || chunk.source,
          evidenceLevel: chunk.evidenceLevel || "other",
          content: chunk.content || "",
        });
      }
    } catch (err) {
      console.warn("[RAG] Evidence retrieval failed, proceeding without:", err);
    }

    // Partnership RAG: Retrieve relevant chunks from partner knowledge base (best-effort)
    let partnershipContext = "";
    let partnershipSources: string[] = [];
    try {
      const partnerChunks = await retrieveContext({
        query: message,
        maxChunks: is_deep_consult ? 6 : 4,
        threshold: 0.7,
      });
      partnershipContext = formatRagContext(partnerChunks, referenceChunks.length + 1);
      partnershipSources = [...new Set(partnerChunks.map((c) => c.source).filter(Boolean))];
      for (const chunk of partnerChunks) {
        referenceChunks.push({
          refNum: referenceChunks.length + 1,
          title: chunk.title,
          authors: chunk.authors ?? [],
          year: chunk.publishedDate?.split("-")[0] || "",
          doi: chunk.doi || "",
          source: chunk.source,
          publication: chunk.publication || chunk.source,
          evidenceLevel: chunk.evidenceLevel || "other",
          content: chunk.content || "",
          ragSource: chunk.source,
        });
      }
    } catch (err) {
      console.warn("[RAG] Partnership context retrieval failed, proceeding without:", err);
    }

    // Stream response
    const encoder = new TextEncoder();
    let fullContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation_id first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "conversation_id", conversation_id: convId })}\n\n`
            )
          );

          const usage = await streamCompletion(
            {
              model,
              maxTokens: is_deep_consult ? 4096 : 2048,
              system: CLINICAL_CHAT_SYSTEM_PROMPT + patientContext + (clinical_lens === "conventional" ? CONVENTIONAL_LENS_ADDENDUM : clinical_lens === "both" ? COMPARISON_LENS_ADDENDUM : "") + buildSourceFilterAddendum(filterAllowedSources((source_filter ?? []) as string[], practitioner.subscription_tier) as SourceId[]) + evidenceContext + (partnershipContext ? "\n\n" + partnershipContext : ""),
              messages,
            },
            {
              onText(text) {
                fullContent += text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text_delta", text })}\n\n`
                  )
                );
              },
            }
          );

          // Ground citations: convert [REF-N] to real [Author, Year](DOI) from RAG chunks
          let resolvedContent = fullContent;
          let resolvedCitationsForDB: object[] = [];
          if (referenceChunks.length > 0) {
            console.log(`[Chat] Grounding ${referenceChunks.length} refs. REF-N matches in content: ${(fullContent.match(/\[REF-\d+\]/g) || []).length}`);
            const grounding = groundCitations(fullContent, referenceChunks);
            resolvedContent = grounding.content;

            console.log(`[Chat] Grounding result: ${grounding.flatCitations.length} citations resolved, content changed: ${resolvedContent !== fullContent}`);
            if (resolvedContent !== fullContent) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "citations_resolved", content: resolvedContent })}\n\n`
                )
              );
            }

            if (Object.keys(grounding.citationsByKey).length > 0) {
              // Only emit multi-citation metadata for Pro users
              if (isFeatureAvailable(practitioner.subscription_tier, "multi_citation_badges")) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "citation_metadata_multi", citationsByKey: grounding.citationsByKey })}\n\n`
                  )
                );
              }

              resolvedCitationsForDB = grounding.flatCitations.map((c) => ({
                citationText: c.citationText,
                title: c.title,
                source: c.source,
                authors: c.authors,
                year: c.year ? parseInt(c.year) : undefined,
                doi: c.doi,
                evidence_level: c.evidenceLevel,
              }));
            }

            if (grounding.unresolvedRefs.length > 0) {
              console.warn(`[Citations] Unresolved REF numbers: ${grounding.unresolvedRefs.join(", ")}`);
            }
          }

          // Emit source attributions for partnership RAG (e.g. Apex Energetics)
          if (partnershipSources.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "source_attributions", sources: partnershipSources })}\n\n`
              )
            );
          }

          // Save assistant message (with resolved citations if available)
          const { data: savedMessage } = await supabase
            .from("messages")
            .insert({
              conversation_id: convId,
              role: "assistant" as const,
              content: resolvedContent,
              citations: resolvedCitationsForDB,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
            })
            .select()
            .single();

          auditLog({
            request,
            practitionerId: practitioner.id,
            action: "query",
            resourceType: "conversation",
            resourceId: convId ?? undefined,
            detail: {
              model,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
              is_deep_consult,
              clinical_lens,
              source_filter: source_filter ?? [],
              has_patient_context: !!patient_id,
              has_rag_context: ragChunkCount > 0,
              rag_chunk_count: ragChunkCount,
              attachment_count: attachments?.length ?? 0,
            },
          });

          // Send final event with metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "message_complete",
                message_id: savedMessage?.id,
                usage: { input_tokens: usage.inputTokens, output_tokens: usage.outputTokens },
                queries_remaining:
                  practitioner.subscription_tier === "free"
                    ? Math.max(0, 2 - (practitioner.daily_query_count + 1))
                    : null,
              })}\n\n`
            )
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof PromptInjectionError) {
      return jsonError("Your message was blocked by our safety filter. Please rephrase your question.", 400);
    }
    console.error("Chat stream error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

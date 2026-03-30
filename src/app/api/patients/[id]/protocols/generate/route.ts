import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { assembleProtocolContext } from "@/lib/ai/protocol-context";
import {
  PROTOCOL_GENERATION_SYSTEM_PROMPT,
  buildProtocolUserMessage,
} from "@/lib/ai/protocol-prompts";
import { generateProtocolSchema, aiProtocolOutputSchema } from "@/lib/validations/protocol";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { auditLog } from "@/lib/api/audit";
import { validateInputSafety, PromptInjectionError } from "@/lib/api/validate-input";
import { isFeatureAvailable } from "@/lib/tier/gates";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — complex multi-phase protocol generation

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── CSRF ────────────────────────────────────────────────────────
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: patientId } = await params;
    const supabase = await createClient();

    // ── Auth ────────────────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // ── Pro+ tier gate ──────────────────────────────────────────────
    if (!isFeatureAvailable(practitioner.subscription_tier, "multi_phase_protocols")) {
      return jsonError(
        "Protocol Generator Pro is a Pro+ feature. Upgrade to Pro+ to access.",
        403
      );
    }

    // ── Rate limit ──────────────────────────────────────────────────
    const rateLimitError = await checkRateLimit(
      supabase,
      practitioner.id,
      practitioner.subscription_tier,
      "protocol_generate"
    );
    if (rateLimitError) return rateLimitError;

    // ── Validate patient ownership ──────────────────────────────────
    const { data: patient } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!patient) return jsonError("Patient not found", 404);

    // ── Parse & validate body ───────────────────────────────────────
    const body = await request.json();
    const parsed = generateProtocolSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { focus_areas, custom_instructions } = parsed.data;

    // ── Prompt injection detection on custom instructions ───────────
    if (custom_instructions) {
      validateInputSafety(custom_instructions, {
        request,
        practitionerId: practitioner.id,
        resourceType: "protocol",
        resourceId: patientId,
      });
    }

    // ── SSE Stream ──────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          // ── Phase 1: Assemble clinical context ────────────────────
          send({ type: "status", message: "Assembling clinical context..." });

          const context = await assembleProtocolContext(
            supabase,
            patientId,
            practitioner.id,
            focus_areas,
            custom_instructions
          );

          // ── Phase 2: Create draft protocol row ────────────────────
          send({ type: "status", message: "Preparing protocol..." });

          const { data: protocol, error: insertError } = await supabase
            .from("treatment_protocols")
            .insert({
              patient_id: patientId,
              practitioner_id: practitioner.id,
              title: "Generating...",
              status: "draft",
              focus_areas,
              generation_context: {
                focus_areas,
                custom_instructions: custom_instructions || null,
                model: MODELS.advanced,
                generated_at: new Date().toISOString(),
              },
            })
            .select("id")
            .single();

          if (insertError || !protocol) {
            send({
              type: "error",
              message: "Failed to create protocol record",
            });
            controller.close();
            return;
          }

          const protocolId = protocol.id;

          // ── Phase 3: Build prompts ────────────────────────────────
          send({ type: "status", message: "Generating protocol..." });

          const systemPrompt = PROTOCOL_GENERATION_SYSTEM_PROMPT;
          const userMessage = buildProtocolUserMessage(context);

          // ── Phase 4: Stream AI completion ─────────────────────────
          let accumulated = "";

          const streamResult = await streamCompletion(
            {
              model: MODELS.advanced,
              maxTokens: 8192,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            },
            {
              onText(text) {
                accumulated += text;
                send({ type: "streaming", text });
              },
            }
          );

          // ── Phase 5: Parse JSON output ────────────────────────────
          send({ type: "status", message: "Processing protocol data..." });

          let protocolData;
          try {
            // Extract JSON from accumulated content (AI may wrap in markdown)
            const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error("No JSON object found in AI response");
            }
            const rawParsed = JSON.parse(jsonMatch[0]);
            protocolData = aiProtocolOutputSchema.parse(rawParsed);
          } catch (parseErr) {
            console.error(
              "[Protocol Generate] JSON parse/validation failed:",
              parseErr
            );

            // Save raw content for debugging
            await supabase
              .from("treatment_protocols")
              .update({
                title: "Generation Failed — Review Required",
                generation_context: {
                  focus_areas,
                  custom_instructions: custom_instructions || null,
                  model: MODELS.advanced,
                  generated_at: new Date().toISOString(),
                  raw_ai_output: accumulated,
                  parse_error:
                    parseErr instanceof Error
                      ? parseErr.message
                      : "Unknown parse error",
                  input_tokens: streamResult.inputTokens,
                  output_tokens: streamResult.outputTokens,
                },
              })
              .eq("id", protocolId);

            send({
              type: "error",
              message:
                "Protocol generation completed but output could not be parsed. The draft has been saved for review.",
              protocol_id: protocolId,
            });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // ── Phase 6: Save protocol and phases to DB ───────────────
          send({ type: "status", message: "Saving protocol phases..." });

          // Update the protocol with the parsed title and duration
          await supabase
            .from("treatment_protocols")
            .update({
              title: protocolData.title,
              total_duration_weeks: protocolData.total_duration_weeks,
              generation_context: {
                focus_areas,
                custom_instructions: custom_instructions || null,
                model: MODELS.advanced,
                generated_at: new Date().toISOString(),
                input_tokens: streamResult.inputTokens,
                output_tokens: streamResult.outputTokens,
                phases_count: protocolData.phases.length,
                has_rag_context: !!context.ragContext,
              },
            })
            .eq("id", protocolId);

          // Insert phases and their supplements
          for (const phase of protocolData.phases) {
            const { data: phaseRow, error: phaseError } = await supabase
              .from("protocol_phases")
              .insert({
                protocol_id: protocolId,
                phase_number: phase.phase_number,
                title: phase.title,
                goal: phase.goal,
                duration_weeks: phase.duration_weeks,
                status: "pending",
                supplements: phase.supplements,
                diet: phase.diet,
                lifestyle: phase.lifestyle,
                labs_to_order: phase.labs_to_order,
                conditional_logic: phase.conditional_logic,
                sort_order: phase.phase_number,
              })
              .select("id")
              .single();

            if (phaseError || !phaseRow) {
              console.error(
                `[Protocol Generate] Failed to insert phase ${phase.phase_number}:`,
                phaseError
              );
              continue;
            }

            // Insert normalized supplement rows for querying/reporting
            if (phase.supplements.length > 0) {
              const supplementRows = phase.supplements.map((s, idx) => ({
                phase_id: phaseRow.id,
                name: s.name,
                dosage: s.dosage,
                frequency: s.frequency,
                timing: s.timing || null,
                rationale: s.rationale,
                rag_source: s.rag_source || null,
                action: s.action || "start",
                sort_order: idx,
              }));

              const { error: suppError } = await supabase
                .from("protocol_phase_supplements")
                .insert(supplementRows);

              if (suppError) {
                console.error(
                  `[Protocol Generate] Failed to insert supplements for phase ${phase.phase_number}:`,
                  suppError
                );
              }
            }
          }

          // ── Phase 7: Audit log and complete ───────────────────────
          auditLog({
            request,
            practitionerId: practitioner.id,
            action: "generate",
            resourceType: "protocol",
            resourceId: protocolId,
            detail: {
              patient_id: patientId,
              focus_areas,
              phases_count: protocolData.phases.length,
              total_duration_weeks: protocolData.total_duration_weeks,
              input_tokens: streamResult.inputTokens,
              output_tokens: streamResult.outputTokens,
              has_rag_context: !!context.ragContext,
            },
          });

          send({
            type: "complete",
            protocol_id: protocolId,
            phases_count: protocolData.phases.length,
          });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("[Protocol Generate] Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Protocol generation interrupted",
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof PromptInjectionError) {
      return jsonError("Input blocked by safety filter. Please rephrase.", 400);
    }
    console.error("[Protocol Generate] Unhandled error:", error);
    return jsonError("Internal server error", 500);
  }
}

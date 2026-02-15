import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import {
  buildVisitSystemPrompt,
  formatPatientContext,
  VISIT_IFM_MATRIX_SYSTEM_PROMPT,
  VISIT_PROTOCOL_SYSTEM_PROMPT,
} from "@/lib/ai/visit-prompts";
import { generateVisitSchema } from "@/lib/validations/visit";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const { id: visitId } = await params;
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "visit_generate"
    );
    if (rateLimitError) return rateLimitError;

    // Fetch visit
    const { data: visit } = await supabase
      .from("visits")
      .select("*, patients(first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, clinical_summary)")
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!visit) return jsonError("Visit not found", 404);
    if (visit.status === "completed") return jsonError("Cannot regenerate a completed visit", 409);

    // Validate input
    const body = await request.json();
    const parsed = generateVisitSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { raw_notes, sections } = parsed.data;

    // Build patient context with document summaries
    let documentSummaries: string[] = [];
    if (visit.patient_id) {
      const { data: documents } = await supabase
        .from("patient_documents")
        .select("extraction_summary, document_type, title")
        .eq("patient_id", visit.patient_id)
        .eq("status", "extracted")
        .order("uploaded_at", { ascending: false })
        .limit(10);
      if (documents?.length) {
        documentSummaries = documents
          .filter((d: { extraction_summary: string | null }) => d.extraction_summary)
          .map((d: { document_type: string; title: string | null; extraction_summary: string | null }) => `[${d.document_type}: ${d.title || "Untitled"}]\n${d.extraction_summary}`);
      }
    }
    const patientContext = visit.patients
      ? formatPatientContext(visit.patients, { documentSummaries })
      : undefined;

    // Save raw notes to the visit
    await supabase
      .from("visits")
      .update({ raw_notes })
      .eq("id", visitId);

    const model = MODELS.standard;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          // ── Phase 1: SOAP Generation ──────────────────────────────────
          if (sections.includes("soap")) {
            send({ section: "soap", status: "generating" });

            const soapPrompt = buildVisitSystemPrompt({
              visitType: visit.visit_type || "soap",
              patientContext,
            });

            let soapContent = "";
            await streamCompletion(
              {
                model,
                maxTokens: 4096,
                system: soapPrompt,
                messages: [
                  {
                    role: "user",
                    content: `Generate a structured ${visit.visit_type === "history_physical" ? "History & Physical" :
                      visit.visit_type === "consult" ? "Consultation Note" :
                        visit.visit_type === "follow_up" ? "Follow-up SOAP note" :
                          "SOAP note"
                      } from these clinical notes:\n\n${raw_notes}${visit.chief_complaint ? `\n\nChief Complaint: ${visit.chief_complaint}` : ""
                      }`,
                  },
                ],
              },
              {
                onText(text) {
                  soapContent += text;
                  send({ section: "soap", status: "streaming", text });
                },
              }
            );

            // Parse SOAP JSON
            let soapData: Record<string, string> = {};
            try {
              const jsonMatch = soapContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                soapData = JSON.parse(jsonMatch[0]);
              }
            } catch {
              soapData = { subjective: soapContent };
            }

            // Save SOAP to visit
            await supabase
              .from("visits")
              .update({
                subjective: soapData.subjective || null,
                objective: soapData.objective || null,
                assessment: soapData.assessment || null,
                plan: soapData.plan || null,
                ai_soap_note: soapContent,
              })
              .eq("id", visitId);

            send({ section: "soap", status: "complete", data: soapData });

            // ── Phase 2 & 3: Parallel Generation (IFM Matrix + Protocol) ──
            const tasks: Promise<void>[] = [];

            // IFM Matrix Task
            if (sections.includes("ifm_matrix")) {
              tasks.push((async () => {
                send({ section: "ifm_matrix", status: "generating" });

                let matrixContent = "";
                await streamCompletion(
                  {
                    model,
                    maxTokens: 3000,
                    system: VISIT_IFM_MATRIX_SYSTEM_PROMPT,
                    messages: [
                      {
                        role: "user",
                        content: `Map these SOAP note findings to the IFM Matrix:\n\n${JSON.stringify(soapData, null, 2)}`,
                      },
                    ],
                  },
                  {
                    onText(text) {
                      matrixContent += text;
                      send({ section: "ifm_matrix", status: "streaming", text });
                    },
                  }
                );

                let matrixData = {};
                try {
                  const jsonMatch = matrixContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) matrixData = JSON.parse(jsonMatch[0]);
                } catch { /* use empty */ }

                await supabase
                  .from("visits")
                  .update({ ifm_matrix: matrixData })
                  .eq("id", visitId);

                send({ section: "ifm_matrix", status: "complete", data: matrixData });
              })());
            }

            // Protocol Task
            if (sections.includes("protocol")) {
              tasks.push((async () => {
                send({ section: "protocol", status: "generating" });

                let protocolContent = "";
                await streamCompletion(
                  {
                    model,
                    maxTokens: 4096,
                    system: VISIT_PROTOCOL_SYSTEM_PROMPT,
                    messages: [
                      {
                        role: "user",
                        content: `Generate evidence-based protocol recommendations based on this clinical assessment:\n\nSOAP Note:\n${JSON.stringify(soapData, null, 2)}${patientContext ? `\n\nPatient Context:\n${patientContext}` : ""
                          }`,
                      },
                    ],
                  },
                  {
                    onText(text) {
                      protocolContent += text;
                      send({ section: "protocol", status: "streaming", text });
                    },
                  }
                );

                let protocolData = {};
                try {
                  const jsonMatch = protocolContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) protocolData = JSON.parse(jsonMatch[0]);
                } catch { /* use empty */ }

                await supabase
                  .from("visits")
                  .update({
                    ai_plan: protocolContent,
                    ai_protocol: protocolData,
                  })
                  .eq("id", visitId);

                send({ section: "protocol", status: "complete", data: protocolData });
              })());
            }

            // Wait for both to complete
            await Promise.all(tasks);
          }

          auditLog({
            request,
            practitionerId: practitioner.id,
            action: "generate",
            resourceType: "visit",
            resourceId: visitId,
            detail: { sections, visit_type: visit.visit_type, has_patient: !!visit.patient_id },
          });

          send({ section: "complete", status: "done" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Visit generation stream error:", err);
          const errorMessage = err instanceof Error ? err.message : "Generation interrupted";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ section: "error", status: "error", message: errorMessage })}\n\n`)
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
    console.error("Visit generate error:", error);
    return jsonError("Internal server error", 500);
  }
}

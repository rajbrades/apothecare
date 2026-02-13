import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAnthropicClient, MODELS } from "@/lib/ai/anthropic";
import {
  buildVisitSystemPrompt,
  formatPatientContext,
  VISIT_IFM_MATRIX_SYSTEM_PROMPT,
  VISIT_PROTOCOL_SYSTEM_PROMPT,
} from "@/lib/ai/visit-prompts";
import { generateVisitSchema } from "@/lib/validations/visit";

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
    const { id: visitId } = await params;
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Fetch visit
    const { data: visit } = await supabase
      .from("visits")
      .select("*, patients(first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies)")
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

    // Build patient context
    const patientContext = visit.patients ? formatPatientContext(visit.patients) : undefined;

    // Save raw notes to the visit
    await supabase
      .from("visits")
      .update({ raw_notes })
      .eq("id", visitId);

    const anthropic = getAnthropicClient();
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
            const soapStream = await anthropic.messages.stream({
              model,
              max_tokens: 4096,
              system: soapPrompt,
              messages: [
                {
                  role: "user",
                  content: `Generate a structured SOAP note from these clinical notes:\n\n${raw_notes}${
                    visit.chief_complaint ? `\n\nChief Complaint: ${visit.chief_complaint}` : ""
                  }`,
                },
              ],
            });

            for await (const event of soapStream) {
              if (event.type === "content_block_delta" && "text" in event.delta) {
                soapContent += event.delta.text;
                send({ section: "soap", status: "streaming", text: event.delta.text });
              }
            }

            // Parse SOAP JSON
            let soapData: Record<string, string> = {};
            try {
              // Extract JSON from potential markdown code blocks
              const jsonMatch = soapContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                soapData = JSON.parse(jsonMatch[0]);
              }
            } catch {
              // If parsing fails, use the raw content as the full note
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

            // ── Phase 2: IFM Matrix ───────────────────────────────────────
            if (sections.includes("ifm_matrix")) {
              send({ section: "ifm_matrix", status: "generating" });

              let matrixContent = "";
              const matrixStream = await anthropic.messages.stream({
                model,
                max_tokens: 3000,
                system: VISIT_IFM_MATRIX_SYSTEM_PROMPT,
                messages: [
                  {
                    role: "user",
                    content: `Map these SOAP note findings to the IFM Matrix:\n\n${JSON.stringify(soapData, null, 2)}`,
                  },
                ],
              });

              for await (const event of matrixStream) {
                if (event.type === "content_block_delta" && "text" in event.delta) {
                  matrixContent += event.delta.text;
                  send({ section: "ifm_matrix", status: "streaming", text: event.delta.text });
                }
              }

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
            }

            // ── Phase 3: Protocol ─────────────────────────────────────────
            if (sections.includes("protocol")) {
              send({ section: "protocol", status: "generating" });

              let protocolContent = "";
              const protocolStream = await anthropic.messages.stream({
                model,
                max_tokens: 4096,
                system: VISIT_PROTOCOL_SYSTEM_PROMPT,
                messages: [
                  {
                    role: "user",
                    content: `Generate evidence-based protocol recommendations based on this clinical assessment:\n\nSOAP Note:\n${JSON.stringify(soapData, null, 2)}${
                      patientContext ? `\n\nPatient Context:\n${patientContext}` : ""
                    }`,
                  },
                ],
              });

              for await (const event of protocolStream) {
                if (event.type === "content_block_delta" && "text" in event.delta) {
                  protocolContent += event.delta.text;
                  send({ section: "protocol", status: "streaming", text: event.delta.text });
                }
              }

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
            }
          }

          // Audit log
          const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
          const userAgent = request.headers.get("user-agent") || "unknown";

          await serviceClient.from("audit_logs").insert({
            practitioner_id: practitioner.id,
            action: "generate",
            resource_type: "visit",
            resource_id: visitId,
            ip_address: clientIp,
            user_agent: userAgent,
            detail: { sections, visit_type: visit.visit_type, has_patient: !!visit.patient_id },
          });

          send({ section: "complete", status: "done" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Visit generation stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ section: "error", status: "error", message: "Generation interrupted" })}\n\n`)
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

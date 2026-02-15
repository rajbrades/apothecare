import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { INTERACTION_CHECK_SYSTEM_PROMPT } from "@/lib/ai/supplement-prompts";
import { interactionCheckSchema } from "@/lib/validations/supplement";
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

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();

    // Auth
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

    const rateLimitError = await checkRateLimit(
      supabase,
      practitioner.id,
      practitioner.subscription_tier,
      "interaction_check"
    );
    if (rateLimitError) return rateLimitError;

    // Validate input
    const body = await request.json();
    const parsed = interactionCheckSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { supplements, medications, patient_id } = parsed.data;

    // If patient_id provided, fetch patient data to enrich context
    let patientContext = "";
    if (patient_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select(
          "first_name, last_name, date_of_birth, sex, medical_history, allergies"
        )
        .eq("id", patient_id)
        .eq("practitioner_id", practitioner.id)
        .single();

      if (patient) {
        const lines: string[] = [];
        if (patient.sex) lines.push(`- Sex: ${patient.sex}`);
        if (patient.date_of_birth)
          lines.push(`- DOB: ${patient.date_of_birth}`);
        if (patient.medical_history)
          lines.push(`- Medical History: ${patient.medical_history}`);
        if (patient.allergies?.length)
          lines.push(`- Allergies: ${patient.allergies.join(", ")}`);
        if (lines.length) {
          patientContext = `\n\nPatient Context:\n${lines.join("\n")}`;
        }
      }
    }

    // Insert interaction check row
    const { data: check, error: insertError } = await supabase
      .from("interaction_checks")
      .insert({
        practitioner_id: practitioner.id,
        patient_id: patient_id || null,
        supplements_input: supplements,
        medications_input: medications || "",
        result_data: {},
        raw_ai_text: "",
      })
      .select()
      .single();

    if (insertError || !check) {
      console.error("Interaction check insert error:", insertError);
      return jsonError("Failed to create interaction check", 500);
    }

    const userMessage = `Check interactions between these supplements: ${supplements}\n\nAnd these medications: ${medications || "None provided"}${patientContext}`;

    const model = MODELS.standard;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          send({ type: "check_id", check_id: check.id });

          let fullContent = "";
          const usage = await streamCompletion(
            {
              model,
              maxTokens: 4096,
              system: INTERACTION_CHECK_SYSTEM_PROMPT,
              messages: [{ role: "user", content: userMessage }],
            },
            {
              onText(text) {
                fullContent += text;
                send({ type: "text_delta", text });
              },
            }
          );

          // Parse JSON from AI response
          let resultData = {};
          try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) resultData = JSON.parse(jsonMatch[0]);
          } catch {
            /* use empty */
          }

          // Update interaction check row
          await supabase
            .from("interaction_checks")
            .update({
              result_data: resultData,
              raw_ai_text: fullContent,
              model_used: model,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
            })
            .eq("id", check.id);

          auditLog({
            request,
            practitionerId: practitioner.id,
            action: "generate",
            resourceType: "interaction_check",
            resourceId: check.id,
            detail: {
              patient_id: patient_id || null,
              model,
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
            },
          });

          send({
            type: "check_complete",
            data: resultData,
            check_id: check.id,
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Interaction check stream error:", err);

          const errorMessage =
            err instanceof Error ? err.message : "Generation interrupted";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
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
    console.error("Interaction check error:", error);
    return jsonError("Internal server error", 500);
  }
}

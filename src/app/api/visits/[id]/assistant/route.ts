import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { validateInputSafety, PromptInjectionError } from "@/lib/api/validate-input";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4000),
    })
  ).min(1).max(20),
});

function buildVisitContext(visit: Record<string, unknown>): string {
  const parts: string[] = [];

  const patient = visit.patients as Record<string, unknown> | null | undefined;
  if (patient) {
    const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ");
    const dob = patient.date_of_birth as string | null;
    const sex = patient.sex as string | null;
    parts.push(`PATIENT: ${name || "Unknown"}${dob ? ` | DOB: ${dob}` : ""}${sex ? ` | Sex: ${sex}` : ""}`);
    if (patient.chief_complaints && Array.isArray(patient.chief_complaints) && patient.chief_complaints.length > 0) {
      parts.push(`Chief Complaints: ${(patient.chief_complaints as string[]).join(", ")}`);
    }
    if (patient.medical_history) parts.push(`Medical History: ${patient.medical_history}`);
    if (patient.current_medications) parts.push(`Current Medications: ${patient.current_medications}`);
    if (patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0) {
      parts.push(`Allergies: ${(patient.allergies as string[]).join(", ")}`);
    }
  }

  parts.push(`\nVISIT DATE: ${visit.visit_date as string}`);
  if (visit.chief_complaint) parts.push(`Visit Chief Complaint: ${visit.chief_complaint}`);

  if (visit.subjective) parts.push(`\nSOAP - SUBJECTIVE:\n${visit.subjective}`);
  if (visit.objective) parts.push(`\nSOAP - OBJECTIVE:\n${visit.objective}`);
  if (visit.assessment) parts.push(`\nSOAP - ASSESSMENT:\n${visit.assessment}`);
  if (visit.plan) parts.push(`\nSOAP - PLAN:\n${visit.plan}`);

  const matrix = visit.ifm_matrix as Record<string, unknown> | null | undefined;
  if (matrix && typeof matrix === "object" && Object.keys(matrix).length > 0) {
    const matrixSummary = Object.entries(matrix)
      .filter(([, v]) => v && typeof v === "object")
      .map(([node, data]) => {
        const d = data as Record<string, unknown>;
        const findings = (d.findings as string[] | null) ?? [];
        const severity = d.severity as string | null;
        return findings.length > 0
          ? `${node}${severity ? ` (${severity})` : ""}: ${findings.join("; ")}`
          : null;
      })
      .filter(Boolean)
      .join("\n");
    if (matrixSummary) parts.push(`\nIFM MATRIX:\n${matrixSummary}`);
  }

  const protocol = visit.ai_protocol as Record<string, unknown> | null | undefined;
  if (protocol && typeof protocol === "object") {
    const supplements = protocol.supplements as Array<{ name: string; dose?: string; rationale?: string }> | undefined;
    if (supplements && supplements.length > 0) {
      const suppList = supplements.slice(0, 10).map((s) => `${s.name}${s.dose ? ` ${s.dose}` : ""}`).join(", ");
      parts.push(`\nPROTOCOL SUPPLEMENTS: ${suppList}`);
    }
    if (protocol.dietary_recommendations) {
      parts.push(`Dietary Recommendations: ${Array.isArray(protocol.dietary_recommendations)
        ? (protocol.dietary_recommendations as string[]).slice(0, 5).join("; ")
        : protocol.dietary_recommendations}`);
    }
  }

  return parts.join("\n");
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

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid request", 400);

    const { messages } = parsed.data;

    // Validate the latest user message for prompt injection
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      try {
        validateInputSafety(lastUserMsg.content, {
          request,
          practitionerId: practitioner.id,
          resourceType: "visit",
          resourceId: visitId,
        });
      } catch (e) {
        if (e instanceof PromptInjectionError) return jsonError(e.message, 400);
        throw e;
      }
    }

    // Fetch visit with patient context
    const { data: visit } = await supabase
      .from("visits")
      .select("*, patients(first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies)")
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!visit) return jsonError("Visit not found", 404);

    const visitContext = buildVisitContext(visit as Record<string, unknown>);

    const systemPrompt = `You are a clinical synthesis assistant for a functional medicine practitioner.
Your role is to help synthesize and analyze information from the current patient visit.
You have access to the visit's SOAP note, IFM Matrix findings, and treatment protocol.
Provide evidence-based, clinically relevant responses. Be concise but thorough.
When discussing treatments, note if they are established vs. emerging evidence.
Never make definitive diagnoses — support the practitioner's clinical judgment.

CURRENT VISIT CONTEXT:
${visitContext}`;

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamCompletion(
            {
              model: MODELS.standard,
              maxTokens: 1024,
              system: systemPrompt,
              messages: messages.map((m) => ({ role: m.role, content: m.content })),
            },
            {
              onText: (text) => {
                controller.enqueue(encoder.encode(text));
              },
            }
          );
          controller.close();
        } catch {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

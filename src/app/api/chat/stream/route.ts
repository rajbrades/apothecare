import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAnthropicClient, CLINICAL_CHAT_SYSTEM_PROMPT, MODELS } from "@/lib/ai/anthropic";
import { chatMessageSchema } from "@/lib/validations/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  try {
    // CSRF: Validate origin
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (origin && !appUrl.startsWith(origin)) {
      return jsonError("Forbidden", 403);
    }

    const supabase = await createClient();
    const serviceClient = createServiceClient();

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
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!practitioner) {
      return new Response(
        JSON.stringify({ error: "Practitioner profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check query limits
    const { data: allowed } = await supabase.rpc("check_and_increment_query", {
      p_practitioner_id: practitioner.id,
    });

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
    const { message, conversation_id, patient_id, is_deep_consult } = parsed.data;

    // Capture request metadata for audit
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          practitioner_id: practitioner.id,
          patient_id: patient_id || null,
          title: message.slice(0, 100),
          is_deep_consult,
          model_used: is_deep_consult ? MODELS.advanced : MODELS.standard,
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

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user" as const,
      content: message,
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
        .select("*")
        .eq("id", patient_id)
        .single();

      if (patient) {
        patientContext = `\n\n## Patient Context\n- Sex: ${patient.sex || "Not specified"}\n- DOB: ${patient.date_of_birth || "Not specified"}\n- Chief Complaints: ${patient.chief_complaints?.join(", ") || "None listed"}\n- Current Medications: ${patient.current_medications || "None listed"}\n- Supplements: ${patient.supplements || "None listed"}\n- Allergies: ${patient.allergies?.join(", ") || "NKDA"}\n- History: ${patient.medical_history || "Not provided"}`;
      }
    }

    // Build messages array
    const messages = (history || [])
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Stream from Anthropic
    const anthropic = getAnthropicClient();
    const model = is_deep_consult ? MODELS.advanced : MODELS.standard;

    const stream = await anthropic.messages.stream({
      model,
      max_tokens: is_deep_consult ? 4096 : 2048,
      system: CLINICAL_CHAT_SYSTEM_PROMPT + patientContext,
      messages,
    });

    // Create a ReadableStream that sends SSE
    const encoder = new TextEncoder();
    let fullContent = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation_id first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "conversation_id", conversation_id: convId })}\n\n`
            )
          );

          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta;
              if ("text" in delta) {
                fullContent += delta.text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text_delta", text: delta.text })}\n\n`
                  )
                );
              }
            } else if (event.type === "message_start") {
              inputTokens = event.message.usage?.input_tokens || 0;
            } else if (event.type === "message_delta") {
              if ("usage" in event) {
                outputTokens = (event.usage as { output_tokens: number })?.output_tokens || 0;
              }
            }
          }

          // Get final usage from stream
          const finalMessage = await stream.finalMessage();
          inputTokens = finalMessage.usage.input_tokens;
          outputTokens = finalMessage.usage.output_tokens;

          // Save assistant message
          const { data: savedMessage } = await supabase
            .from("messages")
            .insert({
              conversation_id: convId,
              role: "assistant" as const,
              content: fullContent,
              citations: [],
              input_tokens: inputTokens,
              output_tokens: outputTokens,
            })
            .select()
            .single();

          // Audit log
          await serviceClient.from("audit_logs").insert({
            practitioner_id: practitioner.id,
            action: "query" as const,
            resource_type: "conversation",
            resource_id: convId,
            ip_address: clientIp,
            user_agent: userAgent,
            detail: {
              model,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              is_deep_consult,
              has_patient_context: !!patient_id,
            },
          });

          // Send final event with metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "message_complete",
                message_id: savedMessage?.id,
                usage: { input_tokens: inputTokens, output_tokens: outputTokens },
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
    console.error("Chat stream error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

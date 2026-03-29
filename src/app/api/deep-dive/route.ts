import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompletion, MODELS } from "@/lib/ai/provider";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { validateInputSafety, PromptInjectionError } from "@/lib/api/validate-input";
import { auditLog } from "@/lib/api/audit";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";
import { deepDiveSchema } from "@/lib/validations/deep-dive";
import { DEEP_DIVE_SYSTEM_PROMPT } from "@/lib/ai/deep-dive-prompts";
import { retrieveContext } from "@/lib/rag/retrieve";
import { formatRagContext } from "@/lib/rag/format-context";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/deep-dive
 * Streams educational content about a clinical topic.
 * Uses RAG from partnership knowledge bases when available.
 */
export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id, subscription_tier")
      .eq("auth_user_id", user.id)
      .single();
    if (!practitioner) return jsonError("Practitioner not found", 404);

    // Tier gate
    if (!isFeatureAvailable(practitioner.subscription_tier, "deep_dive")) {
      return proGateResponse(NextResponse, "Clinical Deep-Dive");
    }

    // Rate limit
    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "deep_dive"
    );
    if (rateLimitError) return rateLimitError;

    const body = await request.json();
    const parsed = deepDiveSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { topic, followUp } = parsed.data;

    // Prompt injection check
    try {
      validateInputSafety(topic, {
        request,
        practitionerId: practitioner.id,
        resourceType: "deep_dive",
      });
    } catch (e) {
      if (e instanceof PromptInjectionError) return jsonError(e.message, 400);
      throw e;
    }

    // Retrieve RAG context from partnership knowledge bases
    let ragContext = "";
    try {
      // Get practitioner's active partnerships
      const { data: practPartners } = await supabase
        .from("practitioner_partnerships")
        .select("partnership_id")
        .eq("practitioner_id", practitioner.id)
        .eq("is_active", true);

      const partnershipIds = (practPartners || []).map((p: { partnership_id: string }) => p.partnership_id);

      if (partnershipIds.length > 0) {
        const chunks = await retrieveContext({
          query: topic,
          partnershipIds,
          maxChunks: 5,
          threshold: 0.65,
        });

        if (chunks.length > 0) {
          ragContext = formatRagContext(chunks);
        }
      }
    } catch (err) {
      console.error("[deep-dive] RAG retrieval error (non-blocking):", err);
    }

    // Build the user message
    const userMessage = followUp
      ? `Topic: "${topic}"\n\nFollow-up question: ${followUp}`
      : `Explain this clinical topic: "${topic}"`;

    const systemWithRag = ragContext
      ? `${DEEP_DIVE_SYSTEM_PROMPT}\n\n---\n\nPARTNERSHIP KNOWLEDGE BASE CONTEXT:\n${ragContext}`
      : DEEP_DIVE_SYSTEM_PROMPT;

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "query",
      resourceType: "deep_dive",
      detail: { topic, has_follow_up: !!followUp, rag_context: !!ragContext },
    });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamCompletion(
            {
              model: MODELS.standard,
              maxTokens: 2048,
              system: systemWithRag,
              messages: [{ role: "user", content: userMessage }],
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

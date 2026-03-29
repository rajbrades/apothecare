import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { isFeatureAvailable, proGateResponse } from "@/lib/tier/gates";
import { auditLog } from "@/lib/api/audit";
import { createCompletion, MODELS } from "@/lib/ai/provider";
import { DIALOGUE_SYSTEM_PROMPT, parseDialogue } from "@/lib/ai/deep-dive-dialogue";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120; // TTS can take a while for long dialogues

const bodySchema = z.object({
  content: z.string().min(10).max(10000),
  topic: z.string().min(2).max(500),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// OpenAI TTS voices for the two hosts
const VOICE_A: OpenAI.Audio.SpeechCreateParams["voice"] = "nova";   // Female, warm
const VOICE_B: OpenAI.Audio.SpeechCreateParams["voice"] = "onyx";   // Male, deep

/**
 * POST /api/deep-dive/audio
 * Generates a two-voice podcast-style audio from Deep Dive content.
 * 1. AI converts content to dialogue script
 * 2. OpenAI TTS generates audio for each turn
 * 3. Returns combined MP3
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

    if (!isFeatureAvailable(practitioner.subscription_tier, "deep_dive")) {
      return proGateResponse(NextResponse, "Clinical Deep-Dive Audio");
    }

    const rateLimitError = await checkRateLimit(
      supabase, practitioner.id, practitioner.subscription_tier, "deep_dive"
    );
    if (rateLimitError) return rateLimitError;

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

    const { content, topic } = parsed.data;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return jsonError("Audio generation is not configured", 503);

    // Step 1: Generate dialogue script from content
    const dialogueResult = await createCompletion({
      model: MODELS.standard,
      maxTokens: 2000,
      system: DIALOGUE_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Topic: "${topic}"\n\nEducational content to convert into dialogue:\n\n${content}`,
      }],
    });

    const turns = parseDialogue(dialogueResult.text);
    if (turns.length < 4) {
      return jsonError("Failed to generate dialogue — not enough turns", 500);
    }

    // Step 2: Generate TTS for each turn and concatenate
    const openai = new OpenAI({ apiKey: openaiKey });
    const audioChunks: Buffer[] = [];

    for (const turn of turns) {
      const voice = turn.speaker === "A" ? VOICE_A : VOICE_B;
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice,
        input: turn.text,
        response_format: "mp3",
      });

      const arrayBuffer = await response.arrayBuffer();
      audioChunks.push(Buffer.from(arrayBuffer));
    }

    // Concatenate MP3 chunks (MP3 frames are independently decodable)
    const combined = Buffer.concat(audioChunks);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "generate",
      resourceType: "deep_dive_audio",
      detail: { topic, turns: turns.length, size_bytes: combined.length },
    });

    return new Response(combined, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="deep-dive-${topic.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.mp3"`,
        "Content-Length": String(combined.length),
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    console.error("[deep-dive/audio] Error:", err);
    return jsonError("Failed to generate audio", 500);
  }
}

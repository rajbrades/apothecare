import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio, MAX_AUDIO_SIZE } from "@/lib/ai/transcription";
import { validateCsrf } from "@/lib/api/csrf";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { auditLog } from "@/lib/api/audit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Whisper transcription of long encounters (up to 60 min audio)

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/visits/[id]/transcribe
 *
 * Accepts an audio blob (multipart/form-data) and returns the
 * transcribed text via OpenAI Whisper.
 *
 * The transcript is also appended to the visit's raw_notes.
 */
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
      supabase, practitioner.id, practitioner.subscription_tier, "visit_transcribe"
    );
    if (rateLimitError) return rateLimitError;

    // Verify visit ownership
    const { data: visit } = await supabase
      .from("visits")
      .select("id, raw_notes, status")
      .eq("id", visitId)
      .eq("practitioner_id", practitioner.id)
      .single();
    if (!visit) return jsonError("Visit not found", 404);
    if (visit.status === "completed") return jsonError("Cannot modify a completed visit", 409);

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) return jsonError("No audio file provided", 400);

    // Validate size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return jsonError(`Audio file too large. Max size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`, 400);
    }

    // Validate type
    const validTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "audio/flac",
    ];
    const isValidType = validTypes.some((t) => audioFile.type.startsWith(t));
    if (!isValidType) {
      return jsonError(`Invalid audio format. Supported: ${validTypes.join(", ")}`, 400);
    }

    // Convert File to Blob for transcription
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: audioFile.type });

    // Transcribe
    const result = await transcribeAudio(audioBlob);

    if (!result.text.trim()) {
      return jsonError("No speech detected in the recording", 422);
    }

    // Append transcript to visit raw_notes
    const separator = visit.raw_notes?.trim() ? "\n\n---\n[Transcribed from recording]\n" : "";
    const updatedNotes = (visit.raw_notes || "") + separator + result.text;

    await supabase
      .from("visits")
      .update({ raw_notes: updatedNotes })
      .eq("id", visitId);

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "transcribe",
      resourceType: "visit",
      resourceId: visitId,
      detail: {
        audio_size: audioFile.size,
        audio_type: audioFile.type,
        duration: result.duration,
        language: result.language,
        transcript_length: result.text.length,
      },
    });

    return NextResponse.json({
      transcript: result.text,
      duration: result.duration,
      language: result.language,
      updated_raw_notes: updatedNotes,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return jsonError("Transcription failed", 500);
  }
}

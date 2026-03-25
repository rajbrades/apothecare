import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/ai/transcription";
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
 * Accepts an audio storage path (JSON body) and returns the
 * transcribed text via OpenAI Whisper.
 *
 * Audio is uploaded to Supabase Storage client-side to avoid
 * the Vercel 4.5MB request body size limit. This endpoint
 * downloads from storage, sends to Whisper, then cleans up.
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

    // Parse JSON body with storage path
    const body = await request.json().catch(() => null);
    const audioStoragePath = body?.audio_storage_path;

    if (!audioStoragePath || typeof audioStoragePath !== "string") {
      return jsonError("audio_storage_path is required", 400);
    }

    // Download audio from Supabase Storage
    const service = createServiceClient();
    const { data: audioData, error: dlError } = await service.storage
      .from("patient-documents")
      .download(audioStoragePath);

    if (dlError || !audioData) {
      return jsonError("Failed to download audio file", 500);
    }

    // Transcribe via Whisper
    const result = await transcribeAudio(audioData);

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

    // Clean up audio file from storage (best-effort)
    service.storage
      .from("patient-documents")
      .remove([audioStoragePath])
      .catch(() => {});

    auditLog({
      request,
      practitionerId: practitioner.id,
      action: "transcribe",
      resourceType: "visit",
      resourceId: visitId,
      detail: {
        audio_path: audioStoragePath,
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

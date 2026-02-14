// ── Whisper Transcription Service ─────────────────────────────────────────
//
// Sends audio to OpenAI's Whisper API for transcription.
// Used for session recording transcription (not real-time dictation,
// which uses the browser's Web Speech API).

import { env } from "@/lib/env";

interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

interface TranscriptionOptions {
  /** Language hint for better accuracy (ISO 639-1, e.g. "en") */
  language?: string;
  /** Optional prompt to guide the model (medical terminology, etc.) */
  prompt?: string;
}

const MEDICAL_PROMPT = `Clinical visit recording. Medical terminology includes:
SOAP note, subjective, objective, assessment, plan, IFM matrix,
functional medicine, supplements, nutraceuticals, biomarkers,
methylation, detoxification, HPA axis, gut permeability,
microbiome, mitochondrial function, oxidative stress.`;

/**
 * Transcribe an audio blob using OpenAI Whisper API.
 *
 * @param audioBlob - The audio blob from MediaRecorder
 * @param options - Transcription options
 * @returns Transcription result with text
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to your .env.local file.");
  }

  const { language = "en", prompt = MEDICAL_PROMPT } = options;

  // Determine file extension from MIME type
  const ext = audioBlob.type.includes("mp4") ? "mp4"
    : audioBlob.type.includes("ogg") ? "ogg"
    : "webm";

  const formData = new FormData();
  formData.append("file", audioBlob, `recording.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("language", language);
  formData.append("response_format", "verbose_json");
  if (prompt) formData.append("prompt", prompt);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Whisper API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    text: data.text,
    duration: data.duration,
    language: data.language,
  };
}

/**
 * Max audio file size for Whisper API (25MB).
 */
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

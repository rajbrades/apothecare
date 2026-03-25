"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * MediaRecorder hook for session audio recording.
 *
 * Records audio from the user's microphone using the MediaRecorder API.
 * Produces a Blob that can be uploaded for Whisper transcription.
 *
 * When `autoSave` is enabled, recordings are immediately uploaded to
 * Supabase Storage after recording stops — surviving page refreshes.
 * Audio is encrypted at rest (AES-256 via Supabase) and deleted after
 * transcription completes (HIPAA §164.530(c) — dispose when no longer needed).
 */

interface UseAudioRecorderOptions {
  /** Max recording duration in seconds (default: 3600 = 60 min) */
  maxDuration?: number;
  /** Auto-save to Supabase Storage after recording stops (HIPAA-compliant) */
  autoSave?: { visitId: string };
  /** Called when recording stops with the audio blob */
  onRecordingComplete?: (blob: Blob, durationMs: number) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

interface UseAudioRecorderReturn {
  /** Whether the browser supports MediaRecorder */
  isSupported: boolean;
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether audio is being uploaded to storage */
  isSaving: boolean;
  /** Recording duration in seconds */
  durationSeconds: number;
  /** The recorded audio blob (available after stopping) */
  audioBlob: Blob | null;
  /** Object URL for the recorded audio (for playback) */
  audioUrl: string | null;
  /** Storage path if auto-saved (for transcription) */
  storagePath: string | null;
  /** Start recording */
  start: () => Promise<void>;
  /** Stop recording */
  stop: () => void;
  /** Clear the recorded audio (also deletes from storage) */
  clear: () => void;
}

function getPreferredMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "audio/webm";
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { maxDuration = 3600, autoSave, onRecordingComplete, onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onErrorRef = useRef(onError);
  const autoSaveRef = useRef(autoSave);
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
    onErrorRef.current = onError;
    autoSaveRef.current = autoSave;
  }, [onRecordingComplete, onError, autoSave]);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  /** Upload audio blob to Supabase Storage (HIPAA: encrypted at rest, scoped by visit) */
  const saveToStorage = useCallback(async (blob: Blob, visitId: string): Promise<string | null> => {
    try {
      setIsSaving(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const path = `audio/${visitId}/${Date.now()}.webm`;
      const { error } = await supabase.storage
        .from("patient-documents")
        .upload(path, blob, { contentType: blob.type, upsert: true });
      if (error) {
        console.error("[Audio] Storage upload failed:", error.message);
        onErrorRef.current?.("Failed to save recording. It exists in memory only.");
        return null;
      }
      setStoragePath(path);
      return path;
    } catch (err) {
      console.error("[Audio] Storage upload error:", err);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /** Delete audio from Supabase Storage (cleanup after transcription or discard) */
  const deleteFromStorage = useCallback(async (path: string) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.storage
        .from("patient-documents")
        .remove([path]);
    } catch {
      // Best-effort cleanup
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      onErrorRef.current?.("Audio recording is not supported in this browser");
      return;
    }

    // Clear previous recording
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (storagePath) deleteFromStorage(storagePath);
    setAudioBlob(null);
    setAudioUrl(null);
    setStoragePath(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;

        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);

        onRecordingCompleteRef.current?.(blob, durationMs);
        cleanup();

        // Auto-save to storage if configured
        if (autoSaveRef.current?.visitId) {
          saveToStorage(blob, autoSaveRef.current.visitId);
        }
      };

      recorder.onerror = () => {
        onErrorRef.current?.("Recording error occurred");
        setIsRecording(false);
        cleanup();
      };

      // Start recording with 1-second chunks
      startTimeRef.current = Date.now();
      recorder.start(1000);
      setIsRecording(true);
      setDurationSeconds(0);

      // Duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          recorder.stop();
        }
      }, 1000);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access."
          : "Failed to start recording. Please check your microphone.";
      onErrorRef.current?.(message);
    }
  }, [isSupported, audioUrl, storagePath, maxDuration, cleanup, saveToStorage, deleteFromStorage]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clear = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    // Delete from storage if auto-saved
    if (storagePath) deleteFromStorage(storagePath);
    setAudioBlob(null);
    setAudioUrl(null);
    setStoragePath(null);
    setDurationSeconds(0);
    chunksRef.current = [];
  }, [audioUrl, storagePath, deleteFromStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isSupported,
    isRecording,
    isSaving,
    durationSeconds,
    audioBlob,
    audioUrl,
    storagePath,
    start,
    stop,
    clear,
  };
}

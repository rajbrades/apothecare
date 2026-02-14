"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * MediaRecorder hook for session audio recording.
 *
 * Records audio from the user's microphone using the MediaRecorder API.
 * Produces a Blob that can be uploaded for Whisper transcription.
 */

interface UseAudioRecorderOptions {
  /** Max recording duration in seconds (default: 1800 = 30 min) */
  maxDuration?: number;
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
  /** Recording duration in seconds */
  durationSeconds: number;
  /** The recorded audio blob (available after stopping) */
  audioBlob: Blob | null;
  /** Object URL for the recorded audio (for playback) */
  audioUrl: string | null;
  /** Start recording */
  start: () => Promise<void>;
  /** Stop recording */
  stop: () => void;
  /** Clear the recorded audio */
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
  const { maxDuration = 1800, onRecordingComplete, onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
    onErrorRef.current = onError;
  }, [onRecordingComplete, onError]);

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

  const start = useCallback(async () => {
    if (!isSupported) {
      onErrorRef.current?.("Audio recording is not supported in this browser");
      return;
    }

    // Clear previous recording
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
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
  }, [isSupported, audioUrl, maxDuration, cleanup]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clear = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSeconds(0);
    chunksRef.current = [];
  }, [audioUrl]);

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
    durationSeconds,
    audioBlob,
    audioUrl,
    start,
    stop,
    clear,
  };
}

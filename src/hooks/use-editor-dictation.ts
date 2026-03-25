"use client";

import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useAudioRecorder } from "./use-audio-recorder";

export type ScribeStatus = "idle" | "transcribing" | "assigning" | "done" | "error";

interface UseEditorDictationOptions {
  editor: Editor | null;
  visitId?: string;
  onError?: (message: string) => void;
  /** Called when AI Scribe finishes with section assignments */
  onScribeComplete?: (sections: Record<string, string>) => void;
}

export function useEditorDictation({
  editor,
  visitId,
  onError,
  onScribeComplete,
}: UseEditorDictationOptions) {
  const [transcribing, setTranscribing] = useState(false);
  const [scribeStatus, setScribeStatus] = useState<ScribeStatus>("idle");
  const lastInsertRef = useRef<number>(0);

  // Ensure editor is focused before inserting text
  const ensureFocus = useCallback(() => {
    if (!editor) return;
    if (!editor.isFocused) {
      editor.commands.focus("end");
    }
  }, [editor]);

  // Insert text at the current cursor position in the editor
  const insertAtCursor = useCallback(
    (text: string) => {
      if (!editor) return;

      ensureFocus();

      // Add space before text if needed
      const now = Date.now();
      const needsSpace = now - lastInsertRef.current < 2000;
      const prefix = needsSpace ? " " : "";

      editor.commands.insertContent(prefix + text);
      lastInsertRef.current = now;
    },
    [editor, ensureFocus]
  );

  // Live dictation via Web Speech API
  const handleDictationResult = useCallback(
    (transcript: string) => {
      insertAtCursor(transcript);
    },
    [insertAtCursor]
  );

  const handleDictationError = useCallback(
    (error: string) => {
      onError?.(error);
    },
    [onError]
  );

  const dictation = useSpeechRecognition({
    onResult: handleDictationResult,
    onError: handleDictationError,
  });

  // Session recording via MediaRecorder
  const recorder = useAudioRecorder({
    maxDuration: 1800,
    onError: (err) => onError?.(err),
  });

  // Transcribe recorded audio via Whisper API (basic transcription only)
  const uploadAudioToStorage = useCallback(async (blob: Blob): Promise<string> => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const path = `audio/${visitId}/${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from("patient-documents")
      .upload(path, blob, { contentType: blob.type, upsert: true });
    if (error) throw new Error(`Audio upload failed: ${error.message}`);
    return path;
  }, [visitId]);

  const transcribeRecording = useCallback(async () => {
    if (!recorder.audioBlob || !visitId) return;

    setTranscribing(true);

    try {
      // Upload audio to storage first (avoids body size limit)
      const storagePath = await uploadAudioToStorage(recorder.audioBlob);

      const res = await fetch(`/api/visits/${visitId}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_storage_path: storagePath }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transcription failed");
      }

      const { updated_raw_notes } = await res.json();
      // Insert the transcribed text at cursor
      if (updated_raw_notes) {
        insertAtCursor(updated_raw_notes);
      }
      recorder.clear();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  }, [recorder, visitId, insertAtCursor, onError]);

  /**
   * AI Scribe pipeline:
   * 1. Transcribe audio via Whisper
   * 2. Send transcript to /api/visits/[id]/scribe for section assignment
   * 3. Return section assignments to populate the editor
   */
  const scribeRecording = useCallback(async () => {
    if (!recorder.audioBlob || !visitId) return;

    try {
      // Step 1: Upload audio to storage + transcribe
      setScribeStatus("transcribing");

      const storagePath = await uploadAudioToStorage(recorder.audioBlob);

      const transcribeRes = await fetch(`/api/visits/${visitId}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_storage_path: storagePath }),
      });

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json();
        throw new Error(data.error || "Transcription failed");
      }

      const { transcript } = await transcribeRes.json();

      if (!transcript || transcript.trim().length < 10) {
        throw new Error("Transcript too short. Please record a longer encounter.");
      }

      // Step 2: AI Section Assignment
      setScribeStatus("assigning");

      const scribeRes = await fetch(`/api/visits/${visitId}/scribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!scribeRes.ok) {
        const data = await scribeRes.json();
        throw new Error(data.error || "AI Scribe processing failed");
      }

      const { sections } = await scribeRes.json();

      // Step 3: Notify parent to populate editor sections
      setScribeStatus("done");
      recorder.clear();
      onScribeComplete?.(sections);
    } catch (err) {
      setScribeStatus("error");
      onError?.(err instanceof Error ? err.message : "AI Scribe failed");
    }
  }, [recorder, visitId, onError, onScribeComplete]);

  // Reset scribe status
  const resetScribe = useCallback(() => {
    setScribeStatus("idle");
  }, []);

  // Start dictation (reset state first)
  const startDictation = useCallback(() => {
    ensureFocus();
    dictation.start();
  }, [dictation, ensureFocus]);

  // Start recording
  const startRecording = useCallback(() => {
    ensureFocus();
    recorder.start();
  }, [recorder, ensureFocus]);

  // Stop everything and trigger complete
  const completeNote = useCallback(() => {
    if (dictation.isListening) dictation.stop();
    if (recorder.isRecording) recorder.stop();
  }, [dictation, recorder]);

  const isActive = dictation.isListening || recorder.isRecording;
  const hasRecording = !!recorder.audioBlob && !recorder.isRecording;
  const isScribing = scribeStatus === "transcribing" || scribeStatus === "assigning";

  return {
    // Dictation
    dictation,
    startDictation,

    // Recording
    recorder,
    startRecording,
    transcribeRecording,
    transcribing,

    // AI Scribe
    scribeRecording,
    scribeStatus,
    isScribing,
    resetScribe,

    // State
    isActive,
    hasRecording,

    // Actions
    completeNote,
    insertAtCursor,
  };
}

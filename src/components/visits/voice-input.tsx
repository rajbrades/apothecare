"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface VoiceInputProps {
  /** Called when finalized text is available to append */
  onTranscript: (text: string) => void;
  /** Whether the input is disabled (e.g. during generation) */
  disabled?: boolean;
}

/**
 * Real-time dictation toggle using the Web Speech API.
 * Transcribes speech as the user talks and appends to notes.
 */
export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleResult = useCallback(
    (transcript: string) => {
      // Add a space before appending if needed
      onTranscript(transcript);
    },
    [onTranscript]
  );

  const handleError = useCallback((err: string) => {
    setError(err);
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  const { isSupported, isListening, interimTranscript, toggle } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
  });

  if (!isSupported) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`relative p-2 rounded-[var(--radius-md)] transition-all ${
          isListening
            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-surface-secondary)] border border-transparent"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? "Stop dictation" : "Start dictation"}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            {/* Pulsing indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Interim transcript preview */}
      {isListening && interimTranscript && (
        <span className="ml-2 text-xs text-[var(--color-text-muted)] italic truncate max-w-[200px]">
          {interimTranscript}
        </span>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] whitespace-nowrap flex items-center gap-1.5 z-10">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

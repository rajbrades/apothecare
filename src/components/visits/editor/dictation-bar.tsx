"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Mic, MicOff, Square, Loader2, AlertCircle, Sparkles,
} from "lucide-react";
import { useEditorDictation } from "@/hooks/use-editor-dictation";

interface DictationBarProps {
  editor: Editor | null;
  visitId: string;
  autoStart?: boolean;
  disabled?: boolean;
  onCompleteNote?: () => void;
  /** Called when AI Scribe finishes assigning sections */
  onScribeComplete?: (sections: Record<string, string>) => void;
}

const SCRIBE_STATUS_LABELS = {
  idle: "",
  transcribing: "Transcribing audio...",
  assigning: "Assigning to sections...",
  done: "Sections populated",
  error: "Scribe failed",
} as const;

export function DictationBar({
  editor,
  visitId,
  autoStart,
  disabled,
  onCompleteNote,
  onScribeComplete,
}: DictationBarProps) {
  const [error, setError] = useState<string | null>(null);
  const hasAutoStarted = useRef(false);

  const {
    dictation,
    startDictation,
    recorder,
    startRecording,
    scribeRecording,
    scribeStatus,
    isScribing,
    resetScribe,
    isActive,
    hasRecording,
    completeNote,
  } = useEditorDictation({
    editor,
    visitId,
    onError: (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 8000);
    },
    onScribeComplete: (sections) => {
      onScribeComplete?.(sections);
      // Auto-reset scribe status after a short delay
      setTimeout(() => resetScribe(), 3000);
    },
  });

  // Auto-start recording when autoStart is true (AI Scribe mode)
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && recorder.isSupported && editor) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => startRecording(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, editor]);

  const handleComplete = () => {
    completeNote();
    // If live dictation (no recording blob), trigger generation immediately
    if (!recorder.audioBlob && !recorder.isRecording) {
      onCompleteNote?.();
    }
  };

  if (!dictation.isSupported && !recorder.isSupported) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
        {/* Left: status */}
        <div className="flex items-center gap-3">
          {isScribing ? (
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-brand-600)]" />
              <span className="text-[var(--color-brand-600)] font-medium">
                {SCRIBE_STATUS_LABELS[scribeStatus]}
              </span>
            </div>
          ) : scribeStatus === "done" ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Sections populated — review and edit
            </div>
          ) : isActive ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">
                {dictation.isListening ? "Dictating" : "Recording encounter"}
              </span>
              {recorder.isRecording && (
                <span className="font-[var(--font-mono)]">
                  {formatDuration(recorder.durationSeconds)}
                </span>
              )}
            </div>
          ) : hasRecording ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span className="font-[var(--font-mono)]">
                {formatDuration(recorder.durationSeconds)}
              </span>
              <span>recorded — ready to scribe</span>
            </div>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">
              Dictate into sections or use AI Scribe to record the encounter
            </span>
          )}

          {dictation.interimTranscript && (
            <span className="text-xs text-[var(--color-text-muted)] italic truncate max-w-[200px]">
              {dictation.interimTranscript}
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Idle state: show Dictate + AI Scribe */}
          {!isActive && !hasRecording && !isScribing && scribeStatus !== "done" && (
            <>
              {/* Quick dictate into current section */}
              {dictation.isSupported && (
                <button
                  type="button"
                  onClick={startDictation}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
                >
                  <Mic className="w-3.5 h-3.5" />
                  Dictate
                </button>
              )}

              {/* AI Scribe — record encounter for full processing */}
              {recorder.isSupported && visitId && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-full hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Scribe
                </button>
              )}
            </>
          )}

          {/* Active: stop dictation */}
          {dictation.isListening && (
            <button
              type="button"
              onClick={dictation.stop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
            >
              <MicOff className="w-3.5 h-3.5" />
              Stop
            </button>
          )}

          {/* Active: stop recording */}
          {recorder.isRecording && (
            <button
              type="button"
              onClick={recorder.stop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop Recording
            </button>
          )}

          {/* Has recording: Process with AI Scribe */}
          {hasRecording && !isScribing && (
            <button
              type="button"
              onClick={scribeRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-full hover:bg-[var(--color-brand-500)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Process with AI Scribe
            </button>
          )}

          {/* Complete note (when dictating) */}
          {isActive && (
            <button
              type="button"
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-full hover:bg-[var(--color-brand-100)] transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              Complete Note
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

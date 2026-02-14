"use client";

import { useState } from "react";
import {
  Circle,
  Square,
  Loader2,
  AlertCircle,
  Trash2,
  Upload,
  Play,
  Pause,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

interface AudioRecorderProps {
  /** Visit ID for the transcribe endpoint */
  visitId: string;
  /** Called with the transcribed text and updated raw notes */
  onTranscribed: (transcript: string, updatedNotes: string) => void;
  /** Whether the recorder is disabled */
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Session audio recorder with Whisper transcription.
 *
 * Records audio → stops → uploads to transcribe endpoint → returns text.
 */
export function AudioRecorder({ visitId, onTranscribed, disabled }: AudioRecorderProps) {
  const [error, setError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const recorder = useAudioRecorder({
    maxDuration: 1800, // 30 min
    onError: (err) => {
      setError(err);
      setTimeout(() => setError(null), 5000);
    },
  });

  const handleTranscribe = async () => {
    if (!recorder.audioBlob) return;

    setTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", recorder.audioBlob, "recording.webm");

      const res = await fetch(`/api/visits/${visitId}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transcription failed");
      }

      const { transcript, updated_raw_notes } = await res.json();
      onTranscribed(transcript, updated_raw_notes);
      recorder.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const handlePlayPause = () => {
    if (!recorder.audioUrl) return;

    if (audioEl && isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(recorder.audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setAudioEl(audio);
    setIsPlaying(true);
  };

  if (!recorder.isSupported) return null;

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className="flex items-center gap-2">
        {!recorder.isRecording && !recorder.audioBlob && (
          <button
            onClick={recorder.start}
            disabled={disabled || transcribing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start recording session"
          >
            <Circle className="w-3 h-3 fill-current" />
            Record Session
          </button>
        )}

        {recorder.isRecording && (
          <>
            <button
              onClick={recorder.stop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] hover:bg-red-100 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {formatDuration(recorder.durationSeconds)}
            </span>
          </>
        )}

        {recorder.audioBlob && !recorder.isRecording && (
          <>
            {/* Playback */}
            <button
              onClick={handlePlayPause}
              disabled={transcribing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? "Pause" : "Play"}
              <span className="text-[var(--color-text-muted)]">
                ({formatDuration(recorder.durationSeconds)})
              </span>
            </button>

            {/* Transcribe */}
            <button
              onClick={handleTranscribe}
              disabled={transcribing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50"
            >
              {transcribing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  Transcribe
                </>
              )}
            </button>

            {/* Discard */}
            <button
              onClick={() => {
                if (audioEl) {
                  audioEl.pause();
                  setIsPlaying(false);
                }
                recorder.clear();
              }}
              disabled={transcribing}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors disabled:opacity-50"
              title="Discard recording"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-700">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

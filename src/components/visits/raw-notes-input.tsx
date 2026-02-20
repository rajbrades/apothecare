"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Mic, MicOff, Keyboard, Pause, Play, Square, Loader2,
  AlertCircle, FileText, MessageSquareText,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

type InputMode = "type" | "transcribe";
type TranscriptView = "running" | "raw";

interface RawNotesInputProps {
  value: string;
  onChange: (value: string) => void;
  visitType: "soap" | "follow_up" | "history_physical" | "consult";
  visitId?: string;
  disabled?: boolean;
  /** Start in transcribe mode (e.g. from ?mode=transcribe) */
  initialMode?: InputMode;
  /** Trigger SOAP generation after completing recording */
  onCompleteNote?: () => void;
}

const PLACEHOLDERS: Record<string, string> = {
  soap: `Chief complaint and HPI, review of systems, vitals, physical exam findings, lab results or imaging, current medications and supplements, assessment impressions, treatment considerations...`,
  follow_up: `Progress since last visit, current symptoms and changes, protocol adherence, new lab results or findings, updated assessment, plan modifications...`,
  history_physical: `Chief complaint, HPI with timeline, past medical/surgical/family history, social history and lifestyle, full review of systems, vitals, comprehensive physical exam findings, lab results...`,
  consult: `Reason for consultation, referring provider, relevant history, focused exam findings, records reviewed, clinical impression, recommendations for referring provider...`,
};

export function RawNotesInput({
  value, onChange, visitType, visitId, disabled, initialMode, onCompleteNote,
}: RawNotesInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<InputMode>(initialMode || "type");
  const [transcriptView, setTranscriptView] = useState<TranscriptView>("running");
  const [error, setError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Running notes: AI-structured bullet points extracted from raw transcript
  const [runningNotes, setRunningNotes] = useState<string[]>([]);
  const runningNotesRef = useRef<string[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || mode !== "type") return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
  }, [value, mode]);

  // ── Extract running notes from transcript ──
  // Parses raw dictation into structured bullet points
  const extractRunningNotes = useCallback((transcript: string) => {
    if (!transcript.trim()) return;
    // Split on sentence-like boundaries and create bullet points
    const sentences = transcript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1];
      // Only add if it's meaningfully different from the last note
      const existingNotes = runningNotesRef.current;
      const lastNote = existingNotes[existingNotes.length - 1];
      if (!lastNote || !lastSentence.startsWith(lastNote.slice(0, 20))) {
        const updated = [...existingNotes, lastSentence];
        runningNotesRef.current = updated;
        setRunningNotes(updated);
      }
    }
  }, []);

  // ── Speech Recognition (real-time dictation) ──
  const handleDictationResult = useCallback(
    (transcript: string) => {
      const needsSpace = value.length > 0 && !value.endsWith(" ") && !value.endsWith("\n");
      const newValue = value + (needsSpace ? " " : "") + transcript;
      onChange(newValue);
      extractRunningNotes(transcript);
    },
    [value, onChange, extractRunningNotes]
  );

  const handleDictationError = useCallback((err: string) => {
    setError(err);
    setTimeout(() => setError(null), 5000);
  }, []);

  const dictation = useSpeechRecognition({
    onResult: handleDictationResult,
    onError: handleDictationError,
  });

  // ── Audio Recorder (session recording → Whisper) ──
  const recorder = useAudioRecorder({
    maxDuration: 1800,
    onError: (err) => {
      setError(err);
      setTimeout(() => setError(null), 5000);
    },
  });

  const handleTranscribeRecording = async () => {
    if (!recorder.audioBlob || !visitId) return;

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

      const { updated_raw_notes } = await res.json();
      onChange(updated_raw_notes);
      recorder.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  // ── Complete Note: stop recording and trigger generation ──
  const handleCompleteNote = useCallback(() => {
    if (dictation.isListening) dictation.stop();
    if (recorder.isRecording) recorder.stop();
    // If there's a session recording, transcribe first, then generate
    // For live dictation, the text is already in value — just generate
    if (!recorder.isRecording && !recorder.audioBlob) {
      // Live dictation mode — text is already captured
      onCompleteNote?.();
    }
    // For recorded audio, the user will need to transcribe first via the bar
  }, [dictation, recorder, onCompleteNote]);

  const isActive = dictation.isListening || recorder.isRecording;
  const hasRecording = !!recorder.audioBlob && !recorder.isRecording;

  // ── Start transcription ──
  const startDictation = useCallback(() => {
    setRunningNotes([]);
    runningNotesRef.current = [];
    dictation.start();
  }, [dictation]);

  const startRecording = useCallback(() => {
    setRunningNotes([]);
    runningNotesRef.current = [];
    recorder.start();
  }, [recorder]);

  // Auto-start dictation when entering in transcribe mode (from ?mode=transcribe)
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (initialMode === "transcribe" && !hasAutoStarted.current && dictation.isSupported) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => startDictation(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  return (
    <div className="space-y-3">
      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("type");
            if (dictation.isListening) dictation.stop();
            if (recorder.isRecording) recorder.stop();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-[var(--radius-md)] border transition-all ${
            mode === "type"
              ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
              : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Type Notes
        </button>
        <button
          type="button"
          onClick={() => setMode("transcribe")}
          disabled={!dictation.isSupported && !recorder.isSupported}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-[var(--radius-md)] border transition-all ${
            mode === "transcribe"
              ? "border-red-300 bg-red-50 text-red-700 font-medium"
              : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Mic className="w-4 h-4" />
          Transcribe
        </button>
      </div>

      {/* ── Type mode ── */}
      {mode === "type" && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={PLACEHOLDERS[visitType]}
            disabled={disabled}
            className="w-full min-h-[200px] p-5 text-sm leading-relaxed text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] outline-none resize-none placeholder:text-[var(--color-text-muted)] placeholder:leading-relaxed focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            spellCheck={true}
          />
          <div className="absolute bottom-3 right-4 flex items-center gap-2">
            {dictation.isSupported && (
              <button
                type="button"
                onClick={dictation.toggle}
                disabled={disabled}
                className={`p-1.5 rounded-md transition-all ${
                  dictation.isListening
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-surface-secondary)]"
                } disabled:opacity-50`}
                title={dictation.isListening ? "Stop dictation" : "Dictate"}
              >
                {dictation.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
              {value.length.toLocaleString()} chars
            </span>
          </div>
        </div>
      )}

      {/* ── Transcribe mode ── */}
      {mode === "transcribe" && (
        <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] overflow-hidden">

          {/* Idle state — start options */}
          {!isActive && !hasRecording && !value.trim() && (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-4">
                <Mic className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Record your encounter
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-6 text-center max-w-sm">
                Speak naturally — AI will transcribe and structure your clinical notes.
              </p>
              <div className="flex items-center gap-3">
                {dictation.isSupported && (
                  <button
                    type="button"
                    onClick={startDictation}
                    disabled={disabled}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Mic className="w-4 h-4" />
                    Live Dictation
                  </button>
                )}
                {recorder.isSupported && visitId && (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={disabled}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4" />
                    Record Session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Idle state with existing notes — restart or edit */}
          {!isActive && !hasRecording && value.trim() && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Transcribed Notes
                </p>
                <div className="flex items-center gap-2">
                  {dictation.isSupported && (
                    <button
                      type="button"
                      onClick={startDictation}
                      disabled={disabled}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Mic className="w-3 h-3" />
                      Continue
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMode("type")}
                    className="text-xs text-[var(--color-brand-600)] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                {value}
              </p>
            </div>
          )}

          {/* ── Active recording: Running Notes panel ── */}
          {(isActive || hasRecording) && (
            <div className="px-5 py-4">
              {/* View toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTranscriptView("running")}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      transcriptView === "running"
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    Running Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscriptView("raw")}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      transcriptView === "raw"
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Raw Transcript
                  </button>
                </div>
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {recorder.isRecording
                      ? formatDuration(recorder.durationSeconds)
                      : "Live"}
                  </span>
                )}
              </div>

              {/* Content area */}
              <div className="min-h-[120px] max-h-[300px] overflow-y-auto">
                {transcriptView === "running" ? (
                  <ul className="space-y-1.5">
                    {runningNotes.length > 0 ? (
                      runningNotes.map((note, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-1.5 shrink-0" />
                          {note}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)] italic">
                        {isActive ? "Listening for clinical notes..." : "No notes captured yet."}
                      </p>
                    )}
                    {dictation.interimTranscript && (
                      <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)] italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)] mt-1.5 shrink-0" />
                        {dictation.interimTranscript}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                    {value || (
                      <span className="text-[var(--color-text-muted)] italic">
                        {isActive ? "Waiting for speech..." : "No transcript yet."}
                      </span>
                    )}
                    {dictation.interimTranscript && (
                      <span className="text-[var(--color-text-muted)] italic">
                        {" "}{dictation.interimTranscript}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Bottom control bar ── */}
          {(isActive || hasRecording) && (
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border-light)]">
              <div className="flex items-center gap-3">
                {/* Recording indicator */}
                {isActive && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="font-[var(--font-mono)]">
                      {recorder.isRecording
                        ? formatDuration(recorder.durationSeconds)
                        : "00:00"}
                    </span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-600 font-medium">
                      {dictation.isListening ? "Dictating" : "Recording"}
                    </span>
                  </div>
                )}
                {hasRecording && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="font-[var(--font-mono)]">
                      {formatDuration(recorder.durationSeconds)}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">recorded</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Transcribe button for recorded audio */}
                {hasRecording && (
                  <button
                    type="button"
                    onClick={handleTranscribeRecording}
                    disabled={transcribing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--color-brand-600)] rounded-full hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
                  >
                    {transcribing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        Transcribe
                      </>
                    )}
                  </button>
                )}

                {/* Complete Note button */}
                {(isActive || (hasRecording && !transcribing)) && (
                  <button
                    type="button"
                    onClick={isActive ? handleCompleteNote : undefined}
                    disabled={!isActive && !value.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Complete Note
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
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

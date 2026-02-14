"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Web Speech API hook for real-time dictation.
 *
 * Uses the browser's built-in SpeechRecognition API to transcribe
 * speech in real-time. Results are streamed as interim/final transcripts.
 *
 * Browser support: Chrome, Edge, Safari 14.1+. Firefox requires flag.
 */

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: en-US) */
  language?: string;
  /** Called with each final transcript chunk */
  onResult?: (transcript: string) => void;
  /** Called with interim (not yet finalized) transcript */
  onInterim?: (transcript: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Whether the browser supports Web Speech API */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Current interim transcript (not yet finalized) */
  interimTranscript: string;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Toggle listening on/off */
  toggle: () => void;
}

// Extend Window for vendor-prefixed SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, SpeechRecognitionConstructor>).SpeechRecognition ||
    (window as unknown as Record<string, SpeechRecognitionConstructor>).webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { language = "en-US", onResult, onInterim, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isSupported = typeof window !== "undefined" && getSpeechRecognition() !== null;

  // Store callbacks in refs to avoid re-creating recognition on every render
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onResultRef.current = onResult;
    onInterimRef.current = onInterim;
    onErrorRef.current = onError;
  }, [onResult, onInterim, onError]);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      onErrorRef.current?.("Speech recognition is not supported in this browser");
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        onResultRef.current?.(final);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
        onInterimRef.current?.(interim);
      }
    };

    recognition.onerror = (event) => {
      // "aborted" is not really an error — it's us calling stop()
      if (event.error === "aborted") return;

      const errorMessages: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Please allow microphone access.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Network error. Check your connection.",
        "audio-capture": "No microphone found. Please connect one.",
      };
      onErrorRef.current?.(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    start,
    stop,
    toggle,
  };
}

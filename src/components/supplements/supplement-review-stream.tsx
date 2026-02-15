"use client";

import { useEffect, useRef } from "react";
import { Loader2, StopCircle } from "lucide-react";

interface SupplementReviewStreamProps {
  status: "generating" | "streaming";
  rawText: string;
  onAbort: () => void;
}

export function SupplementReviewStream({
  status,
  rawText,
  onAbort,
}: SupplementReviewStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawText]);

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-600)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {status === "generating"
              ? "Generating supplement review..."
              : "Analyzing supplements..."}
          </span>
        </div>
        <button
          onClick={onAbort}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] hover:bg-red-100 transition-colors"
        >
          <StopCircle className="w-3.5 h-3.5" />
          Stop
        </button>
      </div>

      {/* Streaming text display */}
      {rawText && (
        <div
          ref={scrollRef}
          className="max-h-80 overflow-y-auto p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]"
        >
          <pre className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap break-words leading-relaxed">
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}

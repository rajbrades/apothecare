"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, Sparkles, Loader2 } from "lucide-react";

interface SoapSectionProps {
  label: string;
  shortLabel: string;
  value: string;
  aiValue?: string;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
  streamingText?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function SoapSection({
  label,
  shortLabel,
  value,
  status,
  streamingText,
  readOnly,
  onChange,
}: SoapSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "generating";
  const displayValue = isStreaming ? (streamingText || "") : value;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-[var(--color-brand-600)] text-white text-xs font-bold flex items-center justify-center">
            {shortLabel}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-brand-600)]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </span>
          )}
          {status === "complete" && value && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-brand-600)]">
              <Sparkles className="w-3 h-3" />
              AI-generated
            </span>
          )}
        </div>
        {!readOnly && !isStreaming && value && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {isEditing ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {/* Section content */}
      <div className="p-4">
        {isEditing && !readOnly ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full min-h-[100px] text-sm leading-relaxed text-[var(--color-text-primary)] bg-transparent outline-none resize-none"
          />
        ) : displayValue ? (
          <div className="text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap">
            {displayValue}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--color-brand-500)] animate-pulse rounded-sm" />
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)] italic">
            {status === "idle" ? "Generate a note to populate this section" : "No content"}
          </p>
        )}
      </div>
    </div>
  );
}

interface SoapSectionsProps {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  soapStatus: "idle" | "generating" | "streaming" | "complete" | "error";
  streamingText: string;
  readOnly?: boolean;
  onUpdate: (field: string, value: string) => void;
}

export function SoapSections({
  subjective,
  objective,
  assessment,
  plan,
  soapStatus,
  streamingText,
  readOnly,
  onUpdate,
}: SoapSectionsProps) {
  // Parse streaming text into sections as it arrives
  // The AI streams JSON, so we try to extract partial sections
  let streamS = "";
  let streamO = "";
  let streamA = "";
  let streamP = "";

  if (soapStatus === "streaming" && streamingText) {
    try {
      const jsonMatch = streamingText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const partial = JSON.parse(jsonMatch[0]);
        streamS = partial.subjective || "";
        streamO = partial.objective || "";
        streamA = partial.assessment || "";
        streamP = partial.plan || "";
      }
    } catch {
      // JSON is still being built, try to extract partial fields
      const sMatch = streamingText.match(/"subjective"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const oMatch = streamingText.match(/"objective"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const aMatch = streamingText.match(/"assessment"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const pMatch = streamingText.match(/"plan"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (sMatch) streamS = sMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      if (oMatch) streamO = oMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      if (aMatch) streamA = aMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      if (pMatch) streamP = pMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  // Determine per-section streaming status
  const getSectionStatus = (sectionStream: string, sectionValue: string) => {
    if (soapStatus === "complete") return "complete" as const;
    if (soapStatus === "generating") return "generating" as const;
    if (soapStatus === "streaming" && sectionStream) return "streaming" as const;
    if (soapStatus === "streaming") return "generating" as const;
    if (sectionValue) return "complete" as const;
    return "idle" as const;
  };

  return (
    <div className="space-y-3">
      <SoapSection
        label="Subjective"
        shortLabel="S"
        value={subjective}
        status={getSectionStatus(streamS, subjective)}
        streamingText={streamS}
        readOnly={readOnly}
        onChange={(v) => onUpdate("subjective", v)}
      />
      <SoapSection
        label="Objective"
        shortLabel="O"
        value={objective}
        status={getSectionStatus(streamO, objective)}
        streamingText={streamO}
        readOnly={readOnly}
        onChange={(v) => onUpdate("objective", v)}
      />
      <SoapSection
        label="Assessment"
        shortLabel="A"
        value={assessment}
        status={getSectionStatus(streamA, assessment)}
        streamingText={streamA}
        readOnly={readOnly}
        onChange={(v) => onUpdate("assessment", v)}
      />
      <SoapSection
        label="Plan"
        shortLabel="P"
        value={plan}
        status={getSectionStatus(streamP, plan)}
        streamingText={streamP}
        readOnly={readOnly}
        onChange={(v) => onUpdate("plan", v)}
      />
    </div>
  );
}

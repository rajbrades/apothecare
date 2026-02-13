"use client";

import { useRef, useEffect } from "react";

interface RawNotesInputProps {
  value: string;
  onChange: (value: string) => void;
  visitType: "soap" | "follow_up";
  disabled?: boolean;
}

const PLACEHOLDERS = {
  soap: `Paste or type your clinical notes here. Include any combination of:

• Chief complaint and HPI
• Review of systems
• Vitals, physical exam findings
• Lab results or imaging
• Current medications and supplements
• Assessment impressions
• Treatment considerations

AI will organize these into a structured SOAP note, map findings to the IFM Matrix, and generate evidence-based protocol recommendations.`,
  follow_up: `Paste or type your follow-up notes here. Include:

• Progress since last visit
• Current symptoms and changes
• Protocol adherence (supplements, diet, lifestyle)
• New lab results or findings
• Updated assessment
• Plan modifications

AI will generate a focused follow-up note with protocol adjustments and updated IFM mapping.`,
};

export function RawNotesInput({ value, onChange, visitType, disabled }: RawNotesInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`;
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDERS[visitType]}
        disabled={disabled}
        className="w-full min-h-[300px] p-5 text-sm leading-relaxed text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] outline-none resize-none placeholder:text-[var(--color-text-muted)] placeholder:leading-relaxed focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        spellCheck={true}
      />
      <div className="absolute bottom-3 right-4 text-[11px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
        {value.length.toLocaleString()} chars
      </div>
    </div>
  );
}

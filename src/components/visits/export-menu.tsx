"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Clipboard, Check, FileText } from "lucide-react";
import type { Visit } from "@/types/database";

interface ExportMenuProps {
  visit: Visit;
}

function formatSOAPText(visit: Visit): string {
  const parts: string[] = [];

  if (visit.chief_complaint) {
    parts.push(`CHIEF COMPLAINT: ${visit.chief_complaint}\n`);
  }

  parts.push(`DATE: ${new Date(visit.visit_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })}\n`);

  parts.push(`TYPE: ${visit.visit_type === "follow_up" ? "Follow-up" : "SOAP Note"}\n`);

  if (visit.subjective) {
    parts.push(`\n── SUBJECTIVE ──\n${visit.subjective}`);
  }
  if (visit.objective) {
    parts.push(`\n── OBJECTIVE ──\n${visit.objective}`);
  }
  if (visit.assessment) {
    parts.push(`\n── ASSESSMENT ──\n${visit.assessment}`);
  }
  if (visit.plan) {
    parts.push(`\n── PLAN ──\n${visit.plan}`);
  }

  parts.push(`\n──────────────────\nGenerated with Apothecare — AI Clinical Decision Support\nNote: AI-generated content. Review and verify before clinical use.`);

  return parts.join("\n");
}

export function ExportMenu({ visit }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleCopy = async () => {
    const text = formatSOAPText(visit);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const handlePDF = () => {
    window.open(`/api/visits/${visit.id}/export?format=pdf`, "_blank");
    setOpen(false);
  };

  const hasContent = visit.subjective || visit.objective || visit.assessment || visit.plan;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!hasContent}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-3 h-3" />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-10 w-48 py-1 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)]">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={handlePDF}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Pill, AlertTriangle, Sparkles, Clipboard, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Patient, PatientClinicalSummary } from "@/types/database";

interface PreChartViewProps {
  patient: Patient;
  documentCount?: number;
  onResynthesized?: () => void;
}

export function PreChartView({ patient, documentCount, onResynthesized }: PreChartViewProps) {
  const summary = patient.clinical_summary as PatientClinicalSummary | undefined;
  const [resynthesizing, setResynthesizing] = useState(false);

  const totalDocs = documentCount ?? summary?.document_count ?? 0;
  const synthesizedFrom = summary?.document_count ?? 0;
  const hasNewDocs = totalDocs > synthesizedFrom;

  const handleResynthesize = async () => {
    setResynthesizing(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/resynthesize`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Re-synthesis failed");
      }
      toast.success("Pre-chart re-synthesized from all documents");
      onResynthesized?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-synthesis failed");
    } finally {
      setResynthesizing(false);
    }
  };

  if (!summary || !summary.document_count) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
        <Clipboard className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm mb-2">No Pre-Chart Data</p>
        <p className="text-xs text-center max-w-sm">
          Upload intake questionnaires or health history documents to generate a synthesized pre-chart summary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-xs font-medium text-[var(--color-brand-600)]">
            AI-Synthesized from {synthesizedFrom} document{synthesizedFrom > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {summary.last_updated && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Updated {new Date(summary.last_updated).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleResynthesize}
            disabled={resynthesizing}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] transition-colors disabled:opacity-50 ${
              hasNewDocs
                ? "text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] hover:bg-[var(--color-brand-100)]"
                : "text-[var(--color-text-muted)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]"
            }`}
          >
            {resynthesizing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {hasNewDocs ? `Re-Synthesize (${totalDocs - synthesizedFrom} new)` : "Re-Synthesize"}
          </button>
        </div>
      </div>

      {summary.intake_summary && (
        <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Clinical Summary
          </h3>
          <div className="text-sm text-[var(--color-text-primary)] leading-relaxed prose prose-sm prose-slate max-w-none">
            <ReactMarkdown>{summary.intake_summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {summary.key_findings?.length ? (
        <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Key Findings
          </h3>
          <ul className="space-y-1">
            {summary.key_findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-1.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {summary.medications_from_docs?.length ? (
          <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              <Pill className="w-3 h-3" />
              Medications
            </h3>
            <ul className="space-y-0.5">
              {summary.medications_from_docs.map((m) => (
                <li key={m} className="text-sm text-[var(--color-text-primary)]">{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {summary.supplements_from_docs?.length ? (
          <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              <FileText className="w-3 h-3" />
              Supplements
            </h3>
            <ul className="space-y-0.5">
              {summary.supplements_from_docs.map((s) => (
                <li key={s} className="text-sm text-[var(--color-text-primary)]">{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {summary.allergies_from_docs?.length ? (
          <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3 h-3" />
              Allergies
            </h3>
            <ul className="space-y-0.5">
              {summary.allergies_from_docs.map((a) => (
                <li key={a} className="text-sm text-red-700">{a}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

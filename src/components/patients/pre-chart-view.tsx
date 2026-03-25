"use client";

import ReactMarkdown from "react-markdown";
import { FileText, Pill, AlertTriangle, Sparkles, Clipboard } from "lucide-react";
import type { Patient, PatientClinicalSummary } from "@/types/database";

interface PreChartViewProps {
  patient: Patient;
}

export function PreChartView({ patient }: PreChartViewProps) {
  const summary = patient.clinical_summary as PatientClinicalSummary | undefined;

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
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-xs font-medium text-[var(--color-brand-600)]">
            AI-Synthesized from {summary.document_count} document{summary.document_count > 1 ? "s" : ""}
          </span>
        </div>
        {summary.last_updated && (
          <span className="text-xs text-[var(--color-text-muted)]">
            Updated {new Date(summary.last_updated).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Intake Summary */}
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

      {/* Key Findings */}
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

      {/* Medications + Supplements + Allergies */}
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

"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Patient, IFMMatrix } from "@/types/database";

// ── Section definitions ────────────────────────────────────────────────

interface SectionDef {
  key: string;
  label: string;
  description: string;
  isEmpty: (patient: Patient) => boolean;
}

const ALL_SECTIONS: SectionDef[] = [
  {
    key: "chief_complaints",
    label: "Chief Complaints",
    description: "Primary concerns from documents",
    isEmpty: (p) => !p.chief_complaints || p.chief_complaints.length === 0,
  },
  {
    key: "medical_history",
    label: "Medical History",
    description: "Diagnoses, surgeries, family history (AI)",
    isEmpty: (p) => !p.medical_history?.trim(),
  },
  {
    key: "current_medications",
    label: "Current Medications",
    description: "Medications with dosages",
    isEmpty: (p) => !p.current_medications?.trim(),
  },
  {
    key: "allergies",
    label: "Allergies",
    description: "Known allergies from documents",
    isEmpty: (p) => !p.allergies || p.allergies.length === 0,
  },
  {
    key: "notes",
    label: "Clinical Notes",
    description: "Symptoms, lifestyle, goals (AI)",
    isEmpty: (p) => !p.notes?.trim(),
  },
  {
    key: "ifm_matrix",
    label: "IFM Matrix",
    description: "Map findings to functional medicine matrix (AI)",
    isEmpty: (p) => {
      const m = p.ifm_matrix as IFMMatrix | Record<string, unknown> | null;
      if (!m || typeof m !== "object") return true;
      return Object.values(m).every((node) => {
        if (!node || typeof node !== "object") return true;
        const n = node as { findings?: unknown[]; severity?: string };
        return (!n.findings || n.findings.length === 0) && (!n.severity || n.severity === "none");
      });
    },
  },
];

// ── Banner ─────────────────────────────────────────────────────────────

interface PopulateFromDocsBannerProps {
  patient: Patient;
  extractedDocCount: number;
  sectionsFilter?: string[];
  onPopulated: (data: Partial<Patient>) => void;
}

export function PopulateFromDocsBanner({
  patient,
  extractedDocCount,
  sectionsFilter,
  onPopulated,
}: PopulateFromDocsBannerProps) {
  const [showDialog, setShowDialog] = useState(false);

  const sections = sectionsFilter
    ? ALL_SECTIONS.filter((s) => sectionsFilter.includes(s.key))
    : ALL_SECTIONS;

  const hasEmptySection = sections.some((s) => s.isEmpty(patient));

  if (extractedDocCount === 0 || !hasEmptySection) return null;

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] transition-colors text-left group"
      >
        <Sparkles className="w-4 h-4 text-[var(--color-brand-600)] shrink-0" />
        <span className="text-sm text-[var(--color-brand-700)]">
          <span className="font-medium">{extractedDocCount} document{extractedDocCount !== 1 ? "s" : ""} extracted</span>
          {" — "}
          <span className="group-hover:underline">Populate from documents</span>
        </span>
      </button>

      {showDialog && (
        <PopulateFromDocsDialog
          patient={patient}
          sectionsFilter={sectionsFilter}
          onClose={() => setShowDialog(false)}
          onPopulated={(data) => {
            onPopulated(data);
            setShowDialog(false);
          }}
        />
      )}
    </>
  );
}

// ── Dialog ─────────────────────────────────────────────────────────────

interface PopulateFromDocsDialogProps {
  patient: Patient;
  sectionsFilter?: string[];
  onClose: () => void;
  onPopulated: (data: Partial<Patient>) => void;
}

function PopulateFromDocsDialog({
  patient,
  sectionsFilter,
  onClose,
  onPopulated,
}: PopulateFromDocsDialogProps) {
  const sections = sectionsFilter
    ? ALL_SECTIONS.filter((s) => sectionsFilter.includes(s.key))
    : ALL_SECTIONS;

  // Empty fields checked by default, fields with content unchecked
  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const s of sections) {
      if (s.isEmpty(patient)) initial.add(s.key);
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handlePopulate = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patient.id}/populate-from-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: [...selected] }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }

      const { populated, document_count } = await res.json();
      onPopulated(populated as Partial<Patient>);
      toast.success(`Populated from ${document_count} document${document_count !== 1 ? "s" : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to populate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto bg-[var(--color-surface)]/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md my-auto bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border)] animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Sparkles className="w-4.5 h-4.5 text-[var(--color-brand-600)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Populate from Documents
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Select which fields to populate. Existing content in selected fields will be overwritten.
          </p>
        </div>

        {/* Section checkboxes */}
        <div className="px-6 space-y-1">
          {sections.map((s) => {
            const empty = s.isEmpty(patient);
            const checked = selected.has(s.key);

            return (
              <label
                key={s.key}
                className={`flex items-start gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition-colors ${
                  checked
                    ? "bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]"
                    : "bg-[var(--color-surface-secondary)] border border-transparent hover:border-[var(--color-border-light)]"
                } ${loading ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s.key)}
                  disabled={loading}
                  className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-brand-600)] focus:ring-[var(--color-brand-400)]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {s.label}
                    </span>
                    {!empty && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        has content
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 p-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePopulate}
            disabled={loading || selected.size === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Populating..." : `Populate ${selected.size} field${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

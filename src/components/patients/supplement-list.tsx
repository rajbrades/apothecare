"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  Pill, Plus, Pencil, Check, X, Loader2, Trash2, FlaskConical,
} from "lucide-react";
import type { PatientSupplement } from "@/types/database";

// ── Types ─────────────────────────────────────────────────────────────

interface SupplementFormData {
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  timing: string;
  brand: string;
}

const EMPTY_FORM: SupplementFormData = {
  name: "",
  dosage: "",
  form: "",
  frequency: "",
  timing: "",
  brand: "",
};

const FORM_OPTIONS = [
  "", "Capsule", "Softgel", "Tablet", "Chewable", "Gummy",
  "Powder", "Liquid", "Drops", "Spray", "Sublingual", "Lozenge",
  "Patch", "Topical", "Injection", "Other",
];

const FREQUENCY_OPTIONS = [
  "", "1x daily", "2x daily", "3x daily", "4x daily",
  "Every other day", "Weekly", "2x weekly", "3x weekly",
  "As needed", "With each meal", "Other",
];

const TIMING_OPTIONS = [
  "", "With food", "With breakfast", "With lunch", "With dinner",
  "Before bed", "On empty stomach", "Morning", "Evening",
  "30 min before meal", "Other",
];

const selectClass = "text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]";
const inputClass = selectClass;

// ── Helpers ───────────────────────────────────────────────────────────

function buildDetailLine(sup: PatientSupplement): string {
  const parts: string[] = [];
  if (sup.dosage) parts.push(sup.dosage);
  if (sup.form) parts.push(sup.form);
  if (sup.frequency) parts.push(sup.frequency);
  if (sup.timing) parts.push(sup.timing);
  return parts.join(" · ");
}

// ── SupplementRow ─────────────────────────────────────────────────────

function SupplementRow({
  supplement,
  patientId,
  onUpdated,
  onDiscontinued,
}: {
  supplement: PatientSupplement;
  patientId: string;
  onUpdated: (sup: PatientSupplement) => void;
  onDiscontinued: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SupplementFormData>(EMPTY_FORM);

  const handleEdit = () => {
    setDraft({
      name: supplement.name,
      dosage: supplement.dosage ?? "",
      form: supplement.form ?? "",
      frequency: supplement.frequency ?? "",
      timing: supplement.timing ?? "",
      brand: supplement.brand ?? "",
    });
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/supplements/${supplement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          dosage: draft.dosage.trim() || null,
          form: draft.form.trim() || null,
          frequency: draft.frequency.trim() || null,
          timing: draft.timing.trim() || null,
          brand: draft.brand.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const { supplement: updated } = await res.json();
      onUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscontinue = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/supplements/${supplement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to discontinue");
      }
      onDiscontinued(supplement.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const detail = buildDetailLine(supplement);

  if (isEditing) {
    return (
      <div className="p-3 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Supplement name *"
            className={`col-span-2 ${inputClass}`}
            autoFocus
          />
          <input
            type="text"
            value={draft.dosage}
            onChange={(e) => setDraft((d) => ({ ...d, dosage: e.target.value }))}
            placeholder="Dosage (e.g., 400mg)"
            className={inputClass}
          />
          <select
            value={draft.form}
            onChange={(e) => setDraft((d) => ({ ...d, form: e.target.value }))}
            className={`${selectClass} ${!draft.form ? "text-[var(--color-text-muted)]" : ""}`}
          >
            <option value="">Form</option>
            {FORM_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            value={draft.frequency}
            onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value }))}
            className={`${selectClass} ${!draft.frequency ? "text-[var(--color-text-muted)]" : ""}`}
          >
            <option value="">Frequency</option>
            {FREQUENCY_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            value={draft.timing}
            onChange={(e) => setDraft((d) => ({ ...d, timing: e.target.value }))}
            className={`${selectClass} ${!draft.timing ? "text-[var(--color-text-muted)]" : ""}`}
          >
            <option value="">Timing</option>
            {TIMING_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input
            type="text"
            value={draft.brand}
            onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
            placeholder="Brand (optional)"
            className={`col-span-2 ${inputClass}`}
          />
        </div>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-[var(--radius-sm)] transition-colors"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border-light)] last:border-b-0 group">
      <Pill className="w-4 h-4 text-[var(--color-brand-600)] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {supplement.name}
          </span>
          {supplement.brand && (
            <span className="text-xs text-[var(--color-text-muted)]">
              ({supplement.brand})
            </span>
          )}
        </div>
        {detail && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEdit}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDiscontinue}
          disabled={isSaving}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Discontinue"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── AddSupplementForm ─────────────────────────────────────────────────

function AddSupplementForm({
  patientId,
  onAdded,
  onCancel,
}: {
  patientId: string;
  onAdded: (sup: PatientSupplement) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SupplementFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/supplements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          dosage: draft.dosage.trim() || null,
          form: draft.form.trim() || null,
          frequency: draft.frequency.trim() || null,
          timing: draft.timing.trim() || null,
          brand: draft.brand.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add");
      }
      const { supplement } = await res.json();
      onAdded(supplement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-3 border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)]">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Supplement name *"
          className={`col-span-2 ${inputClass}`}
          autoFocus
        />
        <input
          type="text"
          value={draft.dosage}
          onChange={(e) => setDraft((d) => ({ ...d, dosage: e.target.value }))}
          placeholder="Dosage (e.g., 400mg)"
          className={inputClass}
        />
        <select
          value={draft.form}
          onChange={(e) => setDraft((d) => ({ ...d, form: e.target.value }))}
          className={`${selectClass} ${!draft.form ? "text-[var(--color-text-muted)]" : ""}`}
        >
          <option value="">Form</option>
          {FORM_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={draft.frequency}
          onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value }))}
          className={`${selectClass} ${!draft.frequency ? "text-[var(--color-text-muted)]" : ""}`}
        >
          <option value="">Frequency</option>
          {FREQUENCY_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={draft.timing}
          onChange={(e) => setDraft((d) => ({ ...d, timing: e.target.value }))}
          className={`${selectClass} ${!draft.timing ? "text-[var(--color-text-muted)]" : ""}`}
        >
          <option value="">Timing</option>
          {TIMING_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input
          type="text"
          value={draft.brand}
          onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
          placeholder="Brand (optional)"
          className={`col-span-2 ${inputClass}`}
        />
      </div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-[var(--radius-sm)] transition-colors"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

interface SupplementListProps {
  patientId: string;
  initialSupplements: PatientSupplement[];
}

export function SupplementList({ patientId, initialSupplements }: SupplementListProps) {
  const [supplements, setSupplements] = useState(initialSupplements);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdded = useCallback((sup: PatientSupplement) => {
    setSupplements((prev) => [...prev, sup]);
    setIsAdding(false);
  }, []);

  const handleUpdated = useCallback((updated: PatientSupplement) => {
    setSupplements((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDiscontinued = useCallback((id: string) => {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Current Supplements
        </h3>
        <div className="flex items-center gap-1">
          {supplements.length > 0 && (
            <Link
              href={`/supplements?patientId=${patientId}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-[var(--radius-sm)] transition-colors"
              title="Review supplements with AI"
            >
              <FlaskConical className="w-3 h-3" />
              Review
            </Link>
          )}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              title="Add supplement"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="text-[var(--color-text-primary)]">
        {supplements.length === 0 && !isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add supplement
          </button>
        ) : (
          <div>
            {supplements.map((sup) => (
              <SupplementRow
                key={sup.id}
                supplement={sup}
                patientId={patientId}
                onUpdated={handleUpdated}
                onDiscontinued={handleDiscontinued}
              />
            ))}
          </div>
        )}

        {isAdding && (
          <div className={supplements.length > 0 ? "mt-3" : ""}>
            <AddSupplementForm
              patientId={patientId}
              onAdded={handleAdded}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

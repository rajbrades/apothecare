"use client";

import { useState } from "react";
import { Loader2, X, Activity } from "lucide-react";
import { toast } from "sonner";

interface AddSymptomLogFormProps {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}

const BODY_SYSTEMS = [
  "Neurological",
  "Cardiovascular",
  "Respiratory",
  "Gastrointestinal",
  "Musculoskeletal",
  "Endocrine",
  "Immune",
  "Dermatological",
  "Genitourinary",
  "Psychological",
];

export function AddSymptomLogForm({
  patientId,
  onClose,
  onCreated,
}: AddSymptomLogFormProps) {
  const [saving, setSaving] = useState(false);
  const [symptomName, setSymptomName] = useState("");
  const [severity, setSeverity] = useState<number | null>(null);
  const [bodySystem, setBodySystem] = useState("");
  const [onsetDate, setOnsetDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!symptomName.trim()) {
      toast.error("Symptom name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/symptom-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom_name: symptomName.trim(),
          severity,
          body_system: bodySystem || null,
          onset_date: onsetDate
            ? new Date(onsetDate + "T00:00:00").toISOString()
            : null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log symptom");
      }
      toast.success("Symptom logged");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log symptom");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Log Symptom
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Symptom Name */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Symptom *
        </label>
        <input
          type="text"
          value={symptomName}
          onChange={(e) => setSymptomName(e.target.value)}
          placeholder="e.g. Fatigue, Brain Fog, Joint Pain"
          className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Severity */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Severity
          </label>
          <select
            value={severity ?? ""}
            onChange={(e) =>
              setSeverity(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}/10
              </option>
            ))}
          </select>
        </div>

        {/* Body System */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Body System
          </label>
          <select
            value={bodySystem}
            onChange={(e) => setBodySystem(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">—</option>
            {BODY_SYSTEMS.map((sys) => (
              <option key={sys} value={sys.toLowerCase()}>
                {sys}
              </option>
            ))}
          </select>
        </div>

        {/* Onset Date */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Onset Date
          </label>
          <input
            type="date"
            value={onsetDate}
            onChange={(e) => setOnsetDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional details..."
          className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !symptomName.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-[var(--radius-sm)] disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Log Symptom
        </button>
      </div>
    </div>
  );
}

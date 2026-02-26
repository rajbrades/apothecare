"use client";

import { useState } from "react";
import { Loader2, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface AddPatientReportFormProps {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}

const REPORT_TYPES: { value: string; label: string }[] = [
  { value: "general", label: "General" },
  { value: "symptom", label: "Symptom" },
  { value: "side_effect", label: "Side Effect" },
  { value: "improvement", label: "Improvement" },
  { value: "concern", label: "Concern" },
];

export function AddPatientReportForm({
  patientId,
  onClose,
  onCreated,
}: AddPatientReportFormProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("general");
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState<number | null>(null);
  const [reportedDate, setReportedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!reportedDate) {
      toast.error("Date is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/patient-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          report_type: reportType,
          content: content.trim() || null,
          severity,
          reported_date: new Date(
            reportedDate + "T00:00:00"
          ).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log report");
      }
      toast.success("Patient report logged");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to log report"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Log Patient Report
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Patient reports improved energy"
          className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Report Type */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

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

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Date *
          </label>
          <input
            type="date"
            value={reportedDate}
            onChange={(e) => setReportedDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Details
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Patient-reported details..."
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
          disabled={saving || !title.trim() || !reportedDate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-text-secondary)] hover:bg-[var(--color-text-primary)] rounded-[var(--radius-sm)] disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Log Report
        </button>
      </div>
    </div>
  );
}

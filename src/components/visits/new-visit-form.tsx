"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, RefreshCcw, ArrowLeft, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { RawNotesInput } from "./raw-notes-input";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export function NewVisitForm({ patients }: { patients: PatientOption[] }) {
  const router = useRouter();
  const [visitType, setVisitType] = useState<"soap" | "follow_up">("soap");
  const [patientId, setPatientId] = useState<string>("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim() && !chiefComplaint.trim()) {
      setError("Enter a chief complaint or raw notes to continue.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Create the visit
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_type: visitType,
          patient_id: patientId || null,
          chief_complaint: chiefComplaint || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create visit");
      }

      const { visit } = await res.json();

      // If raw notes exist, save them before navigating
      if (rawNotes.trim()) {
        await fetch(`/api/visits/${visit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_notes: rawNotes }),
        });
      }

      // Navigate to the visit workspace
      router.push(`/visits/${visit.id}${rawNotes.trim() ? "?generate=true" : ""}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Back link */}
      <Link
        href="/visits"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to visits
      </Link>

      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-1">
        New Visit
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Enter clinical notes and let AI generate a structured SOAP note with IFM mapping and protocol recommendations.
      </p>

      {/* Visit type selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
          Visit Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setVisitType("soap")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-[var(--radius-md)] border transition-all ${
              visitType === "soap"
                ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            SOAP Note
          </button>
          <button
            type="button"
            onClick={() => setVisitType("follow_up")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-[var(--radius-md)] border transition-all ${
              visitType === "follow_up"
                ? "border-[var(--color-gold-400)] bg-[var(--color-gold-50)] text-[var(--color-gold-700)] font-medium"
                : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
            }`}
          >
            <RefreshCcw className="w-4 h-4" />
            Follow-up
          </button>
        </div>
      </div>

      {/* Patient selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
          Patient <span className="text-[var(--color-text-muted)] normal-case">(optional)</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] outline-none text-[var(--color-text-primary)] focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all appearance-none"
          >
            <option value="">No patient selected</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
              </option>
            ))}
          </select>
        </div>
        {patientId && (
          <p className="text-[11px] text-[var(--color-brand-600)] mt-1">
            Patient history, labs, and medications will be included as AI context.
          </p>
        )}
      </div>

      {/* Chief complaint */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
          Chief Complaint
        </label>
        <input
          type="text"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="e.g., Fatigue, brain fog, weight gain x 6 months"
          maxLength={500}
          className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all"
        />
      </div>

      {/* Raw notes */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
          Clinical Notes
        </label>
        <RawNotesInput
          value={rawNotes}
          onChange={setRawNotes}
          visitType={visitType}
          disabled={submitting}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          {submitting ? "Creating..." : rawNotes.trim() ? "Create & Generate SOAP" : "Create Visit"}
        </button>
        <Link
          href="/visits"
          className="px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

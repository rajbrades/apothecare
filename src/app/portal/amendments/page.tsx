"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";

interface Amendment {
  id: string;
  field_name: string;
  current_value: string | null;
  requested_value: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  phone: "Phone",
  date_of_birth: "Date of Birth",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  gender_identity: "Gender Identity",
  ethnicity: "Ethnicity",
  allergies: "Allergies",
  medical_history: "Medical History",
  current_medications: "Current Medications",
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending Review" },
  approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Approved" },
  denied: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Denied" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function AmendmentsPage() {
  const router = useRouter();
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchAmendments();
  }, []);

  async function fetchAmendments() {
    try {
      const res = await fetch("/api/patient-portal/me/amendments");
      if (res.status === 401) { router.replace("/portal/login"); return; }
      const data = await res.json();
      setAmendments(data.amendments || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      const res = await fetch("/api/patient-portal/me/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_name: fieldName,
          current_value: currentValue || undefined,
          requested_value: requestedValue,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit request");
        return;
      }
      setSubmitSuccess(true);
      setShowForm(false);
      setFieldName("");
      setCurrentValue("");
      setRequestedValue("");
      setReason("");
      fetchAmendments();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Request Correction
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Per HIPAA §164.526, you may request amendments to your health information.
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setShowForm(true); setSubmitSuccess(false); }}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)] transition-colors"
              >
                New Request
              </button>
            )}
          </div>
        </div>

        {submitSuccess && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700">Your amendment request has been submitted. Your provider will review it.</p>
          </div>
        )}

        {/* New request form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              New Amendment Request
            </h2>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Field to Correct *
              </label>
              <select
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)]"
              >
                <option value="">Select a field…</option>
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Current Value (optional)
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="What is currently on file"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Corrected Value *
              </label>
              <input
                type="text"
                value={requestedValue}
                onChange={(e) => setRequestedValue(e.target.value)}
                required
                placeholder="What it should be changed to"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Reason for Request *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain why this information should be corrected"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] placeholder:text-[var(--color-text-muted)] resize-none"
              />
            </div>

            {submitError && (
              <p className="text-xs text-red-600">{submitError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm font-medium rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !fieldName || !requestedValue || !reason}
                className="flex-1 py-2 text-sm font-medium rounded-md bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        )}

        {/* Existing requests */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-600)] opacity-60" /></div>
        ) : amendments.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-6 py-10 flex flex-col items-center text-center gap-3">
            <FileEdit className="h-6 w-6 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No amendment requests submitted yet.</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              If any information in your health record is incorrect, you can request a correction.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {amendments.map((a) => {
              const config = STATUS_CONFIG[a.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border ${config.border} ${config.bg} p-4 space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {FIELD_LABELS[a.field_name] || a.field_name}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                    {a.current_value && (
                      <p>Current: <span className="line-through">{a.current_value}</span></p>
                    )}
                    <p>Requested: <span className="font-medium">{a.requested_value}</span></p>
                    <p>Reason: {a.reason}</p>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    Submitted {formatDate(a.created_at)}
                    {a.reviewed_at && ` · Reviewed ${formatDate(a.reviewed_at)}`}
                  </p>
                  {a.reviewer_note && (
                    <p className="text-xs text-[var(--color-text-secondary)] italic border-t border-[var(--color-border-light)] pt-2 mt-2">
                      Provider note: {a.reviewer_note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

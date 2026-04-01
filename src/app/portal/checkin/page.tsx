"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { SliderField } from "@/components/portal/intake/intake-fields";
import { SYMPTOM_GROUPS } from "@/lib/constants/symptoms";

export default function SymptomCheckinPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Pre-populate from last check-in
  useEffect(() => {
    async function loadPrevious() {
      try {
        const res = await fetch("/api/patient-portal/me/symptom-checkin/history?mode=overview");
        if (res.status === 401) { router.replace("/portal/login"); return; }
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        // If we have previous snapshots, use the latest scores as defaults
        if (data.trends && data.trends.length > 0) {
          const prev: Record<string, number> = {};
          for (const t of data.trends) {
            prev[t.symptom_key] = t.latest_value;
          }
          setScores(prev);
        }
      } catch { /* start fresh */ } finally {
        setLoading(false);
      }
    }
    loadPrevious();
  }, [router]);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    // Filter out zero scores
    const nonZero: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (v > 0) nonZero[k] = v;
    }

    if (Object.keys(nonZero).length === 0) {
      setError("Please rate at least one symptom.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/patient-portal/me/symptom-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: nonZero, notes: notes.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit check-in");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PortalShell>
        <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-600)] opacity-70" /></div>
      </PortalShell>
    );
  }

  if (success) {
    return (
      <PortalShell>
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-4 py-16">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-brand-600)]" />
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Check-in submitted
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            Thank you for sharing how you&apos;re feeling. Your provider will review your responses.
          </p>
          <Link
            href="/portal/dashboard"
            className="mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-brand-900)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Symptom Check-in
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Rate each symptom from 0 (not a problem) to 10 (severe). Only fill in what&apos;s relevant — skip any that don&apos;t apply.
          </p>
        </div>

        {/* Symptom groups */}
        {SYMPTOM_GROUPS.map((group) => (
          <section key={group.key} className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              <div className="h-px flex-1 bg-[var(--color-border-light)]" />
              <h2 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2">
                {group.label}
              </h2>
              <div className="h-px flex-1 bg-[var(--color-border-light)]" />
            </div>
            {group.symptoms.map((symptom) => (
              <SliderField
                key={symptom.key}
                label={symptom.label}
                value={scores[symptom.key] || 0}
                onChange={(v) => setScore(symptom.key, v)}
              />
            ))}
          </section>
        ))}

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Additional Notes <span className="font-normal italic normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you'd like your provider to know — triggers, patterns, what's changed since last visit..."
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2 ${
            submitting
              ? "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] cursor-wait"
              : "text-white bg-[var(--color-brand-900)] hover:bg-[var(--color-brand-700)] hover:-translate-y-px hover:shadow-lg"
          }`}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            "Submit Check-in"
          )}
        </button>
      </div>
    </PortalShell>
  );
}

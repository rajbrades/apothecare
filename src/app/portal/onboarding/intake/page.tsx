"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";

interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea";
  required: boolean;
  maps_to?: string;
}

interface IntakeTemplate {
  id: string;
  version: number;
  title: string;
  schema_json: TemplateField[];
}

export default function IntakePage() {
  const router = useRouter();
  const [template, setTemplate] = useState<IntakeTemplate | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const DRAFT_KEY = "apothecare_intake_draft";

  useEffect(() => {
    fetch("/api/patient-portal/me/intake")
      .then(async (r) => {
        if (r.status === 401) { router.replace("/portal/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.already_submitted) {
          setAlreadySubmitted(true);
          setLoading(false);
          localStorage.removeItem(DRAFT_KEY);
          setTimeout(() => router.replace("/portal/dashboard"), 1500);
          return;
        }
        if (data.template) {
          setTemplate(data.template);
          try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) setResponses(JSON.parse(saved));
          } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (template && Object.keys(responses).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(responses));
    }
  }, [responses, template]);

  function validate(): boolean {
    if (!template) return false;
    const errors: Record<string, string> = {};
    for (const field of template.schema_json) {
      if (field.required && !responses[field.key]?.trim()) {
        errors[field.key] = "This field is required";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!template || !validate()) return;
    setSubmitting(true);
    setSubmitError("");

    const res = await fetch("/api/patient-portal/me/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: template.id, responses }),
    });

    if (!res.ok) {
      const data = await res.json();
      setSubmitError(data.error || "We couldn't save your intake. Check your internet connection and try again.");
      setSubmitting(false);
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    router.push("/portal/dashboard");
  }

  if (loading) {
    return (
      <PortalShell maxWidth="2xl">
        <p className="text-sm text-[var(--color-text-muted)]">Loading intake form…</p>
      </PortalShell>
    );
  }

  if (alreadySubmitted) {
    return (
      <PortalShell maxWidth="2xl">
        <p className="text-sm text-[var(--color-text-secondary)]">Intake already submitted. Redirecting to your dashboard…</p>
      </PortalShell>
    );
  }

  if (!template) {
    return (
      <PortalShell maxWidth="2xl">
        <p className="text-sm text-[var(--color-text-muted)]">No intake form available. <a href="/portal/dashboard" className="underline">Continue to dashboard.</a></p>
      </PortalShell>
    );
  }

  return (
    <PortalShell maxWidth="2xl">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Step 2 of 2 — Health intake</span>
            <span>Almost done</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-border)]">
            <div className="h-full rounded-full bg-[var(--color-brand-600)] w-full transition-all duration-500 ease-out" />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{template.title}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              This information helps your provider prepare for your care. You can update it at any future visit.
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">
            {template.schema_json.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label htmlFor={`field-${field.key}`} className="text-sm font-medium text-[var(--color-text-primary)]">
                  {field.label}
                  {field.required && (
                    <>
                      <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.key}`}
                    rows={3}
                    value={responses[field.key] || ""}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    aria-invalid={!!fieldErrors[field.key]}
                    aria-describedby={fieldErrors[field.key] ? `error-${field.key}` : undefined}
                    className={`w-full rounded-md border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/30 focus:border-[var(--color-brand-400)] resize-none ${fieldErrors[field.key] ? "border-red-400" : "border-[var(--color-border)]"}`}
                    placeholder="Your answer…"
                  />
                ) : (
                  <input
                    id={`field-${field.key}`}
                    type="text"
                    value={responses[field.key] || ""}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    aria-invalid={!!fieldErrors[field.key]}
                    aria-describedby={fieldErrors[field.key] ? `error-${field.key}` : undefined}
                    className={`w-full rounded-md border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/30 focus:border-[var(--color-brand-400)] ${fieldErrors[field.key] ? "border-red-400" : "border-[var(--color-border)]"}`}
                    placeholder="Your answer…"
                  />
                )}
                {fieldErrors[field.key] && (
                  <p id={`error-${field.key}`} role="alert" className="text-xs text-red-600">{fieldErrors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--color-border)]">
            {submitError && (
              <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 mb-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">{submitError}</p>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
              ) : (
                "Submit and go to dashboard"
              )}
            </Button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

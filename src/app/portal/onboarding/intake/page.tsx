"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logomark } from "@/components/ui/logomark";

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

  useEffect(() => {
    fetch("/api/patient-portal/me/intake")
      .then((r) => r.json())
      .then((data) => {
        if (data.already_submitted) {
          setAlreadySubmitted(true);
          setLoading(false);
          setTimeout(() => router.replace("/portal/dashboard"), 1500);
          return;
        }
        setTemplate(data.template);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

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
      setSubmitError(data.error || "Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/portal/dashboard");
  }

  if (loading) {
    return (
      <PortalShell>
        <p className="text-sm text-[var(--color-text-muted)]">Loading intake form…</p>
      </PortalShell>
    );
  }

  if (alreadySubmitted) {
    return (
      <PortalShell>
        <p className="text-sm text-[var(--color-text-secondary)]">Intake already submitted. Redirecting to your dashboard…</p>
      </PortalShell>
    );
  }

  if (!template) {
    return (
      <PortalShell>
        <p className="text-sm text-[var(--color-text-muted)]">No intake form available. <a href="/portal/dashboard" className="underline">Continue to dashboard.</a></p>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Step 2 of 2 — Health intake</span>
            <span>Almost done</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border)]">
            <div className="h-full rounded-full bg-[var(--color-text-primary)] w-full transition-all" />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{template.title}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              This information helps your provider prepare for your care. You can update it at any future visit.
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">
            {template.schema_json.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={responses[field.key] || ""}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20 resize-none"
                    placeholder="Your answer…"
                  />
                ) : (
                  <input
                    type="text"
                    value={responses[field.key] || ""}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                    placeholder="Your answer…"
                  />
                )}
                {fieldErrors[field.key] && (
                  <p className="text-xs text-red-500">{fieldErrors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--color-border)]">
            {submitError && <p className="text-xs text-red-500 mb-3">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-md bg-[var(--color-text-primary)] text-[var(--color-surface)] text-sm font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit and go to dashboard"}
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2.5">
          <Logomark className="h-6 w-6" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Patient Portal</span>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}

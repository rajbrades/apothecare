"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const [submitted, setSubmitted] = useState(false);

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
          // Restore draft from localStorage
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

  // Save draft to localStorage on changes
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
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PortalShell>
        <OnboardingComplete />
      </PortalShell>
    );
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

function OnboardingComplete() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const portalUrl = `${window.location.origin}/portal/login`;

  function copyUrl() {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-6 py-8">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          You&apos;re all set!
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Your intake has been submitted. Your provider will review it before your next visit.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Bookmark this link to sign in next time
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded px-2.5 py-2 border border-[var(--color-border)] truncate text-left">
            {portalUrl}
          </code>
          <button
            onClick={copyUrl}
            className="flex-shrink-0 p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            aria-label="Copy portal URL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
            )}
          </button>
        </div>
      </div>

      <Button onClick={() => router.push("/portal/dashboard")} className="w-full">
        Go to your dashboard
      </Button>
    </div>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/portal/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logomark className="h-6 w-6" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Patient Portal</span>
          </div>
          <button onClick={signOut} aria-label="Sign out" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-surface-secondary)]">
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</Link>
        </nav>
      </footer>
    </div>
  );
}

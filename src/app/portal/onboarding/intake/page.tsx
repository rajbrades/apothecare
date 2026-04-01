"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { FunctionalMedicineIntake } from "@/components/portal/intake/functional-medicine-intake";
import { Button } from "@/components/ui/button";

export default function IntakePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/patient-portal/me/intake")
      .then(async (r) => {
        if (r.status === 401) { router.replace("/portal/login"); return null; }
        if (r.status === 404) { setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.already_submitted) {
          setAlreadySubmitted(true);
          setLoading(false);
          localStorage.removeItem("apothecare_intake_draft");
          setTimeout(() => router.replace("/portal/dashboard"), 1500);
          return;
        }
        if (data.template) {
          setTemplateId(data.template.id);
        }
        if (data.prefill) {
          setPrefill(data.prefill);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (completed) {
    return (
      <PortalShell maxWidth="2xl">
        <OnboardingComplete />
      </PortalShell>
    );
  }

  if (loading) {
    return (
      <PortalShell maxWidth="2xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-500)]" />
        </div>
      </PortalShell>
    );
  }

  if (alreadySubmitted) {
    return (
      <PortalShell maxWidth="2xl">
        <div className="text-center py-16">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Intake already submitted. Redirecting to your dashboard…
          </p>
        </div>
      </PortalShell>
    );
  }

  if (!templateId) {
    return (
      <PortalShell maxWidth="2xl">
        <div className="text-center py-16">
          <p className="text-sm text-[var(--color-text-muted)]">
            No intake form available.{" "}
            <a href="/portal/dashboard" className="underline text-[var(--color-brand-600)]">
              Continue to dashboard.
            </a>
          </p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell maxWidth="3xl">
      <FunctionalMedicineIntake
        templateId={templateId}
        prefill={prefill ?? undefined}
        onComplete={() => setCompleted(true)}
      />
    </PortalShell>
  );
}

function OnboardingComplete() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/login`
    : "/portal/login";

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

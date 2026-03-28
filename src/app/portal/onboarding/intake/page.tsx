"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { FunctionalMedicineIntake } from "@/components/portal/intake/functional-medicine-intake";

export default function IntakePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

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
        onComplete={() => router.push("/portal/dashboard")}
      />
    </PortalShell>
  );
}

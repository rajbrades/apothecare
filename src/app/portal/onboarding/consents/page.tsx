"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Logomark } from "@/components/ui/logomark";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ConsentTemplate {
  id: string;
  title: string;
  content_markdown: string;
  is_required: boolean;
  signed: boolean;
  signed_at: string | null;
}

export default function ConsentsPage() {
  const router = useRouter();
  const [consents, setConsents] = useState<ConsentTemplate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [signedName, setSignedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patient-portal/me/consents")
      .then((r) => r.json())
      .then((data) => {
        // Only show unsigned required consents
        const unsigned = (data.consents || []).filter((c: ConsentTemplate) => !c.signed);
        setConsents(unsigned);
        setLoading(false);
        if (unsigned.length === 0) {
          // All signed — advance to intake
          router.replace("/portal/onboarding/intake");
        }
      })
      .catch(() => {
        setError("Failed to load consent forms.");
        setLoading(false);
      });
  }, [router]);

  const current = consents[currentIndex];

  async function handleSign() {
    if (!signedName.trim() || !current) return;
    setSigning(true);
    setError("");

    const res = await fetch(`/api/patient-portal/me/consents/${current.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signed_name: signedName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to sign. Please try again.");
      setSigning(false);
      return;
    }

    setSigning(false);
    setSignedName("");

    if (currentIndex + 1 < consents.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push("/portal/onboarding/intake");
    }
  }

  if (loading) {
    return (
      <PortalShell>
        <p className="text-sm text-[var(--color-text-muted)]">Loading consent forms…</p>
      </PortalShell>
    );
  }

  if (!current) return null;

  const total = consents.length;
  const step = currentIndex + 1;

  return (
    <PortalShell>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Step 1 of 2 — Review &amp; sign documents</span>
            <span>Document {step} of {total}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand-600)] transition-all duration-500 ease-out"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Document */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{current.title}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Please review the document below before signing.</p>
          </div>
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto prose prose-sm prose-slate text-[var(--color-text-secondary)]">
            <ReactMarkdown>{current.content_markdown}</ReactMarkdown>
          </div>
        </div>

        {/* Signature capture */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)] px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Sign by typing your full legal name
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              By typing your name and clicking &ldquo;I agree,&rdquo; you acknowledge that you have read and agree to the above document.
            </p>
          </div>
          <input
            type="text"
            placeholder="Your full legal name"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            aria-label="Full legal name for signature"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/30 focus:border-[var(--color-brand-400)]"
          />
          {error && (
            <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}
          <Button
            onClick={handleSign}
            disabled={signing || signedName.trim().length < 2}
            className="w-full"
          >
            {signing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing…</>
            ) : step < total ? (
              "I agree — continue to next document"
            ) : (
              "I agree — continue to intake form"
            )}
          </Button>
        </div>
      </div>
    </PortalShell>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PenLine, FileCheck, Shield } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";

interface ConsentTemplate {
  id: string;
  title: string;
  content_markdown: string;
  is_required: boolean;
  signed: boolean;
  signed_at: string | null;
}

/** Custom markdown components for legal document rendering */
const legalMarkdown: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)] mt-8 mb-3 first:mt-0 pb-2 border-b border-[var(--color-border-light)]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-[var(--color-text-primary)] font-[var(--font-display)] mt-7 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mt-5 mb-1.5">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[13.5px] leading-[1.8] text-[var(--color-text-secondary)] mb-3 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-text-primary)]">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[var(--color-text-secondary)]">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1 mb-3 ml-4 list-disc marker:text-[var(--color-brand-400)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 mb-3 ml-4 list-decimal marker:text-[var(--color-text-muted)]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[13.5px] leading-[1.7] text-[var(--color-text-secondary)] pl-1">
      {children}
    </li>
  ),
  hr: () => (
    <hr className="my-5 border-t border-[var(--color-border-light)]" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-[var(--color-brand-400)] pl-4 py-1 my-4 bg-[var(--color-brand-50)] rounded-r-md pr-4">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-brand-600)] underline underline-offset-2 hover:text-[var(--color-brand-500)] transition-colors"
    >
      {children}
    </a>
  ),
};

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
      .then((r) => {
        if (r.status === 401) { router.replace("/portal/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const unsigned = (data.consents || []).filter((c: ConsentTemplate) => !c.signed);
        setConsents(unsigned);
        setLoading(false);
        if (unsigned.length === 0) {
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
      <PortalShell maxWidth="2xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-500)]" />
        </div>
      </PortalShell>
    );
  }

  if (!current) return null;

  const total = consents.length;
  const step = currentIndex + 1;
  const progressPct = (step / (total + 1)) * 100; // +1 for intake step

  return (
    <PortalShell maxWidth="2xl">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Progress header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Review &amp; Sign
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Step 1 of 2
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-full">
              Document {step} of {total}
            </span>
          </div>
          {/* Segmented progress */}
          <div className="flex gap-1.5">
            {Array.from({ length: total + 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i < step
                    ? "bg-[var(--color-brand-600)]"
                    : i === step
                    ? "bg-[var(--color-brand-200)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Document card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Document header */}
          <div className="px-7 py-5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileCheck className="w-4.5 h-4.5 text-[var(--color-brand-600)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-[var(--font-display)]">
                  {current.title}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Please read the entire document carefully before signing below.
                </p>
              </div>
            </div>
          </div>

          {/* Document body — scrollable */}
          <div className="px-7 py-6 max-h-[55vh] overflow-y-auto scroll-smooth">
            <ReactMarkdown components={legalMarkdown}>
              {current.content_markdown}
            </ReactMarkdown>
          </div>

          {/* Scroll fade hint */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
        </div>

        {/* Signature card */}
        <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] flex items-center justify-center">
              <PenLine className="w-4 h-4 text-[var(--color-brand-600)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Electronic Signature
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Type your full legal name to sign this document
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Your full legal name"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSign()}
              aria-label="Full legal name for signature"
              className="w-full rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] transition-all italic"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            />
            {signedName.trim().length >= 2 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-[var(--color-brand-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            By typing your name and clicking &ldquo;I agree,&rdquo; you acknowledge that you have read, understood, and agree to the terms of the above document. This constitutes a legally binding electronic signature under the E-SIGN Act.
          </p>

          {error && (
            <div role="alert" className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSign}
            disabled={signing || signedName.trim().length < 2}
            className="w-full h-12 text-[15px] font-semibold"
          >
            {signing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing…</>
            ) : step < total ? (
              <>I Agree — Continue to Next Document</>
            ) : (
              <>I Agree — Continue to Intake Form</>
            )}
          </Button>
        </div>
      </div>
    </PortalShell>
  );
}

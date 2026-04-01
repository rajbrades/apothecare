"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logomark } from "@/components/ui/logomark";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

type Stage = "enter_email" | "check_email" | "signing_in";

export default function PortalLoginPage() {
  return (
    <Suspense>
      <PortalLoginInner />
    </Suspense>
  );
}

function PortalLoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>("enter_email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDev = process.env.NODE_ENV === "development";

  const supabase = createClient();

  // Redirect if already authenticated patient
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/portal/dashboard");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        setStage("signing_in");
        router.replace("/portal/dashboard");
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink() {
    if (!email || loading) return;
    setLoading(true);
    setError("");

    // Dev mode: allow password sign-in for testing
    if (isDev && password) {
      const { error: pwError } = await supabase.auth.signInWithPassword({ email, password });
      if (pwError) {
        setError(pwError.message);
        setLoading(false);
      }
      return;
    }

    // Send branded magic link via our API (uses Resend instead of Supabase's default email)
    try {
      const res = await fetch("/api/patient-portal/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug: slug ?? "" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send sign-in link. Please try again.");
        setLoading(false);
      } else {
        setStage("check_email");
      }
    } catch {
      setError("Failed to send sign-in link. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + label */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Logomark className="h-7 w-7" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Apothecare</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Patient portal sign in</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            We&apos;ll send a secure sign-in link to your email address.
          </p>
        </div>

        {stage === "enter_email" && (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
              aria-label="Email address"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/30 focus:border-[var(--color-brand-400)]"
            />
            {isDev && (
              <input
                type="password"
                placeholder="Password (dev only)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                aria-label="Password"
                className="w-full rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/30 focus:border-[var(--color-brand-400)]"
              />
            )}
            {error && (
              <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}
            <Button
              onClick={sendMagicLink}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</>
              ) : (
                "Send sign-in link"
              )}
            </Button>
          </div>
        )}

        {stage === "check_email" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              We sent a sign-in link to <strong>{email}</strong>. Click the link in that email to access your portal.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              The link expires in 10 minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => setStage("enter_email")}
              className="text-xs text-[var(--color-text-muted)] underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        )}

        {stage === "signing_in" && (
          <p className="text-sm text-[var(--color-text-muted)] text-center">Signing you in…</p>
        )}

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Don&apos;t have an account?{" "}
          <span>Check your email for an invitation from your provider.</span>
        </p>

        <nav className="flex items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]">
          <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</Link>
          <Link href="/telehealth" className="hover:text-[var(--color-text-secondary)] transition-colors">Telehealth</Link>
        </nav>
      </div>
    </div>
  );
}

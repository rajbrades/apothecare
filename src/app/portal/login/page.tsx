"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logomark } from "@/components/ui/logomark";
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
  const [stage, setStage] = useState<Stage>("enter_email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    const redirectTo = `${window.location.origin}/portal/login?slug=${slug ?? ""}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false, // Don't create new users from login page
      },
    });

    if (otpError) {
      setError("No account found with that email address. If you haven't activated your invitation yet, check your email for an invitation link.");
      setLoading(false);
    } else {
      setStage("check_email");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + label */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-4">
            <Logomark className="h-7 w-7" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Apothecare</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Patient portal sign in</h1>
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
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
            />
            {error && <p className="text-xs text-red-500 leading-relaxed">{error}</p>}
            <button
              onClick={sendMagicLink}
              disabled={loading || !email}
              className="w-full rounded-md bg-[var(--color-text-primary)] text-[var(--color-surface)] text-sm font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </div>
        )}

        {stage === "check_email" && (
          <div className="space-y-4">
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
          <p className="text-sm text-[var(--color-text-muted)]">Signing you in…</p>
        )}

        <p className="text-xs text-[var(--color-text-muted)]">
          Don&apos;t have an account?{" "}
          <span>Check your email for an invitation from your provider.</span>
        </p>

        <nav className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</Link>
          <Link href="/telehealth" className="hover:text-[var(--color-text-secondary)] transition-colors">Telehealth</Link>
        </nav>
      </div>
    </div>
  );
}

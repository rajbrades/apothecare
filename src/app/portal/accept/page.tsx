"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logomark } from "@/components/ui/logomark";
import Link from "next/link";

type Stage = "loading" | "enter_email" | "check_email" | "linking" | "done" | "error";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const slug = searchParams.get("slug");

  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // On mount: check if user is already authenticated
  useEffect(() => {
    if (!token) {
      setStage("error");
      setErrorMsg("Invalid invitation link. Please check your email and try again.");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Already signed in — go straight to linking
        linkAccount(token);
      } else {
        setStage("enter_email");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Listen for auth state change (magic link callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && token) {
        linkAccount(token);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function sendMagicLink() {
    if (!email || loading) return;
    setLoading(true);
    setErrorMsg("");

    const redirectTo = `${window.location.origin}/portal/accept?token=${token}&slug=${slug ?? ""}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setErrorMsg("Failed to send sign-in link. Please try again.");
      setLoading(false);
    } else {
      setStage("check_email");
    }
  }

  async function linkAccount(rawToken: string) {
    setStage("linking");
    try {
      const res = await fetch("/api/patient-portal/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "Failed to accept invitation.");
        return;
      }
      setStage("done");
      setTimeout(() => router.push("/portal/onboarding/consents"), 1500);
    } catch {
      setStage("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Logomark className="h-7 w-7" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Apothecare</span>
        </div>

        {stage === "loading" && (
          <div className="text-sm text-[var(--color-text-muted)]">Verifying invitation…</div>
        )}

        {stage === "enter_email" && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Accept your invitation</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Enter the email address where you received your invitation. We&apos;ll send you a sign-in link.
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
              />
              {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
              <button
                onClick={sendMagicLink}
                disabled={loading || !email}
                className="w-full rounded-md bg-[var(--color-text-primary)] text-[var(--color-surface)] text-sm font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? "Sending…" : "Send sign-in link"}
              </button>
            </div>
          </div>
        )}

        {stage === "check_email" && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Check your email</h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              We sent a sign-in link to <strong>{email}</strong>. Click the link in that email to continue.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              The link expires in 10 minutes. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        )}

        {stage === "linking" && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-text-secondary)]">Activating your account…</p>
          </div>
        )}

        {stage === "done" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Account activated!</p>
            <p className="text-sm text-[var(--color-text-muted)]">Redirecting to onboarding…</p>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Contact your provider to request a new invitation, or{" "}
              <Link href="/portal/login" className="underline">sign in</Link> if you already have an account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

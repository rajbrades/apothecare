"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logomark } from "@/components/ui/logomark";
import Link from "next/link";

type Stage = "loading" | "redirecting" | "linking" | "done" | "error";

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  // On mount: check session, then either link or get magic link
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
        // Not signed in — get an admin magic link and redirect
        getMagicLink(token);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Listen for auth state change after magic link redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && token) {
        linkAccount(token);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function getMagicLink(rawToken: string) {
    setStage("redirecting");
    try {
      const res = await fetch(`/api/patient-portal/accept-invite/prepare?token=${encodeURIComponent(rawToken)}`);
      const data = await res.json();
      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "Failed to prepare sign-in link.");
        return;
      }

      // Use verifyOtp() client-side instead of redirecting to Supabase's
      // /auth/v1/verify GET endpoint (which has strict rate limits).
      if (data.token_hash && data.type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: data.type,
        });
        if (otpError) {
          console.error("[accept] verifyOtp error:", otpError);
          if (otpError.message?.includes("rate") || otpError.status === 429) {
            setStage("error");
            setErrorMsg("Too many sign-in attempts. Please wait a few minutes and try again.");
            return;
          }
          // Fall back to redirect if verifyOtp fails for other reasons
          window.location.href = data.action_link;
        }
        // onAuthStateChange listener will fire and call linkAccount()
      } else {
        // Fallback: redirect to the magic link URL
        window.location.href = data.action_link;
      }
    } catch {
      setStage("error");
      setErrorMsg("Something went wrong. Please try again.");
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

        {(stage === "loading" || stage === "redirecting") && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-text-muted)]">
              {stage === "loading" ? "Verifying invitation…" : "Preparing your sign-in…"}
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

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";
import Link from "next/link";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") || "magiclink";

    if (!tokenHash) {
      setError("Invalid sign-in link. Please request a new one.");
      return;
    }

    const supabase = createClient();

    (async () => {
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink",
      });

      if (otpError) {
        console.error("[Portal Callback] verifyOtp error:", otpError);
        if (otpError.message?.includes("expired") || otpError.message?.includes("invalid")) {
          setError("This sign-in link has expired. Please request a new one.");
        } else {
          setError(otpError.message || "Sign-in failed. Please try again.");
        }
        return;
      }

      router.replace("/portal/dashboard");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <Logomark className="h-7 w-7" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Apothecare</span>
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-left">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
            <Link
              href="/portal/login"
              className="inline-block text-sm text-[var(--color-brand-600)] font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-600)] mx-auto" />
            <p className="text-sm text-[var(--color-text-secondary)]">Signing you in...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}

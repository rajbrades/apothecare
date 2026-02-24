"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logomark } from "@/components/ui/logomark";
import { GoogleSignIn, OAuthDivider } from "@/components/auth/google-sign-in";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const supabase = createClient();

  const validateEmail = (value: string) => {
    if (value && !EMAIL_REGEX.test(value)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const validatePassword = (value: string) => {
    if (value && value.length < 8) {
      setFieldErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }));
    } else {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const validateFullName = (value: string) => {
    if (value && value.trim().length < 2) {
      setFieldErrors((prev) => ({ ...prev, fullName: "Please enter your full name" }));
    } else {
      setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to onboarding to collect credentials (threading next param)
      const onboardingUrl = next
        ? `/auth/onboarding?next=${encodeURIComponent(next)}`
        : "/auth/onboarding";
      router.push(onboardingUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logomark size="md" withText />
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Create your account — 2 free queries per day, no credit card required
          </p>
        </div>

        {/* Form */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8">
          <GoogleSignIn onError={setError} next={next} />
          <OAuthDivider />
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: undefined })); }}
                onBlur={(e) => validateFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                aria-invalid={!!fieldErrors.fullName}
                className={`w-full px-4 py-2.5 text-sm border rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] ${fieldErrors.fullName ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--color-border)] focus:border-[var(--color-brand-400)] focus:ring-[var(--color-brand-100)]"}`}
              />
              {fieldErrors.fullName && (
                <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
                onBlur={(e) => validateEmail(e.target.value)}
                placeholder="you@practice.com"
                required
                aria-invalid={!!fieldErrors.email}
                className={`w-full px-4 py-2.5 text-sm border rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] ${fieldErrors.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--color-border)] focus:border-[var(--color-brand-400)] focus:ring-[var(--color-brand-100)]"}`}
              />
              {fieldErrors.email && (
                <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
                onBlur={(e) => validatePassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                aria-invalid={!!fieldErrors.password}
                className={`w-full px-4 py-2.5 text-sm border rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] ${fieldErrors.password ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--color-border)] focus:border-[var(--color-brand-400)] focus:ring-[var(--color-brand-100)]"}`}
              />
              {fieldErrors.password && (
                <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div role="alert" className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--color-brand-700)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-4 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy
            Policy. Apotheca is HIPAA-compliant and your data is encrypted at
            rest and in transit.
          </p>
        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link
            href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"}
            className="text-[var(--color-brand-700)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

      // Redirect to onboarding to collect credentials
      router.push("/auth/onboarding");
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
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-700)] flex items-center justify-center">
              <span className="text-white font-bold text-lg font-[var(--font-display)]">A</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
              Apotheca
            </span>
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Create your account — 2 free queries per day, no credit card required
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-8">
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
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@practice.com"
                required
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--color-brand-700)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            href="/auth/login"
            className="text-[var(--color-brand-700)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

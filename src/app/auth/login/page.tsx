"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset link sent. Check your email.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/dashboard");
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
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center">
              <span className="text-white font-bold text-lg font-[var(--font-display)]">A</span>
            </div>
            <span className="text-2xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
              Apotheca
            </span>
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Sign in to your clinical decision support platform
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--color-text-primary)]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[var(--color-brand-600)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--color-brand-600)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-[var(--color-text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-[var(--color-brand-600)] font-medium hover:underline"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

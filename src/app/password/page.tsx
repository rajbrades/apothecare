"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logomark } from "@/components/ui/logomark";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/site-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex">
            <Logomark size="lg" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">
            Apothecare
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Enter the site password to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />

          {error && (
            <p className="text-sm text-red-600">Incorrect password</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-brand-600)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

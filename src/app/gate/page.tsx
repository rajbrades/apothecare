"use client";

import { useState } from "react";
import { Logomark } from "@/components/ui/logomark";

export default function GatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }

      // Redirect to home — cookie is set
      window.location.href = "/";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logomark size="lg" />
          <h1 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
            Apothecare
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Enter the access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Access code"
              autoFocus
              className="w-full px-4 py-3 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-center tracking-widest"
            />
            {error && (
              <p className="mt-2 text-xs text-red-600 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 text-sm font-medium bg-[var(--color-brand-600)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-[var(--color-text-muted)]">
          Beta access only. Contact us for an invitation.
        </p>
      </div>
    </div>
  );
}

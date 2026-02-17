"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Microscope, Search } from "lucide-react";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface DashboardSearchProps {
  patients: PatientOption[];
}

export function DashboardSearch({ patients }: DashboardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [isDeepConsult, setIsDeepConsult] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (patientId) params.set("patient_id", patientId);
    if (isDeepConsult) params.set("deep_consult", "true");

    router.push(`/chat?${params}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] shadow-[var(--shadow-elevated)] hover:border-[var(--color-brand-400)] transition-all focus-within:border-[var(--color-brand-400)] focus-within:shadow-[0_4px_20px_-4px_rgba(13,148,121,0.15)]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a clinical question..."
          className="w-full px-4 sm:px-6 py-4 text-base bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] rounded-[var(--radius-lg)]"
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pb-3">
          {/* Attach — not yet implemented */}
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-50 cursor-not-allowed"
            title="File attachment coming soon"
          >
            <Paperclip className="w-3 h-3" />
            Attach
          </button>

          {/* Select Patient */}
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="text-xs text-[var(--color-text-secondary)] bg-transparent border border-[var(--color-border)] rounded-full px-3 py-1.5 outline-none hover:border-[var(--color-brand-300)] transition-colors cursor-pointer"
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
              </option>
            ))}
          </select>

          {/* Deep Consult toggle */}
          <button
            type="button"
            onClick={() => setIsDeepConsult(!isDeepConsult)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              isDeepConsult
                ? "bg-[var(--color-gold-50)] text-[var(--color-gold-700)] border-[var(--color-gold-300)]"
                : "text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-gold-50)] hover:text-[var(--color-gold-700)] hover:border-[var(--color-gold-200)]"
            }`}
          >
            <Microscope className="w-3 h-3" />
            Deep Consult
            {isDeepConsult && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)]" />
            )}
          </button>

          {/* Submit button — pushed to right */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="ml-auto w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" stroke="white" />
          </button>
        </div>
      </div>
    </form>
  );
}

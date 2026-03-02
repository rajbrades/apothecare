"use client";

import { Dna, Stethoscope, Users, Search, Mic } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";

const SUGGESTED_QUESTIONS = [
  "What are evidence-based interventions for elevated zonulin and intestinal permeability?",
  "Compare berberine vs. metformin for insulin resistance in prediabetic patients",
  "Optimal DUTCH test interpretation for a 42F with fatigue and weight gain",
];

export function MockDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Prototype badge */}
      <div className="fixed top-3 right-3 z-30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 rounded-full border border-amber-200">
        Prototype
      </div>

      {/* Brand mark */}
      <div className="mb-6">
        <Logomark size="lg" />
      </div>

      {/* Search input (non-functional mock) */}
      <div className="w-full max-w-2xl mb-6">
        <div className="relative">
          <div className="flex items-center gap-3 w-full px-5 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[var(--shadow-elevated)] focus-within:border-[var(--color-brand-400)]">
            <Search size={18} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <input
              type="text"
              placeholder="Ask a medical question..."
              className="flex-1 text-sm bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
              readOnly
            />
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-tertiary)] rounded-full hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-600)] transition-colors">
                Select Patient
              </button>
              <button className="p-2 rounded-full bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] transition-colors">
                <Mic size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested questions */}
      <div className="w-full max-w-2xl space-y-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            className="flex items-center justify-between w-full px-5 py-3.5 text-sm text-left text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all group"
          >
            <span>{q}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors flex-shrink-0 ml-3"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="flex flex-wrap justify-center gap-4 mt-12">
        <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]">
          <Dna size={20} />
          Upload Labs
        </button>
        <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]">
          <Stethoscope size={20} />
          Start Visit
        </button>
        <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]">
          <Users size={20} />
          Patients
        </button>
      </div>
    </div>
  );
}

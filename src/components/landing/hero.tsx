import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-10 sm:pb-12 text-center">
      <ScrollReveal>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)] text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)]" />
          Evidence partnerships with A4M, IFM, Cleveland Clinic & more
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--color-text-primary)] leading-tight mb-6">
          Clinical intelligence for{" "}
          <span className="text-[var(--color-brand-600)]">functional medicine</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
          AI-powered evidence synthesis, multi-modal lab interpretation, and protocol
          generation — grounded in functional medicine research. Built for the practitioners
          who think differently about health.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <div className="max-w-2xl mx-auto">
          <div className="relative container-elevated p-2">
            <input
              type="text"
              placeholder="Ask a clinical question..."
              className="w-full px-4 py-3 text-lg bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              readOnly
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 pb-3">
              <span className="text-xs text-[var(--color-text-muted)]">
                2 free queries/day · No credit card required
              </span>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto text-center px-5 py-2 bg-[var(--color-brand-600)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-700)] transition-colors"
              >
                Start Free &rarr;
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-6">
        {[
          "Berberine vs. metformin for insulin resistance?",
          "Interpret elevated zonulin with low sIgA",
          "DUTCH test: high cortisol metabolites protocol",
        ].map((q, i) => (
          <ScrollReveal key={q} delay={400 + i * 100} className="flex-1">
            <Link
              href="/auth/register"
              className="block px-4 py-3 text-sm text-left text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all"
            >
              {q}
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="flex flex-col items-center gap-1.5 mt-10">
        <span className="text-xs text-[var(--color-text-muted)] tracking-wide">See it in action</span>
        <ChevronDown
          className="w-5 h-5 text-[var(--color-text-muted)] animate-bounce opacity-60"
          strokeWidth={1.5}
        />
      </div>
    </section>
  );
}

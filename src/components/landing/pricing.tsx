import Link from "next/link";
import { Check, X } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function Pricing() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--color-text-primary)] mb-3 font-[var(--font-display)]">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <ScrollReveal delay={0}>
            <div className="h-full p-8 rounded-2xl border border-[var(--color-border)] bg-white">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Free</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                Try Apotheca risk-free
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-4">$0</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { text: "2 clinical queries per day", included: true },
                  { text: "PubMed evidence sources", included: true },
                  { text: "Basic citation expansion", included: true },
                  { text: "7-day conversation history", included: true },
                  { text: "Lab interpretation", included: false },
                  { text: "Visit documentation", included: false },
                  { text: "Protocol generation", included: false },
                ].map((item) => (
                  <li
                    key={item.text}
                    className={`flex items-center gap-2.5 ${
                      item.included
                        ? "text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {item.included ? (
                      <Check size={15} className="text-[var(--color-brand-500)] flex-shrink-0" />
                    ) : (
                      <X size={15} className="text-[var(--color-text-muted)] flex-shrink-0" />
                    )}
                    {item.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="block text-center mt-8 px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </ScrollReveal>

          {/* Pro */}
          <ScrollReveal delay={100}>
            <div className="h-full p-8 rounded-2xl border-2 border-[var(--color-brand-500)] bg-white relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[var(--color-brand-600)] text-white text-xs font-medium rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Pro</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                Everything you need in practice
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-4">
                $89
                <span className="text-base font-normal text-[var(--color-text-tertiary)]">
                  /mo
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {[
                  "Unlimited clinical queries",
                  "All evidence sources (A4M, IFM, premium)",
                  "Full citation expansion + evidence badges",
                  "Unlimited visit documentation + SOAP notes",
                  "Multi-modal lab interpretation",
                  "Cross-lab correlation analysis",
                  "Protocol generation with dosing",
                  "Patient management + trending",
                  "Branded PDF exports",
                  "HIPAA BAA included",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check size={15} className="text-[var(--color-brand-500)] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?plan=pro"
                className="block text-center mt-8 px-6 py-3 rounded-lg bg-[var(--color-brand-600)] text-white font-medium hover:bg-[var(--color-brand-700)] transition-colors"
              >
                Start Free Trial &rarr;
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

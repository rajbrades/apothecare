import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#FCFCFC] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Free */}
          <ScrollReveal delay={0}>
            <div className="h-full p-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex flex-col h-full space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Free</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Try Apothecare risk-free
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[var(--color-text-primary)]">$0</span>
                </div>
                <ul className="space-y-3 flex-1">
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
                      className={`flex items-start gap-3 text-sm ${
                        item.included
                          ? ""
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {item.included ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-600)] flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
                          &#x2715;
                        </span>
                      )}
                      <span className={item.included ? "" : "line-through"}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="block text-center w-full px-6 py-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Pro */}
          <ScrollReveal delay={100}>
            <div className="h-full p-8 rounded-[var(--radius-lg)] border-2 border-[var(--color-brand-500)] bg-[var(--color-surface)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--color-brand-600)] text-white text-xs font-medium rounded-full">
                Most Popular
              </div>
              <div className="flex flex-col h-full space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Pro</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Everything you need in practice
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[var(--color-text-primary)]">$99</span>
                  <span className="text-[var(--color-text-tertiary)]">/mo</span>
                </div>
                <ul className="space-y-3 flex-1">
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
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-600)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=pro"
                  className="block text-center w-full px-6 py-3 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white font-medium hover:bg-[var(--color-brand-500)] transition-colors"
                >
                  Start Free Trial &rarr;
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Pro+ */}
          <ScrollReveal delay={200}>
            <div className="h-full p-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex flex-col h-full space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Pro+</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Advanced protocols &amp; education
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[var(--color-text-primary)]">$179</span>
                  <span className="text-[var(--color-text-tertiary)]">/mo</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {[
                    "Everything in Pro",
                    "Multi-phase protocol generator",
                    "Longitudinal clinical synthesis",
                    "Custom knowledge base (RAG uploads)",
                    "Clinical Deep-Dive education",
                    "Protocol progress tracking",
                    "Patient portal protocol view",
                    "Partnership product recommendations",
                    "Deep Research literature reviews",
                    "Patient education audio & visuals",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-600)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register?plan=pro_plus"
                  className="block text-center w-full px-6 py-3 rounded-[var(--radius-sm)] border border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-medium hover:bg-[var(--color-brand-50)] transition-colors"
                >
                  Start Free Trial &rarr;
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

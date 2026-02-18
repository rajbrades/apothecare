import { ScrollReveal } from "./scroll-reveal";

// TODO: Replace with real practitioner testimonials before launch
const testimonials = [
  {
    quote:
      "Apotheca has transformed how I approach complex cases. The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
    name: "Dr. Sarah Chen",
    credential: "ND, IFMCP",
    practice: "Integrative Wellness Center",
    initials: "SC",
  },
  {
    quote:
      "Finally an AI tool that speaks functional medicine. The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
    name: "Dr. Michael Torres",
    credential: "DO, ABOIM",
    practice: "Precision Medicine Associates",
    initials: "MT",
  },
  {
    quote:
      "The protocol generation alone is worth the subscription. Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
    name: "Dr. Amanda Patel",
    credential: "MD, A4M Fellow",
    practice: "Functional Health Partners",
    initials: "AP",
  },
];

export function Testimonials() {
  return (
    <section className="py-12 md:py-16 bg-[var(--color-surface-secondary)]">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)] mb-3">
              Trusted by practitioners
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Functional medicine clinicians using Apotheca in practice
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="h-full p-8 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_4px_16px_rgba(0,0,0,0.08),_0_1px_4px_rgba(0,0,0,0.04)] flex flex-col">
                {/* Quote mark */}
                <span className="text-4xl leading-none text-[var(--color-brand-300)] font-[var(--font-display)] mb-3">
                  &ldquo;
                </span>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
                  {t.quote}
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--color-border-light)]">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center">
                    <span className="text-xs font-medium text-[var(--color-brand-700)]">
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-brand-600)]">{t.credential}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{t.practice}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { ScrollReveal } from "./scroll-reveal";

// TODO: Replace with real practitioner testimonials before launch
const testimonials = [
  {
    quote:
      "The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
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
    <section className="bg-[#FAFAFA] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
              Trusted by practitioners
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Functional medicine clinicians using Apotheca in practice
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="h-full p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-6 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-[var(--color-brand-600)] text-sm">
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{t.credential}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t.practice}</p>
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

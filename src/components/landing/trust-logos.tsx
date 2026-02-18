import { ScrollReveal } from "./scroll-reveal";

// TODO: Replace text-based logos with actual SVG logos when available
const partners = [
  { name: "PubMed", subtitle: "NCBI" },
  { name: "IFM", subtitle: "Inst. for Functional Medicine" },
  { name: "A4M", subtitle: "Anti-Aging Medicine" },
  { name: "Cleveland Clinic", subtitle: "Functional Medicine" },
  { name: "Cochrane", subtitle: "Systematic Reviews" },
];

export function TrustLogos() {
  return (
    <section className="py-8 md:py-10">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <p className="text-center text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-8">
            Grounded in evidence from
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <span className="text-base md:text-lg font-semibold text-[var(--color-text-tertiary)] font-[var(--font-display)]">
                  {p.name}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest">
                  {p.subtitle}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

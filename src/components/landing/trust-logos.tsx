import { ScrollReveal } from "./scroll-reveal";

const partners = [
  { name: "PubMed", subtitle: "NCBI" },
  { name: "IFM", subtitle: "Inst. for Functional Medicine" },
  { name: "A4M", subtitle: "Anti-Aging Medicine" },
  { name: "Cleveland Clinic", subtitle: "Functional Medicine" },
  { name: "Cochrane", subtitle: "Systematic Reviews" },
];

export function TrustLogos() {
  return (
    <section className="w-full bg-[var(--color-brand-600)] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <p className="text-center text-xs text-white/70 uppercase tracking-widest font-semibold mb-8">
            Grounded in Evidence From
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((p) => (
              <div key={p.name} className="text-center">
                <span className="text-white font-bold text-lg block">
                  {p.name}
                </span>
                <span className="text-xs text-white/70 mt-1">
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

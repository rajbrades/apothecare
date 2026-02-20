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
          <p className="text-center text-base text-white uppercase tracking-widest font-semibold mb-3">
            Grounded in Evidence From
          </p>
          <p className="text-center text-sm text-white/70 mb-10">
            Filter by source on every query — PubMed, IFM, Cochrane, and more.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {partners.map((p) => (
              <div key={p.name} className="text-center">
                <span className="text-white font-bold text-2xl block">
                  {p.name}
                </span>
                <span className="text-sm text-white/70 mt-1 block">
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

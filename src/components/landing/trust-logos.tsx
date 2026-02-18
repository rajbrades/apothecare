import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";

const partners = [
  { name: "PubMed", subtitle: "NCBI", logo: "/logos/pubmed.svg", w: 100, h: 28 },
  { name: "IFM", subtitle: "Inst. for Functional Medicine", logo: "/logos/ifm.svg", w: 54, h: 28 },
  { name: "A4M", subtitle: "Anti-Aging Medicine", logo: "/logos/a4m.svg", w: 56, h: 28 },
  { name: "Cleveland Clinic", subtitle: "Functional Medicine", logo: "/logos/cleveland-clinic.svg", w: 152, h: 28 },
  { name: "Cochrane", subtitle: "Systematic Reviews", logo: "/logos/cochrane.svg", w: 126, h: 28 },
];

export function TrustLogos() {
  return (
    <section className="py-8 md:py-10 bg-[var(--color-surface-secondary)] border-y border-[var(--color-border-light)]">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <p className="text-center text-xs text-[var(--color-text-secondary)] uppercase tracking-widest mb-8">
            Grounded in evidence from
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-10 md:gap-10">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
                title={p.name}
              >
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={p.w}
                  height={p.h}
                  unoptimized
                />
                <span className="block text-center text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest">
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

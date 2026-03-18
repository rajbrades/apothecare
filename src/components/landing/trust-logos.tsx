import { ScrollReveal } from "./scroll-reveal";

const partners = [
  { name: "PubMed", subtitle: "NCBI" },
  { name: "IFM", subtitle: "Inst. for Functional Medicine" },
  { name: "A4M", subtitle: "Anti-Aging Medicine" },
  { name: "Cleveland Clinic", subtitle: "Functional Medicine" },
  { name: "Cochrane", subtitle: "Systematic Reviews" },
  { name: "AAFP", subtitle: "Family Physicians" },
  { name: "ACP", subtitle: "College of Physicians" },
  { name: "Endocrine Society", subtitle: "Endocrinology" },
  { name: "ACG", subtitle: "Gastroenterology" },
];

function PartnerItem({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="flex-shrink-0 text-center px-8 md:px-12">
      <span className="text-white font-bold text-xl md:text-2xl block whitespace-nowrap">
        {name}
      </span>
      <span className="text-sm text-white/60 mt-1 block whitespace-nowrap">
        {subtitle}
      </span>
    </div>
  );
}

export function TrustLogos() {
  return (
    <section className="w-full bg-[var(--color-brand-600)] py-12 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <p className="text-center text-base text-white uppercase tracking-widest font-semibold mb-3">
            Grounded in Evidence From
          </p>
          <p className="text-center text-sm text-white/70 mb-10">
            Filter by source on every query — PubMed, IFM, Cochrane, and more.
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee container */}
      <div
        className="relative group"
        aria-label="Evidence source partners"
      >
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[var(--color-brand-600)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[var(--color-brand-600)] to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-marquee group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
          {/* First copy */}
          <div className="flex flex-shrink-0">
            {partners.map((p) => (
              <PartnerItem key={p.name} {...p} />
            ))}
          </div>
          {/* Seamless duplicate */}
          <div className="flex flex-shrink-0" aria-hidden="true">
            {partners.map((p) => (
              <PartnerItem key={`dup-${p.name}`} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

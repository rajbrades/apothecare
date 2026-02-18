import { Dna } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const biomarkers = [
  {
    name: "TSH",
    value: 3.8,
    unit: "mIU/L",
    conventionalLow: 0.5,
    conventionalHigh: 4.5,
    functionalLow: 1.0,
    functionalHigh: 2.5,
    flag: "borderline" as const,
  },
  {
    name: "Free T3",
    value: 2.4,
    unit: "pg/mL",
    conventionalLow: 2.0,
    conventionalHigh: 4.4,
    functionalLow: 3.0,
    functionalHigh: 3.5,
    flag: "out-of-range" as const,
  },
  {
    name: "Free T4",
    value: 1.1,
    unit: "ng/dL",
    conventionalLow: 0.8,
    conventionalHigh: 1.8,
    functionalLow: 1.0,
    functionalHigh: 1.5,
    flag: "normal" as const,
  },
  {
    name: "TPO Antibodies",
    value: 85,
    unit: "IU/mL",
    conventionalLow: 0,
    conventionalHigh: 34,
    functionalLow: 0,
    functionalHigh: 15,
    flag: "out-of-range" as const,
  },
];

const flagColors: Record<string, string> = {
  optimal: "var(--color-biomarker-optimal)",
  normal: "var(--color-biomarker-normal)",
  borderline: "var(--color-biomarker-borderline)",
  "out-of-range": "var(--color-biomarker-out-of-range)",
  critical: "var(--color-biomarker-critical)",
};

const flagLabels: Record<string, string> = {
  optimal: "Optimal",
  normal: "Normal",
  borderline: "Borderline",
  "out-of-range": "Out of Range",
  critical: "Critical",
};

function BiomarkerRow({
  name,
  value,
  unit,
  conventionalLow,
  conventionalHigh,
  functionalLow,
  functionalHigh,
  flag,
}: (typeof biomarkers)[0]) {
  const rangeMin = Math.min(conventionalLow * 0.3, functionalLow * 0.3);
  const rangeMax = Math.max(conventionalHigh * 1.5, functionalHigh * 1.5);
  const span = rangeMax - rangeMin;
  const markerPercent = ((value - rangeMin) / span) * 100;
  const funcLeftPct = ((functionalLow - rangeMin) / span) * 100;
  const funcWidthPct = ((functionalHigh - functionalLow) / span) * 100;

  return (
    <div className="py-3 border-b border-[var(--color-border-light)] last:border-0">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{name}</span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-[var(--font-mono)] font-medium"
            style={{ color: flagColors[flag] }}
          >
            {value} {unit}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: flagColors[flag],
              backgroundColor: `color-mix(in srgb, ${flagColors[flag]} 12%, transparent)`,
            }}
          >
            {flagLabels[flag]}
          </span>
        </div>
      </div>
      <div className="range-bar">
        {/* Functional optimal zone */}
        <div
          className="absolute h-full rounded"
          style={{
            left: `${funcLeftPct}%`,
            width: `${funcWidthPct}%`,
            backgroundColor: "var(--color-brand-100)",
          }}
        />
        {/* Marker */}
        <div
          className="marker"
          style={{
            left: `${Math.min(Math.max(markerPercent, 4), 96)}%`,
            backgroundColor: flagColors[flag],
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-[var(--color-text-muted)]">
        <span>
          Functional: {functionalLow}&ndash;{functionalHigh}
        </span>
        <span>
          Conventional: {conventionalLow}&ndash;{conventionalHigh}
        </span>
      </div>
    </div>
  );
}

export function FeatureLab() {
  return (
    <section className="py-12 md:py-16 bg-[var(--color-surface)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text */}
          <ScrollReveal direction="none">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center mb-4">
                <Dna className="icon-feature text-[var(--color-brand-600)]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)] mb-4">
                Multi-modal lab interpretation
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apotheca parses, interprets,
                and correlates findings across all labs — with both conventional and functional
                ranges side by side.
              </p>
              <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Functional ranges catch subclinical dysfunction early
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Cross-lab pattern recognition across all test types
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Visual biomarker bars with color-coded status
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Mockup */}
          <ScrollReveal direction="none">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-elevated)] overflow-hidden bg-[var(--color-surface)]">
              {/* Panel header */}
              <div className="px-5 py-4 border-b border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Thyroid Panel Results
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      Quest Diagnostics &middot; Dec 2024
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-biomarker-borderline)]" />
                    <span className="text-[11px] text-[var(--color-text-muted)]">2 flags</span>
                  </div>
                </div>
              </div>
              {/* Biomarker rows */}
              <div className="px-5 py-2">
                {biomarkers.map((bm) => (
                  <BiomarkerRow key={bm.name} {...bm} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

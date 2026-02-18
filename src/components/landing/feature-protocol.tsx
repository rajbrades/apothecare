import { ClipboardList } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const phases = [
  {
    name: "Phase 1: Remove",
    timeline: "Weeks 1\u20134",
    items: [
      { supplement: "Berberine HCl", dose: "500mg TID", badge: "RCT", cls: "evidence-rct" },
      { supplement: "Allicin (stabilized)", dose: "450mg BID", badge: "META", cls: "evidence-meta" },
    ],
  },
  {
    name: "Phase 2: Repair",
    timeline: "Weeks 2\u20138",
    items: [
      { supplement: "L-Glutamine", dose: "5g BID", badge: "RCT", cls: "evidence-rct" },
      { supplement: "Zinc Carnosine", dose: "75mg BID", badge: "RCT", cls: "evidence-rct" },
      { supplement: "SBI Protect", dose: "5g QD", badge: "COHORT", cls: "evidence-cohort" },
    ],
  },
  {
    name: "Phase 3: Reinoculate",
    timeline: "Weeks 4\u201312",
    items: [
      { supplement: "S. Boulardii", dose: "5B CFU BID", badge: "META", cls: "evidence-meta" },
      { supplement: "MegaSporeBiotic", dose: "2 caps QD", badge: "RCT", cls: "evidence-rct" },
    ],
  },
];

export function FeatureProtocol() {
  return (
    <section className="py-12 md:py-16 bg-[var(--color-surface-secondary)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Mockup (left on desktop) */}
          <ScrollReveal direction="none" className="order-2 md:order-1">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-elevated)] overflow-hidden bg-[var(--color-surface)]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--color-border-light)] bg-gradient-to-r from-[var(--color-gold-50)] to-[var(--color-surface-secondary)]">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Generated Protocol
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Intestinal Permeability &middot; 5R Framework
                </p>
              </div>

              {/* Phases */}
              <div className="divide-y divide-[var(--color-border-light)]">
                {phases.map((phase) => (
                  <div key={phase.name} className="px-5 py-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        {phase.name}
                      </h4>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {phase.timeline}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {phase.items.map((item) => (
                        <div
                          key={item.supplement}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[var(--color-text-secondary)]">
                            {item.supplement}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                              {item.dose}
                            </span>
                            <span className={`citation-badge ${item.cls} text-[10px]`}>
                              {item.badge}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Text (right on desktop) */}
          <ScrollReveal direction="none" className="order-1 md:order-2">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center mb-4">
                <ClipboardList className="icon-feature text-[var(--color-brand-600)]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)] mb-4">
                Evidence-backed protocol generation
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                Generate phased treatment protocols with supplement dosing, dietary interventions,
                and lifestyle recommendations — every line item backed by a cited evidence source.
              </p>
              <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Phased protocols following the 5R framework
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Evidence-level badges on every recommendation
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 flex-shrink-0" />
                  Dosing in clinical notation (TID, BID, QD)
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

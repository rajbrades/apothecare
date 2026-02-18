import { Stethoscope, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-[var(--color-brand-600)]" />,
    title: "HIPAA Compliant",
    desc: "End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 certification in progress. Built for clinical use from day one.",
  },
  {
    icon: <Stethoscope className="w-6 h-6 text-[var(--color-brand-600)]" />,
    title: "Clinical Visits",
    desc: "Document visits with real-time evidence surfacing. Transcribe, generate SOAP notes, and query the literature — all in one workflow.",
  },
  {
    icon: <Zap className="w-6 h-6 text-[var(--color-brand-600)]" />,
    title: "Functional Ranges",
    desc: "Every biomarker displayed with both conventional and functional/optimal ranges. Catch subclinical dysfunction that standard labs miss.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-[var(--color-brand-600)]" />,
    title: "Deep Consult Mode",
    desc: "Engage advanced reasoning for complex cases. Deep Consult uses extended thinking to synthesize multi-system clinical scenarios.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              Built for clinical practice
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Every feature designed around the functional medicine workflow
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className="h-full p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]/50 transition-all hover-lift">
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-brand-50)] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mt-3 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

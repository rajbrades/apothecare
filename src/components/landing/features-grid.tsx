import { MessageSquare, BarChart2, FileText, Shield, Zap, Sparkles } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const features = [
  {
    icon: <MessageSquare className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "Clinical Chat",
    desc: "Evidence-based responses to complex clinical questions at seconds with cited, peer-reviewed evidence.",
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "Lab Interpretation",
    desc: "Multi-modal parsing for GI-MAPs, DUTCH tests with functional and conventional ranges.",
  },
  {
    icon: <FileText className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "Protocol Generation",
    desc: "Phased treatment protocols in the 5R framework with dosing, evidence levels, and badges.",
  },
  {
    icon: <Shield className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "HIPAA Compliant",
    desc: "End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 in progress.",
  },
  {
    icon: <Zap className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "Clinical Visits",
    desc: "Real-time evidence surfacing with SOAP notes and transcript integration.",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-[var(--color-brand-600)]" />,
    title: "Deep Consult Mode",
    desc: "Interactive reasoning for complex, multi-system clinical scenarios.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#FCFCFC] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
              Built for clinical practice
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Every feature designed around the functional medicine workflow
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className="h-full p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

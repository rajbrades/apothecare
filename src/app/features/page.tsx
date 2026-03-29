import Link from "next/link";
import {
  MessageSquare,
  FlaskConical,
  FileText,
  BookOpen,
  Pill,
  Users,
  CheckCircle2,
  ArrowRight,
  Library,
  Shield,
  Activity,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

// ── Feature data ───────────────────────────────────────────────────────

const CORE_FEATURES = [
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Clinical Chat",
    description:
      "Ask complex clinical questions and receive evidence-cited responses in seconds. Every answer is grounded in peer-reviewed literature and functional medicine frameworks.",
    bullets: [
      "9+ evidence sources: PubMed, Cochrane, IFM, A4M, Cleveland Clinic",
      "Multi-citation badges with evidence level indicators",
      "Clinical lens filtering (functional, conventional, or full spectrum)",
      "Patient-aware context — attach a patient for personalized responses",
    ],
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Lab Interpretation",
    description:
      "Upload any lab panel and get instant interpretation with functional and conventional ranges side by side. Catch subclinical dysfunction that standard ranges miss.",
    bullets: [
      "Multi-modal: GI-MAP, DUTCH, OAT, blood panels, hormones",
      "Functional vs. conventional reference ranges",
      "10+ vendor support (Quest, LabCorp, Genova, ZRT, Vibrant)",
      "Cross-lab biomarker trending and pattern recognition",
    ],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Visit Documentation",
    description:
      "Generate structured SOAP notes with AI assistance. Real-time transcription, IFM Matrix mapping, and evidence-backed protocol recommendations — all in one workspace.",
    bullets: [
      "AI-generated SOAP notes from transcripts or dictation",
      "IFM Matrix auto-mapping across 7 physiological systems",
      "Protocol recommendations with supplement dosing",
      "Branded PDF export for patient records",
    ],
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Clinical Deep-Dive",
    description:
      "Highlight any clinical term anywhere in the app and get instant, AI-generated educational content. Like having a functional medicine textbook that reads your mind.",
    bullets: [
      "Select text, click the floating button — instant education",
      "Grounded in partnership knowledge bases (Apex, IFM)",
      "Structured sections: definition, biomarkers, treatment",
      "Follow-up questions within the same panel",
    ],
  },
  {
    icon: <Pill className="w-5 h-5" />,
    title: "Supplement Intelligence",
    description:
      "Every recommendation backed by a 3-tier citation validation pipeline. CrossRef, PubMed, and curated databases ensure no hallucinated references reach your practice.",
    bullets: [
      "3-tier citation validation (CrossRef + PubMed + curated DB)",
      "Drug-supplement interaction checking with severity levels",
      "Evidence-graded recommendations (META, RCT, COHORT)",
      "Branded protocol PDF export for patients",
    ],
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Patient Portal",
    description:
      "Give patients secure, read-only access to their shared records. Symptom check-ins with trend tracking create longitudinal data your practice can actually use.",
    bullets: [
      "Secure login with lab and note sharing",
      "Recurring symptom check-ins (18 symptoms, 4 body systems)",
      "Trend visualization with sparklines over time",
      "Document uploads, consents, and HIPAA access logs",
    ],
  },
];

const EVIDENCE_SOURCES = [
  { name: "PubMed / NLM", desc: "30M+ biomedical citations" },
  { name: "Cochrane Library", desc: "Systematic reviews & meta-analyses" },
  { name: "IFM", desc: "Functional medicine frameworks" },
  { name: "A4M", desc: "Anti-aging & longevity protocols" },
  { name: "Cleveland Clinic", desc: "Clinical protocols & guidelines" },
  { name: "AAFP", desc: "Primary care guidelines" },
  { name: "ACP", desc: "Internal medicine reviews" },
  { name: "Endocrine Society", desc: "Endocrinology guidelines" },
  { name: "ACG", desc: "Gastroenterology guidelines" },
];

// ── Page ───────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-16">
        {/* ── Section 1: Hero ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-600)] mb-4">
                Platform Features
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.1]">
                Features built for
                <br />
                clinical practice
              </h1>
              <p className="mt-6 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                Every tool designed around the functional medicine workflow — from
                evidence-based chat to multi-modal lab interpretation.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-md)] font-semibold text-sm hover:bg-[var(--color-brand-500)] transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-[var(--radius-md)] font-medium text-sm hover:border-[var(--color-brand-300)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Section 2: Core Features ── */}
        <section className="bg-[#FCFCFC] py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
                  Six tools, one workflow
                </h2>
                <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
                  Each feature integrates with the others — patient data flows from intake to labs to visits to protocols without re-entering anything.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CORE_FEATURES.map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 80}>
                  <div className="h-full flex flex-col p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-elevated)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-600)] mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
                      {feature.description}
                    </p>
                    <ul className="mt-auto space-y-2.5">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                          <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-600)] flex-shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Deep-Dive Spotlight ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal direction="left">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)] text-xs font-semibold mb-6">
                    <Sparkles className="w-3 h-3" />
                    Pro Feature
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-6 leading-tight">
                    Clinical Deep-Dive
                    <br />
                    <span className="text-[var(--color-brand-600)]">
                      Learn while you work
                    </span>
                  </h2>
                  <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    Highlight any clinical term — a biomarker, pathway, supplement, diagnosis — and get instant,
                    structured educational content without leaving your workflow. Grounded in partnership knowledge bases
                    and peer-reviewed evidence.
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        icon: <BookOpen className="w-4 h-4" />,
                        label: "Select & learn",
                        text: "Highlight text anywhere. A floating button appears. Click it.",
                      },
                      {
                        icon: <Library className="w-4 h-4" />,
                        label: "RAG-grounded",
                        text: "Responses cite Apex Energetics, IFM frameworks, and PubMed literature.",
                      },
                      {
                        icon: <Activity className="w-4 h-4" />,
                        label: "Structured output",
                        text: "Definition, clinical relevance, related biomarkers, treatment implications.",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-brand-600)] flex-shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.label}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Mockup panel */}
              <ScrollReveal direction="right">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] overflow-hidden">
                  {/* Panel header */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-[var(--color-brand-600)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Clinical Deep-Dive</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">Zonulin</p>
                    </div>
                  </div>
                  {/* Panel content */}
                  <div className="px-5 py-5 space-y-5">
                    {[
                      {
                        heading: "What It Is",
                        text: "Zonulin is a protein that modulates the permeability of tight junctions between cells of the gastrointestinal tract. Discovered by Dr. Alessio Fasano, it acts as a regulator of intestinal barrier function.",
                      },
                      {
                        heading: "Clinical Relevance",
                        text: "In functional medicine, zonulin is significant due to its connection with increased intestinal permeability (\"leaky gut\"), systemic inflammation, and autoimmune conditions.",
                      },
                      {
                        heading: "Related Biomarkers",
                        text: "Zonulin levels, hs-CRP, fecal calprotectin, lactulose/mannitol ratio, secretory IgA",
                      },
                      {
                        heading: "Treatment Implications",
                        text: "Gluten-free diet, L-glutamine (5-10g daily), specific probiotics (Lactobacillus rhamnosus GG), bone broth, elimination protocol.",
                      },
                    ].map((section) => (
                      <div key={section.heading}>
                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border-light)] pb-1.5 mb-2">
                          {section.heading}
                        </h4>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          {section.text}
                        </p>
                      </div>
                    ))}
                    {/* Follow-up input mockup */}
                    <div className="flex gap-2 pt-2 border-t border-[var(--color-border-light)]">
                      <div className="flex-1 px-3 py-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                        Ask a follow-up...
                      </div>
                      <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white flex items-center justify-center">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Section 4: Evidence Sources ── */}
        <section className="bg-[#FCFCFC] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
                  Grounded in evidence
                </h2>
                <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
                  Every response draws from 9 curated evidence databases plus partnership knowledge bases. No hallucinated citations.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EVIDENCE_SOURCES.map((source, i) => (
                <ScrollReveal key={source.name} delay={i * 60}>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-light)] transition-colors hover:border-[var(--color-brand-200)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {source.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                        {source.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={600}>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Library className="w-3.5 h-3.5 text-purple-500" />
                <span>
                  Plus partnership knowledge bases (Apex Energetics and more) for product-specific clinical protocols
                </span>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Section 5: Security + Compliance ── */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                <Shield className="w-8 h-8 text-[var(--color-brand-600)] flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    HIPAA compliant by design
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    End-to-end encryption, BAAs with all vendors, comprehensive audit logging, row-level security on every table. Your patients&apos; data is protected at every layer.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Section 6: CTA ── */}
        <section className="bg-[#FCFCFC] py-20 md:py-28 border-t border-[var(--color-border-light)]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
                Ready to transform your practice?
              </h2>
              <p className="text-base text-[var(--color-text-secondary)] mb-8">
                Start with the free tier. Upgrade when you see the value.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-md)] font-semibold text-sm hover:bg-[var(--color-brand-500)] transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-4 decoration-[var(--color-border)]"
                >
                  Compare plans
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

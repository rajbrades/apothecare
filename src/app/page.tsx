import Link from "next/link";
import { Microscope, Dna, ClipboardList, Stethoscope, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center">
              <span className="text-white font-bold text-sm font-[var(--font-display)]">A</span>
            </div>
            <span className="text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
              Apotheca
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-lg hover:bg-[var(--color-brand-700)] transition-colors font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-16">
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Trust banner */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)] text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)]" />
            Evidence partnerships with A4M, IFM, Cleveland Clinic & more
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text-primary)] leading-tight mb-6 font-[var(--font-display)]">
            Clinical intelligence for{" "}
            <span className="text-[var(--color-brand-600)]">functional medicine</span>
          </h1>

          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered evidence synthesis, multi-modal lab interpretation, and protocol
            generation — grounded in functional medicine research. Built for the practitioners
            who think differently about health.
          </p>

          {/* CTA Input (mimics the chat interface) */}
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-white rounded-2xl border border-[var(--color-border)] shadow-lg shadow-[var(--color-brand-100)]/50 p-2">
              <input
                type="text"
                placeholder="Ask a clinical question..."
                className="w-full px-4 py-3 text-lg bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                readOnly
              />
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-xs text-[var(--color-text-muted)]">
                  2 free queries/day · No credit card required
                </span>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 bg-[var(--color-brand-600)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brand-700)] transition-colors"
                >
                  Start Free →
                </Link>
              </div>
            </div>
          </div>

          {/* Sample questions */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-6">
            {[
              "Berberine vs. metformin for insulin resistance?",
              "Interpret elevated zonulin with low sIgA",
              "DUTCH test: high cortisol metabolites protocol",
            ].map((q) => (
              <Link
                key={q}
                href="/auth/register"
                className="flex-1 px-4 py-3 text-sm text-left text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all"
              >
                {q}
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Microscope size={24} className="text-[var(--color-brand-600)]" />,
                title: "Evidence-Cited Chat",
                desc: "Ask clinical questions and get responses grounded in functional medicine evidence from IFM, A4M, and peer-reviewed literature. Every claim is cited.",
              },
              {
                icon: <Dna size={24} className="text-[var(--color-brand-600)]" />,
                title: "Multi-Modal Lab Interpretation",
                desc: "Upload blood panels, GI-MAPs, DUTCH tests, OATs — the AI parses, interprets, and correlates findings across all your labs with functional ranges.",
              },
              {
                icon: <ClipboardList size={24} className="text-[var(--color-brand-600)]" />,
                title: "Protocol Generation",
                desc: "AI-generated treatment protocols with supplement dosing, dietary interventions, and lifestyle recommendations — all backed by evidence citations.",
              },
              {
                icon: <Stethoscope size={24} className="text-[var(--color-brand-600)]" />,
                title: "Clinical Visits",
                desc: "Document visits with real-time evidence surfacing. Transcribe, generate SOAP notes, and query evidence — all in one workflow.",
              },
              {
                icon: <ShieldCheck size={24} className="text-[var(--color-brand-600)]" />,
                title: "HIPAA Compliant",
                desc: "Built for clinical use from day one. End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 certification in progress.",
              },
              {
                icon: <Zap size={24} className="text-[var(--color-brand-600)]" />,
                title: "Functional Ranges",
                desc: "Every biomarker displayed with both conventional and functional/optimal ranges. Catch subclinical dysfunction that conventional labs miss.",
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mt-3 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center text-[var(--color-text-primary)] mb-4 font-[var(--font-display)]">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="p-8 rounded-2xl border border-[var(--color-border)] bg-white">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Free</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Try Apotheca risk-free</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-4">$0</p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li>✓ 2 clinical queries per day</li>
                <li>✓ PubMed evidence sources</li>
                <li>✓ Basic citation expansion</li>
                <li>✓ 7-day conversation history</li>
                <li className="text-[var(--color-text-muted)]">✗ Lab interpretation</li>
                <li className="text-[var(--color-text-muted)]">✗ Visit documentation</li>
                <li className="text-[var(--color-text-muted)]">✗ Protocol generation</li>
              </ul>
              <Link
                href="/auth/register"
                className="block text-center mt-8 px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl border-2 border-[var(--color-brand-500)] bg-white relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[var(--color-brand-600)] text-white text-xs font-medium rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Pro</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                Everything you need in practice
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-4">
                $89<span className="text-base font-normal text-[var(--color-text-tertiary)]">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li>✓ Unlimited clinical queries</li>
                <li>✓ All evidence sources (A4M, IFM, premium)</li>
                <li>✓ Full citation expansion + evidence badges</li>
                <li>✓ Unlimited visit documentation + SOAP notes</li>
                <li>✓ Multi-modal lab interpretation</li>
                <li>✓ Cross-lab correlation analysis</li>
                <li>✓ Protocol generation with dosing</li>
                <li>✓ Patient management + trending</li>
                <li>✓ Branded PDF exports</li>
                <li>✓ HIPAA BAA included</li>
              </ul>
              <Link
                href="/auth/register?plan=pro"
                className="block text-center mt-8 px-6 py-3 rounded-lg bg-[var(--color-brand-600)] text-white font-medium hover:bg-[var(--color-brand-700)] transition-colors"
              >
                Start Free Trial →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--color-border-light)] py-12">
          <div className="max-w-5xl mx-auto px-6 text-center text-sm text-[var(--color-text-muted)]">
            <p>© {new Date().getFullYear()} Apotheca. All rights reserved.</p>
            <p className="mt-2">
              Apotheca is a clinical decision support tool. It is not a substitute for
              professional medical judgment. All treatment decisions remain with the licensed
              practitioner.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

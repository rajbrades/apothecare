"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { ChatMockup } from "./chat-mockup";

function buildRegisterHref(query?: string) {
  if (!query) return "/auth/register";
  const next = `/chat?q=${encodeURIComponent(query)}`;
  return `/auth/register?next=${encodeURIComponent(next)}`;
}

export function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildRegisterHref(query.trim() || undefined));
  };

  return (
    <section className="relative bg-[#FCFCFC] flex flex-col pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16 lg:py-20 flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                <Sparkles className="w-3 h-3 text-[var(--color-brand-600)]" />
                <span className="text-xs font-medium text-[var(--color-text-primary)]">Trusted by 2,000+ functional medicine practitioners</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] text-balance leading-[1.1]">
                Clinical intelligence for{" "}
                <span className="text-[var(--color-brand-600)]">functional medicine</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto text-balance leading-relaxed">
                Evidence-based answers in seconds. Multi-modal lab interpretation. Protocol generation with cited research - all grounded in functional medicine.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div>
                <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
                  <input
                    type="text"
                    placeholder="Ask a clinical question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-14 px-6 pr-32 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-base outline-none focus:border-[var(--color-brand-600)] transition-colors text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 h-10 inline-flex items-center gap-1.5 px-5 bg-[var(--color-brand-600)] text-white text-sm font-medium rounded-md hover:bg-[var(--color-brand-500)] transition-colors"
                  >
                    Start Free <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </form>
                <p className="text-sm text-[var(--color-text-muted)] mt-4 text-center">
                  2 free queries daily &middot; No credit card required
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {[
                  "Berberine vs. metformin for insulin resistance?",
                  "Interpret elevated zonulin with low sIgA",
                  "DUTCH test: high cortisol metabolites protocol",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => router.push(buildRegisterHref(q))}
                    className="px-4 py-2.5 text-sm whitespace-nowrap text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:border-[var(--color-brand-500)] border border-[var(--color-border-light)] rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Chat mockup — visible in hero viewport */}
      <ScrollReveal delay={500}>
        <ChatMockup autoStart />
      </ScrollReveal>
    </section>
  );
}

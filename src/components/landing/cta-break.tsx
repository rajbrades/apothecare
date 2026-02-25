import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function CtaBreak() {
  return (
    <section className="py-14 md:py-16 bg-[var(--color-brand-950)]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <ScrollReveal>
          <p className="text-[var(--color-brand-300)] text-sm font-medium tracking-wide uppercase mb-4">
            Start today
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[var(--font-display)] mb-4 leading-tight">
            Evidence-backed answers in seconds.{" "}
            <span className="text-[var(--color-brand-300)]">Not hours of literature search.</span>
          </h2>
          <p className="text-[var(--color-brand-200)] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Join practitioners using Apothecare to deliver better care, faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/register"
              className="px-7 py-3.5 bg-[var(--color-brand-400)] text-[var(--color-brand-950)] font-semibold rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-300)] transition-colors text-sm"
            >
              Get started free &rarr;
            </Link>
            <Link
              href="/auth/login"
              className="px-7 py-3.5 border border-[var(--color-brand-700)] text-[var(--color-brand-200)] font-medium rounded-[var(--radius-sm)] hover:border-[var(--color-brand-500)] hover:text-white transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="text-[var(--color-brand-600)] text-xs mt-5">
            2 free queries/day · No credit card required · Cancel anytime
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

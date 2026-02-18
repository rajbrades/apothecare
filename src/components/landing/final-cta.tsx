import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function FinalCta() {
  return (
    <section className="bg-[var(--color-brand-950)]">
      <div className="max-w-4xl mx-auto px-6 py-14 md:py-16 text-center">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-[var(--font-display)] mb-4">
            Ready to elevate your clinical practice?
          </h2>
          <p className="text-[var(--color-brand-300)] mb-10 max-w-lg mx-auto">
            Start with 2 free queries per day. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-[var(--color-brand-950)] font-medium rounded-lg hover:bg-[var(--color-brand-50)] transition-colors"
            >
              Get Started Free &rarr;
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border border-[var(--color-brand-700)] text-[var(--color-brand-200)] font-medium rounded-lg hover:bg-[var(--color-brand-900)] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

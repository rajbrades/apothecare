import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function FinalCta() {
  return (
    <section className="bg-[var(--color-brand-600)] py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Ready to elevate your clinical practice?
            </h2>
            <p className="text-lg text-white/90">
              Start with 2 free queries per day. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[var(--color-brand-900)] font-medium rounded-lg hover:bg-[var(--color-brand-50)] transition-colors"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

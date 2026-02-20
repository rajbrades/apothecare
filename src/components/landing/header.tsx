import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border-light)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logomark size="sm" withText />
        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="#features"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#about"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            About
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm px-4 py-2 rounded-[var(--radius-sm)] border border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] hover:border-[var(--color-border)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm px-4 py-2 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}

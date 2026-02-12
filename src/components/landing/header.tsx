import Link from "next/link";

export function Header() {
  return (
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
  );
}

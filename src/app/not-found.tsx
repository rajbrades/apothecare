import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-6">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <Logomark size="lg" />
        </div>
        <h1 className="text-6xl font-bold text-[var(--color-brand-600)] font-[var(--font-display)] mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-3">
          Page not found
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-lg hover:bg-[var(--color-brand-500)] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-7 h-7 text-[var(--color-brand-600)]" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-lg hover:bg-[var(--color-brand-700)] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        Dashboard Error
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-1">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono">
          Digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-900)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

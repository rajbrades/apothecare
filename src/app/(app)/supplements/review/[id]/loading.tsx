export default function SupplementReviewLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-56 bg-[var(--color-surface-tertiary)] rounded mb-6" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-[var(--color-surface-tertiary)] rounded" />
          <div className="h-4 w-32 bg-[var(--color-surface-tertiary)] rounded mt-2" />
        </div>
        <div className="h-6 w-20 bg-[var(--color-surface-tertiary)] rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-32 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-48 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-32 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}

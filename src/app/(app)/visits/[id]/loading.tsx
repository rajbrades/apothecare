export default function VisitDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-[var(--color-surface-tertiary)] rounded mb-6" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-64 bg-[var(--color-surface-tertiary)] rounded" />
          <div className="h-4 w-40 bg-[var(--color-surface-tertiary)] rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
          <div className="h-9 w-32 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b border-[var(--color-border-light)] mb-6 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-5 w-20 bg-[var(--color-surface-tertiary)] rounded" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-40 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-40 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}

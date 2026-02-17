export default function LabDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-[var(--color-surface-tertiary)] rounded mb-6" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-tertiary)]" />
          <div>
            <div className="h-7 w-56 bg-[var(--color-surface-tertiary)] rounded" />
            <div className="h-4 w-36 bg-[var(--color-surface-tertiary)] rounded mt-2" />
          </div>
        </div>
        <div className="h-9 w-24 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>

      {/* Status + meta skeleton */}
      <div className="flex gap-3 mb-6">
        <div className="h-6 w-20 bg-[var(--color-surface-tertiary)] rounded-full" />
        <div className="h-6 w-28 bg-[var(--color-surface-tertiary)] rounded-full" />
      </div>

      {/* Biomarker rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        ))}
      </div>
    </div>
  );
}

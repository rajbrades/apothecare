export default function LabsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-32 bg-[var(--color-surface-tertiary)] rounded" />
        <div className="h-4 w-72 bg-[var(--color-surface-tertiary)] rounded mt-2" />
      </div>

      {/* Upload toggle skeleton */}
      <div className="h-12 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface-tertiary)] mb-4" />

      {/* Filter row skeleton */}
      <div className="flex gap-3 mb-4">
        <div className="h-8 w-28 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-8 w-28 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)]"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-tertiary)]" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-[var(--color-surface-tertiary)] rounded mb-2" />
              <div className="h-3 w-72 bg-[var(--color-surface-tertiary)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

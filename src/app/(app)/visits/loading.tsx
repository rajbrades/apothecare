export default function VisitsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-36 bg-[var(--color-surface-tertiary)] rounded" />
          <div className="h-4 w-64 bg-[var(--color-surface-tertiary)] rounded mt-2" />
        </div>
        <div className="h-10 w-28 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
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

export default function PatientsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-24 bg-[var(--color-surface-tertiary)] rounded" />
          <div className="h-3 w-56 bg-[var(--color-surface-tertiary)] rounded mt-1.5" />
        </div>
        <div className="h-8 w-28 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>

      {/* Patient card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)]"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--color-surface-tertiary)]" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-[var(--color-surface-tertiary)] rounded mb-1.5" />
              <div className="h-3 w-64 bg-[var(--color-surface-tertiary)] rounded" />
            </div>
            <div className="h-3 w-20 bg-[var(--color-surface-tertiary)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

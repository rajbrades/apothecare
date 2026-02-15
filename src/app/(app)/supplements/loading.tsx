export default function SupplementsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-56 bg-[var(--color-surface-tertiary)] rounded" />
        <div className="h-4 w-80 bg-[var(--color-surface-tertiary)] rounded mt-2" />
      </div>
      <div className="flex gap-4 mb-6">
        <div className="h-9 w-24 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-9 w-36 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
        <div className="h-9 w-32 bg-[var(--color-surface-tertiary)] rounded-[var(--radius-md)]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
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

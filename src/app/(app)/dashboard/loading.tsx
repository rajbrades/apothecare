export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-40px)] px-6 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-tertiary)] mb-6" />
      <div className="w-full max-w-2xl mb-6">
        <div className="h-[88px] rounded-2xl bg-[var(--color-surface-tertiary)]" />
      </div>
      <div className="w-full max-w-2xl space-y-2">
        <div className="h-14 rounded-xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-14 rounded-xl bg-[var(--color-surface-tertiary)]" />
        <div className="h-14 rounded-xl bg-[var(--color-surface-tertiary)]" />
      </div>
    </div>
  );
}

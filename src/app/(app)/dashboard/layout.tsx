/**
 * Dashboard-specific layout.
 *
 * Auth, sidebar, and data fetching are handled by the parent (app) layout.
 * This layout only adds the trust banner unique to the dashboard section.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Trust banner */}
      <div className="bg-[var(--color-brand-50)] border-b border-[var(--color-brand-100)] px-6 py-2 text-center text-sm text-[var(--color-brand-700)]">
        Evidence partnerships with{" "}
        <span className="font-semibold underline">A4M</span>,{" "}
        <span className="font-semibold underline">IFM</span>,{" "}
        <span className="font-semibold underline">Cleveland Clinic</span>, and
        more.
      </div>

      {children}
    </>
  );
}

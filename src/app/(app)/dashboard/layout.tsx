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
  return <>{children}</>;
}

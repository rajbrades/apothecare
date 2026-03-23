/**
 * Dashboard-specific layout.
 *
 * Auth, sidebar, and data fetching are handled by the parent (app) layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

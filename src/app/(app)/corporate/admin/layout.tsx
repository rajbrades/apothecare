import Link from "next/link";
import { requireCorporateAdmin } from "@/lib/auth/corporate-admin";
import { BookOpen, BarChart3, Users, Settings, Building2 } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";

export default async function CorporateAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { corporate } = await requireCorporateAdmin();

  const navItems = [
    { href: "/corporate/admin", icon: Building2, label: "Dashboard" },
    { href: "/corporate/admin/protocols", icon: BookOpen, label: "Protocols" },
    { href: "/corporate/admin/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/corporate/admin" className="flex items-center gap-2">
              {corporate.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={corporate.logo_url} alt="" className="h-7 w-7 rounded" />
              ) : (
                <Logomark className="h-6 w-6" />
              )}
              <div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {corporate.name}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] ml-2">Admin</span>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-1 ml-6">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-[var(--radius-md)] transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/dashboard"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Back to Apothecare
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-4 px-6 text-center">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {corporate.name} · Powered by Apothecare
        </p>
      </footer>
    </div>
  );
}

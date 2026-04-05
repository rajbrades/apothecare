import Link from "next/link";
import { BookOpen, BarChart3, Users, Plus, TrendingUp } from "lucide-react";
import { requireCorporateAdmin } from "@/lib/auth/corporate-admin";
import { createClient } from "@/lib/supabase/server";

export default async function CorporateAdminDashboard() {
  const { corporate } = await requireCorporateAdmin();
  const supabase = await createClient();

  // Fetch stats
  const [
    { count: protocolCount },
    { count: memberCount },
    { count: matchCount },
  ] = await Promise.all([
    supabase
      .from("corporate_protocols")
      .select("id", { count: "exact", head: true })
      .eq("corporate_id", corporate.id)
      .eq("status", "active"),
    supabase
      .from("corporate_provider_memberships")
      .select("id", { count: "exact", head: true })
      .eq("corporate_id", corporate.id)
      .eq("is_active", true),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("resource_type", "corporate_protocol_match"),
  ]);

  const stats = [
    { label: "Active Protocols", value: protocolCount ?? 0, icon: BookOpen, href: "/corporate/admin/protocols" },
    { label: "Providers", value: memberCount ?? 0, icon: Users, href: "#" },
    { label: "Protocol Matches", value: matchCount ?? 0, icon: TrendingUp, href: "/corporate/admin/analytics" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {corporate.name} Admin
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage protocols, providers, and analytics
          </p>
        </div>
        <Link
          href="/corporate/admin/protocols/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Protocol
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[var(--color-brand-600)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/corporate/admin/protocols"
          className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-brand-300)] transition-all"
        >
          <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Manage Protocols</p>
            <p className="text-xs text-[var(--color-text-muted)]">Create, edit, version, and publish treatment protocols</p>
          </div>
        </Link>
        <Link
          href="/corporate/admin/analytics"
          className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-brand-300)] transition-all"
        >
          <BarChart3 className="w-6 h-6 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">View Analytics</p>
            <p className="text-xs text-[var(--color-text-muted)]">Protocol usage, provider activity, match outcomes</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

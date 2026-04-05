import { requireCorporateAdmin } from "@/lib/auth/corporate-admin";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, Search, Users, TrendingUp, Clock } from "lucide-react";

export default async function CorporateAnalyticsPage() {
  const { corporate } = await requireCorporateAdmin();
  const supabase = await createClient();

  // Fetch match history from audit logs
  const { data: matchLogs } = await supabase
    .from("audit_logs")
    .select("id, created_at, detail")
    .eq("resource_type", "corporate_protocol_match")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch protocol apply events
  const { data: applyLogs } = await supabase
    .from("audit_logs")
    .select("id, created_at, detail")
    .eq("resource_type", "treatment_protocol")
    .eq("action", "create")
    .order("created_at", { ascending: false })
    .limit(50);

  const corporateApplyLogs = (applyLogs || []).filter(
    (log: { detail: Record<string, unknown> }) =>
      (log.detail as { source?: string })?.source === "corporate_protocol"
  );

  // Aggregate stats
  const totalMatches = (matchLogs || []).length;
  const totalApplied = corporateApplyLogs.length;

  // Top matched protocols
  const matchCounts: Record<string, number> = {};
  for (const log of matchLogs || []) {
    const detail = log.detail as { top_match?: string };
    if (detail.top_match) {
      matchCounts[detail.top_match] = (matchCounts[detail.top_match] || 0) + 1;
    }
  }
  const topMatches = Object.entries(matchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Provider count
  const { count: providerCount } = await supabase
    .from("corporate_provider_memberships")
    .select("id", { count: "exact", head: true })
    .eq("corporate_id", corporate.id)
    .eq("is_active", true);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Protocol usage and provider activity for {corporate.name}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Protocol Matches", value: totalMatches, icon: Search },
          { label: "Protocols Applied", value: totalApplied, icon: TrendingUp },
          { label: "Active Providers", value: providerCount ?? 0, icon: Users },
          { label: "Conversion Rate", value: totalMatches > 0 ? `${Math.round((totalApplied / totalMatches) * 100)}%` : "—", icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4"
          >
            <Icon className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Top matched protocols */}
      {topMatches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
            Top Matched Protocols
          </h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Protocol</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Matches</th>
                </tr>
              </thead>
              <tbody>
                {topMatches.map(([name, count]) => (
                  <tr key={name} className="border-t border-[var(--color-border-light)]">
                    <td className="px-4 py-2.5 text-[var(--color-text-primary)]">{name}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent match activity */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
          Recent Activity
        </h2>
        <div className="space-y-2">
          {(matchLogs || []).slice(0, 20).map((log: { id: string; created_at: string; detail: Record<string, unknown> }) => {
            const detail = log.detail as { top_match?: string; top_score?: number; match_count?: number };
            return (
              <div
                key={log.id}
                className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  {detail.top_match && (
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {detail.top_match}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {detail.top_score != null && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      detail.top_score >= 80
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {detail.top_score}%
                    </span>
                  )}
                  {detail.match_count != null && (
                    <span className="text-[var(--color-text-muted)]">
                      {detail.match_count} match{detail.match_count !== 1 ? "es" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {(matchLogs || []).length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              No match activity yet. Providers will see activity here once they start using protocol matching.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

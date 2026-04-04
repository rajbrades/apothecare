import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Pill, Syringe, Activity, Search, Building2 } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import type { ProtocolCategory } from "@/types/corporate-protocol";

const CATEGORY_META: Record<ProtocolCategory, { label: string; icon: typeof Pill; color: string }> = {
  trt: { label: "TRT", icon: Syringe, color: "text-blue-600 bg-blue-50 border-blue-200" },
  hrt: { label: "HRT", icon: Syringe, color: "text-pink-600 bg-pink-50 border-pink-200" },
  peptides: { label: "Peptides", icon: Pill, color: "text-purple-600 bg-purple-50 border-purple-200" },
  metabolic: { label: "Metabolic", icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  thyroid: { label: "Thyroid", icon: Activity, color: "text-amber-600 bg-amber-50 border-amber-200" },
  gut: { label: "Gut", icon: Activity, color: "text-orange-600 bg-orange-50 border-orange-200" },
  neuro: { label: "Neuro", icon: Activity, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  other: { label: "Other", icon: BookOpen, color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export default async function ProtocolLibraryPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  // Get corporate membership
  const { data: memberships } = await supabase
    .from("corporate_provider_memberships")
    .select("corporate_id, role, corporate_accounts(name, slug, logo_url, branding)")
    .eq("practitioner_id", practitioner.id)
    .eq("is_active", true);

  const hasCorporate = memberships && memberships.length > 0;
  const corporate = hasCorporate
    ? (memberships[0] as { corporate_accounts: { name: string; slug: string; logo_url: string | null } }).corporate_accounts
    : null;

  // Fetch protocols
  let protocols: { id: string; title: string; description: string | null; category: string; tags: string[]; version: number }[] = [];

  if (hasCorporate) {
    const corporateIds = memberships!.map((m: { corporate_id: string }) => m.corporate_id);
    const { data } = await supabase
      .from("corporate_protocols")
      .select("id, title, description, category, tags, version")
      .in("corporate_id", corporateIds)
      .eq("status", "active")
      .order("category")
      .order("title");
    protocols = data || [];
  }

  // Group by category
  const grouped = protocols.reduce<Record<string, typeof protocols>>((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {corporate?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={corporate.logo_url} alt="" className="h-8 w-8 rounded" />
            )}
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Protocol Library
            </h1>
          </div>
          {corporate ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Building2 className="w-4 h-4" />
              <span>{corporate.name}</span>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="text-[var(--color-text-muted)]">{protocols.length} protocols</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              No corporate account linked. Contact your organization administrator.
            </p>
          )}
        </div>

        <Link
          href="/protocols/library?match=true"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
        >
          <Search className="w-4 h-4" />
          Find Protocol
        </Link>
      </div>

      {/* Protocol grid by category */}
      {Object.entries(grouped).map(([category, categoryProtocols]) => {
        const meta = CATEGORY_META[category as ProtocolCategory] ?? CATEGORY_META.other;
        const Icon = meta.icon;
        return (
          <section key={category}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${meta.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {meta.label}
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({categoryProtocols.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryProtocols.map((protocol) => (
                <Link
                  key={protocol.id}
                  href={`/protocols/${protocol.id}`}
                  className="group block rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all"
                >
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-700)] transition-colors mb-1.5">
                    {protocol.title}
                  </h3>
                  {protocol.description && (
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed mb-3">
                      {protocol.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border-light)]">
                      v{protocol.version}
                    </span>
                    {protocol.tags?.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {protocols.length === 0 && hasCorporate && (
        <div className="text-center py-16 text-sm text-[var(--color-text-muted)]">
          No protocols published yet. Contact your organization administrator.
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Powered by Apothecare · Clinical Decision Support
        </p>
      </div>
    </div>
  );
}

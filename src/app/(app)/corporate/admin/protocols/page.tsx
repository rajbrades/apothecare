import Link from "next/link";
import { Plus, Pencil, Archive, ArchiveRestore, Copy } from "lucide-react";
import { requireCorporateAdmin } from "@/lib/auth/corporate-admin";
import { createClient } from "@/lib/supabase/server";
import { ProtocolActions } from "@/components/corporate/protocol-actions";

export default async function CorporateProtocolsPage() {
  const { corporate } = await requireCorporateAdmin();
  const supabase = await createClient();

  const { data: protocols } = await supabase
    .from("corporate_protocols")
    .select("id, title, description, category, version, status, authored_by, tags, created_at, updated_at")
    .eq("corporate_id", corporate.id)
    .order("status")
    .order("category")
    .order("title");

  const active = (protocols || []).filter((p: { status: string }) => p.status === "active");
  const drafts = (protocols || []).filter((p: { status: string }) => p.status === "draft");
  const archived = (protocols || []).filter((p: { status: string }) => p.status === "archived");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Protocols</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {(protocols || []).length} protocols · {active.length} active
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

      {/* Active protocols */}
      {active.length > 0 && (
        <ProtocolSection
          title="Active"
          protocols={active}
          badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <ProtocolSection
          title="Drafts"
          protocols={drafts}
          badgeClass="bg-amber-50 text-amber-700 border-amber-200"
        />
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-3">
            Archived ({archived.length})
          </summary>
          <ProtocolSection
            title=""
            protocols={archived}
            badgeClass="bg-gray-50 text-gray-600 border-gray-200"
          />
        </details>
      )}

      {(protocols || []).length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">No protocols yet</p>
          <Link
            href="/corporate/admin/protocols/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Protocol
          </Link>
        </div>
      )}
    </div>
  );
}

function ProtocolSection({
  title,
  protocols,
  badgeClass,
}: {
  title: string;
  protocols: { id: string; title: string; description: string | null; category: string; version: number; status: string; authored_by: string | null; tags: string[]; updated_at: string }[];
  badgeClass: string;
}) {
  return (
    <section>
      {title && (
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          {title} ({protocols.length})
        </h2>
      )}
      <div className="space-y-2">
        {protocols.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] px-5 py-4 hover:border-[var(--color-brand-300)] transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/corporate/admin/protocols/${p.id}/edit`}
                  className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] transition-colors truncate"
                >
                  {p.title}
                </Link>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                  {p.status}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">v{p.version}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span className="uppercase">{p.category}</span>
                {p.authored_by && <span>by {p.authored_by}</span>}
                <span>Updated {new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <ProtocolActions protocolId={p.id} status={p.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

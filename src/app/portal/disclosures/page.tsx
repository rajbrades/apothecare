"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";

interface Disclosure {
  id: string;
  action: string;
  resource_type: string;
  accessed_at: string;
  accessed_by: string;
  detail: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DisclosuresPage() {
  const router = useRouter();
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchDisclosures();
  }, []);

  async function fetchDisclosures(cursor?: string) {
    if (cursor) setLoadingMore(true);
    try {
      const url = `/api/patient-portal/me/disclosures${cursor ? `?cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      if (res.status === 401) { router.replace("/portal/login"); return; }
      const data = await res.json();
      if (cursor) {
        setDisclosures((prev) => [...prev, ...(data.disclosures || [])]);
      } else {
        setDisclosures(data.disclosures || []);
      }
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Access Disclosure Log
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Per HIPAA §164.528, you may review an accounting of who has accessed
            your health records and when.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-600)] opacity-60" /></div>
        ) : disclosures.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-6 py-10 flex flex-col items-center text-center gap-3">
            <Eye className="h-6 w-6 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No access events recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
              {disclosures.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)]"
                >
                  <div>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{d.accessed_by}</span>{" "}
                      <span className="text-[var(--color-text-secondary)]">{d.action.toLowerCase()} {d.resource_type}</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDate(d.accessed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {nextCursor && (
              <button
                onClick={() => fetchDisclosures(nextCursor)}
                disabled={loadingMore}
                className="w-full py-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}

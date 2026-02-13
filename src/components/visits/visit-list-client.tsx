"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VisitListCard } from "./visit-list-card";

interface VisitItem {
  id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  chief_complaint: string | null;
  patient_id: string | null;
  patients?: { first_name: string | null; last_name: string | null } | null;
}

export function VisitListClient({ initialVisits }: { initialVisits: VisitItem[] }) {
  const router = useRouter();
  const [visits, setVisits] = useState<VisitItem[]>(initialVisits);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialVisits.length === 20);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || visits.length === 0) return;
    setLoading(true);

    const lastDate = visits[visits.length - 1].visit_date;
    const res = await fetch(`/api/visits?cursor=${encodeURIComponent(lastDate)}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setVisits((prev) => [...prev, ...data.visits]);
      setHasMore(data.nextCursor !== null);
    }
    setLoading(false);
  }, [loading, hasMore, visits]);

  const handleArchive = useCallback(async (id: string) => {
    const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVisits((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
    }
  }, [router]);

  return (
    <div className="space-y-2">
      {visits.map((visit) => (
        <VisitListCard
          key={visit.id}
          visit={visit}
          onArchive={handleArchive}
        />
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more visits"}
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VisitListCard } from "./visit-list-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";

interface PatientInfo {
  first_name: string | null;
  last_name: string | null;
}

interface VisitItem {
  id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  chief_complaint: string | null;
  patient_id: string | null;
  patients?: PatientInfo | null;
}

export function VisitListClient({ initialVisits }: { initialVisits: VisitItem[] }) {
  const router = useRouter();
  const [visits, setVisits] = useState<VisitItem[]>(initialVisits);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialVisits.length === 20);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [patientFilter, setPatientFilter] = useState<{ id: string; name: string } | null>(null);

  const fetchVisits = useCallback(
    async (opts: { cursor?: string; patientId?: string }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (opts.cursor) params.set("cursor", opts.cursor);
      if (opts.patientId) params.set("patient_id", opts.patientId);
      const res = await fetch(`/api/visits?${params.toString()}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ visits: VisitItem[]; nextCursor: string | null }>;
    },
    []
  );

  const handlePatientFilter = useCallback(async (patientId: string, name: string) => {
    const newFilter = patientId ? { id: patientId, name } : null;
    setPatientFilter(newFilter);
    setLoading(true);
    const result = await fetchVisits({ patientId: patientId || undefined });
    if (result) {
      setVisits(result.visits);
      setHasMore(result.nextCursor !== null);
    }
    setLoading(false);
  }, [fetchVisits]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || visits.length === 0) return;
    setLoading(true);
    const lastDate = visits[visits.length - 1].visit_date;
    const result = await fetchVisits({ cursor: lastDate, patientId: patientFilter?.id });
    if (result) {
      setVisits((prev) => [...prev, ...result.visits]);
      setHasMore(result.nextCursor !== null);
    }
    setLoading(false);
  }, [loading, hasMore, visits, fetchVisits, patientFilter]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/visits/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      setVisits((prev) => prev.filter((v) => v.id !== deleteTarget));
      router.refresh();
    }
    setDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, router]);

  const handleAssigned = useCallback(
    (visitId: string, patientId: string | null, patient: PatientInfo | null) => {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? { ...v, patient_id: patientId, patients: patient }
            : v
        )
      );
    },
    []
  );

  return (
    <div className="space-y-3">
      {/* Patient filter */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-64">
          <PatientSearchCombobox
            value={patientFilter?.id ?? ""}
            onChange={handlePatientFilter}
            placeholder="Filter by patient…"
            selectedName={patientFilter?.name ?? ""}

          />
        </div>
        {patientFilter && (
          <button
            onClick={() => handlePatientFilter("", "")}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Clear
          </button>
        )}
        {loading && (
          <span className="text-xs text-[var(--color-text-muted)]">Loading…</span>
        )}
      </div>

      {/* Visit list */}
      {visits.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
          {patientFilter ? `No visits for ${patientFilter.name}` : "No visits found"}
        </p>
      ) : (
        visits.map((visit) => (
          <VisitListCard
            key={visit.id}
            visit={visit}
            onDelete={(id) => setDeleteTarget(id)}
            onAssigned={handleAssigned}
          />
        ))
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more visits"}
        </button>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete this visit?"
        description="This will permanently remove the visit note and all associated data. This action cannot be undone."
        confirmLabel="Delete Visit"
        loading={deleting}
      />
    </div>
  );
}

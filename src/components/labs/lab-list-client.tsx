"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LabReportCard } from "./lab-report-card";
import { LabUpload } from "./lab-upload";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";

interface LabItem {
  id: string;
  test_name: string | null;
  lab_vendor: LabVendor;
  test_type: LabTestType;
  collection_date: string | null;
  status: LabReportStatus;
  raw_file_name: string | null;
  raw_file_size: number | null;
  created_at: string;
  patients?: { first_name: string | null; last_name: string | null } | null;
}

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface LabListClientProps {
  initialLabs: LabItem[];
  patients: PatientOption[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "uploading", label: "Uploading" },
  { value: "parsing", label: "Parsing" },
  { value: "complete", label: "Complete" },
  { value: "error", label: "Error" },
];

const TEST_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "blood_panel", label: "Blood Panel" },
  { value: "stool_analysis", label: "Stool Analysis" },
  { value: "saliva_hormone", label: "Saliva Hormone" },
  { value: "urine_hormone", label: "Urine Hormone" },
  { value: "organic_acids", label: "Organic Acids" },
  { value: "micronutrient", label: "Micronutrient" },
  { value: "genetic", label: "Genetic" },
  { value: "food_sensitivity", label: "Food Sensitivity" },
  { value: "other", label: "Other" },
];

export function LabListClient({ initialLabs, patients }: LabListClientProps) {
  const router = useRouter();
  const [labs, setLabs] = useState<LabItem[]>(initialLabs);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialLabs.length === 20);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("");

  const fetchLabs = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);
    if (testTypeFilter) params.set("test_type", testTypeFilter);

    const res = await fetch(`/api/labs?${params}`);
    if (!res.ok) return null;
    return res.json();
  }, [statusFilter, testTypeFilter]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || labs.length === 0) return;
    setLoading(true);

    const lastDate = labs[labs.length - 1].created_at;
    const data = await fetchLabs(lastDate);
    if (data) {
      setLabs((prev) => [...prev, ...data.labs]);
      setHasMore(data.nextCursor !== null);
    }
    setLoading(false);
  }, [loading, hasMore, labs, fetchLabs]);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    const data = await fetchLabs();
    if (data) {
      setLabs(data.labs);
      setHasMore(data.nextCursor !== null);
    }
    setLoading(false);
  }, [fetchLabs]);

  const handleUploaded = () => {
    router.refresh();
    // Refetch the list to show the new upload
    fetchLabs().then((data) => {
      if (data) {
        setLabs(data.labs);
        setHasMore(data.nextCursor !== null);
      }
    });
  };

  const handleDelete = (id: string) => {
    setLabs((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lab report deleted");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <LabUpload patients={patients} onUploaded={handleUploaded} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            // We need to trigger re-fetch after state update
            setTimeout(() => applyFilters(), 0);
          }}
          className="px-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={testTypeFilter}
          onChange={(e) => {
            setTestTypeFilter(e.target.value);
            setTimeout(() => applyFilters(), 0);
          }}
          className="px-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        >
          {TEST_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Lab list */}
      <div className="space-y-2">
        {labs.map((lab) => (
          <LabReportCard key={lab.id} report={lab} onDelete={handleDelete} />
        ))}
      </div>

      {labs.length === 0 && !loading && (
        <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
          No lab reports match your filters.
        </p>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more reports"}
        </button>
      )}
    </div>
  );
}

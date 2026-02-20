"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
  is_archived?: boolean;
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
  const [patientFilter, setPatientFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const fetchLabs = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);
    if (testTypeFilter) params.set("test_type", testTypeFilter);
    if (patientFilter) params.set("patient_id", patientFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (showArchived) params.set("include_archived", "true");

    const res = await fetch(`/api/labs?${params}`);
    if (!res.ok) return null;
    return res.json();
  }, [statusFilter, testTypeFilter, patientFilter, debouncedSearch, showArchived]);

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

  // Re-fetch when debounced search changes
  useEffect(() => {
    applyFilters();
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleArchive = (id: string, archived: boolean) => {
    if (showArchived) {
      // Keep in list but update state
      setLabs((prev) => prev.map((l) => l.id === id ? { ...l, is_archived: archived } : l));
    } else {
      // Remove from list when hiding archived
      setLabs((prev) => prev.filter((l) => l.id !== id));
    }
    toast.success(archived ? "Lab report archived" : "Lab report unarchived");
  };

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <LabUpload patients={patients} onUploaded={handleUploaded} defaultExpanded={initialLabs.length === 0} />

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-48"
          />
        </div>

        {patients.length > 0 && (
          <select
            value={patientFilter}
            onChange={(e) => {
              setPatientFilter(e.target.value);
              setTimeout(() => applyFilters(), 0);
            }}
            className="px-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
          >
            <option value="">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
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

        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => {
              setShowArchived(e.target.checked);
              setTimeout(() => applyFilters(), 0);
            }}
            className="rounded border-[var(--color-border-light)]"
          />
          Show Archived
        </label>
      </div>

      {/* Lab list */}
      <div className="space-y-2">
        {labs.map((lab) => (
          <LabReportCard key={lab.id} report={lab} onDelete={handleDelete} onArchive={handleArchive} />
        ))}
      </div>

      {labs.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            {statusFilter || testTypeFilter || patientFilter || searchQuery
              ? "No lab reports match your filters."
              : "No lab reports yet. Upload your first report above."}
          </p>
          {(statusFilter || testTypeFilter || patientFilter || searchQuery || showArchived) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setTestTypeFilter("");
                setPatientFilter("");
                setSearchQuery("");
                setShowArchived(false);
                setTimeout(() => applyFilters(), 0);
              }}
              className="mt-2 text-sm font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
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

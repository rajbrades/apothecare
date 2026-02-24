"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, LayoutList, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LabReportCard } from "./lab-report-card";
import { LabUpload } from "./lab-upload";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";
import type { LabReportStatus, LabVendor, LabTestType } from "@/types/database";

interface PatientLabSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  lab_count: number;
  latest_lab_date: string | null;
}

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
  patients?: { id?: string; first_name: string | null; last_name: string | null } | null;
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
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "by_patient">("list");
  const [patientSummaries, setPatientSummaries] = useState<PatientLabSummary[]>([]);
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);
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

  const loadPatientSummaries = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/labs/patients-summary");
      if (res.ok) {
        const data = await res.json();
        setPatientSummaries(data.patients || []);
        setUnlinkedCount(data.unlinked_count || 0);
      }
    } finally {
      setSummaryLoading(false);
    }
  }, []);

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

  const handleAssign = (id: string, patient: { id: string; first_name: string | null; last_name: string | null } | null) => {
    setLabs((prev) => prev.map((l) => l.id === id ? { ...l, patients: patient ?? undefined } : l));
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

      {/* View mode toggle + Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View mode toggle */}
        <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border-light)] overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              viewMode === "list"
                ? "bg-[var(--color-brand-600)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
            }`}
          >
            <LayoutList className="w-3 h-3" />
            List
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("by_patient");
              if (patientSummaries.length === 0) loadPatientSummaries();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border-l border-[var(--color-border-light)] transition-colors ${
              viewMode === "by_patient"
                ? "bg-[var(--color-brand-600)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
            }`}
          >
            <Users className="w-3 h-3" />
            By Patient
          </button>
        </div>

        {viewMode === "list" && (
          <>
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

            <PatientSearchCombobox
              value={patientFilter}
              selectedName={selectedPatientName}
              onChange={(id, name) => {
                setPatientFilter(id);
                setSelectedPatientName(name);
                setTimeout(() => applyFilters(), 0);
              }}
            />

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
          </>
        )}
      </div>

      {/* By-patient grid */}
      {viewMode === "by_patient" && (
        <div>
          {summaryLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-[var(--color-text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading patients...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {patientSummaries.map((ps) => {
                const name = [ps.first_name, ps.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
                return (
                  <button
                    key={ps.id}
                    type="button"
                    onClick={() => {
                      setPatientFilter(ps.id);
                      setSelectedPatientName(name);
                      setViewMode("list");
                      setTimeout(() => applyFilters(), 0);
                    }}
                    className="flex flex-col items-start p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-2">
                      <User className="w-4 h-4 text-[var(--color-brand-600)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate w-full">{name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {ps.lab_count} report{ps.lab_count !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}

              {unlinkedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientFilter("__unlinked__");
                    setSelectedPatientName("Unlinked");
                    setViewMode("list");
                    // Fetch unlinked labs
                    setLoading(true);
                    const params = new URLSearchParams({ limit: "20", unlinked: "true" });
                    fetch(`/api/labs?${params}`)
                      .then((r) => r.json())
                      .then((data) => {
                        setLabs(data.labs || []);
                        setHasMore(data.nextCursor !== null);
                      })
                      .finally(() => setLoading(false));
                  }}
                  className="flex flex-col items-start p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-300)] transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] truncate w-full">Unlinked Labs</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {unlinkedCount} report{unlinkedCount !== 1 ? "s" : ""}
                  </p>
                </button>
              )}

              {patientSummaries.length === 0 && unlinkedCount === 0 && (
                <p className="col-span-full text-sm text-center py-8 text-[var(--color-text-muted)]">No patients with labs yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lab list */}
      {viewMode === "list" && (
      <div className="space-y-2">
        {labs.map((lab) => (
          <LabReportCard key={lab.id} report={lab} onDelete={handleDelete} onArchive={handleArchive} onAssign={handleAssign} />
        ))}
      </div>
      )}

      {viewMode === "list" && labs.length === 0 && !loading && (
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

      {viewMode === "list" && hasMore && (
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

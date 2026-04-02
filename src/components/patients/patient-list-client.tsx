"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { User, Calendar, ChevronRight, Loader2, Search, X, Archive } from "lucide-react";

interface PatientItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  chief_complaints: string[] | null;
  portal_status: string | null;
  updated_at: string;
}

interface PatientListClientProps {
  initialPatients: PatientItem[];
  initialCursor: string | null;
}

export function PatientListClient({ initialPatients, initialCursor }: PatientListClientProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (search) params.set("search", search);
      if (showArchived) params.set("archived", "true");
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients((prev) => [...prev, ...data.patients]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, search, showArchived]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (term: string, archived = showArchived) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.set("search", term);
      if (archived) params.set("archived", "true");
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data.patients);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const handleToggleArchived = useCallback(() => {
    const next = !showArchived;
    setShowArchived(next);
    handleSearch(search, next);
  }, [showArchived, search, handleSearch]);

  // Debounced search on typing (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(search);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search, handleSearch]);

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-10 pr-8 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active / Archived toggle */}
      <div className="flex items-center gap-1 mb-4 p-0.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] w-fit">
        <button
          onClick={() => showArchived && handleToggleArchived()}
          className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
            !showArchived
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => !showArchived && handleToggleArchived()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
            showArchived
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Archive className="w-3 h-3" />
          Archived
        </button>
      </div>

      {/* Patient list */}
      <div className="space-y-2">
        {patients.map((patient) => {
          const name = [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
          const age = getAge(patient.date_of_birth);

          return (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-[var(--color-brand-600)]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    {name}
                    {patient.portal_status === "active" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] border border-[var(--color-brand-200)]">Portal</span>
                    )}
                    {patient.portal_status === "invited" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-gold-50)] text-[var(--color-gold-600)] border border-[var(--color-gold-200)]">Invited</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                    {age !== null && <span>{age}y {patient.sex ? `/ ${patient.sex}` : ""}</span>}
                    {patient.chief_complaints?.length ? (
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{patient.chief_complaints.join(", ")}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(patient.updated_at).toLocaleDateString()}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      {cursor && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)]"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Load More
          </button>
        </div>
      )}

      {patients.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            {showArchived ? "No archived patients" : "No patients found"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-[var(--color-brand-600)] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

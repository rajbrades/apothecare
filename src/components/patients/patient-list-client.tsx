"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { User, Calendar, ChevronRight, Loader2, Search } from "lucide-react";

interface PatientItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  chief_complaints: string[] | null;
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

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (search) params.set("search", search);
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients((prev) => [...prev, ...data.patients]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, search]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data.patients);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [search]);

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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search patients..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          />
        </div>
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
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                    {age !== null && <span>{age}y {patient.sex ? `/ ${patient.sex}` : ""}</span>}
                    {patient.chief_complaints?.length ? (
                      <span className="truncate max-w-[200px]">{patient.chief_complaints.join(", ")}</span>
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
        <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
          No patients found
        </p>
      )}
    </div>
  );
}

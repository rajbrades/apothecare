"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { MOCK_PATIENTS } from "./mock-data";

export function PanelPatients() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...MOCK_PATIENTS].sort((a, b) =>
      a.last_name.localeCompare(b.last_name)
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--color-surface-tertiary)] border border-transparent rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-colors"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {filtered.length > 0 ? (
          filtered.map((patient) => (
            <button
              key={patient.id}
              className="w-full text-left px-2 py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {/* Avatar initial */}
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] text-xs font-semibold">
                  {patient.first_name[0]}
                  {patient.last_name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {patient.last_name}, {patient.first_name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    DOB {new Date(patient.date_of_birth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {patient.last_visit_date && (
                      <> · Last visit {formatRelativeTime(patient.last_visit_date)}</>
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="px-2 py-4 text-xs text-[var(--color-text-muted)] text-center">
            No patients found
          </p>
        )}
      </div>
    </div>
  );
}

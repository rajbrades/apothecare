"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X, Loader2, User } from "lucide-react";

interface PatientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface PatientSearchComboboxProps {
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  className?: string;
  selectedName?: string;
}

function patientDisplayName(p: PatientOption): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
}

export function PatientSearchCombobox({
  value,
  onChange,
  placeholder = "All Patients",
  className = "",
  selectedName,
}: PatientSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch patients when input changes (debounced 300ms)
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "15" });
        if (inputValue.trim()) params.set("search", inputValue.trim());
        const res = await fetch(`/api/patients?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.patients || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [inputValue, open]);

  // Pre-load on open
  useEffect(() => {
    if (open) setInputValue("");
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const displayLabel = value && selectedName ? selectedName : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-300)] transition-colors max-w-[180px]"
      >
        <User className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />
        <span className="truncate">{displayLabel}</span>
        {value ? (
          <X
            className="w-3 h-3 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "");
            }}
          />
        ) : (
          <ChevronDown className="w-3 h-3 shrink-0 text-[var(--color-text-muted)] ml-auto" />
        )}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown panel */}
          <div className="absolute top-full left-0 mt-1 w-64 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-[var(--color-border-light)]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)]" />
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)]"
                />
              </div>
            </div>

            {/* Results list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {value && (
                <li>
                  <button
                    type="button"
                    onClick={() => { onChange("", ""); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    All Patients
                  </button>
                </li>
              )}

              {loading && (
                <li className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching...
                </li>
              )}

              {!loading && results.length === 0 && (
                <li className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  No patients found
                </li>
              )}

              {!loading && results.map((p) => {
                const name = patientDisplayName(p);
                const isSelected = p.id === value;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(p.id, name); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        isSelected
                          ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                          : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

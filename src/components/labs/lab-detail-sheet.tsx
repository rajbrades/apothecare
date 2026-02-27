"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, FlaskConical, Loader2, TrendingUp } from "lucide-react";
import type { LabReportStatus, LabVendor } from "@/types/database";

interface BiomarkerResult {
  id: string;
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  value: number;
  unit: string;
  functional_flag: string | null;
  conventional_flag: string | null;
}

interface LabData {
  report: {
    id: string;
    test_name: string | null;
    lab_vendor: LabVendor;
    test_type: string;
    collection_date: string | null;
    status: LabReportStatus;
    error_message: string | null;
    patient_id: string | null;
    patients?: { first_name: string | null; last_name: string | null } | null;
  };
  biomarkers: BiomarkerResult[];
}

interface LabDetailSheetProps {
  labId: string | null;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onOpenTrends?: (biomarkerCode?: string) => void;
}

const VENDOR_LABELS: Partial<Record<LabVendor, string>> = {
  quest: "Quest Diagnostics",
  labcorp: "LabCorp",
  diagnostic_solutions: "Diagnostic Solutions",
  vibrant: "Vibrant Wellness",
  genova: "Genova Diagnostics",
  precision_analytical: "Precision Analytical",
  mosaic: "Mosaic Diagnostics",
  spectracell: "SpectraCell",
  realtime_labs: "RealTime Labs",
  zrt: "ZRT Laboratory",
  other: "Other Lab",
};

const PROCESSING_STATUSES: LabReportStatus[] = ["uploading", "classifying", "parsing", "interpreting"];

function getFlagStyle(flag: string | null): { dot: string; badge: string; label: string } {
  switch (flag) {
    case "optimal":
      return { dot: "bg-emerald-400", badge: "text-emerald-700 bg-emerald-50", label: "Optimal" };
    case "normal":
      return { dot: "bg-gray-300", badge: "text-gray-500 bg-gray-50", label: "Normal" };
    case "borderline":
      return { dot: "bg-amber-400", badge: "text-amber-700 bg-amber-50", label: "Borderline" };
    case "low":
      return { dot: "bg-orange-400", badge: "text-orange-700 bg-orange-50", label: "Low" };
    case "high":
      return { dot: "bg-orange-400", badge: "text-orange-700 bg-orange-50", label: "High" };
    case "out_of_range":
      return { dot: "bg-orange-500", badge: "text-orange-700 bg-orange-50", label: "Out of Range" };
    case "critical":
      return { dot: "bg-red-500", badge: "text-red-700 bg-red-50", label: "Critical" };
    default:
      return { dot: "bg-gray-200", badge: "text-gray-400 bg-gray-50", label: "–" };
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function LabDetailSheet({ labId, patientId, patientName, onClose, onOpenTrends }: LabDetailSheetProps) {
  const [data, setData] = useState<LabData | null>(null);
  const [loading, setLoading] = useState(false);
  // Fetch lab data when labId changes
  useEffect(() => {
    if (!labId) { setData(null); return; }
    setLoading(true);
    fetch(`/api/labs/${labId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [labId]);

  // Escape key to close
  useEffect(() => {
    if (!labId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [labId, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!labId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [labId]);

  if (!labId) return null;

  const report = data?.report;
  const biomarkers = data?.biomarkers ?? [];

  const displayName = report?.test_name
    || (report?.test_type
      ? report.test_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Lab Report");

  const vendorLabel = report ? (VENDOR_LABELS[report.lab_vendor] ?? report.lab_vendor) : "";
  const isProcessing = report ? PROCESSING_STATUSES.includes(report.status) : false;
  const isComplete = report?.status === "complete";

  const flaggedBiomarkers = biomarkers.filter((b) => {
    const f = b.functional_flag || b.conventional_flag;
    return f && f !== "optimal" && f !== "normal";
  });

  // Group all biomarkers by category
  const grouped = new Map<string, BiomarkerResult[]>();
  for (const b of biomarkers) {
    const cat = b.category || "Uncategorized";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(b);
  }

  const fullReportHref = `/labs/${labId}?from=patient&patientId=${patientId}&patientName=${encodeURIComponent(patientName)}`;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/25" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[500px] max-w-[90vw] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden border-l border-[var(--color-border-light)]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-border-light)] shrink-0 gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              {patientName} &middot; Lab Report
            </p>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2">
              {loading ? "Loading…" : displayName}
            </h2>
            {report && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {vendorLabel}
                {report.collection_date && ` · ${formatDate(report.collection_date)}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={fullReportHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] rounded-[var(--radius-md)] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Full report
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : !report ? (
            <p className="text-center text-sm text-[var(--color-text-muted)] py-12">
              Failed to load lab data.
            </p>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-600)]" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Processing lab report…</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Biomarkers will appear once parsing is complete.
              </p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">

              {/* Summary chips */}
              {isComplete && biomarkers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                    <FlaskConical className="w-3 h-3" />
                    {biomarkers.length} biomarker{biomarkers.length !== 1 ? "s" : ""}
                  </span>
                  {flaggedBiomarkers.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-700 font-medium">
                      {flaggedBiomarkers.length} flagged
                    </span>
                  )}
                </div>
              )}

              {/* Error state */}
              {report.status === "error" && (
                <div className="p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-700">Parsing failed</p>
                  {report.error_message && (
                    <p className="text-xs text-red-600 mt-0.5">{report.error_message}</p>
                  )}
                </div>
              )}

              {/* Flagged biomarkers */}
              {flaggedBiomarkers.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    Flagged
                  </h3>
                  <div className="space-y-0.5">
                    {flaggedBiomarkers.map((b) => {
                      const flag = b.functional_flag || b.conventional_flag;
                      const style = getFlagStyle(flag);
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                        >
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">
                            {b.biomarker_name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {b.value} {b.unit}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                              {style.label}
                            </span>
                            {onOpenTrends && (
                              <button
                                onClick={() => onOpenTrends(b.biomarker_code)}
                                title="View trend"
                                className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All results by category */}
              {grouped.size > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                    All Results
                  </h3>
                  <div className="space-y-4">
                    {[...grouped.entries()].map(([cat, markers]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                          {cat}
                        </p>
                        <div className="space-y-0.5">
                          {markers.map((b) => {
                            const flag = b.functional_flag || b.conventional_flag;
                            const style = getFlagStyle(flag);
                            const isFlagged = flag && flag !== "optimal" && flag !== "normal";
                            return (
                              <div
                                key={b.id}
                                className={`flex items-center justify-between py-1 px-2 rounded-[var(--radius-sm)] transition-colors ${
                                  isFlagged
                                    ? "bg-amber-50/60"
                                    : "hover:bg-[var(--color-surface-secondary)]"
                                }`}
                              >
                                <span className={`text-xs ${isFlagged ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                                  {b.biomarker_name}
                                </span>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-xs text-[var(--color-text-muted)]">
                                    {b.value} {b.unit}
                                  </span>
                                  {flag && flag !== "normal" && (
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isComplete && biomarkers.length === 0 && (
                <p className="text-sm text-center text-[var(--color-text-muted)] py-6">
                  No biomarker data extracted from this report.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border-light)] shrink-0">
          <Link
            href={fullReportHref}
            target="_blank"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Open full report
          </Link>
        </div>
      </div>
    </div>
  );
}

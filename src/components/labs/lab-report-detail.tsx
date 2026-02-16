"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BiomarkerPanel } from "@/components/chat/biomarker-range-bar";
import type { BiomarkerData, BiomarkerPanelData } from "@/components/chat/biomarker-range-bar";
import { LabStatusBadge } from "./lab-status-badge";
import { mapDbFlagToComponentFlag } from "@/lib/labs/flag-mapping";
import type { LabReportStatus, LabVendor, BiomarkerFlag as DbFlag } from "@/types/database";

interface BiomarkerRow {
  id: string;
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  value: number;
  unit: string;
  conventional_low: number | null;
  conventional_high: number | null;
  conventional_flag: DbFlag | null;
  functional_low: number | null;
  functional_high: number | null;
  functional_flag: DbFlag | null;
  interpretation: string | null;
}

interface ReportData {
  id: string;
  test_name: string | null;
  lab_vendor: LabVendor;
  test_type: string;
  collection_date: string | null;
  status: LabReportStatus;
  error_message: string | null;
  raw_file_url: string;
  patients?: { first_name: string | null; last_name: string | null; date_of_birth: string | null; sex: string | null } | null;
}

interface LabReportDetailProps {
  report: ReportData;
  biomarkers: BiomarkerRow[];
  pdfUrl: string | null;
}

const VENDOR_LABELS: Partial<Record<LabVendor, string>> = {
  quest: "Quest Diagnostics",
  labcorp: "LabCorp",
  diagnostic_solutions: "Diagnostic Solutions",
  genova: "Genova Diagnostics",
  precision_analytical: "Precision Analytical",
  mosaic: "Mosaic Diagnostics",
  vibrant: "Vibrant Wellness",
  spectracell: "SpectraCell",
  realtime_labs: "RealTime Labs",
  zrt: "ZRT Laboratory",
  other: "Other Lab",
};

const PROCESSING_STATUSES: LabReportStatus[] = ["uploading", "classifying", "parsing", "interpreting"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildPanels(biomarkers: BiomarkerRow[], labSource: string, collectedDate?: string | null): BiomarkerPanelData[] {
  const groups = new Map<string, BiomarkerData[]>();

  for (const b of biomarkers) {
    const category = b.category || "Uncategorized";
    const flag = b.functional_flag
      ? mapDbFlagToComponentFlag(b.functional_flag)
      : b.conventional_flag
        ? mapDbFlagToComponentFlag(b.conventional_flag)
        : "normal";

    const biomarkerData: BiomarkerData = {
      name: b.biomarker_name,
      value: b.value,
      unit: b.unit,
      conventionalLow: b.conventional_low ?? 0,
      conventionalHigh: b.conventional_high ?? b.value * 2,
      functionalLow: b.functional_low ?? b.conventional_low ?? 0,
      functionalHigh: b.functional_high ?? b.conventional_high ?? b.value * 2,
      flag,
      note: b.interpretation || undefined,
    };

    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(biomarkerData);
  }

  // Sort categories alphabetically, but put "Uncategorized" last
  const sortedCategories = [...groups.keys()].sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return sortedCategories.map((category) => {
    const markers = groups.get(category)!;
    const flagCount = markers.filter((m) => m.flag !== "optimal" && m.flag !== "normal").length;

    // Format category name to ALL CAPS
    const title = category
      .split("_")
      .join(" ")
      .toUpperCase();

    return {
      title,
      labSource,
      collectedDate: collectedDate ? formatDate(collectedDate) : undefined,
      flagCount,
      biomarkers: markers,
    };
  });
}

export function LabReportDetail({ report: initialReport, biomarkers: initialBiomarkers, pdfUrl: initialPdfUrl }: LabReportDetailProps) {
  const [report, setReport] = useState(initialReport);
  const [biomarkers, setBiomarkers] = useState(initialBiomarkers);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [retrying, setRetrying] = useState(false);

  const isProcessing = PROCESSING_STATUSES.includes(report.status);

  // Poll while processing — with backoff and visibility check
  useEffect(() => {
    if (!isProcessing) return;

    let delay = 3000;
    const MAX_DELAY = 15000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      // Skip poll when tab is hidden
      if (document.hidden) {
        timeoutId = setTimeout(poll, delay);
        return;
      }

      try {
        const res = await fetch(`/api/labs/${report.id}`);
        if (!res.ok) {
          delay = Math.min(delay * 1.5, MAX_DELAY);
        } else {
          const data = await res.json();
          setReport(data.report);
          setBiomarkers(data.biomarkers);
          if (data.pdfUrl) setPdfUrl(data.pdfUrl);
          delay = 3000; // Reset on success
        }
      } catch {
        delay = Math.min(delay * 1.5, MAX_DELAY);
      }

      timeoutId = setTimeout(poll, delay);
    };

    timeoutId = setTimeout(poll, delay);

    return () => clearTimeout(timeoutId);
  }, [report.id, isProcessing]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/labs/${report.id}/reparse`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start re-parse");
      }
      toast.success("Re-parsing started");
      // Update local state to show processing
      setReport((prev) => ({ ...prev, status: "parsing" as LabReportStatus }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start re-parse");
    } finally {
      setRetrying(false);
    }
  }, [report.id]);

  const patientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  const vendorLabel = VENDOR_LABELS[report.lab_vendor] || report.lab_vendor;
  const displayName = report.test_name || "Lab Report";

  const panels = buildPanels(biomarkers, vendorLabel, report.collection_date);
  const totalBiomarkers = biomarkers.length;
  const flaggedCount = biomarkers.filter((b) => {
    const flag = b.functional_flag || b.conventional_flag;
    return flag && flag !== "optimal" && flag !== "normal";
  }).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
        <Link
          href="/labs"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Labs
        </Link>
        <span className="text-[var(--color-text-muted)]">&gt;</span>
        <span className="text-[var(--color-text-primary)]">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {displayName}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {vendorLabel}
              {report.collection_date && ` \u00B7 ${formatDate(report.collection_date)}`}
              {patientName && ` \u00B7 ${patientName}`}
            </p>
          </div>
          <LabStatusBadge status={report.status} />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-4">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Original PDF
            </a>
          )}
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-sm font-medium text-amber-800">Processing your lab report</p>
            <p className="text-xs text-amber-600 mt-0.5">
              AI is extracting and analyzing biomarkers. This usually takes 30-60 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {report.status === "error" && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-[var(--radius-md)] border border-red-200 bg-red-50">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Parsing failed</p>
            <p className="text-xs text-red-600 mt-0.5">
              {report.error_message || "An unexpected error occurred while parsing this lab report."}
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-[var(--color-surface)] border border-red-200 rounded-[var(--radius-md)] hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        </div>
      )}

      {/* Biomarker summary */}
      {report.status === "complete" && totalBiomarkers > 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {totalBiomarkers} biomarker{totalBiomarkers !== 1 ? "s" : ""}
          {flaggedCount > 0 && (
            <> &middot; <span className="text-[var(--color-biomarker-borderline)] font-medium">{flaggedCount} flagged</span></>
          )}
        </p>
      )}

      {/* Biomarker panels */}
      {report.status === "complete" && panels.length > 0 && (
        <div className="space-y-4">
          {panels.map((panel) => (
            <BiomarkerPanel key={panel.title} panel={panel} />
          ))}
        </div>
      )}

      {/* Complete but no biomarkers */}
      {report.status === "complete" && totalBiomarkers === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-text-muted)]">
            No biomarker results were extracted from this report.
          </p>
        </div>
      )}
    </div>
  );
}

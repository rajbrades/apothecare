"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, AlertCircle, Loader2, RefreshCcw, Archive, ArchiveRestore, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BiomarkerPanel } from "@/components/chat/biomarker-range-bar";
import type { BiomarkerData, BiomarkerPanelData, QualitativeData } from "@/components/chat/biomarker-range-bar";
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

interface ParsedQualitativeResult {
  name: string;
  result: string;
  reference: string;
  category: string;
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
  is_archived?: boolean;
  parsed_data?: { qualitative_results?: ParsedQualitativeResult[] } | null;
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

const MAX_TITLE_LENGTH = 80;

/** Split a long semicolon-delimited test name into a short title + panel list */
function parseTestName(testName: string | null): { shortName: string; panels: string[] | null } {
  if (!testName) return { shortName: "Lab Report", panels: null };
  if (testName.length <= MAX_TITLE_LENGTH && !testName.includes(";")) {
    return { shortName: testName, panels: null };
  }

  const parts = testName.split(/;\s*/);
  if (parts.length <= 1) {
    // No semicolons but still long — truncate
    return { shortName: testName.slice(0, MAX_TITLE_LENGTH) + "\u2026", panels: null };
  }

  const shortName = parts[0];
  return { shortName, panels: parts };
}

// Human-readable titles for GI-MAP sections (matching the PDF headings)
const GI_MAP_SECTION_TITLES: Record<string, string> = {
  bacterial_pathogens: "BACTERIAL PATHOGENS",
  parasitic_pathogens: "PARASITIC PATHOGENS",
  viral_pathogens: "VIRAL PATHOGENS",
  h_pylori: "H. PYLORI",
  commensal_bacteria: "COMMENSAL / KEYSTONE BACTERIA",
  bacterial_phyla: "BACTERIAL PHYLA",
  dysbiotic_overgrowth_bacteria: "DYSBIOTIC & OVERGROWTH BACTERIA",
  commensal_overgrowth_microbes: "COMMENSAL OVERGROWTH MICROBES",
  inflammatory_autoimmune_bacteria: "INFLAMMATORY & AUTOIMMUNE-RELATED BACTERIA",
  commensal_inflammatory_bacteria: "COMMENSAL INFLAMMATORY & AUTOIMMUNE-RELATED BACTERIA",
  normal_flora: "NORMAL FLORA",
  dysbiotic_bacteria: "DYSBIOTIC BACTERIA",
  fungi_yeast: "FUNGI / YEAST",
  parasites: "PARASITES",
  worms: "WORMS",
  intestinal_health: "INTESTINAL HEALTH",
};

// GI-MAP section display order (matches the PDF report layout)
const GI_MAP_SECTION_ORDER = [
  // Pathogens
  "bacterial_pathogens",
  "parasitic_pathogens",
  "viral_pathogens",
  // H. pylori
  "h_pylori",
  // Commensal / Keystone Bacteria
  "commensal_bacteria",
  "bacterial_phyla",
  // Opportunistic / Overgrowth Microbes
  "dysbiotic_overgrowth_bacteria",
  "commensal_overgrowth_microbes",
  "inflammatory_autoimmune_bacteria",
  "commensal_inflammatory_bacteria",
  // Legacy fallbacks (in case old data uses these)
  "normal_flora",
  "dysbiotic_bacteria",
  // Fungi, Parasites, Worms
  "fungi_yeast",
  "parasites",
  "worms",
  // Intestinal Health
  "intestinal_health",
];

function isQualitativeFlagged(result: string, reference: string): boolean {
  const r = result.toLowerCase().trim();
  const ref = reference.toLowerCase().trim();
  // "Detected" when reference is "Not Detected" → flagged
  if (ref.includes("not detected") && !r.includes("not detected") && r.includes("detected")) return true;
  // "Positive" when reference is "Negative" → flagged
  if (ref.includes("negative") && r.includes("positive")) return true;
  // Result doesn't match reference (generic)
  if (r !== ref && ref === "not detected" && r !== "not detected") return true;
  return false;
}

function buildPanels(
  biomarkers: BiomarkerRow[],
  labSource: string,
  collectedDate?: string | null,
  qualitativeResults?: ParsedQualitativeResult[],
  isGiMap?: boolean,
): BiomarkerPanelData[] {
  const numericGroups = new Map<string, BiomarkerData[]>();
  const qualGroups = new Map<string, QualitativeData[]>();

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

    if (!numericGroups.has(category)) numericGroups.set(category, []);
    numericGroups.get(category)!.push(biomarkerData);
  }

  // Group qualitative results by category
  if (qualitativeResults) {
    for (const q of qualitativeResults) {
      const category = q.category || "Uncategorized";
      const qualData: QualitativeData = {
        name: q.name,
        result: q.result,
        reference: q.reference,
        flagged: isQualitativeFlagged(q.result, q.reference),
      };

      if (!qualGroups.has(category)) qualGroups.set(category, []);
      qualGroups.get(category)!.push(qualData);
    }
  }

  // Merge all category keys
  const allCategories = new Set([...numericGroups.keys(), ...qualGroups.keys()]);

  // Sort: GI-MAP uses defined clinical order, others use alphabetical
  let sortedCategories: string[];
  if (isGiMap) {
    sortedCategories = [...allCategories].sort((a, b) => {
      const idxA = GI_MAP_SECTION_ORDER.indexOf(a);
      const idxB = GI_MAP_SECTION_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  } else {
    sortedCategories = [...allCategories].sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }

  return sortedCategories.map((category) => {
    const markers = numericGroups.get(category) || [];
    const qualitative = qualGroups.get(category) || [];
    const numericFlagCount = markers.filter((m) => m.flag !== "optimal" && m.flag !== "normal").length;
    const qualFlagCount = qualitative.filter((q) => q.flagged).length;

    const title = (isGiMap && GI_MAP_SECTION_TITLES[category])
      ? GI_MAP_SECTION_TITLES[category]
      : category.split("_").join(" ").toUpperCase();

    return {
      title,
      labSource,
      collectedDate: collectedDate ? formatDate(collectedDate) : undefined,
      flagCount: numericFlagCount + qualFlagCount,
      biomarkers: markers,
      qualitativeResults: qualitative.length > 0 ? qualitative : undefined,
    };
  });
}

export function LabReportDetail({ report: initialReport, biomarkers: initialBiomarkers, pdfUrl: initialPdfUrl }: LabReportDetailProps) {
  const [report, setReport] = useState(initialReport);
  const [biomarkers, setBiomarkers] = useState(initialBiomarkers);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [retrying, setRetrying] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const isArchived = report.is_archived ?? false;

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

  const handleArchive = useCallback(async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/labs/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !isArchived }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setReport((prev) => ({ ...prev, is_archived: !isArchived }));
      toast.success(isArchived ? "Lab report unarchived" : "Lab report archived");
    } catch {
      toast.error("Failed to update archive status");
    } finally {
      setArchiving(false);
    }
  }, [report.id, isArchived]);

  const patientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  const vendorLabel = VENDOR_LABELS[report.lab_vendor] || report.lab_vendor;
  const { shortName: displayName, panels: testPanels } = parseTestName(report.test_name);
  const [panelsExpanded, setPanelsExpanded] = useState(false);

  const isGiMap = report.lab_vendor === "diagnostic_solutions";
  const qualitativeResults = (report.parsed_data?.qualitative_results as ParsedQualitativeResult[] | undefined) || [];
  const panels = buildPanels(biomarkers, vendorLabel, report.collection_date, qualitativeResults, isGiMap);
  const totalBiomarkers = biomarkers.length + qualitativeResults.length;
  const flaggedCount = biomarkers.filter((b) => {
    const flag = b.functional_flag || b.conventional_flag;
    return flag && flag !== "optimal" && flag !== "normal";
  }).length + qualitativeResults.filter((q) => isQualitativeFlagged(q.result, q.reference)).length;

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
            {testPanels && (
              <div className="mt-2">
                <button
                  onClick={() => setPanelsExpanded(!panelsExpanded)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${panelsExpanded ? "rotate-180" : ""}`} />
                  {testPanels.length} panels included
                </button>
                {panelsExpanded && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {testPanels.map((panel, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border-light)]"
                      >
                        {panel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          {report.status === "complete" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Re-parsing..." : "Re-parse Report"}
            </button>
          )}
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
          >
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {isArchived ? "Unarchive" : "Archive"}
          </button>
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
          {panels.map((panel, idx) => (
            <BiomarkerPanel key={`${panel.title}-${idx}`} panel={panel} />
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

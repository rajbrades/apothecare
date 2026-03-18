"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, AlertCircle, Loader2, RefreshCcw, Archive, ArchiveRestore, ChevronDown, ChevronsUpDown, ChevronsDownUp, ClipboardList, Copy, Check, Download, CalendarPlus, X, MoreHorizontal, Printer } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BiomarkerPanel } from "@/components/chat/biomarker-range-bar";
import type { BiomarkerData, BiomarkerPanelData, QualitativeData } from "@/components/chat/biomarker-range-bar";
import { LabStatusBadge } from "./lab-status-badge";
import { AssignPatientButton } from "./assign-patient-button";
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
  patient_id?: string | null;
  patients?: { id?: string | null; first_name: string | null; last_name: string | null; date_of_birth: string | null; sex: string | null } | null;
}

interface LabReportDetailProps {
  report: ReportData;
  biomarkers: BiomarkerRow[];
  pdfUrl: string | null;
  previousValues?: Record<string, number>;
  fromPatient?: { id: string; name: string };
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

/** Convert a panel title to a DOM-safe id slug. */
function slugifyPanel(title: string): string {
  return "panel-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


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

// Clinical display order for CBC biomarkers
const CBC_BIOMARKER_ORDER = [
  // Red cell indices first
  "HEMOGLOBIN", "HGB",
  "RED BLOOD CELL", "RBC",
  "HEMATOCRIT", "HCT",
  "MCH ",  // trailing space to avoid matching MCHC
  "MCHC",
  "MCV", "MEAN CORPUSCULAR VOLUME",
  "RDW",
  // WBC total before differentials
  "WHITE BLOOD CELL", "WBC",
  // WBC differentials
  "NEUTROPHIL", "NEUT",
  "LYMPHOCYTE", "LYMPH",
  "MONOCYTE", "MONO",
  "EOSINOPHIL", "EOS",
  "BASOPHIL", "BASO",
  // Platelets last
  "PLATELET", "PLT",
  "MPV",
];

function getCbcSortIndex(name: string): number {
  const upper = name.toUpperCase();
  for (let i = 0; i < CBC_BIOMARKER_ORDER.length; i++) {
    if (upper.includes(CBC_BIOMARKER_ORDER[i].trimEnd()) || upper.startsWith(CBC_BIOMARKER_ORDER[i].trimEnd())) {
      return i;
    }
  }
  return CBC_BIOMARKER_ORDER.length; // unknown → end
}

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
  previousValues?: Record<string, number>,
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
      previousValue: previousValues?.[b.biomarker_code],
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
    let markers = numericGroups.get(category) || [];
    const qualitative = qualGroups.get(category) || [];

    // Sort CBC biomarkers in clinical display order
    if (category.toLowerCase() === "cbc") {
      markers = [...markers].sort((a, b) => getCbcSortIndex(a.name) - getCbcSortIndex(b.name));
    }

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

// ── Clipboard helper ────────────────────────────────────────────────────
function buildClipboardText(
  reportName: string,
  vendorLabel: string,
  collectionDate: string | null,
  patientName: string | null,
  biomarkers: BiomarkerRow[],
  qualitativeResults: ParsedQualitativeResult[],
): string {
  const lines: string[] = [];
  lines.push(`LAB REPORT: ${reportName}`);
  lines.push(`Lab: ${vendorLabel}`);
  if (collectionDate) lines.push(`Collected: ${formatDate(collectionDate)}`);
  if (patientName) lines.push(`Patient: ${patientName}`);
  lines.push("");

  const flagged = biomarkers.filter((b) => {
    const f = b.functional_flag || b.conventional_flag;
    return f && f !== "optimal" && f !== "normal";
  });

  if (flagged.length > 0) {
    lines.push("── FLAGGED BIOMARKERS ──");
    for (const b of flagged) {
      const flag = b.functional_flag || b.conventional_flag;
      const range = b.functional_low != null && b.functional_high != null
        ? `functional range: ${b.functional_low}–${b.functional_high} ${b.unit}`
        : b.conventional_low != null && b.conventional_high != null
          ? `range: ${b.conventional_low}–${b.conventional_high} ${b.unit}`
          : "";
      lines.push(`• ${b.biomarker_name}: ${b.value} ${b.unit} [${flag?.toUpperCase()}]${range ? ` (${range})` : ""}`);
      if (b.interpretation) lines.push(`  → ${b.interpretation}`);
    }
    lines.push("");
  }

  const flaggedQual = qualitativeResults.filter((q) => isQualitativeFlagged(q.result, q.reference));
  if (flaggedQual.length > 0) {
    lines.push("── FLAGGED QUALITATIVE ──");
    for (const q of flaggedQual) {
      lines.push(`• ${q.name}: ${q.result} (ref: ${q.reference})`);
    }
    lines.push("");
  }

  const normal = biomarkers.filter((b) => {
    const f = b.functional_flag || b.conventional_flag;
    return !f || f === "optimal" || f === "normal";
  });
  if (normal.length > 0) {
    lines.push("── WITHIN RANGE ──");
    for (const b of normal) {
      lines.push(`• ${b.biomarker_name}: ${b.value} ${b.unit}`);
    }
  }

  return lines.join("\n");
}

// ── Add to Visit Modal ───────────────────────────────────────────────────
interface VisitOption {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string | null;
  objective: string | null;
}

function AddToVisitModal({
  patientId,
  labSummary,
  onClose,
}: {
  patientId: string;
  labSummary: string;
  onClose: () => void;
}) {
  const [visits, setVisits] = useState<VisitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/visits?patient_id=${patientId}&status=draft&limit=10`)
      .then((r) => r.json())
      .then((d) => setVisits(d.visits || []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = async (visit: VisitOption) => {
    setSaving(visit.id);
    const newObjective = visit.objective
      ? `${visit.objective}\n\n---\n${labSummary}`
      : labSummary;
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: newObjective }),
      });
      if (!res.ok) throw new Error("Failed to update visit");
      setSaved(visit.id);
      toast.success("Lab summary added to visit");
    } catch {
      toast.error("Failed to add to visit");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Add to Visit</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Select an open visit to append this lab summary</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : visits.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No open visits for this patient</p>
          ) : (
            <div className="space-y-1">
              {visits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => handleAdd(visit)}
                  disabled={!!saving || saved === visit.id}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all text-left disabled:opacity-60 group"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {new Date(visit.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)] capitalize">{visit.visit_type.replace("_", " ")}</span>
                    </p>
                    {visit.chief_complaint && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate max-w-xs">{visit.chief_complaint}</p>
                    )}
                  </div>
                  {saving === visit.id ? (
                    <Loader2 size={16} className="animate-spin text-[var(--color-brand-600)] flex-shrink-0" />
                  ) : saved === visit.id ? (
                    <Check size={16} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <CalendarPlus size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] flex-shrink-0 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverflowMenu({
  pdfUrl,
  showReparse,
  retrying,
  onReparse,
  archiving,
  isArchived,
  onArchive,
  showDownload,
  onDownload,
  showAddToVisit,
  onAddToVisit,
  reportId,
  showExport,
}: {
  pdfUrl: string | null;
  showReparse: boolean;
  retrying: boolean;
  onReparse: () => void;
  archiving: boolean;
  isArchived: boolean;
  onArchive: () => void;
  showDownload: boolean;
  onDownload: () => void;
  showAddToVisit: boolean;
  onAddToVisit: () => void;
  reportId: string;
  showExport: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const itemClass =
    "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 text-left";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border transition-colors ${
          open
            ? "bg-[var(--color-surface-tertiary)] border-[var(--color-border)] text-[var(--color-text-primary)]"
            : "bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
        }`}
        title="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 py-1 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-lg">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <FileText className="w-4 h-4" />
              View Original PDF
            </a>
          )}

          {showDownload && (
            <button
              onClick={() => { onDownload(); setOpen(false); }}
              className={itemClass}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}

          {showExport && (
            <a
              href={`/api/labs/${reportId}/export`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Printer className="w-4 h-4" />
              Export Report
            </a>
          )}

          {showAddToVisit && (
            <button
              onClick={() => { onAddToVisit(); setOpen(false); }}
              className={itemClass}
            >
              <CalendarPlus className="w-4 h-4" />
              Add to Visit
            </button>
          )}

          {(pdfUrl || showDownload || showAddToVisit) && (showReparse || true) && (
            <div className="my-1 h-px bg-[var(--color-border-light)]" />
          )}

          {showReparse && (
            <button
              onClick={() => { onReparse(); setOpen(false); }}
              disabled={retrying}
              className={itemClass}
            >
              <RefreshCcw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Re-parsing..." : "Re-parse Report"}
            </button>
          )}

          <button
            onClick={() => { onArchive(); setOpen(false); }}
            disabled={archiving}
            className={itemClass}
          >
            {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {isArchived ? "Unarchive" : "Archive"}
          </button>
        </div>
      )}
    </div>
  );
}

export function LabReportDetail({ report: initialReport, biomarkers: initialBiomarkers, pdfUrl: initialPdfUrl, previousValues, fromPatient }: LabReportDetailProps) {
  const [report, setReport] = useState(initialReport);
  const [biomarkers, setBiomarkers] = useState(initialBiomarkers);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [retrying, setRetrying] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddToVisit, setShowAddToVisit] = useState(false);
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

  const handlePushToRecord = useCallback(async () => {
    setPushing(true);
    try {
      const res = await fetch(`/api/labs/${report.id}/push-to-record`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to push to record");
      }
      setPushed(true);
      toast.success("Lab results pushed to patient record");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push to record");
    } finally {
      setPushing(false);
    }
  }, [report.id]);

  const handleCopyToClipboard = useCallback(async () => {
    const qual = (report.parsed_data?.qualitative_results as ParsedQualitativeResult[] | undefined) || [];
    const text = buildClipboardText(
      report.test_name || "Lab Report",
      VENDOR_LABELS[report.lab_vendor] || report.lab_vendor,
      report.collection_date,
      report.patients ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ") : null,
      biomarkers,
      qual,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [report, biomarkers]);

  const handleDownloadPdf = useCallback(() => {
    window.print();
  }, []);

  const patientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  const vendorLabel = VENDOR_LABELS[report.lab_vendor] || report.lab_vendor;
  const { shortName: displayName } = parseTestName(report.test_name);
  const [panelsExpanded, setPanelsExpanded] = useState(true);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [sectionKey, setSectionKey] = useState(0);

  const handleToggleAllSections = useCallback(() => {
    setSectionsExpanded((prev) => !prev);
    setSectionKey((k) => k + 1);
  }, []);

  const isGiMap = report.lab_vendor === "diagnostic_solutions";
  const qualitativeResults = (report.parsed_data?.qualitative_results as ParsedQualitativeResult[] | undefined) || [];
  const panels = buildPanels(biomarkers, vendorLabel, report.collection_date, qualitativeResults, isGiMap, previousValues);
  const totalBiomarkers = biomarkers.length + qualitativeResults.length;
  const flaggedCount = biomarkers.filter((b) => {
    const flag = b.functional_flag || b.conventional_flag;
    return flag && flag !== "optimal" && flag !== "normal";
  }).length + qualitativeResults.filter((q) => isQualitativeFlagged(q.result, q.reference)).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
        {fromPatient ? (
          <>
            <Link
              href={`/patients/${fromPatient.id}?tab=documents`}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {fromPatient.name}
            </Link>
            <span className="text-[var(--color-text-muted)]">&gt;</span>
            <span className="text-[var(--color-text-primary)]">{displayName}</span>
          </>
        ) : (
          <>
            <Link
              href="/labs"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Labs
            </Link>
            <span className="text-[var(--color-text-muted)]">&gt;</span>
            <span className="text-[var(--color-text-primary)]">{displayName}</span>
          </>
        )}
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
            {panels.length > 1 && (
              <div className="mt-2">
                <button
                  onClick={() => setPanelsExpanded(!panelsExpanded)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-full hover:border-[var(--color-brand-200)] hover:text-[var(--color-brand-600)] transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${panelsExpanded ? "rotate-180" : ""}`} />
                  {panels.length} panels included
                </button>
                {panelsExpanded && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {panels.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(slugifyPanel(p.title));
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="px-2 py-0.5 text-xs bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-full border border-[var(--color-border-light)] hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-200)] hover:text-[var(--color-brand-500)] transition-colors cursor-pointer"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <LabStatusBadge status={report.status} />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          {/* Primary actions — always visible */}
          <AssignPatientButton
            labId={report.id}
            currentPatient={report.patients?.id ? { id: report.patients.id, first_name: report.patients.first_name, last_name: report.patients.last_name } : null}
            onAssigned={(p) => setReport((prev) => ({ ...prev, patients: p ? { ...p, date_of_birth: null, sex: null } : null, patient_id: p?.id ?? null }))}
            variant="button"
          />

          {report.status === "complete" && report.patients && (
            <button
              onClick={handlePushToRecord}
              disabled={pushing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50"
            >
              {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {pushed ? "Update Record" : "Push to Record"}
            </button>
          )}

          {report.status === "complete" && totalBiomarkers > 0 && (
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          )}

          {/* Overflow menu */}
          <OverflowMenu
            pdfUrl={pdfUrl}
            showReparse={report.status === "complete"}
            retrying={retrying}
            onReparse={handleRetry}
            archiving={archiving}
            isArchived={isArchived}
            onArchive={handleArchive}
            showDownload={report.status === "complete" && totalBiomarkers > 0}
            onDownload={handleDownloadPdf}
            showAddToVisit={report.status === "complete" && !!report.patient_id && totalBiomarkers > 0}
            onAddToVisit={() => setShowAddToVisit(true)}
            reportId={report.id}
            showExport={report.status === "complete" && totalBiomarkers > 0}
          />
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {totalBiomarkers} biomarker{totalBiomarkers !== 1 ? "s" : ""}
            {flaggedCount > 0 && (
              <> &middot; <span className="text-[var(--color-biomarker-borderline)] font-medium">{flaggedCount} flagged</span></>
            )}
          </p>
          {panels.length > 1 && (
            <button
              onClick={handleToggleAllSections}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-full hover:border-[var(--color-brand-200)] hover:text-[var(--color-brand-600)] transition-colors"
            >
              {sectionsExpanded ? (
                <ChevronsDownUp className="w-3 h-3" />
              ) : (
                <ChevronsUpDown className="w-3 h-3" />
              )}
              {sectionsExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
      )}

      {/* Biomarker panels */}
      {report.status === "complete" && panels.length > 0 && (
        <div className="space-y-4">
          {panels.map((panel, idx) => (
            <BiomarkerPanel key={`${panel.title}-${idx}-${sectionKey}`} panel={panel} id={slugifyPanel(panel.title)} initialExpanded={sectionsExpanded} />
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

      {/* Add to Visit modal */}
      {showAddToVisit && report.patient_id && (
        <AddToVisitModal
          patientId={report.patient_id}
          labSummary={buildClipboardText(
            report.test_name || "Lab Report",
            VENDOR_LABELS[report.lab_vendor] || report.lab_vendor,
            report.collection_date,
            patientName,
            biomarkers,
            (report.parsed_data?.qualitative_results as ParsedQualitativeResult[] | undefined) || [],
          )}
          onClose={() => setShowAddToVisit(false)}
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not([data-print-target]) { display: none !important; }
          nav, aside, header, footer, button, a { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

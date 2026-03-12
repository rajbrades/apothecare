"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, FlaskConical, Upload, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FullscriptStubButton } from "./fullscript-stub-button";
import { EvidenceBadge, type EvidenceLevel, type Citation } from "@/components/chat/evidence-badge";
import type { SupplementReviewItem, SupplementAction, InteractionSeverity, PatientSupplement } from "@/types/database";

/** Editable fields for a "modify" supplement */
export interface FieldEdits {
  dosage?: string;
  form?: string;
  timing?: string;
  brand?: string;
}

/** Conflict between review recommendation and existing patient record */
interface FieldConflict {
  supplementName: string;
  field: string;
  existing: string;
  recommended: string;
}

interface SupplementReviewDetailProps {
  review: {
    id?: string;
    status: string;
    review_data: {
      items: SupplementReviewItem[];
      additions: SupplementReviewItem[];
      summary: string;
    } | null;
    created_at: string;
    pushed_at?: string | null;
  };
  patientName: string;
  patientId?: string;
}

const ACTION_BADGE_CONFIG: Record<
  SupplementAction,
  { label: string; className: string }
> = {
  keep: {
    label: "Keep",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  modify: {
    label: "Modify",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  discontinue: {
    label: "Discontinue",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  add: {
    label: "Add",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

/** Map supplement underscore-format evidence levels to shared EvidenceBadge levels */
const EVIDENCE_LEVEL_MAP: Record<string, EvidenceLevel> = {
  meta_analysis: "meta-analysis",
  rct: "rct",
  cohort_study: "cohort",
  case_study: "case-study",
  clinical_guideline: "guideline",
  expert_consensus: "case-study",
  in_vitro: "case-study",
  other: "case-study",
};

/** Map supplement evidence level keys to display labels for the popover */
const EVIDENCE_LABEL_MAP: Record<string, string> = {
  meta_analysis: "META",
  rct: "RCT",
  cohort_study: "COHORT",
  case_study: "CASE",
  clinical_guideline: "GUIDELINE",
  expert_consensus: "CONSENSUS",
  in_vitro: "IN VITRO",
  other: "OTHER",
};

const SEVERITY_STYLES: Record<InteractionSeverity, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  caution: "bg-amber-50 border-amber-200 text-amber-800",
  safe: "bg-emerald-50 border-emerald-200 text-emerald-700",
  unknown: "bg-gray-50 border-gray-200 text-gray-700",
};

const ACTION_OPTIONS: SupplementAction[] = ["keep", "modify", "discontinue", "add"];

function ActionBadge({
  currentAction,
  originalAction,
  onActionChange,
}: {
  currentAction: SupplementAction;
  originalAction: SupplementAction;
  onActionChange?: (action: SupplementAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const config = ACTION_BADGE_CONFIG[currentAction] || ACTION_BADGE_CONFIG.keep;
  const isOverridden = currentAction !== originalAction;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!onActionChange) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border rounded-[var(--radius-sm)] flex-shrink-0 ${config.className}`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border rounded-[var(--radius-sm)] cursor-pointer hover:opacity-80 transition-opacity ${config.className} ${isOverridden ? "ring-1 ring-offset-1 ring-[var(--color-brand-300)]" : ""}`}
        title="Click to change action"
      >
        {config.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] py-1 min-w-[120px]">
          {ACTION_OPTIONS.map((action) => {
            const opt = ACTION_BADGE_CONFIG[action];
            const isActive = action === currentAction;
            return (
              <button
                key={action}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onActionChange(action);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${isActive ? "bg-[var(--color-surface-secondary)] font-medium" : "hover:bg-[var(--color-surface-secondary)]"}`}
              >
                <span className={`inline-flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full border ${opt.className}`} />
                  {opt.label}
                  {action === originalAction && action !== currentAction && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">(AI)</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupplementItemCard({
  item,
  actionOverride,
  onActionChange,
  fieldEdits,
  onFieldEditsChange,
  existingSupplement,
}: {
  item: SupplementReviewItem;
  actionOverride?: SupplementAction;
  onActionChange?: (name: string, action: SupplementAction) => void;
  fieldEdits?: FieldEdits;
  onFieldEditsChange?: (name: string, edits: FieldEdits) => void;
  existingSupplement?: PatientSupplement | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [badgeHovered, setBadgeHovered] = useState(false);
  const currentAction = actionOverride || item.action;
  const isModify = currentAction === "modify";

  // Auto-expand when switching to modify
  useEffect(() => {
    if (isModify) setExpanded(true);
  }, [isModify]);

  const hasDetails =
    item.recommended_dosage ||
    item.recommended_form ||
    item.recommended_timing ||
    item.recommended_duration ||
    item.recommended_brand ||
    (item.interactions && item.interactions.length > 0) ||
    (item.biomarker_correlations && item.biomarker_correlations.length > 0);

  return (
    <div className={`relative border rounded-[var(--radius-md)] bg-[var(--color-surface)] overflow-visible ${badgeHovered ? "z-40" : ""} ${currentAction === "discontinue" ? "border-red-200" : "border-[var(--color-border-light)]"}`}>
      {/* Always visible header */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full text-left p-4 ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={hasDetails ? expanded : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            {hasDetails && (
              <span className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)]">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            )}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${currentAction === "discontinue" ? "text-red-700 line-through" : "text-[var(--color-text-primary)]"}`}>
                {item.name}
              </p>
              {item.current_dosage && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Current: {item.current_dosage}
                </p>
              )}
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                {item.rationale}
              </p>
              {/* Evidence badges — verified citations (new) or legacy fallback */}
              {(() => {
                const citations: Citation[] = [];

                if (item.verified_citations && item.verified_citations.length > 0) {
                  // New: up to 3 verified citations from CrossRef/PubMed/curated DB
                  for (const vc of item.verified_citations) {
                    const level = EVIDENCE_LEVEL_MAP[vc.evidence_level] || "case-study";
                    citations.push({
                      level,
                      label: EVIDENCE_LABEL_MAP[vc.evidence_level] || vc.evidence_level.toUpperCase(),
                      title: vc.title,
                      authors: vc.authors,
                      year: vc.year,
                      source: vc.source,
                      doi: vc.doi,
                      summary: item.rationale,
                    });
                  }
                } else if (item.evidence_level) {
                  // Legacy fallback for existing reviews without verified_citations
                  const level = EVIDENCE_LEVEL_MAP[item.evidence_level] || "case-study";
                  citations.push({
                    level,
                    label: EVIDENCE_LABEL_MAP[item.evidence_level] || item.evidence_level.toUpperCase(),
                    title: item.name,
                    doi: item.evidence_doi,
                    summary: item.rationale,
                  });
                }

                if (citations.length === 0) return null;

                return (
                  <span
                    className="mt-1.5 inline-flex flex-wrap gap-1"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setBadgeHovered(true)}
                    onMouseLeave={() => setBadgeHovered(false)}
                  >
                    {citations.map((citation, i) => (
                      <EvidenceBadge
                        key={`${citation.doi || citation.title}-${i}`}
                        citation={citation}
                        index={citations.length > 1 ? i + 1 : undefined}
                      />
                    ))}
                  </span>
                );
              })()}
            </div>
          </div>
          <ActionBadge
            currentAction={currentAction}
            originalAction={item.action}
            onActionChange={
              onActionChange
                ? (action) => onActionChange(item.name, action)
                : undefined
            }
          />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--color-border-light)]">
          {/* Modify mode: editable fields with existing-value comparison */}
          {isModify && onFieldEditsChange ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                <Pencil className="w-3 h-3" />
                Edit fields before pushing
              </div>

              {/* Show existing patient values if they differ */}
              {existingSupplement && (
                <div className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-[var(--radius-sm)]">
                  <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1.5">
                    Current Patient Record
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-amber-800">
                    {existingSupplement.dosage && (
                      <span>Dosage: {existingSupplement.dosage}</span>
                    )}
                    {existingSupplement.form && (
                      <span>Form: {existingSupplement.form}</span>
                    )}
                    {existingSupplement.timing && (
                      <span>Timing: {existingSupplement.timing}</span>
                    )}
                    {existingSupplement.brand && (
                      <span>Brand: {existingSupplement.brand}</span>
                    )}
                    {!existingSupplement.dosage && !existingSupplement.form && !existingSupplement.timing && !existingSupplement.brand && (
                      <span className="col-span-2 text-amber-600 italic">No details on file</span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={fieldEdits?.dosage ?? item.recommended_dosage ?? ""}
                    onChange={(e) =>
                      onFieldEditsChange(item.name, {
                        ...fieldEdits,
                        dosage: e.target.value,
                      })
                    }
                    placeholder="e.g., 400mg"
                    className="mt-0.5 w-full px-2 py-1.5 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Form
                  </label>
                  <input
                    type="text"
                    value={fieldEdits?.form ?? item.recommended_form ?? ""}
                    onChange={(e) =>
                      onFieldEditsChange(item.name, {
                        ...fieldEdits,
                        form: e.target.value,
                      })
                    }
                    placeholder="e.g., capsule"
                    className="mt-0.5 w-full px-2 py-1.5 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Timing
                  </label>
                  <input
                    type="text"
                    value={fieldEdits?.timing ?? item.recommended_timing ?? ""}
                    onChange={(e) =>
                      onFieldEditsChange(item.name, {
                        ...fieldEdits,
                        timing: e.target.value,
                      })
                    }
                    placeholder="e.g., with meals"
                    className="mt-0.5 w-full px-2 py-1.5 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={fieldEdits?.brand ?? item.recommended_brand ?? ""}
                    onChange={(e) =>
                      onFieldEditsChange(item.name, {
                        ...fieldEdits,
                        brand: e.target.value,
                      })
                    }
                    placeholder="e.g., Pure Encapsulations"
                    className="mt-0.5 w-full px-2 py-1.5 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] transition-colors"
                  />
                </div>
              </div>

              {item.recommended_duration && (
                <div>
                  <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                    {item.recommended_duration}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Read-only mode for keep/add/discontinue */
            <>
              {(item.recommended_dosage ||
                item.recommended_form ||
                item.recommended_timing ||
                item.recommended_duration) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {item.recommended_dosage && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Dosage
                      </p>
                      <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                        {item.recommended_dosage}
                      </p>
                    </div>
                  )}
                  {item.recommended_form && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Form
                      </p>
                      <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                        {item.recommended_form}
                      </p>
                    </div>
                  )}
                  {item.recommended_timing && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Timing
                      </p>
                      <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                        {item.recommended_timing}
                      </p>
                    </div>
                  )}
                  {item.recommended_duration && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Duration
                      </p>
                      <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                        {item.recommended_duration}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {item.recommended_brand && (
                <div className="mt-2">
                  <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    Recommended Brand
                  </p>
                  <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                    {item.recommended_brand}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Interaction warnings */}
          {item.interactions && item.interactions.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Interaction Warnings
              </p>
              {item.interactions.map((warning, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-[var(--radius-sm)] border text-xs leading-relaxed ${
                    SEVERITY_STYLES[warning.severity] || SEVERITY_STYLES.unknown
                  }`}
                >
                  <p className="font-medium mb-0.5">
                    {warning.substance_a} &rarr; {warning.substance_b}
                  </p>
                  <p>{warning.mechanism}</p>
                  {warning.recommendation && (
                    <p className="mt-1 opacity-80">
                      {warning.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Biomarker correlations */}
          {item.biomarker_correlations &&
            item.biomarker_correlations.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <FlaskConical className="w-3 h-3" />
                  Biomarker Correlations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.biomarker_correlations.map((biomarker) => (
                    <span
                      key={biomarker}
                      className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] rounded-[var(--radius-sm)]"
                    >
                      {biomarker}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Fullscript button */}
          <div className="mt-3 pt-2 border-t border-[var(--color-border-light)]">
            <FullscriptStubButton supplementName={item.name} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Build list of field conflicts between review items and existing patient supplements */
function detectConflicts(
  allItems: SupplementReviewItem[],
  actionOverrides: Record<string, SupplementAction>,
  fieldEditsMap: Record<string, FieldEdits>,
  existingMap: Map<string, PatientSupplement>
): FieldConflict[] {
  const conflicts: FieldConflict[] = [];

  for (const item of allItems) {
    const key = item.name.trim().toLowerCase();
    const action = actionOverrides[key] || item.action;
    if (action !== "modify" && action !== "keep") continue;

    const existing = existingMap.get(key);
    if (!existing) continue;

    const edits = fieldEditsMap[key];

    const pairs: { field: string; existing: string | null; recommended: string }[] = [
      { field: "Dosage", existing: existing.dosage, recommended: edits?.dosage ?? item.recommended_dosage ?? "" },
      { field: "Form", existing: existing.form, recommended: edits?.form ?? item.recommended_form ?? "" },
      { field: "Timing", existing: existing.timing, recommended: edits?.timing ?? item.recommended_timing ?? "" },
      { field: "Brand", existing: existing.brand, recommended: edits?.brand ?? item.recommended_brand ?? "" },
    ];

    for (const p of pairs) {
      if (!p.recommended) continue; // nothing to push
      if (!p.existing) continue; // no existing value to conflict with
      if (p.existing.trim().toLowerCase() === p.recommended.trim().toLowerCase()) continue;
      conflicts.push({
        supplementName: item.name,
        field: p.field,
        existing: p.existing,
        recommended: p.recommended,
      });
    }
  }

  return conflicts;
}

export function SupplementReviewDetail({
  review,
  patientName,
  patientId,
}: SupplementReviewDetailProps) {
  const data = review.review_data;
  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(!!review.pushed_at);
  const [actionOverrides, setActionOverrides] = useState<
    Record<string, SupplementAction>
  >({});
  const [fieldEditsMap, setFieldEditsMap] = useState<Record<string, FieldEdits>>({});
  const [existingSupplements, setExistingSupplements] = useState<Map<string, PatientSupplement>>(new Map());
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Fetch existing patient supplements for conflict detection
  useEffect(() => {
    if (!patientId || pushed) return;
    setLoadingExisting(true);
    fetch(`/api/patients/${patientId}/supplements?include_discontinued=true`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        const map = new Map<string, PatientSupplement>();
        for (const sup of json.supplements || []) {
          map.set(sup.name.trim().toLowerCase(), sup);
        }
        setExistingSupplements(map);
      })
      .catch(() => {/* non-critical — conflict warnings just won't show */})
      .finally(() => setLoadingExisting(false));
  }, [patientId, pushed]);

  const handleActionChange = useCallback(
    (name: string, action: SupplementAction) => {
      const key = name.trim().toLowerCase();
      setActionOverrides((prev) => ({ ...prev, [key]: action }));
    },
    []
  );

  const handleFieldEditsChange = useCallback(
    (name: string, edits: FieldEdits) => {
      const key = name.trim().toLowerCase();
      setFieldEditsMap((prev) => ({ ...prev, [key]: edits }));
    },
    []
  );

  const hasOverrides = Object.keys(actionOverrides).length > 0;
  const hasFieldEdits = Object.keys(fieldEditsMap).length > 0;

  // Compute conflicts for push confirmation
  const allItems = [...(data?.items || []), ...(data?.additions || [])];
  const conflicts = detectConflicts(allItems, actionOverrides, fieldEditsMap, existingSupplements);

  const handlePushToPatientFile = async () => {
    if (!patientId || !review.id) return;
    setPushing(true);
    try {
      const body: Record<string, unknown> = { review_id: review.id };
      if (hasOverrides) body.action_overrides = actionOverrides;
      if (hasFieldEdits) body.field_overrides = fieldEditsMap;

      const res = await fetch(`/api/patients/${patientId}/supplements/push-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to push supplements");
      }
      const { results } = await res.json();
      setPushed(true);
      setShowPushConfirm(false);
      toast.success(
        `Pushed ${results.total} supplement${results.total !== 1 ? "s" : ""} to patient file`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Push failed");
    } finally {
      setPushing(false);
    }
  };

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
        No review data available.
      </div>
    );
  }

  const canPush = patientId && review.id && review.status === "complete";

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div className="p-4 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
          <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Summary
          </p>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            {data.summary}
          </p>
        </div>
      )}

      {/* Push to Patient File */}
      {canPush && (
        <div className="flex justify-end">
          {pushed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pushed to Patient File
            </span>
          ) : (
            <button
              onClick={() => setShowPushConfirm(true)}
              disabled={pushing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50"
            >
              {pushing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Push to Patient File
            </button>
          )}
        </div>
      )}

      {/* Current supplements review */}
      {data.items && data.items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Current Supplements ({data.items.length})
          </h3>
          <div className="space-y-2">
            {data.items.map((item, idx) => {
              const key = item.name.trim().toLowerCase();
              return (
                <SupplementItemCard
                  key={`item-${idx}`}
                  item={item}
                  actionOverride={actionOverrides[key]}
                  onActionChange={!pushed ? handleActionChange : undefined}
                  fieldEdits={fieldEditsMap[key]}
                  onFieldEditsChange={!pushed ? handleFieldEditsChange : undefined}
                  existingSupplement={existingSupplements.get(key)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended additions */}
      {data.additions && data.additions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Recommended Additions ({data.additions.length})
          </h3>
          <div className="space-y-2">
            {data.additions.map((item, idx) => {
              const key = item.name.trim().toLowerCase();
              return (
                <SupplementItemCard
                  key={`addition-${idx}`}
                  item={item}
                  actionOverride={actionOverrides[key]}
                  onActionChange={!pushed ? handleActionChange : undefined}
                  fieldEdits={fieldEditsMap[key]}
                  onFieldEditsChange={!pushed ? handleFieldEditsChange : undefined}
                  existingSupplement={existingSupplements.get(key)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Push confirm dialog — with conflict warnings */}
      {showPushConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center animate-[fadeIn_150ms_ease-out]"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPushConfirm(false);
          }}
        >
          <div className="w-full max-w-md mx-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border-light)] animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="p-6">
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] text-center font-[var(--font-display)] mb-1.5">
                Push to Patient File?
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] text-center leading-relaxed">
                This will update the patient&apos;s supplement list based on this review.
              </p>

              {/* Conflict warnings */}
              {conflicts.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)]">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    The following fields will be overwritten:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {conflicts.map((c, i) => (
                      <div key={i} className="text-[11px] text-amber-900 leading-relaxed">
                        <span className="font-medium">{c.supplementName}</span>
                        {" — "}
                        <span className="text-amber-700">{c.field}</span>
                        {": "}
                        <span className="line-through opacity-60">{c.existing}</span>
                        {" → "}
                        <span className="font-medium">{c.recommended}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowPushConfirm(false)}
                disabled={pushing}
                className="flex-1 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-tertiary)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePushToPatientFile}
                disabled={pushing}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors disabled:opacity-50"
              >
                {pushing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {conflicts.length > 0 ? "Push Anyway" : "Push to Patient File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

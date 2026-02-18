"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, FlaskConical } from "lucide-react";
import { FullscriptStubButton } from "./fullscript-stub-button";
import type { SupplementReviewItem, SupplementAction, InteractionSeverity } from "@/types/database";

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
  };
  patientName: string;
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

const EVIDENCE_LABELS: Record<string, string> = {
  meta_analysis: "Meta-Analysis",
  rct: "RCT",
  cohort_study: "Cohort Study",
  case_study: "Case Study",
  clinical_guideline: "Clinical Guideline",
  expert_consensus: "Expert Consensus",
  in_vitro: "In Vitro",
  other: "Other",
};

const SEVERITY_STYLES: Record<InteractionSeverity, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  caution: "bg-amber-50 border-amber-200 text-amber-800",
  safe: "bg-emerald-50 border-emerald-200 text-emerald-700",
  unknown: "bg-gray-50 border-gray-200 text-gray-700",
};

function SupplementItemCard({ item }: { item: SupplementReviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const actionConfig = ACTION_BADGE_CONFIG[item.action] || ACTION_BADGE_CONFIG.keep;

  const hasDetails =
    item.recommended_dosage ||
    item.recommended_form ||
    item.recommended_timing ||
    item.recommended_duration ||
    item.recommended_brand ||
    (item.interactions && item.interactions.length > 0) ||
    (item.biomarker_correlations && item.biomarker_correlations.length > 0);

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface)]">
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
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
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
              {item.evidence_level && (
                <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)]">
                  {EVIDENCE_LABELS[item.evidence_level] || item.evidence_level}
                </span>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border rounded-[var(--radius-sm)] flex-shrink-0 ${actionConfig.className}`}
          >
            {actionConfig.label}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--color-border-light)]">
          {/* Recommended dosage/form/timing/duration */}
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

          {/* Recommended brand */}
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

export function SupplementReviewDetail({
  review,
  patientName,
}: SupplementReviewDetailProps) {
  const data = review.review_data;

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
        No review data available.
      </div>
    );
  }

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

      {/* Current supplements review */}
      {data.items && data.items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Current Supplements ({data.items.length})
          </h3>
          <div className="space-y-2">
            {data.items.map((item, idx) => (
              <SupplementItemCard key={`item-${idx}`} item={item} />
            ))}
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
            {data.additions.map((item, idx) => (
              <SupplementItemCard key={`addition-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

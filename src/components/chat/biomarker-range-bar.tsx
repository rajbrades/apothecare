"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

export type BiomarkerFlag = "optimal" | "normal" | "borderline" | "out-of-range" | "critical";

export interface BiomarkerData {
  /** Biomarker name (e.g. "TSH", "Free T3") */
  name: string;
  /** Measured value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Conventional reference range low */
  conventionalLow: number;
  /** Conventional reference range high */
  conventionalHigh: number;
  /** Functional/optimal range low */
  functionalLow: number;
  /** Functional/optimal range high */
  functionalHigh: number;
  /** Status flag based on functional ranges */
  flag: BiomarkerFlag;
  /** Optional previous value for trend indicator */
  previousValue?: number;
  /** Optional clinical note */
  note?: string;
}

export interface BiomarkerPanelData {
  /** Panel title (e.g. "Thyroid Panel") */
  title: string;
  /** Lab source */
  labSource?: string;
  /** Collection date */
  collectedDate?: string;
  /** Number of flagged biomarkers */
  flagCount?: number;
  /** Individual biomarker readings */
  biomarkers: BiomarkerData[];
}

const FLAG_COLORS: Record<BiomarkerFlag, string> = {
  optimal: "var(--color-biomarker-optimal)",
  normal: "var(--color-biomarker-normal)",
  borderline: "var(--color-biomarker-borderline)",
  "out-of-range": "var(--color-biomarker-out-of-range)",
  critical: "var(--color-biomarker-critical)",
};

const FLAG_LABELS: Record<BiomarkerFlag, string> = {
  optimal: "Optimal",
  normal: "Normal",
  borderline: "Borderline",
  "out-of-range": "Out of Range",
  critical: "Critical",
};

/** Returns a directional prefix for accessibility (e.g. "↑" for high, "↓" for low, "✓" for optimal) */
function flagPrefix(flag: BiomarkerFlag, value: number, functionalLow: number, functionalHigh: number): string {
  if (flag === "optimal" || flag === "normal") return "\u2713";
  const midpoint = (functionalLow + functionalHigh) / 2;
  return value >= midpoint ? "\u2191" : "\u2193";
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const pctChange = Math.abs((diff / previous) * 100);

  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]">
        <Minus size={10} />
        stable
      </span>
    );
  }

  const isUp = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] ${
        isUp ? "text-[var(--color-biomarker-out-of-range)]" : "text-[var(--color-biomarker-optimal)]"
      }`}
    >
      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pctChange.toFixed(1)}%
    </span>
  );
}

interface BiomarkerRangeBarProps {
  biomarker: BiomarkerData;
  /** Whether to animate the bar on mount */
  animate?: boolean;
}

export function BiomarkerRangeBar({ biomarker, animate = true }: BiomarkerRangeBarProps) {
  const {
    name,
    value,
    unit,
    conventionalLow,
    conventionalHigh,
    functionalLow,
    functionalHigh,
    flag,
    previousValue,
    note,
  } = biomarker;

  const [showNote, setShowNote] = useState(false);
  const flagColor = FLAG_COLORS[flag];

  // Calculate the visual range - extend beyond conventional range for context
  const rangeMin = Math.min(conventionalLow * 0.3, functionalLow * 0.3, 0);
  const rangeMax = Math.max(conventionalHigh * 1.5, functionalHigh * 1.5);
  const span = rangeMax - rangeMin;

  // Position calculations as percentages
  const valuePercent = Math.min(Math.max(((value - rangeMin) / span) * 100, 2), 98);
  const conventionalLeftPct = ((conventionalLow - rangeMin) / span) * 100;
  const conventionalWidthPct = ((conventionalHigh - conventionalLow) / span) * 100;
  const functionalLeftPct = ((functionalLow - rangeMin) / span) * 100;
  const functionalWidthPct = ((functionalHigh - functionalLow) / span) * 100;

  return (
    <div className="py-3 border-b border-[var(--color-border-light)] last:border-0 biomarker-row-entrance">
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {name}
          </span>
          {previousValue !== undefined && (
            <TrendIndicator current={value} previous={previousValue} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-[var(--font-mono)] font-medium tabular-nums"
            style={{ color: flagColor }}
          >
            {value} <span className="text-[11px] opacity-70">{unit}</span>
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{
              color: flagColor,
              backgroundColor: `color-mix(in srgb, ${flagColor} 12%, transparent)`,
            }}
          >
            {flagPrefix(flag, value, functionalLow, functionalHigh)} {FLAG_LABELS[flag]}
          </span>
        </div>
      </div>

      {/* Dual range bar */}
      <div className="relative h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-visible">
        {/* Conventional range zone (lighter, wider) */}
        <div
          className="absolute h-full rounded-full opacity-30"
          style={{
            left: `${conventionalLeftPct}%`,
            width: animate ? `${conventionalWidthPct}%` : `${conventionalWidthPct}%`,
            backgroundColor: "var(--color-biomarker-normal)",
            animation: animate ? "range-bar-fill 0.8s ease-out" : undefined,
          }}
        />

        {/* Functional optimal range zone (brighter, narrower) */}
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${functionalLeftPct}%`,
            width: animate ? `${functionalWidthPct}%` : `${functionalWidthPct}%`,
            backgroundColor: "var(--color-brand-200)",
            animation: animate ? "range-bar-fill 0.8s ease-out 0.15s backwards" : undefined,
          }}
        />

        {/* Value marker */}
        <div
          className="absolute w-3 h-3 rounded-full top-[-2px] border-2 border-white biomarker-marker-entrance"
          style={{
            left: `${valuePercent}%`,
            transform: "translateX(-50%)",
            backgroundColor: flagColor,
            boxShadow: `0 1px 4px ${flagColor}40, 0 0 0 1px ${flagColor}20`,
          }}
        />

        {/* Previous value ghost marker */}
        {previousValue !== undefined && (
          <div
            className="absolute w-2 h-2 rounded-full top-0 opacity-30"
            style={{
              left: `${Math.min(
                Math.max(((previousValue - rangeMin) / span) * 100, 2),
                98
              )}%`,
              transform: "translateX(-50%)",
              backgroundColor: flagColor,
            }}
            title={`Previous: ${previousValue} ${unit}`}
          />
        )}
      </div>

      {/* Range labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
          <span className="text-[var(--color-brand-500)]">Functional</span>{" "}
          {functionalLow}&ndash;{functionalHigh}
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
          <span className="opacity-60">Conventional</span>{" "}
          {conventionalLow}&ndash;{conventionalHigh}
        </span>
      </div>

      {/* Clinical note (expandable) */}
      {note && (
        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-1 mt-1.5 text-[11px] text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
        >
          {showNote ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Clinical note
        </button>
      )}
      {note && showNote && (
        <p className="mt-1.5 text-[12px] text-[var(--color-text-secondary)] leading-relaxed pl-3 border-l-2 border-[var(--color-brand-200)] animate-evidence-expand">
          {note}
        </p>
      )}
    </div>
  );
}

/** Full biomarker panel card for embedding in chat messages */
interface BiomarkerPanelProps {
  panel: BiomarkerPanelData;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function BiomarkerPanel({ panel, compact = false }: BiomarkerPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const flaggedCount =
    panel.flagCount ??
    panel.biomarkers.filter((b) => b.flag !== "optimal" && b.flag !== "normal").length;

  return (
    <div className="rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden bg-[var(--color-surface)] my-3 biomarker-panel-entrance">
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3.5 border-b border-[var(--color-border-light)] bg-gradient-to-r from-[var(--color-brand-50)] to-[var(--color-surface-secondary)] flex items-center justify-between hover:from-[var(--color-brand-100)] hover:to-[var(--color-surface-tertiary)] transition-all"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-1 h-8 rounded-full bg-[var(--color-brand-400)] flex-shrink-0" />
          <div>
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--color-text-primary)] font-[var(--font-display)]">
              {panel.title}
            </h3>
            {(panel.labSource || panel.collectedDate) && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {panel.labSource}
                {panel.labSource && panel.collectedDate && " \u00B7 "}
                {panel.collectedDate}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {flaggedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-biomarker-borderline)]/10">
              <span className="w-2 h-2 rounded-full bg-[var(--color-biomarker-borderline)]" />
              <span className="text-[11px] font-medium text-[var(--color-biomarker-borderline)]">
                {flaggedCount} {flaggedCount === 1 ? "flag" : "flags"}
              </span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp size={16} className="text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
          )}
        </div>
      </button>

      {/* Biomarker rows */}
      {isExpanded && (
        <div className="px-4 py-1">
          {panel.biomarkers.map((biomarker) => (
            <BiomarkerRangeBar
              key={biomarker.name}
              biomarker={biomarker}
            />
          ))}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 py-2.5 border-t border-[var(--color-border-light)] mt-1">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              Legend:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-1.5 rounded-full bg-[var(--color-brand-200)]" />
              <span className="text-[10px] text-[var(--color-text-muted)]">Functional optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-1.5 rounded-full bg-[var(--color-biomarker-normal)] opacity-30" />
              <span className="text-[10px] text-[var(--color-text-muted)]">Conventional range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm bg-[var(--color-text-muted)]" />
              <span className="text-[10px] text-[var(--color-text-muted)]">Your value</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

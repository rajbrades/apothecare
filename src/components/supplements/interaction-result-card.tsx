"use client";

import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import type { InteractionResult } from "@/types/database";

interface InteractionResultCardProps {
  interaction: InteractionResult;
}

const SEVERITY_CONFIG: Record<
  string,
  {
    bg: string;
    border: string;
    badgeClass: string;
    badgeLabel: string;
    Icon: typeof AlertTriangle;
    iconColor: string;
  }
> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    badgeLabel: "CRITICAL",
    Icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  caution: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    badgeLabel: "CAUTION",
    Icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  safe: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    badgeLabel: "SAFE",
    Icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  unknown: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
    badgeLabel: "UNKNOWN",
    Icon: HelpCircle,
    iconColor: "text-gray-500",
  },
};

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  drug_supplement: "Drug-Supplement",
  supplement_supplement: "Supplement-Supplement",
  supplement_condition: "Supplement-Condition",
};

export function InteractionResultCard({
  interaction,
}: InteractionResultCardProps) {
  const config = SEVERITY_CONFIG[interaction.severity] || SEVERITY_CONFIG.unknown;
  const { Icon } = config;

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-[var(--radius-md)] p-4`}
    >
      {/* Header: severity badge + substances */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {interaction.substance_a}
              <span className="mx-1.5 text-[var(--color-text-muted)]">
                &rarr;
              </span>
              {interaction.substance_b}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide border rounded-[var(--radius-sm)] flex-shrink-0 ${config.badgeClass}`}
        >
          {config.badgeLabel}
        </span>
      </div>

      {/* Interaction type tag */}
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)]">
          {INTERACTION_TYPE_LABELS[interaction.interaction_type] ||
            interaction.interaction_type}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        {interaction.mechanism && (
          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              Mechanism
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {interaction.mechanism}
            </p>
          </div>
        )}

        {interaction.clinical_significance && (
          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              Clinical Significance
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {interaction.clinical_significance}
            </p>
          </div>
        )}

        {interaction.recommendation && (
          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              Recommendation
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {interaction.recommendation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

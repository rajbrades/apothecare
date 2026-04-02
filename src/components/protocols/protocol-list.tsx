"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProtocolListItem, ProtocolStatus } from "@/types/protocol";
import { FOCUS_AREAS, type FocusAreaKey } from "@/types/protocol";

// ── Status badge config ────────────────────────────────────────────

const STATUS_STYLES: Record<
  ProtocolStatus,
  { bg: string; text: string; label: string; dot: string }
> = {
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Draft",
    dot: "bg-gray-400",
  },
  active: {
    bg: "bg-[var(--color-brand-50)]",
    text: "text-[var(--color-brand-700)]",
    label: "Active",
    dot: "bg-[var(--color-brand-500)]",
  },
  completed: {
    bg: "bg-[var(--color-brand-600)]/10",
    text: "text-[var(--color-brand-600)]",
    label: "Completed",
    dot: "bg-[var(--color-brand-600)]",
  },
  archived: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    label: "Archived",
    dot: "bg-gray-300",
  },
};

// ── Focus area label lookup ────────────────────────────────────────

const FOCUS_LABEL_MAP = new Map(
  FOCUS_AREAS.map((a) => [a.key, a.label])
);

function focusLabel(key: string): string {
  return FOCUS_LABEL_MAP.get(key as FocusAreaKey) || key;
}

// ── Format date ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Props ──────────────────────────────────────────────────────────

interface ProtocolListProps {
  protocols: ProtocolListItem[];
  patientId: string;
}

// ── Component ──────────────────────────────────────────────────────

export function ProtocolList({ protocols, patientId }: ProtocolListProps) {
  if (protocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
          <ClipboardList className="w-6 h-6 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
          No treatment protocols yet
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
          Generate an AI-powered multi-phase treatment protocol tailored to this
          patient&apos;s clinical profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {protocols.map((protocol) => {
        const status =
          STATUS_STYLES[protocol.status] || STATUS_STYLES.draft;
        const phaseCount = protocol.phase_count ?? 0;
        const activePhase = protocol.active_phase_number ?? 0;

        return (
          <Link
            key={protocol.id}
            href={`/patients/${patientId}/protocols/${protocol.id}`}
            className="group flex items-center gap-3 px-4 py-3 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-card)] hover:shadow-md hover:border-[var(--color-brand-400)]/40 transition-all"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-600)] transition-colors">
                  {protocol.title}
                </h4>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                    status.bg,
                    status.text
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      status.dot
                    )}
                  />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                {/* Focus area tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  {protocol.focus_areas.slice(0, 3).map((key) => (
                    <span
                      key={key}
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]/50"
                    >
                      {focusLabel(key)}
                    </span>
                  ))}
                  {protocol.focus_areas.length > 3 && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      +{protocol.focus_areas.length - 3}
                    </span>
                  )}
                </div>

                <span className="text-[var(--color-border)]">|</span>

                {/* Date */}
                <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                  <Clock className="w-3 h-3" />
                  {formatDate(protocol.created_at)}
                </span>
              </div>

              {/* Phase progress */}
              {phaseCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: phaseCount }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-6 h-1 rounded-full transition-colors",
                          i + 1 < activePhase
                            ? "bg-[var(--color-brand-600)]"
                            : i + 1 === activePhase
                            ? "bg-[var(--color-brand-500)]"
                            : "bg-[var(--color-surface-tertiary)]"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Phase {activePhase || "--"} of {phaseCount}
                  </span>
                </div>
              )}
            </div>

            {/* Chevron */}
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

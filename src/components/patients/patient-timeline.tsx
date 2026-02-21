"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  FlaskConical,
  Stethoscope,
  Pill,
  Flag,
  MessageCircle,
  Brain,
  Activity,
  Loader2,
  Clock,
} from "lucide-react";
import { useTimeline } from "@/hooks/use-timeline";
import type { TimelineEvent, TimelineFilters } from "@/hooks/use-timeline";
import type { TimelineEventType } from "@/lib/validations/timeline";

// ── Constants ─────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  TimelineEventType,
  { label: string; icon: typeof FlaskConical; accentColor: string; bgColor: string }
> = {
  lab_result: {
    label: "Lab Result",
    icon: FlaskConical,
    accentColor: "var(--color-brand-600)",
    bgColor: "var(--color-brand-50)",
  },
  visit: {
    label: "Visit",
    icon: Stethoscope,
    accentColor: "#3b82f6",
    bgColor: "#eff6ff",
  },
  supplement_start: {
    label: "Supplement Started",
    icon: Pill,
    accentColor: "#f59e0b",
    bgColor: "#fffbeb",
  },
  supplement_stop: {
    label: "Supplement Stopped",
    icon: Pill,
    accentColor: "#ef4444",
    bgColor: "#fef2f2",
  },
  supplement_dose_change: {
    label: "Dose Changed",
    icon: Pill,
    accentColor: "#f59e0b",
    bgColor: "#fffbeb",
  },
  symptom_log: {
    label: "Symptom",
    icon: Activity,
    accentColor: "#6366f1",
    bgColor: "#eef2ff",
  },
  protocol_milestone: {
    label: "Milestone",
    icon: Flag,
    accentColor: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
  patient_reported: {
    label: "Patient Reported",
    icon: MessageCircle,
    accentColor: "var(--color-text-secondary)",
    bgColor: "var(--color-surface-secondary)",
  },
  ai_insight: {
    label: "AI Insight",
    icon: Brain,
    accentColor: "var(--color-brand-400)",
    bgColor: "var(--color-brand-50)",
  },
};

const FILTER_TYPES: TimelineEventType[] = [
  "lab_result",
  "visit",
  "supplement_start",
  "supplement_stop",
  "supplement_dose_change",
  "protocol_milestone",
  "symptom_log",
  "patient_reported",
  "ai_insight",
];

// ── Helpers ───────────────────────────────────────────────────────────

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthGroup(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function groupByMonth(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const key = formatMonthGroup(event.event_date);
    const group = groups.get(key) || [];
    group.push(event);
    groups.set(key, group);
  }
  return groups;
}

// ── FilterBar ─────────────────────────────────────────────────────────

function TimelineFilterBar({
  excludedTypes,
  onToggleType,
}: {
  excludedTypes: Set<TimelineEventType>;
  onToggleType: (type: TimelineEventType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {FILTER_TYPES.map((type) => {
        const config = EVENT_CONFIG[type];
        const isActive = !excludedTypes.has(type);
        return (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? "border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent hover:border-[var(--color-brand-500)]"
                : "border border-[var(--color-border-light)] text-[var(--color-text-muted)] bg-transparent opacity-50"
            }`}
            title={isActive ? `Hide ${config.label} events` : `Show ${config.label} events`}
          >
            <config.icon
              className="w-3 h-3"
              style={{ color: isActive ? config.accentColor : undefined }}
            />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  const config = EVENT_CONFIG[event.event_type];
  const Icon = config.icon;
  const detail = event.detail as Record<string, unknown>;

  return (
    <div
      className="flex items-start gap-3 py-4 border-b border-[var(--color-border-light)] last:border-b-0"
      role="article"
      aria-label={`${config.label}: ${event.title}`}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: config.bgColor, color: config.accentColor }}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">
            {event.title}
          </h4>
          <span className="flex-shrink-0 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            {relativeTime(event.event_date)}
          </span>
        </div>

        {event.summary && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
            {event.summary}
          </p>
        )}

        {/* Inline metadata */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {/* Lab-specific: flagged count */}
          {event.event_type === "lab_result" && detail.flagged_count ? (
            <>
              <span className="text-xs font-medium text-amber-700">
                {String(detail.flagged_count)} flagged
              </span>
              <span className="text-[var(--color-text-muted)]">&middot;</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {String(detail.biomarker_count)} biomarkers
              </span>
            </>
          ) : null}

          {/* Visit-specific: visit type */}
          {event.event_type === "visit" && detail.visit_type ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              {String(detail.visit_type).replace("_", " ")}
            </span>
          ) : null}

          {/* Body systems as inline text */}
          {event.body_systems && event.body_systems.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {event.body_systems.join(" \u00b7 ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DateGroup ─────────────────────────────────────────────────────────

function TimelineDateGroup({
  month,
  events,
}: {
  month: string;
  events: TimelineEvent[];
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {month}
        </h3>
        <div className="flex-1 h-px bg-[var(--color-border-light)]" />
      </div>
      <div>
        {events.map((event) => (
          <TimelineEventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ── LoadMoreTrigger ───────────────────────────────────────────────────

function LoadMoreTrigger({ onIntersect }: { onIntersect: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersectRef.current();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="h-1" />;
}

// ── Main Component ────────────────────────────────────────────────────

interface PatientTimelineProps {
  patientId: string;
}

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const [excludedTypes, setExcludedTypes] = useState<Set<TimelineEventType>>(new Set());

  const {
    events,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    loadMore,
  } = useTimeline(patientId);

  const handleToggleType = useCallback((type: TimelineEventType) => {
    setExcludedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      // Update the API filter to only include non-excluded types
      const activeTypes = FILTER_TYPES.filter((t) => !next.has(t));
      // If all are active, send empty array (meaning "all")
      setFilters({
        ...filters,
        eventTypes: activeTypes.length === FILTER_TYPES.length ? [] : activeTypes,
      });
      return next;
    });
  }, [filters, setFilters]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const grouped = groupByMonth(events);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-600)]" />
        <span className="ml-2 text-sm text-[var(--color-text-muted)]">
          Loading timeline...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Health Timeline
        </h2>
      </div>

      <TimelineFilterBar excludedTypes={excludedTypes} onToggleType={handleToggleType} />

      {events.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--color-border-light)] rounded-lg">
          <Clock className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            No timeline events yet
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Events will appear as labs are processed and visits are created
          </p>
        </div>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([month, monthEvents]) => (
            <TimelineDateGroup
              key={month}
              month={month}
              events={monthEvents}
            />
          ))}

          {hasMore && <LoadMoreTrigger onIntersect={handleLoadMore} />}

          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-600)]" />
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                Loading more...
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

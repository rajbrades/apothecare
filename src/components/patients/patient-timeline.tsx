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
  FileText,
  Loader2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useTimeline } from "@/hooks/use-timeline";
import type { TimelineEvent, TimelineFilters } from "@/hooks/use-timeline";
import type { TimelineEventType } from "@/lib/validations/timeline";
import type { FMCategory, FMLifeStage } from "@/types/database";

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
  document_upload: {
    label: "Document",
    icon: FileText,
    accentColor: "#64748b",
    bgColor: "#f8fafc",
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
  "document_upload",
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

// ── AI Insight expanded detail ─────────────────────────────────────────

interface AISynthesisDetail {
  summary?: string;
  key_trends?: string[];
  correlations?: string[];
  potential_root_causes?: string[];
  bright_spots?: string[];
  focus_areas?: string[];
  generated_at?: string;
}

const AI_SECTIONS: { key: keyof AISynthesisDetail; label: string }[] = [
  { key: "key_trends", label: "Key Trends" },
  { key: "correlations", label: "Correlations" },
  { key: "potential_root_causes", label: "Potential Root Causes" },
  { key: "bright_spots", label: "Bright Spots" },
  { key: "focus_areas", label: "Focus Areas" },
];

function AIInsightDetail({ detail }: { detail: AISynthesisDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-600)] hover:underline font-medium"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? "Hide details" : "View analysis"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {AI_SECTIONS.map(({ key, label }) => {
            const items = detail[key] as string[] | undefined;
            if (!items?.length) return null;
            return (
              <div key={key}>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">{label}</p>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {detail.generated_at && (
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Generated {new Date(detail.generated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Push to FM Timeline form ───────────────────────────────────────────

const FM_CATEGORIES: { key: FMCategory; label: string; color: string }[] = [
  { key: "antecedent", label: "Antecedent", color: "text-violet-700 bg-violet-50 border-violet-200" },
  { key: "trigger",    label: "Trigger",    color: "text-orange-700 bg-orange-50 border-orange-200" },
  { key: "mediator",   label: "Mediator",   color: "text-amber-700 bg-amber-50 border-amber-200" },
];

const FM_STAGES: { key: FMLifeStage; label: string }[] = [
  { key: "adulthood",   label: "Adulthood" },
  { key: "adolescence", label: "Adolescence" },
  { key: "childhood",   label: "Childhood" },
  { key: "birth",       label: "Birth" },
  { key: "prenatal",    label: "Pre-Birth" },
];

function PushToFMForm({
  event,
  onPush,
  onCancel,
}: {
  event: TimelineEvent;
  onPush: (category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<FMCategory>("trigger");
  const [lifeStage, setLifeStage] = useState<FMLifeStage>("adulthood");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onPush(category, lifeStage);
    setSaving(false);
  };

  return (
    <div
      className="mt-2 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
        Push to FM Timeline
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 italic">&quot;{event.title}&quot;</p>

      {/* Category */}
      <div>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Category</p>
        <div className="flex items-center gap-1">
          {FM_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                category === c.key ? c.color : "border-transparent text-[var(--color-text-muted)] bg-transparent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Life stage */}
      <div>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Life Stage</p>
        <select
          value={lifeStage}
          onChange={(e) => setLifeStage(e.target.value as FMLifeStage)}
          className="w-full text-xs px-2 py-1 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
        >
          {FM_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Push
        </button>
      </div>
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────

function TimelineEventRow({
  event,
  onPushToFMTimeline,
}: {
  event: TimelineEvent;
  onPushToFMTimeline?: (event: TimelineEvent, category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
}) {
  const config = EVENT_CONFIG[event.event_type];
  const Icon = config.icon;
  const detail = event.detail as Record<string, unknown>;
  const [showPushForm, setShowPushForm] = useState(false);
  const [pushed, setPushed] = useState(false);
  const canPush = !!onPushToFMTimeline && event.event_type !== "ai_insight";

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
          <div className="flex items-center gap-2 shrink-0">
            {canPush && (
              pushed ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                  <Check className="w-3 h-3" /> Added
                </span>
              ) : (
                <button
                  onClick={() => setShowPushForm((p) => !p)}
                  title="Push to FM Timeline"
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
                >
                  <GitBranch className="w-3 h-3" />
                  FM
                </button>
              )
            )}
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
              {relativeTime(event.event_date)}
            </span>
          </div>
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

          {/* Supplement start: dosage details */}
          {event.event_type === "supplement_start" && (detail.dosage || detail.frequency) ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              {[detail.dosage, detail.form, detail.frequency, detail.timing]
                .filter(Boolean)
                .map(String)
                .join(" · ")}
            </span>
          ) : null}

          {/* Supplement dose change: old → new */}
          {event.event_type === "supplement_dose_change" && detail.previous && detail.updated ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              {(() => {
                const prev = detail.previous as Record<string, string | null>;
                const upd = detail.updated as Record<string, string | null>;
                const changes: string[] = [];
                if (prev.dosage !== upd.dosage)
                  changes.push(`${prev.dosage || "none"} → ${upd.dosage || "none"}`);
                if (prev.form !== upd.form)
                  changes.push(`form: ${prev.form || "none"} → ${upd.form || "none"}`);
                if (prev.frequency !== upd.frequency)
                  changes.push(`freq: ${prev.frequency || "none"} → ${upd.frequency || "none"}`);
                if (prev.timing !== upd.timing)
                  changes.push(`timing: ${prev.timing || "none"} → ${upd.timing || "none"}`);
                return changes.join(", ");
              })()}
            </span>
          ) : null}

          {/* Supplement stop: show what was being taken */}
          {event.event_type === "supplement_stop" && detail.last_dosage ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              was: {[detail.last_dosage, detail.last_frequency, detail.last_timing]
                .filter(Boolean)
                .map(String)
                .join(" · ")}
            </span>
          ) : null}

          {/* Source badge for supplement events */}
          {(event.event_type === "supplement_start" ||
            event.event_type === "supplement_stop" ||
            event.event_type === "supplement_dose_change") &&
            detail.source ? (
            <span className="text-xs text-[var(--color-text-muted)] italic">
              via {String(detail.source)}
            </span>
          ) : null}

          {/* Body systems as inline text */}
          {event.body_systems && event.body_systems.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {event.body_systems.join(" \u00b7 ")}
            </span>
          )}
        </div>

        {/* AI Insight expanded detail */}
        {event.event_type === "ai_insight" && (
          <AIInsightDetail detail={detail as AISynthesisDetail} />
        )}

        {/* Push to FM Timeline inline form */}
        {showPushForm && canPush && (
          <PushToFMForm
            event={event}
            onPush={async (category, lifeStage) => {
              await onPushToFMTimeline!(event, category, lifeStage);
              setPushed(true);
              setShowPushForm(false);
            }}
            onCancel={() => setShowPushForm(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── DateGroup ─────────────────────────────────────────────────────────

function TimelineDateGroup({
  month,
  events,
  onPushToFMTimeline,
}: {
  month: string;
  events: TimelineEvent[];
  onPushToFMTimeline?: (event: TimelineEvent, category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
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
          <TimelineEventRow
            key={event.id}
            event={event}
            onPushToFMTimeline={onPushToFMTimeline}
          />
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
  onPushToFMTimeline?: (event: TimelineEvent, category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
}

export function PatientTimeline({ patientId, onPushToFMTimeline }: PatientTimelineProps) {
  const [excludedTypes, setExcludedTypes] = useState<Set<TimelineEventType>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

  const {
    events,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    loadMore,
    refresh,
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

  const handleSynthesize = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/timeline/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }
      toast.success("AI synthesis complete");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [patientId, refresh]);

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
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Health Timeline
          </h2>
        </div>
        <button
          onClick={handleSynthesize}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors disabled:opacity-50"
          title="AI analyzes all clinical data and surfaces trends, correlations, and root causes"
        >
          {analyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {analyzing ? "Analyzing…" : "Synthesize"}
        </button>
      </div>

      <TimelineFilterBar excludedTypes={excludedTypes} onToggleType={handleToggleType} />

      {events.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--color-border-light)] rounded-lg">
          <Clock className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            No timeline events yet
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Events will appear as labs, visits, and supplement changes are recorded
          </p>
        </div>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([month, monthEvents]) => (
            <TimelineDateGroup
              key={month}
              month={month}
              events={monthEvents}
              onPushToFMTimeline={onPushToFMTimeline}
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

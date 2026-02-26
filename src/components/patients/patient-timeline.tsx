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
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useTimeline } from "@/hooks/use-timeline";
import type { TimelineEvent, TimelineFilters } from "@/hooks/use-timeline";
import type { TimelineEventType } from "@/lib/validations/timeline";
import type { FMCategory, FMLifeStage } from "@/types/database";
import { AddSymptomLogForm } from "./add-symptom-log-form";
import { AddMilestoneForm } from "./add-milestone-form";
import { AddPatientReportForm } from "./add-patient-report-form";

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

type AddFormType = "symptom" | "milestone" | "report" | null;

// ── Helpers ───────────────────────────────────────────────────────────

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

// ── Add Event Dropdown ───────────────────────────────────────────────

function AddEventDropdown({ onSelect }: { onSelect: (type: AddFormType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Event
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-20 py-1">
          <button
            onClick={() => { onSelect("symptom"); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Log Symptom
          </button>
          <button
            onClick={() => { onSelect("milestone"); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <Flag className="w-3.5 h-3.5 text-purple-500" />
            Add Milestone
          </button>
          <button
            onClick={() => { onSelect("report"); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
            Log Patient Report
          </button>
        </div>
      )}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────

function TimelineFilterBar({
  excludedTypes,
  onToggleType,
  availableTypes,
}: {
  excludedTypes: Set<TimelineEventType>;
  onToggleType: (type: TimelineEventType) => void;
  availableTypes: TimelineEventType[];
}) {
  // Only show filter chips for types that have events
  const visibleTypes =
    availableTypes.length > 0
      ? FILTER_TYPES.filter((t) => availableTypes.includes(t))
      : [];

  if (visibleTypes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {visibleTypes.map((type) => {
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
  patientId,
  onPushToFMTimeline,
  onResolveSymptom,
}: {
  event: TimelineEvent;
  patientId: string;
  onPushToFMTimeline?: (event: TimelineEvent, category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
  onResolveSymptom?: (sourceId: string) => Promise<void>;
}) {
  const config = EVENT_CONFIG[event.event_type];
  const Icon = config.icon;
  const detail = event.detail as Record<string, unknown>;
  const [showPushForm, setShowPushForm] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [resolving, setResolving] = useState(false);
  const canPush = !!onPushToFMTimeline && event.event_type !== "ai_insight";

  // Unresolved symptom: event is symptom_log without resolved=true
  const isUnresolvedSymptom =
    event.event_type === "symptom_log" &&
    !detail.resolved &&
    !!onResolveSymptom;

  const handleResolve = async () => {
    if (!onResolveSymptom) return;
    setResolving(true);
    try {
      await onResolveSymptom(event.source_id);
    } finally {
      setResolving(false);
    }
  };

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
            {/* Resolve symptom button */}
            {isUnresolvedSymptom && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                title="Mark symptom as resolved"
                className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-green-600 transition-colors disabled:opacity-50"
              >
                {resolving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                Resolve
              </button>
            )}
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

          {/* Symptom log: severity + resolved status */}
          {event.event_type === "symptom_log" && (
            <>
              {detail.severity != null && (
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      Number(detail.severity) >= 7
                        ? "#ef4444"
                        : Number(detail.severity) >= 4
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                >
                  Severity {String(detail.severity)}/10
                </span>
              )}
              {detail.resolved && (
                <>
                  <span className="text-[var(--color-text-muted)]">&middot;</span>
                  <span className="text-xs text-green-600 font-medium">Resolved</span>
                  {detail.duration_days != null && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      after {String(Math.round(Number(detail.duration_days)))} days
                    </span>
                  )}
                </>
              )}
              {detail.body_system && (
                <>
                  <span className="text-[var(--color-text-muted)]">&middot;</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {String(detail.body_system)}
                  </span>
                </>
              )}
            </>
          )}

          {/* Protocol milestone: category */}
          {event.event_type === "protocol_milestone" && detail.category ? (
            <span className="text-xs text-[var(--color-text-muted)] italic">
              {String(detail.category)}
            </span>
          ) : null}

          {/* Patient reported: type + severity */}
          {event.event_type === "patient_reported" && (
            <>
              {detail.report_type && detail.report_type !== "general" && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {String(detail.report_type).replace(/_/g, " ")}
                </span>
              )}
              {detail.severity != null && (
                <>
                  <span className="text-[var(--color-text-muted)]">&middot;</span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        Number(detail.severity) >= 7
                          ? "#ef4444"
                          : Number(detail.severity) >= 4
                            ? "#f59e0b"
                            : "#22c55e",
                    }}
                  >
                    Severity {String(detail.severity)}/10
                  </span>
                </>
              )}
            </>
          )}

          {/* AI insight: type + confidence + source */}
          {event.event_type === "ai_insight" && (
            <>
              {detail.insight_type && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {String(detail.insight_type).replace(/_/g, " ")}
                </span>
              )}
              {detail.confidence && (
                <>
                  <span className="text-[var(--color-text-muted)]">&middot;</span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        detail.confidence === "high"
                          ? "#22c55e"
                          : detail.confidence === "medium"
                            ? "#f59e0b"
                            : "#9ca3af",
                    }}
                  >
                    {String(detail.confidence)} confidence
                  </span>
                </>
              )}
              {detail.source_type && (
                <>
                  <span className="text-[var(--color-text-muted)]">&middot;</span>
                  <span className="text-xs text-[var(--color-text-muted)] italic">
                    from {String(detail.source_type).replace(/_/g, " ")}
                  </span>
                </>
              )}
            </>
          )}

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
  patientId,
  onPushToFMTimeline,
  onResolveSymptom,
}: {
  month: string;
  events: TimelineEvent[];
  patientId: string;
  onPushToFMTimeline?: (event: TimelineEvent, category: FMCategory, lifeStage: FMLifeStage) => Promise<void>;
  onResolveSymptom?: (sourceId: string) => Promise<void>;
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
            patientId={patientId}
            onPushToFMTimeline={onPushToFMTimeline}
            onResolveSymptom={onResolveSymptom}
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
  const [activeForm, setActiveForm] = useState<AddFormType>(null);

  const {
    events,
    availableTypes,
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
      // Use availableTypes for the active filter set
      const visibleTypes = availableTypes.length > 0
        ? FILTER_TYPES.filter((t) => availableTypes.includes(t))
        : FILTER_TYPES;
      const activeTypes = visibleTypes.filter((t) => !next.has(t));
      setFilters({
        ...filters,
        eventTypes: activeTypes.length === visibleTypes.length ? [] : activeTypes,
      });
      return next;
    });
  }, [filters, setFilters, availableTypes]);

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

  const handleResolveSymptom = useCallback(async (sourceId: string) => {
    try {
      const res = await fetch(
        `/api/patients/${patientId}/symptom-logs/${sourceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolved_at: new Date().toISOString(),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to resolve symptom");
      }
      toast.success("Symptom marked as resolved");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resolve symptom"
      );
    }
  }, [patientId, refresh]);

  const handleFormCreated = useCallback(() => {
    refresh();
  }, [refresh]);

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
        <div className="flex items-center gap-2">
          <AddEventDropdown onSelect={setActiveForm} />
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
      </div>

      {/* Inline add-event forms */}
      {activeForm === "symptom" && (
        <div className="mb-4">
          <AddSymptomLogForm
            patientId={patientId}
            onClose={() => setActiveForm(null)}
            onCreated={handleFormCreated}
          />
        </div>
      )}
      {activeForm === "milestone" && (
        <div className="mb-4">
          <AddMilestoneForm
            patientId={patientId}
            onClose={() => setActiveForm(null)}
            onCreated={handleFormCreated}
          />
        </div>
      )}
      {activeForm === "report" && (
        <div className="mb-4">
          <AddPatientReportForm
            patientId={patientId}
            onClose={() => setActiveForm(null)}
            onCreated={handleFormCreated}
          />
        </div>
      )}

      <TimelineFilterBar
        excludedTypes={excludedTypes}
        onToggleType={handleToggleType}
        availableTypes={availableTypes}
      />

      {events.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--color-border-light)] rounded-lg">
          <Clock className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            No timeline events yet
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Events will appear as labs, visits, supplements, symptoms, milestones, and insights are recorded
          </p>
        </div>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([month, monthEvents]) => (
            <TimelineDateGroup
              key={month}
              month={month}
              events={monthEvents}
              patientId={patientId}
              onPushToFMTimeline={onPushToFMTimeline}
              onResolveSymptom={handleResolveSymptom}
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

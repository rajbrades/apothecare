"use client";

import { useState, useCallback } from "react";
import {
  Plus, X, Pencil, Trash2, Sparkles, Loader2, GitBranch,
  ChevronDown, ChevronUp,
} from "lucide-react";
import type { FMTimelineEvent, FMTimelineData, FMCategory, FMLifeStage } from "@/types/database";

// ── Constants ─────────────────────────────────────────────────────────

// Ordered top → bottom (most recent → birth)
const LIFE_STAGES: { key: FMLifeStage; label: string; sub: string }[] = [
  { key: "adulthood",   label: "Adulthood",    sub: "Age 19 – present" },
  { key: "adolescence", label: "Adolescence",  sub: "Ages 13 – 18" },
  { key: "childhood",   label: "Childhood",    sub: "Ages 2 – 12" },
  { key: "birth",       label: "Birth",        sub: "Delivery & infancy" },
  { key: "prenatal",    label: "Pre-Birth",    sub: "In utero & family history" },
];

const CATEGORIES: Record<FMCategory, {
  label: string;
  short: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}> = {
  antecedent: {
    label: "Antecedent",
    short: "A",
    dot: "bg-violet-400",
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-200",
  },
  trigger: {
    label: "Trigger",
    short: "T",
    dot: "bg-orange-400",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  mediator: {
    label: "Mediator",
    short: "M",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

// ── Types ─────────────────────────────────────────────────────────────

interface FMTimelineProps {
  patientId: string;
  initialData: FMTimelineData | null;
  onDataChange?: (data: FMTimelineData) => void;
}

interface AddingState {
  life_stage: FMLifeStage;
  category: FMCategory;
  title: string;
  notes: string;
  year: string;
}

interface EditingState extends AddingState {
  id: string;
}

interface AISynthesis {
  summary: string;
  antecedent_patterns: string[];
  trigger_patterns: string[];
  mediator_patterns: string[];
  root_cause_hypotheses: string[];
  recommended_focus: string[];
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Event inline form ─────────────────────────────────────────────────

function EventForm({
  life_stage,
  category,
  initialTitle = "",
  initialNotes = "",
  initialYear = "",
  onSave,
  onCancel,
  onCategoryChange,
}: {
  life_stage: FMLifeStage;
  category: FMCategory;
  initialTitle?: string;
  initialNotes?: string;
  initialYear?: string;
  onSave: (data: { title: string; notes: string; year: string; category: FMCategory }) => void;
  onCancel: () => void;
  onCategoryChange: (c: FMCategory) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [year, setYear] = useState(initialYear);

  void life_stage; // used by parent for placement

  return (
    <div className="ml-8 mt-2 mb-2 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-2 w-72">
      {/* Category selector */}
      <div className="flex items-center gap-1">
        {(Object.keys(CATEGORIES) as FMCategory[]).map((c) => {
          const cat = CATEGORIES[c];
          return (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                category === c
                  ? `${cat.bg} ${cat.text} ${cat.border}`
                  : "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-transparent"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave({ title, notes, year, category });
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Event title..."
        className="w-full text-xs px-2 py-1.5 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
      />

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year (optional)"
          className="w-28 text-xs px-2 py-1.5 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full text-xs px-2 py-1.5 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] resize-none"
      />

      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ title, notes, year, category })}
          disabled={!title.trim()}
          className="px-2 py-1 text-xs font-medium text-white bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ── Event node ────────────────────────────────────────────────────────

function EventNode({
  event,
  onEdit,
  onDelete,
}: {
  event: FMTimelineEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES[event.category];
  const [hover, setHover] = useState(false);

  return (
    <div
      className="flex items-start gap-0 group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Dot on the line */}
      <div className="relative flex flex-col items-center" style={{ width: 32, minWidth: 32 }}>
        {/* vertical connector from line to dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm shrink-0 z-10 ${cat.dot}`}
          style={{ marginTop: 6 }}
        />
      </div>

      {/* Card */}
      <div
        className={`relative ml-2 mb-3 px-3 py-2 rounded-[var(--radius-md)] border ${cat.border} ${cat.bg} cursor-pointer flex-1 max-w-xs`}
        onClick={onEdit}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${cat.text} leading-snug`}>{event.title}</p>
            {event.year && (
              <p className={`text-[10px] ${cat.text} opacity-60 mt-0.5`}>{event.year}</p>
            )}
            {event.notes && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-snug line-clamp-2">
                {event.notes}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.text} ${cat.border} border`}>
            {cat.short}
          </span>
        </div>

        {/* Action buttons on hover */}
        {hover && (
          <div className="absolute -top-2 -right-2 flex items-center gap-0.5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-5 h-5 rounded-full bg-white border border-[var(--color-border)] shadow flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-5 h-5 rounded-full bg-white border border-red-200 shadow flex items-center justify-center text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Synthesis panel ────────────────────────────────────────────────

function AISynthesisPanel({ synthesis }: { synthesis: AISynthesis }) {
  const [open, setOpen] = useState(true);

  const sections: { label: string; items: string[] }[] = [
    { label: "Antecedent Patterns", items: synthesis.antecedent_patterns },
    { label: "Trigger Patterns", items: synthesis.trigger_patterns },
    { label: "Mediator Patterns", items: synthesis.mediator_patterns },
    { label: "Root Cause Hypotheses", items: synthesis.root_cause_hypotheses },
    { label: "Recommended Focus", items: synthesis.recommended_focus },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)]">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-sm font-semibold text-[var(--color-brand-700)]">AI Root Cause Analysis</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[var(--color-brand-500)]" />
          : <ChevronDown className="w-4 h-4 text-[var(--color-brand-500)]" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-[var(--color-brand-800)] leading-relaxed">{synthesis.summary}</p>
          {sections.map((s) => (
            <div key={s.label}>
              <p className="text-xs font-semibold text-[var(--color-brand-700)] uppercase tracking-wide mb-1">{s.label}</p>
              <ul className="space-y-0.5">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-brand-800)]">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-brand-400)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function FMTimeline({ patientId, initialData, onDataChange }: FMTimelineProps) {
  const [events, setEvents] = useState<FMTimelineEvent[]>(initialData?.events ?? []);
  const [adding, setAdding] = useState<AddingState | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [synthesis, setSynthesis] = useState<AISynthesis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  // ── Persist (immediate — no debounce so tab switches don't lose data) ──

  const persist = useCallback(async (next: FMTimelineEvent[]) => {
    const nextData = { events: next };
    onDataChange?.(nextData);
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fm_timeline_data: nextData }),
      });
      setSavedAt(new Date());
    } catch {
      // silently fail — data is at least in parent state
    } finally {
      setSaving(false);
    }
  }, [patientId, onDataChange]);

  // ── CRUD ───────────────────────────────────────────────────────────

  const commitAdd = useCallback(
    (data: { title: string; notes: string; year: string; category: FMCategory }) => {
      if (!adding || !data.title.trim()) return;
      const evt: FMTimelineEvent = {
        id: newId(),
        category: data.category,
        life_stage: adding.life_stage,
        title: data.title.trim(),
        notes: data.notes.trim() || undefined,
        year: data.year ? parseInt(data.year, 10) : undefined,
      };
      setEvents((prev) => {
        const next = [...prev, evt];
        persist(next);
        return next;
      });
      setAdding(null);
    },
    [adding, persist]
  );

  const commitEdit = useCallback(
    (data: { title: string; notes: string; year: string; category: FMCategory }) => {
      if (!editing || !data.title.trim()) return;
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === editing.id
            ? {
                ...e,
                title: data.title.trim(),
                notes: data.notes.trim() || undefined,
                year: data.year ? parseInt(data.year, 10) : undefined,
                category: data.category,
              }
            : e
        );
        persist(next);
        return next;
      });
      setEditing(null);
    },
    [editing, persist]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // ── AI ─────────────────────────────────────────────────────────────

  const handleSynthesize = async () => {
    if (events.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setSynthesis(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/fm-timeline/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Analysis failed");
      }
      const data = await res.json();
      setSynthesis(data.result);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  const totalEvents = events.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">FM Health Timeline</span>
          {totalEvents > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-full">
              {totalEvents} event{totalEvents !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-text-muted)]" />}
          {!saving && savedAt && (
            <span className="text-xs text-[var(--color-text-muted)]">Saved</span>
          )}
          {totalEvents > 0 && (
            <button
              onClick={handleSynthesize}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
            >
              {analyzing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />
              }
              {analyzing ? "Analyzing..." : "Synthesize"}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6">
        {(Object.keys(CATEGORIES) as FMCategory[]).map((k) => {
          const cat = CATEGORIES[k];
          return (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
              <span className="text-xs text-[var(--color-text-muted)]">{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* "Today" cap */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex flex-col items-center" style={{ width: 32 }}>
            <div className="w-3 h-3 rounded-full bg-[var(--color-brand-600)]" />
          </div>
          <span className="text-xs font-semibold text-[var(--color-brand-700)] uppercase tracking-wide">
            Today
          </span>
        </div>

        {/* Life stage sections */}
        {LIFE_STAGES.map((stage, stageIdx) => {
          const stageEvents = events.filter((e) => e.life_stage === stage.key);
          const isAddingHere = adding?.life_stage === stage.key;
          const isLastStage = stageIdx === LIFE_STAGES.length - 1;

          return (
            <div key={stage.key} className="relative flex gap-0">
              {/* Vertical bar column */}
              <div
                className="flex flex-col items-center shrink-0"
                style={{ width: 32 }}
              >
                {/* Continuous line */}
                <div className={`w-0.5 bg-[var(--color-border)] ${isLastStage ? "flex-1" : "flex-1"}`} />
              </div>

              {/* Section content */}
              <div className="flex-1 pb-2">
                {/* Stage header divider */}
                <div className="flex items-center gap-2 mb-3 -ml-4">
                  <div className="w-4 h-0.5 bg-[var(--color-border)]" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{stage.sub}</span>
                  </div>
                </div>

                {/* Events in this stage */}
                <div className="space-y-0">
                  {stageEvents.map((evt) => {
                    if (editing?.id === evt.id) {
                      return (
                        <EventForm
                          key={evt.id}
                          life_stage={stage.key}
                          category={editing.category}
                          initialTitle={editing.title}
                          initialNotes={editing.notes}
                          initialYear={editing.year}
                          onSave={commitEdit}
                          onCancel={() => setEditing(null)}
                          onCategoryChange={(c) => setEditing((prev) => prev ? { ...prev, category: c } : prev)}
                        />
                      );
                    }
                    return (
                      <EventNode
                        key={evt.id}
                        event={evt}
                        onEdit={() =>
                          setEditing({
                            id: evt.id,
                            life_stage: evt.life_stage,
                            category: evt.category,
                            title: evt.title,
                            notes: evt.notes ?? "",
                            year: evt.year ? String(evt.year) : "",
                          })
                        }
                        onDelete={() => deleteEvent(evt.id)}
                      />
                    );
                  })}
                </div>

                {/* Add form for this stage */}
                {isAddingHere && (
                  <EventForm
                    life_stage={stage.key}
                    category={adding.category}
                    onSave={commitAdd}
                    onCancel={() => setAdding(null)}
                    onCategoryChange={(c) => setAdding((prev) => prev ? { ...prev, category: c } : prev)}
                  />
                )}

                {/* Add button */}
                {!isAddingHere && (
                  <button
                    onClick={() =>
                      setAdding({
                        life_stage: stage.key,
                        category: "antecedent",
                        title: "",
                        notes: "",
                        year: "",
                      })
                    }
                    className="ml-8 flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors py-1 group/add"
                  >
                    <Plus className="w-3 h-3 group-hover/add:text-[var(--color-brand-600)]" />
                    Add to {stage.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* "Birth" cap at bottom */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex flex-col items-center" style={{ width: 32 }}>
            <div className="w-3 h-3 rounded-full bg-[var(--color-surface-secondary)] border-2 border-[var(--color-border)]" />
          </div>
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Birth
          </span>
        </div>
      </div>

      {/* Empty state */}
      {totalEvents === 0 && (
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Use the &quot;Add to [Stage]&quot; buttons above to map antecedents, triggers, and mediators across the patient&apos;s life.
        </p>
      )}

      {/* AI error */}
      {analyzeError && (
        <p className="mt-4 text-xs text-red-600">{analyzeError}</p>
      )}

      {/* AI synthesis result */}
      {synthesis && <AISynthesisPanel synthesis={synthesis} />}
    </div>
  );
}

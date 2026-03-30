"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Pill,
  Salad,
  HeartPulse,
  FlaskConical,
  GitBranch,
  StickyNote,
  Plus,
  Trash2,
  ArrowRight,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ProtocolPhase,
  PhaseStatus,
  PhaseSupplementItem,
  ProtocolSupplementAction,
} from "@/types/protocol";

// ── Status badge config ────────────────────────────────────────────

const STATUS_STYLES: Record<
  PhaseStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Pending",
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Active",
  },
  completed: {
    bg: "bg-[var(--color-brand-600)]/10",
    text: "text-[var(--color-brand-600)]",
    label: "Completed",
  },
  extended: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Extended",
  },
  skipped: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    label: "Skipped",
  },
};

// ── Supplement action badge config ─────────────────────────────────

const ACTION_STYLES: Record<
  ProtocolSupplementAction,
  { bg: string; text: string }
> = {
  start: { bg: "bg-blue-50", text: "text-blue-700" },
  continue: { bg: "bg-emerald-50", text: "text-emerald-700" },
  increase: { bg: "bg-amber-50", text: "text-amber-700" },
  decrease: { bg: "bg-amber-50", text: "text-amber-700" },
  discontinue: { bg: "bg-red-50", text: "text-red-700" },
};

// ── Props ──────────────────────────────────────────────────────────

interface PhaseCardProps {
  phase: ProtocolPhase;
  phaseIndex: number;
  isEditable: boolean;
  onUpdate?: (phaseId: string, updates: Partial<ProtocolPhase>) => void;
  onAdvance?: (phaseId: string) => void;
  onExtend?: (phaseId: string, additionalWeeks: number) => void;
}

// ── Helper: blank supplement row ───────────────────────────────────

function blankSupplement(): PhaseSupplementItem {
  return {
    name: "",
    dosage: "",
    frequency: "",
    timing: null,
    rationale: "",
    rag_source: null,
    action: "start",
  };
}

// ── Expandable section wrapper ─────────────────────────────────────

function SectionAccordion({
  icon: Icon,
  title,
  count,
  children,
  defaultOpen = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className="border-t border-[var(--color-border-light)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--color-surface-secondary)]/50 transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        <span className="text-xs font-medium text-[var(--color-text-secondary)] flex-1">
          {title}
        </span>
        <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] rounded-full px-1.5 py-0.5">
          {count}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function PhaseCard({
  phase,
  phaseIndex,
  isEditable,
  onUpdate,
  onAdvance,
  onExtend,
}: PhaseCardProps) {
  const [expanded, setExpanded] = useState(phase.status === "active");
  const [extendWeeks, setExtendWeeks] = useState(2);
  const [showExtend, setShowExtend] = useState(false);

  const status = STATUS_STYLES[phase.status] || STATUS_STYLES.pending;

  // ── Inline edit helpers ────────────────────────────────────────

  const updateField = useCallback(
    (field: keyof ProtocolPhase, value: unknown) => {
      onUpdate?.(phase.id, { [field]: value } as Partial<ProtocolPhase>);
    },
    [phase.id, onUpdate]
  );

  const updateSupplement = useCallback(
    (idx: number, updates: Partial<PhaseSupplementItem>) => {
      const next = [...phase.supplements];
      next[idx] = { ...next[idx], ...updates };
      onUpdate?.(phase.id, { supplements: next });
    },
    [phase.id, phase.supplements, onUpdate]
  );

  const addSupplement = useCallback(() => {
    onUpdate?.(phase.id, {
      supplements: [...phase.supplements, blankSupplement()],
    });
  }, [phase.id, phase.supplements, onUpdate]);

  const removeSupplement = useCallback(
    (idx: number) => {
      const next = phase.supplements.filter((_, i) => i !== idx);
      onUpdate?.(phase.id, { supplements: next });
    },
    [phase.id, phase.supplements, onUpdate]
  );

  const addListItem = useCallback(
    (field: "diet" | "lifestyle", value: string) => {
      if (!value.trim()) return;
      const current = phase[field] || [];
      onUpdate?.(phase.id, { [field]: [...current, value.trim()] } as Partial<ProtocolPhase>);
    },
    [phase, onUpdate]
  );

  const removeListItem = useCallback(
    (field: "diet" | "lifestyle", idx: number) => {
      const current = phase[field] || [];
      onUpdate?.(phase.id, {
        [field]: current.filter((_, i) => i !== idx),
      } as Partial<ProtocolPhase>);
    },
    [phase, onUpdate]
  );

  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-card)] overflow-hidden transition-shadow",
        phase.status === "active" && "ring-1 ring-emerald-200"
      )}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-[var(--color-surface-secondary)]/30 transition-colors"
      >
        {/* Phase number circle */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
            phase.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : phase.status === "completed"
              ? "bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)]"
              : "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
          )}
        >
          {phaseIndex + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {phase.title}
            </h3>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                status.bg,
                status.text
              )}
            >
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
              <Clock className="w-3 h-3" />
              {phase.duration_weeks}w
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
            {phase.goal}
          </p>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-1" />
        )}
      </button>

      {/* ── Expanded content ────────────────────────────────── */}
      {expanded && (
        <div>
          {/* Goal (editable in edit mode) */}
          {isEditable ? (
            <div className="px-4 pb-3">
              <label className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Phase Goal
              </label>
              <textarea
                value={phase.goal}
                onChange={(e) => updateField("goal", e.target.value)}
                rows={2}
                className="w-full mt-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30 resize-none"
              />
            </div>
          ) : (
            <div className="px-4 pb-3">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {phase.goal}
              </p>
            </div>
          )}

          {/* ── Supplements table ───────────────────────────── */}
          <SectionAccordion
            icon={Pill}
            title="Supplements"
            count={phase.supplements.length}
            defaultOpen
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="text-left font-medium pb-1.5 px-1">
                      Supplement
                    </th>
                    <th className="text-left font-medium pb-1.5 px-1">
                      Dosage
                    </th>
                    <th className="text-left font-medium pb-1.5 px-1">
                      Frequency
                    </th>
                    <th className="text-left font-medium pb-1.5 px-1">
                      Timing
                    </th>
                    <th className="text-left font-medium pb-1.5 px-1">
                      Action
                    </th>
                    {isEditable && (
                      <th className="w-8 pb-1.5" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {phase.supplements.map((supp, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-[var(--color-border-light)]/50"
                    >
                      <td className="py-1.5 px-1">
                        {isEditable ? (
                          <input
                            value={supp.name}
                            onChange={(e) =>
                              updateSupplement(idx, { name: e.target.value })
                            }
                            className="w-full min-w-[120px] rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                            placeholder="Name"
                          />
                        ) : (
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {supp.name}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-1">
                        {isEditable ? (
                          <input
                            value={supp.dosage}
                            onChange={(e) =>
                              updateSupplement(idx, {
                                dosage: e.target.value,
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                            placeholder="Dosage"
                          />
                        ) : (
                          supp.dosage
                        )}
                      </td>
                      <td className="py-1.5 px-1">
                        {isEditable ? (
                          <input
                            value={supp.frequency}
                            onChange={(e) =>
                              updateSupplement(idx, {
                                frequency: e.target.value,
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                            placeholder="Frequency"
                          />
                        ) : (
                          supp.frequency
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-[var(--color-text-muted)]">
                        {isEditable ? (
                          <input
                            value={supp.timing || ""}
                            onChange={(e) =>
                              updateSupplement(idx, {
                                timing: e.target.value || null,
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                            placeholder="Timing"
                          />
                        ) : (
                          supp.timing || "--"
                        )}
                      </td>
                      <td className="py-1.5 px-1">
                        {isEditable ? (
                          <select
                            value={supp.action}
                            onChange={(e) =>
                              updateSupplement(idx, {
                                action: e.target
                                  .value as ProtocolSupplementAction,
                              })
                            }
                            className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                          >
                            <option value="start">Start</option>
                            <option value="continue">Continue</option>
                            <option value="increase">Increase</option>
                            <option value="decrease">Decrease</option>
                            <option value="discontinue">Discontinue</option>
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                              ACTION_STYLES[supp.action]?.bg || "bg-gray-50",
                              ACTION_STYLES[supp.action]?.text || "text-gray-600"
                            )}
                          >
                            {supp.action}
                          </span>
                        )}
                      </td>
                      {isEditable && (
                        <td className="py-1.5 px-1">
                          <button
                            onClick={() => removeSupplement(idx)}
                            className="p-1 rounded text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditable && (
                <button
                  onClick={addSupplement}
                  className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add supplement
                </button>
              )}
            </div>
          </SectionAccordion>

          {/* ── Diet ────────────────────────────────────────── */}
          <SectionAccordion
            icon={Salad}
            title="Diet Recommendations"
            count={phase.diet?.length || 0}
          >
            <ListSection
              items={phase.diet || []}
              isEditable={isEditable}
              onAdd={(v) => addListItem("diet", v)}
              onRemove={(i) => removeListItem("diet", i)}
              placeholder="Add diet recommendation..."
            />
          </SectionAccordion>

          {/* ── Lifestyle ───────────────────────────────────── */}
          <SectionAccordion
            icon={HeartPulse}
            title="Lifestyle"
            count={phase.lifestyle?.length || 0}
          >
            <ListSection
              items={phase.lifestyle || []}
              isEditable={isEditable}
              onAdd={(v) => addListItem("lifestyle", v)}
              onRemove={(i) => removeListItem("lifestyle", i)}
              placeholder="Add lifestyle recommendation..."
            />
          </SectionAccordion>

          {/* ── Labs to order ───────────────────────────────── */}
          <SectionAccordion
            icon={FlaskConical}
            title="Labs to Order"
            count={phase.labs_to_order?.length || 0}
          >
            <div className="space-y-1.5">
              {phase.labs_to_order.map((lab, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs"
                >
                  <FlaskConical className="w-3 h-3 text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {lab.name}
                    </span>
                    {lab.target_range && (
                      <span className="text-[var(--color-text-muted)] ml-1">
                        (target: {lab.target_range})
                      </span>
                    )}
                    <p className="text-[var(--color-text-muted)] mt-0.5">
                      {lab.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionAccordion>

          {/* ── Conditional logic ────────────────────────────── */}
          <SectionAccordion
            icon={GitBranch}
            title="Conditional Logic"
            count={phase.conditional_logic?.length || 0}
          >
            <div className="space-y-2">
              {phase.conditional_logic.map((rule, idx) => (
                <div
                  key={idx}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]/30 p-2.5 text-xs"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-[var(--color-brand-600)] uppercase tracking-wider flex-shrink-0">
                      IF
                    </span>
                    <span className="text-[var(--color-text-primary)]">
                      {rule.condition}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider flex-shrink-0">
                      THEN
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {rule.action}
                    </span>
                  </div>
                  {rule.fallback && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex-shrink-0">
                        ELSE
                      </span>
                      <span className="text-[var(--color-text-muted)]">
                        {rule.fallback}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionAccordion>

          {/* ── Practitioner notes ───────────────────────────── */}
          {(phase.practitioner_notes || isEditable) && (
            <SectionAccordion
              icon={StickyNote}
              title="Practitioner Notes"
              count={phase.practitioner_notes ? 1 : isEditable ? 1 : 0}
            >
              {isEditable ? (
                <textarea
                  value={phase.practitioner_notes || ""}
                  onChange={(e) =>
                    updateField("practitioner_notes", e.target.value || null)
                  }
                  rows={3}
                  placeholder="Add notes for this phase..."
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30 resize-none"
                />
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {phase.practitioner_notes}
                </p>
              )}
            </SectionAccordion>
          )}

          {/* ── Phase actions ───────────────────────────────── */}
          {(phase.status === "active" || isEditable) && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]/20">
              {phase.status === "active" && onAdvance && (
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => onAdvance(phase.id)}
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  Advance to Next Phase
                </Button>
              )}
              {phase.status === "active" && onExtend && (
                <>
                  {showExtend ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={extendWeeks}
                        onChange={(e) =>
                          setExtendWeeks(Number(e.target.value))
                        }
                        className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
                      >
                        {[1, 2, 3, 4, 6, 8].map((w) => (
                          <option key={w} value={w}>
                            {w} week{w > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          onExtend(phase.id, extendWeeks);
                          setShowExtend(false);
                        }}
                      >
                        Confirm
                      </Button>
                      <button
                        onClick={() => setShowExtend(false)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setShowExtend(true)}
                    >
                      <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                      Extend Phase
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable list section (diet / lifestyle) ───────────────────────

function ListSection({
  items,
  isEditable,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  isEditable: boolean;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2 group text-xs">
          <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] mt-1.5 flex-shrink-0" />
          <span className="text-[var(--color-text-secondary)] flex-1">
            {item}
          </span>
          {isEditable && (
            <button
              onClick={() => onRemove(idx)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-text-muted)] hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      {isEditable && (
        <div className="flex items-center gap-2 mt-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onAdd(draft);
                setDraft("");
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30"
          />
          <button
            onClick={() => {
              if (draft.trim()) {
                onAdd(draft);
                setDraft("");
              }
            }}
            className="text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

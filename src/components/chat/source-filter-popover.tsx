"use client";

import { useState, useCallback, useMemo } from "react";
import { X, Check, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  EVIDENCE_SOURCES,
  SOURCE_PRESETS,
  ALL_SOURCE_IDS,
  matchPreset,
  type SourceId,
} from "@/lib/ai/source-filter";

interface SourceFilterPopoverProps {
  selectedSources: SourceId[];
  onChangeSources: (sources: SourceId[]) => void;
  onClose: () => void;
  savedDefault?: SourceId[];
  onDefaultSaved?: (sources: SourceId[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  functional: "Functional / Integrative",
  conventional: "Conventional",
  general: "General Literature",
  partnership: "Partner Knowledge Bases",
};

const CATEGORY_ORDER = ["functional", "partnership", "conventional", "general"] as const;

export function SourceFilterPopover({
  selectedSources,
  onChangeSources,
  onClose,
  savedDefault,
  onDefaultSaved,
}: SourceFilterPopoverProps) {
  const activePreset = matchPreset(selectedSources);
  const [isSaving, setIsSaving] = useState(false);

  const selectionDiffersFromSaved = useMemo(() => {
    if (!savedDefault || !onDefaultSaved) return false;
    const currentSorted = [...selectedSources].sort();
    const savedSorted = [...savedDefault].sort();
    if (currentSorted.length !== savedSorted.length) return true;
    return currentSorted.some((s, i) => s !== savedSorted[i]);
  }, [selectedSources, savedDefault, onDefaultSaved]);

  const handleSaveDefault = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/practitioners/evidence-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: selectedSources }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save default");
        return;
      }
      toast.success("Default sources saved");
      onDefaultSaved?.(selectedSources);
    } catch {
      toast.error("Failed to save default");
    } finally {
      setIsSaving(false);
    }
  }, [selectedSources, onDefaultSaved]);

  const toggleSource = useCallback(
    (sourceId: SourceId) => {
      const isSelected = selectedSources.includes(sourceId);
      if (isSelected) {
        // Deselecting the last source resets to all sources
        if (selectedSources.length <= 1) {
          onChangeSources([...ALL_SOURCE_IDS]);
          return;
        }
        onChangeSources(selectedSources.filter((s) => s !== sourceId));
      } else {
        onChangeSources([...selectedSources, sourceId]);
      }
    },
    [selectedSources, onChangeSources]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = SOURCE_PRESETS.find((p) => p.id === presetId);
      if (preset) onChangeSources([...preset.sources]);
    },
    [onChangeSources]
  );

  // Group sources by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    sources: Object.values(EVIDENCE_SOURCES).filter((s) => s.category === cat),
  }));

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-modal)] z-10 flex flex-col max-h-[min(520px,calc(100vh-6rem))]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-brand-500)]" />
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Evidence Sources
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Presets */}
      <div className="px-4 pb-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">
          Presets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                activePreset?.id === preset.id
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]"
                  : "text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-500)]"
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
          {!activePreset && selectedSources.length > 0 && selectedSources.length < ALL_SOURCE_IDS.length && (
            <span className="px-2.5 py-1 text-xs rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-300)]">
              Custom
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-light)]" />

      {/* Individual sources by category */}
      <div className="px-4 py-3 overflow-y-auto space-y-3 flex-1 min-h-0">
        {grouped.map(({ category, label, sources }) => (
          <div key={category}>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1.5">
              {label}
            </p>
            <div className="space-y-0.5">
              {sources.map((source) => {
                const isSelected = selectedSources.includes(source.id as SourceId);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id as SourceId)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 text-left text-xs rounded-md transition-colors ${
                      isSelected
                        ? "text-[var(--color-text-primary)] bg-[var(--color-brand-50)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)]"
                          : "border-[var(--color-border)] bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">{source.name}</span>
                      <span className="text-[var(--color-text-muted)] ml-1.5">
                        {source.fullName !== source.name ? source.fullName : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--color-border-light)] flex items-center justify-between">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Filters which evidence sources the AI prioritizes.
        </p>
        {selectionDiffersFromSaved && (
          <button
            onClick={handleSaveDefault}
            disabled={isSaving}
            className="text-[11px] font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0 ml-2"
          >
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save as Default
          </button>
        )}
      </div>
    </div>
  );
}

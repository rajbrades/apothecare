"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOCUS_AREAS, type FocusAreaKey } from "@/types/protocol";

interface FocusAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (focusAreas: FocusAreaKey[], customInstructions?: string) => void;
  isGenerating: boolean;
}

const MAX_FOCUS_AREAS = 5;

export function FocusAreaModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: FocusAreaModalProps) {
  const [selected, setSelected] = useState<Set<FocusAreaKey>>(new Set());
  const [customInstructions, setCustomInstructions] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
      setCustomInstructions("");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGenerating) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isGenerating, onClose]);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current && !isGenerating) onClose();
    },
    [onClose, isGenerating]
  );

  const toggleArea = (key: FocusAreaKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < MAX_FOCUS_AREAS) {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onGenerate(
      Array.from(selected),
      customInstructions.trim() || undefined
    );
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-center justify-center animate-[fadeIn_150ms_ease-out]"
      style={{ backgroundColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-area-title"
    >
      <div className="w-full max-w-lg mx-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border-light)] animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2
              id="focus-area-title"
              className="text-base font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]"
            >
              Generate Treatment Protocol
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              Select 1-{MAX_FOCUS_AREAS} clinical focus areas
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focus area grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_AREAS.map((area) => {
              const isSelected = selected.has(area.key);
              const isDisabled =
                !isSelected && selected.size >= MAX_FOCUS_AREAS;

              return (
                <button
                  key={area.key}
                  onClick={() => toggleArea(area.key)}
                  disabled={isDisabled || isGenerating}
                  className={`
                    relative flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] border text-left text-sm transition-all
                    ${
                      isSelected
                        ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)]/5 text-[var(--color-brand-600)] ring-1 ring-[var(--color-brand-600)]/20"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-400)] hover:text-[var(--color-text-primary)]"
                    }
                    ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <div
                    className={`
                      w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors
                      ${
                        isSelected
                          ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)]"
                      }
                    `}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="font-medium">{area.label}</span>
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              {selected.size} of {MAX_FOCUS_AREAS} selected
            </p>
          )}
        </div>

        {/* Custom instructions */}
        <div className="px-6 pb-4">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
            Custom instructions (optional)
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g., Patient has MTHFR C677T mutation, avoid high-dose folate initially..."
            rows={3}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]/30 resize-none disabled:opacity-50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected.size === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Generate Protocol
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

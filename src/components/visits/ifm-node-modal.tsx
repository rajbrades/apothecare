"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Plus, GripVertical, Trash2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { IFMMatrixNode } from "@/types/database";

const SEVERITIES = ["none", "low", "moderate", "high"] as const;

const SEVERITY_LABELS: Record<string, string> = {
  none: "None",
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

const SEVERITY_COLORS: Record<string, string> = {
  none: "bg-gray-100 border-gray-300 text-gray-600",
  low: "bg-blue-50 border-blue-400 text-blue-700",
  moderate: "bg-amber-50 border-amber-400 text-amber-700",
  high: "bg-red-50 border-red-400 text-red-700",
};

const SEVERITY_ACTIVE: Record<string, string> = {
  none: "ring-2 ring-gray-400",
  low: "ring-2 ring-blue-500",
  moderate: "ring-2 ring-amber-500",
  high: "ring-2 ring-red-500",
};

interface SortableFindingProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function SortableFinding({ id, value, onChange, onRemove }: SortableFindingProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] touch-none"
        tabIndex={-1}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm px-2 py-1.5 border border-[var(--color-border-light)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
        placeholder="Enter finding..."
      />
      <button
        onClick={onRemove}
        className="p-1 text-[var(--color-text-muted)] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        tabIndex={-1}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface IFMNodeModalProps {
  nodeKey: string;
  label: string;
  description: string;
  data: IFMMatrixNode;
  onSave: (data: IFMMatrixNode) => void;
  onClose: () => void;
}

export function IFMNodeModal({
  label,
  description,
  data,
  onSave,
  onClose,
}: IFMNodeModalProps) {
  const [findings, setFindings] = useState<string[]>([...data.findings]);
  const [severity, setSeverity] = useState(data.severity);
  const [notes, setNotes] = useState(data.notes);
  const [findingIds, setFindingIds] = useState(() =>
    data.findings.map((_, i) => `finding-${i}`)
  );
  const nextIdRef = useRef(data.findings.length);
  const overlayRef = useRef<HTMLDivElement>(null);
  const newFindingRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSave = useCallback(() => {
    const filtered = findings.filter((f) => f.trim());
    onSave({
      findings: filtered,
      severity,
      notes,
    });
    onClose();
  }, [findings, severity, notes, onSave, onClose]);

  const trapRef = useFocusTrap(true, handleSave);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleSave();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = findingIds.indexOf(active.id as string);
    const newIndex = findingIds.indexOf(over.id as string);

    setFindingIds(arrayMove(findingIds, oldIndex, newIndex));
    setFindings(arrayMove(findings, oldIndex, newIndex));
  };

  const addFinding = () => {
    const id = `finding-${nextIdRef.current++}`;
    setFindings([...findings, ""]);
    setFindingIds([...findingIds, id]);
    // Focus the new input after render
    requestAnimationFrame(() => newFindingRef.current?.focus());
  };

  const updateFinding = (index: number, value: string) => {
    const updated = [...findings];
    updated[index] = value;
    setFindings(updated);
  };

  const removeFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
    setFindingIds(findingIds.filter((_, i) => i !== index));
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="ifm-node-title" className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
          <div>
            <h3 id="ifm-node-title" className="text-base font-semibold text-[var(--color-text-primary)]">
              {label}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {description}
            </p>
          </div>
          <button
            onClick={handleSave}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Severity */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              Severity
            </label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    SEVERITY_COLORS[s]
                  } ${severity === s ? SEVERITY_ACTIVE[s] : "opacity-60 hover:opacity-100"}`}
                >
                  {SEVERITY_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              Findings
            </label>
            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={findingIds}
                  strategy={verticalListSortingStrategy}
                >
                  {findings.map((finding, index) => (
                    <SortableFinding
                      key={findingIds[index]}
                      id={findingIds[index]}
                      value={finding}
                      onChange={(v) => updateFinding(index, v)}
                      onRemove={() => removeFinding(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                onClick={addFinding}
                className="flex items-center gap-1.5 text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-medium py-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add finding
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full text-sm px-3 py-2 border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] resize-none"
              placeholder="Clinical reasoning and interpretation..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
          <button
            onClick={() => onClose()}
            className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] rounded-[var(--radius-md)] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

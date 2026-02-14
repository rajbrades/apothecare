"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, GripVertical, X as XIcon, Plus, Pencil } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { IFMNodeModal } from "./ifm-node-modal";
import type { IFMMatrix, IFMMatrixNode } from "@/types/database";

const MATRIX_NODES: { key: keyof IFMMatrix; label: string; description: string }[] = [
  { key: "assimilation", label: "Assimilation", description: "Digestion, absorption, microbiome, GI barrier" },
  { key: "defense_repair", label: "Defense & Repair", description: "Immune, inflammation, autoimmunity" },
  { key: "energy", label: "Energy", description: "Mitochondria, oxidative stress, ATP" },
  { key: "biotransformation", label: "Biotransformation", description: "Detox, methylation, Phase I/II" },
  { key: "transport", label: "Transport", description: "Cardiovascular, lymphatic, respiratory" },
  { key: "communication", label: "Communication", description: "Hormones, neurotransmitters, cytokines" },
  { key: "structural_integrity", label: "Structural Integrity", description: "Musculoskeletal, membranes" },
];

const SEVERITY_COLORS = {
  none: "bg-[var(--color-surface-secondary)] border-[var(--color-border-light)] text-[var(--color-text-muted)]",
  low: "bg-blue-50 border-blue-200 text-blue-800",
  moderate: "bg-amber-50 border-amber-200 text-amber-800",
  high: "bg-red-50 border-red-200 text-red-800",
};

const SEVERITY_DOT = {
  none: "bg-[var(--color-text-muted)]",
  low: "bg-blue-500",
  moderate: "bg-amber-500",
  high: "bg-red-500",
};

const DEFAULT_NODE: IFMMatrixNode = { findings: [], severity: "none", notes: "" };

// ── Draggable Finding (for cross-card DnD) ──────────────────────────────

interface DraggableFindingProps {
  id: string;
  text: string;
  readOnly: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (value: string) => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}

function DraggableFinding({
  id,
  text,
  readOnly,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: DraggableFindingProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: readOnly,
  });
  const [editValue, setEditValue] = useState(text);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.3 : 1 }
    : undefined;

  if (isEditing) {
    return (
      <li className="flex gap-1.5 items-center">
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit(editValue);
            if (e.key === "Escape") onCancelEdit();
          }}
          onBlur={() => onSaveEdit(editValue)}
          className="flex-1 text-[11px] leading-snug px-1 py-0.5 border border-[var(--color-brand-500)] rounded-[var(--radius-sm)] bg-white outline-none"
        />
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="text-[11px] leading-snug flex gap-1.5 group/finding items-center"
    >
      {!readOnly && (
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-current opacity-0 group-hover/finding:opacity-40 transition-opacity touch-none flex-shrink-0"
        >
          <GripVertical className="w-3 h-3" />
        </span>
      )}
      <span className="text-[10px] mt-px flex-shrink-0">&#8226;</span>
      <span
        className={!readOnly ? "cursor-text hover:bg-black/5 rounded px-0.5 -mx-0.5 transition-colors" : ""}
        onClick={!readOnly ? onStartEdit : undefined}
      >
        {text}
      </span>
      {!readOnly && (
        <button
          onClick={onRemove}
          className="ml-auto opacity-0 group-hover/finding:opacity-60 hover:!opacity-100 text-current transition-opacity flex-shrink-0"
          tabIndex={-1}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </li>
  );
}

// ── Droppable Node Card ─────────────────────────────────────────────────

interface MatrixNodeProps {
  nodeKey: keyof IFMMatrix;
  label: string;
  description: string;
  data: IFMMatrixNode;
  readOnly: boolean;
  editingFinding: { nodeKey: string; index: number } | null;
  editingNotes: string | null;
  isOver: boolean;
  onStartEditFinding: (nodeKey: string, index: number) => void;
  onSaveEditFinding: (nodeKey: string, index: number, value: string) => void;
  onCancelEditFinding: () => void;
  onRemoveFinding: (nodeKey: string, index: number) => void;
  onAddFinding: (nodeKey: string) => void;
  onStartEditNotes: (nodeKey: string) => void;
  onSaveEditNotes: (nodeKey: string, value: string) => void;
  onOpenModal: (nodeKey: string) => void;
}

function MatrixNode({
  nodeKey,
  label,
  description,
  data,
  readOnly,
  editingFinding,
  editingNotes,
  isOver,
  onStartEditFinding,
  onSaveEditFinding,
  onCancelEditFinding,
  onRemoveFinding,
  onAddFinding,
  onStartEditNotes,
  onSaveEditNotes,
  onOpenModal,
}: MatrixNodeProps) {
  const { setNodeRef } = useDroppable({ id: `drop-${nodeKey}` });
  const severity = data.severity || "none";
  const hasFindings = data.findings && data.findings.length > 0;
  const [notesValue, setNotesValue] = useState(data.notes);
  const isEditingNotes = editingNotes === nodeKey;

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded-[var(--radius-md)] border transition-all group ${
        SEVERITY_COLORS[severity]
      } ${isOver ? "ring-2 ring-[var(--color-brand-500)] ring-offset-1" : ""}`}
    >
      {/* Header — clickable to open modal */}
      <div
        className={`flex items-center gap-2 mb-1 ${!readOnly ? "cursor-pointer" : ""}`}
        onClick={!readOnly ? () => onOpenModal(nodeKey) : undefined}
      >
        <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[severity]}`} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {!readOnly && (
          <Pencil className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </div>
      <p className="text-[10px] opacity-70 mb-2">{description}</p>

      {/* Findings */}
      {hasFindings && (
        <ul className="space-y-1 mb-2">
          {data.findings.map((f, i) => (
            <DraggableFinding
              key={`${nodeKey}::${i}`}
              id={`${nodeKey}::${i}`}
              text={f}
              readOnly={readOnly}
              isEditing={
                editingFinding?.nodeKey === nodeKey && editingFinding?.index === i
              }
              onStartEdit={() => onStartEditFinding(nodeKey, i)}
              onSaveEdit={(v) => onSaveEditFinding(nodeKey, i, v)}
              onCancelEdit={onCancelEditFinding}
              onRemove={() => onRemoveFinding(nodeKey, i)}
            />
          ))}
        </ul>
      )}

      {!hasFindings && (
        <p className="text-[11px] italic mb-1">No findings</p>
      )}

      {/* Add finding */}
      {!readOnly && (
        <button
          onClick={() => onAddFinding(nodeKey)}
          className="flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity mt-1"
        >
          <Plus className="w-3 h-3" />
          Add finding
        </button>
      )}

      {/* Notes */}
      {data.notes && !isEditingNotes && (
        <p
          className={`text-[11px] italic opacity-80 border-t border-current/10 pt-1.5 mt-1.5 ${
            !readOnly ? "cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition-colors" : ""
          }`}
          onClick={!readOnly ? () => {
            setNotesValue(data.notes);
            onStartEditNotes(nodeKey);
          } : undefined}
        >
          {data.notes}
        </p>
      )}

      {isEditingNotes && (
        <div className="border-t border-current/10 pt-1.5 mt-1.5">
          <textarea
            autoFocus
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onBlur={() => onSaveEditNotes(nodeKey, notesValue)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onSaveEditNotes(nodeKey, notesValue);
              }
            }}
            rows={3}
            className="w-full text-[11px] italic px-1 py-1 border border-[var(--color-brand-500)] rounded-[var(--radius-sm)] bg-white outline-none resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

interface IFMMatrixViewProps {
  matrix: IFMMatrix | Record<string, unknown> | null;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
  readOnly?: boolean;
  onUpdate?: (matrix: IFMMatrix) => void;
}

export function IFMMatrixView({ matrix, status, readOnly = false, onUpdate }: IFMMatrixViewProps) {
  const isGenerating = status === "generating" || status === "streaming";

  // Edit state
  const [editingFinding, setEditingFinding] = useState<{ nodeKey: string; index: number } | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [modalNode, setModalNode] = useState<keyof IFMMatrix | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overNodeKey, setOverNodeKey] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Helper to build a complete matrix from potentially partial data
  const getMatrix = useCallback((): IFMMatrix => {
    const m = (matrix || {}) as Record<string, unknown>;
    return {
      assimilation: (m.assimilation as IFMMatrixNode) || { ...DEFAULT_NODE },
      defense_repair: (m.defense_repair as IFMMatrixNode) || { ...DEFAULT_NODE },
      energy: (m.energy as IFMMatrixNode) || { ...DEFAULT_NODE },
      biotransformation: (m.biotransformation as IFMMatrixNode) || { ...DEFAULT_NODE },
      transport: (m.transport as IFMMatrixNode) || { ...DEFAULT_NODE },
      communication: (m.communication as IFMMatrixNode) || { ...DEFAULT_NODE },
      structural_integrity: (m.structural_integrity as IFMMatrixNode) || { ...DEFAULT_NODE },
    };
  }, [matrix]);

  const updateNode = useCallback(
    (nodeKey: string, updater: (node: IFMMatrixNode) => IFMMatrixNode) => {
      const m = getMatrix();
      const key = nodeKey as keyof IFMMatrix;
      const updated = { ...m, [key]: updater(m[key]) };
      onUpdate?.(updated);
    },
    [getMatrix, onUpdate]
  );

  // ── Inline editing handlers ──────────────────────────────────────────

  const handleStartEditFinding = (nodeKey: string, index: number) => {
    setEditingFinding({ nodeKey, index });
  };

  const handleSaveEditFinding = (nodeKey: string, index: number, value: string) => {
    setEditingFinding(null);
    updateNode(nodeKey, (node) => {
      const findings = [...node.findings];
      if (value.trim()) {
        findings[index] = value.trim();
      } else {
        findings.splice(index, 1);
      }
      return { ...node, findings };
    });
  };

  const handleCancelEditFinding = () => setEditingFinding(null);

  const handleRemoveFinding = (nodeKey: string, index: number) => {
    updateNode(nodeKey, (node) => ({
      ...node,
      findings: node.findings.filter((_, i) => i !== index),
    }));
  };

  const handleAddFinding = (nodeKey: string) => {
    const m = getMatrix();
    const key = nodeKey as keyof IFMMatrix;
    const newIndex = m[key].findings.length;

    updateNode(nodeKey, (n) => ({
      ...n,
      findings: [...n.findings, ""],
    }));

    requestAnimationFrame(() => {
      setEditingFinding({ nodeKey, index: newIndex });
    });
  };

  const handleStartEditNotes = (nodeKey: string) => setEditingNotes(nodeKey);

  const handleSaveEditNotes = (nodeKey: string, value: string) => {
    setEditingNotes(null);
    updateNode(nodeKey, (node) => ({ ...node, notes: value }));
  };

  // ── Modal handlers ───────────────────────────────────────────────────

  const handleOpenModal = (nodeKey: string) => setModalNode(nodeKey as keyof IFMMatrix);

  const handleModalSave = (nodeKey: keyof IFMMatrix, data: IFMMatrixNode) => {
    const m = getMatrix();
    const updated = { ...m, [nodeKey]: data };
    onUpdate?.(updated);
    setModalNode(null);
  };

  // ── Drag and drop handlers ───────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    if (over) {
      const id = over.id as string;
      const match = id.match(/^drop-(.+)$/);
      setOverNodeKey(match ? match[1] : null);
    } else {
      setOverNodeKey(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverNodeKey(null);

    if (!over) return;

    const [sourceNode, sourceIndexStr] = (active.id as string).split("::");
    const sourceIndex = parseInt(sourceIndexStr, 10);

    const targetMatch = (over.id as string).match(/^drop-(.+)$/);
    if (!targetMatch) return;
    const targetNode = targetMatch[1];

    if (sourceNode === targetNode) return;

    const m = getMatrix();
    const sourceKey = sourceNode as keyof IFMMatrix;
    const targetKey = targetNode as keyof IFMMatrix;

    const finding = m[sourceKey].findings[sourceIndex];
    if (!finding) return;

    const updated = {
      ...m,
      [sourceKey]: {
        ...m[sourceKey],
        findings: m[sourceKey].findings.filter((_, i) => i !== sourceIndex),
      },
      [targetKey]: {
        ...m[targetKey],
        findings: [...m[targetKey].findings, finding],
      },
    };

    onUpdate?.(updated);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setOverNodeKey(null);
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-[var(--color-brand-500)]" />
        <p className="text-sm">Mapping findings to IFM Matrix...</p>
      </div>
    );
  }

  if (status === "idle" || !matrix) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <p className="text-sm">Generate a SOAP note to populate the IFM Matrix</p>
      </div>
    );
  }

  const matrixData = getMatrix();

  // Get the active drag item text for overlay
  let activeDragText = "";
  if (activeDragId) {
    const [nodeKey, indexStr] = activeDragId.split("::");
    const node = matrixData[nodeKey as keyof IFMMatrix];
    if (node) activeDragText = node.findings[parseInt(indexStr, 10)] || "";
  }

  const modalNodeDef = modalNode ? MATRIX_NODES.find((n) => n.key === modalNode) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {MATRIX_NODES.map(({ key, label, description }) => (
            <MatrixNode
              key={key}
              nodeKey={key}
              label={label}
              description={description}
              data={matrixData[key]}
              readOnly={readOnly || isGenerating}
              editingFinding={editingFinding}
              editingNotes={editingNotes}
              isOver={overNodeKey === key}
              onStartEditFinding={handleStartEditFinding}
              onSaveEditFinding={handleSaveEditFinding}
              onCancelEditFinding={handleCancelEditFinding}
              onRemoveFinding={handleRemoveFinding}
              onAddFinding={handleAddFinding}
              onStartEditNotes={handleStartEditNotes}
              onSaveEditNotes={handleSaveEditNotes}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragId && activeDragText ? (
            <div className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[var(--color-brand-300)] rounded-full shadow-lg text-[var(--color-text-primary)]">
              {activeDragText}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalNode && modalNodeDef && (
        <IFMNodeModal
          nodeKey={modalNode}
          label={modalNodeDef.label}
          description={modalNodeDef.description}
          data={matrixData[modalNode]}
          onSave={(data) => handleModalSave(modalNode, data)}
          onClose={() => setModalNode(null)}
        />
      )}
    </>
  );
}

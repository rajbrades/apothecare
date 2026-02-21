"use client";

import { useState, useCallback } from "react";
import { Loader2, Pencil } from "lucide-react";
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

// ── Node Card (display-only, click to edit via modal) ───────────────────

interface MatrixNodeProps {
  label: string;
  description: string;
  data: IFMMatrixNode;
  readOnly: boolean;
  onOpenModal: () => void;
}

function MatrixNode({ label, description, data, readOnly, onOpenModal }: MatrixNodeProps) {
  const severity = data.severity || "none";
  const hasFindings = data.findings && data.findings.length > 0;

  return (
    <div
      className={`p-3 rounded-[var(--radius-md)] border transition-all group ${
        SEVERITY_COLORS[severity]
      } ${!readOnly ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={!readOnly ? onOpenModal : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[severity]}`} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {!readOnly && (
          <Pencil className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </div>
      <p className="text-[10px] opacity-70 mb-2">{description}</p>

      {/* Findings */}
      {hasFindings ? (
        <ul className="space-y-1 mb-2">
          {data.findings.map((f, i) => (
            <li key={i} className="text-[11px] leading-snug flex gap-1.5 items-center">
              <span className="text-[10px] mt-px flex-shrink-0">&#8226;</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] italic mb-1">No findings</p>
      )}

      {/* Notes */}
      {data.notes && (
        <p className="text-[11px] italic opacity-80 border-t border-current/10 pt-1.5 mt-1.5">
          {data.notes}
        </p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

interface IFMMatrixViewProps {
  matrix: IFMMatrix | Record<string, unknown> | null;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
  readOnly?: boolean;
  hasSoapNote?: boolean;
  onUpdate?: (matrix: IFMMatrix) => void;
}

export function IFMMatrixView({ matrix, status, readOnly = false, hasSoapNote = false, onUpdate }: IFMMatrixViewProps) {
  const isGenerating = status === "generating" || status === "streaming";
  const [modalNode, setModalNode] = useState<keyof IFMMatrix | null>(null);

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

  const handleModalSave = (nodeKey: keyof IFMMatrix, data: IFMMatrixNode) => {
    const m = getMatrix();
    const updated = { ...m, [nodeKey]: data };
    onUpdate?.(updated);
    setModalNode(null);
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

  if (!matrix) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <p className="text-sm">
          {hasSoapNote
            ? "IFM Matrix has not been generated yet. Regenerate the SOAP note to populate it."
            : "Generate a SOAP note to populate the IFM Matrix"}
        </p>
      </div>
    );
  }

  const matrixData = getMatrix();
  const modalNodeDef = modalNode ? MATRIX_NODES.find((n) => n.key === modalNode) : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {MATRIX_NODES.map(({ key, label, description }) => (
          <MatrixNode
            key={key}
            label={label}
            description={description}
            data={matrixData[key]}
            readOnly={readOnly || isGenerating}
            onOpenModal={() => setModalNode(key)}
          />
        ))}
      </div>

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

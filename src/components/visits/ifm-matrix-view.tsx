"use client";

import { Loader2 } from "lucide-react";
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

interface IFMMatrixViewProps {
  matrix: IFMMatrix | Record<string, unknown> | null;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
}

function MatrixNode({
  node,
  label,
  description,
  data,
}: {
  node: string;
  label: string;
  description: string;
  data?: IFMMatrixNode;
}) {
  const severity = data?.severity || "none";
  const hasFindings = data?.findings && data.findings.length > 0;

  return (
    <div
      className={`p-3 rounded-[var(--radius-md)] border transition-all ${
        SEVERITY_COLORS[severity]
      } ${hasFindings ? "cursor-default" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[severity]}`} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[10px] opacity-70 mb-2">{description}</p>

      {hasFindings && (
        <>
          <ul className="space-y-1 mb-2">
            {data!.findings.map((f, i) => (
              <li key={i} className="text-[11px] leading-snug flex gap-1.5">
                <span className="text-[10px] mt-px">&#8226;</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {data!.notes && (
            <p className="text-[11px] italic opacity-80 border-t border-current/10 pt-1.5 mt-1.5">
              {data!.notes}
            </p>
          )}
        </>
      )}

      {!hasFindings && (
        <p className="text-[11px] italic">No findings</p>
      )}
    </div>
  );
}

export function IFMMatrixView({ matrix, status }: IFMMatrixViewProps) {
  const isGenerating = status === "generating" || status === "streaming";

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

  const matrixData = matrix as IFMMatrix;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {MATRIX_NODES.map(({ key, label, description }) => (
        <MatrixNode
          key={key}
          node={key}
          label={label}
          description={description}
          data={matrixData[key]}
        />
      ))}
    </div>
  );
}

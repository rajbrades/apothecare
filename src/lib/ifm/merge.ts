import type { IFMMatrix, IFMMatrixNode } from "@/types/database";

const SEVERITY_ORDER: Record<string, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
};

const DEFAULT_NODE: IFMMatrixNode = { findings: [], severity: "none", notes: "" };

const MATRIX_KEYS: (keyof IFMMatrix)[] = [
  "assimilation",
  "defense_repair",
  "energy",
  "biotransformation",
  "transport",
  "communication",
  "structural_integrity",
];

/**
 * Merge a single IFM node from a visit into the patient's base node.
 * - Findings: union, deduplicated by case-insensitive trimmed text
 * - Severity: take the higher of the two
 * - Notes: concatenate with separator if both non-empty
 */
export function mergeIFMNode(
  base: IFMMatrixNode | undefined,
  incoming: IFMMatrixNode | undefined
): IFMMatrixNode {
  const b = base || { ...DEFAULT_NODE };
  const i = incoming || { ...DEFAULT_NODE };

  // Deduplicate findings (case-insensitive)
  const existingSet = new Set(b.findings.map((f) => f.trim().toLowerCase()));
  const mergedFindings = [...b.findings];
  for (const finding of i.findings) {
    const normalized = finding.trim().toLowerCase();
    if (normalized && !existingSet.has(normalized)) {
      mergedFindings.push(finding.trim());
      existingSet.add(normalized);
    }
  }

  // Higher severity wins
  const baseSev = SEVERITY_ORDER[b.severity] ?? 0;
  const incomingSev = SEVERITY_ORDER[i.severity] ?? 0;
  const mergedSeverity = incomingSev > baseSev ? i.severity : b.severity;

  // Concatenate notes
  let mergedNotes = b.notes || "";
  if (i.notes && i.notes.trim()) {
    if (mergedNotes.trim()) {
      mergedNotes = `${mergedNotes.trim()}\n\n${i.notes.trim()}`;
    } else {
      mergedNotes = i.notes.trim();
    }
  }

  return {
    findings: mergedFindings,
    severity: mergedSeverity,
    notes: mergedNotes,
  };
}

/**
 * Merge a visit-level IFM Matrix into a patient-level IFM Matrix.
 * Non-destructive: preserves all existing patient findings and only adds new data.
 */
export function mergeIFMMatrix(
  base: IFMMatrix | Record<string, unknown> | null,
  incoming: IFMMatrix | Record<string, unknown> | null
): IFMMatrix {
  const b = (base || {}) as Record<string, unknown>;
  const i = (incoming || {}) as Record<string, unknown>;

  const result: Record<string, IFMMatrixNode> = {};
  for (const key of MATRIX_KEYS) {
    result[key] = mergeIFMNode(
      b[key] as IFMMatrixNode | undefined,
      i[key] as IFMMatrixNode | undefined
    );
  }

  return result as unknown as IFMMatrix;
}

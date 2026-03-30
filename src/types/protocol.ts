// ===========================================
// APOTHECARE - Protocol Generator Pro Types
// ===========================================

// ── Status enums ─────────────────────────────────────────────────────

export type ProtocolStatus = "draft" | "active" | "completed" | "archived";
export type PhaseStatus = "pending" | "active" | "completed" | "extended" | "skipped";

/**
 * Actions for supplements within a protocol phase.
 * NOTE: This is distinct from the existing SupplementAction in database.ts
 * which uses "keep | modify | discontinue | add" for supplement reviews.
 */
export type ProtocolSupplementAction =
  | "start"
  | "continue"
  | "increase"
  | "decrease"
  | "discontinue";

// ── Focus areas ──────────────────────────────────────────────────────

export const FOCUS_AREAS = [
  { key: "gut", label: "Gut Health & Permeability" },
  { key: "thyroid", label: "Thyroid & Metabolic" },
  { key: "methylation", label: "Methylation & Detox" },
  { key: "adrenal", label: "Adrenal & Stress" },
  { key: "neuro", label: "Neurological & Cognitive" },
  { key: "cardiovascular", label: "Cardiovascular" },
  { key: "hormonal", label: "Hormonal Balance" },
  { key: "autoimmune", label: "Autoimmune Management" },
] as const;

export type FocusAreaKey = (typeof FOCUS_AREAS)[number]["key"];

// ── JSONB shapes stored on protocol_phases ───────────────────────────

export interface PhaseSupplementItem {
  name: string;
  dosage: string;
  frequency: string;
  timing: string | null;
  rationale: string;
  rag_source: string | null;
  action: ProtocolSupplementAction;
}

export interface PhaseLabItem {
  name: string;
  rationale: string;
  target_range: string | null;
}

export interface PhaseConditionalRule {
  condition: string;
  action: string;
  fallback: string;
}

// ── Database row types ───────────────────────────────────────────────

export interface TreatmentProtocol {
  id: string;
  patient_id: string;
  practitioner_id: string;
  title: string;
  status: ProtocolStatus;
  focus_areas: string[];
  total_duration_weeks: number | null;
  started_at: string | null;
  completed_at: string | null;
  generation_context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProtocolPhase {
  id: string;
  protocol_id: string;
  phase_number: number;
  title: string;
  goal: string;
  duration_weeks: number;
  status: PhaseStatus;
  started_at: string | null;
  completed_at: string | null;
  supplements: PhaseSupplementItem[];
  diet: string[];
  lifestyle: string[];
  labs_to_order: PhaseLabItem[];
  conditional_logic: PhaseConditionalRule[];
  practitioner_notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProtocolProgress {
  id: string;
  protocol_id: string;
  phase_id: string;
  event_type: string;
  event_date: string;
  detail: Record<string, unknown>;
  created_at: string;
}

// ── Composite types for API responses ────────────────────────────────

export interface ProtocolWithPhases extends TreatmentProtocol {
  phases: ProtocolPhase[];
}

export interface ProtocolListItem extends TreatmentProtocol {
  phase_count?: number;
  active_phase_number?: number;
}

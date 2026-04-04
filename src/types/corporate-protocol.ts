// Corporate Protocol Library — TypeScript types

export interface CorporateAccount {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  branding: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorporateProviderMembership {
  id: string;
  corporate_id: string;
  practitioner_id: string;
  role: "admin" | "provider";
  is_active: boolean;
  joined_at: string;
}

export type ProtocolCategory =
  | "trt"
  | "hrt"
  | "peptides"
  | "metabolic"
  | "thyroid"
  | "gut"
  | "neuro"
  | "other";

export type ProtocolStepType = "medication" | "supplement" | "lifestyle" | "diet";

export interface CorporateProtocol {
  id: string;
  corporate_id: string;
  title: string;
  description: string | null;
  category: ProtocolCategory;
  version: number;
  status: "draft" | "active" | "archived";
  authored_by: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProtocolDecisionRule {
  id: string;
  protocol_id: string;
  rule_name: string;
  parameters: DecisionParameters;
  priority: number;
  is_active: boolean;
}

export interface DecisionParameters {
  sex?: "male" | "female";
  age_min?: number;
  age_max?: number;
  concerns?: string[];
  exclude_concerns?: string[];
  // Lab thresholds — field name matches biomarker convention
  total_testosterone_max?: number;
  total_testosterone_min?: number;
  free_testosterone_max?: number;
  free_testosterone_min?: number;
  fsh_max?: number;
  fsh_min?: number;
  lh_max?: number;
  lh_min?: number;
  igf1_max?: number;
  igf1_min?: number;
  // Extensible — corporate can add custom parameters
  [key: string]: unknown;
}

export interface CorporateProtocolStep {
  id: string;
  protocol_id: string;
  step_order: number;
  step_type: ProtocolStepType;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  cycle_on_days: number | null;
  cycle_off_days: number | null;
  titration_schedule: TitrationStep[] | null;
  timing: string | null;
  clinical_justification: string;
  contraindications: string[];
  references: string[];
  phase_label: string | null;
}

export interface TitrationStep {
  week: number;
  dosage: string;
  condition?: string;
}

export interface CorporateProtocolMonitoring {
  id: string;
  protocol_id: string;
  lab_test: string;
  timing: string;
  target_range: string | null;
  escalation: string | null;
  sort_order: number;
}

export interface CorporateProtocolEvidenceConflict {
  id: string;
  protocol_id: string;
  conflict_description: string;
  org_justification: string;
  evidence_refs: string[];
}

// ── Full protocol with all relations ────────────────────────────────────

export interface CorporateProtocolFull extends CorporateProtocol {
  steps: CorporateProtocolStep[];
  monitoring: CorporateProtocolMonitoring[];
  evidence_conflicts: CorporateProtocolEvidenceConflict[];
  decision_rules: ProtocolDecisionRule[];
  corporate_accounts?: CorporateAccount;
}

// ── Matching types ──────────────────────────────────────────────────────

export interface PatientMatchParameters {
  sex?: "male" | "female";
  age?: number;
  concerns?: string[];
  // Lab values (keyed by biomarker convention)
  total_testosterone?: number;
  free_testosterone?: number;
  fsh?: number;
  lh?: number;
  igf1?: number;
  estradiol?: number;
  hematocrit?: number;
  psa?: number;
  [key: string]: unknown;
}

export interface ProtocolMatch {
  protocol: CorporateProtocol;
  score: number; // 0-100 confidence
  matched_rules: string[];
  justification: string;
}

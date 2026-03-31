// ===========================================
// APOTHECARE - Database Types
// ===========================================
// These types mirror the PostgreSQL schema.
// Regenerate with: npx supabase gen types typescript --local > src/types/database.ts

export type LicenseType = "md" | "do" | "np" | "aprn" | "pa" | "dc" | "nd" | "lac" | "other";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";
export type SubscriptionTier = "free" | "pro" | "pro_plus" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";
export type MessageRole = "user" | "assistant" | "system";
export type LabVendor = "quest" | "labcorp" | "diagnostic_solutions" | "genova" | "precision_analytical" | "mosaic" | "vibrant" | "spectracell" | "realtime_labs" | "zrt" | "other";
export type LabTestType = "blood_panel" | "stool_analysis" | "saliva_hormone" | "urine_hormone" | "organic_acids" | "micronutrient" | "genetic" | "food_sensitivity" | "mycotoxin" | "environmental" | "other";
export type LabReportStatus = "uploading" | "classifying" | "parsing" | "interpreting" | "complete" | "error";
export type BiomarkerFlag = "optimal" | "normal" | "borderline_low" | "borderline_high" | "low" | "high" | "critical";
export type EvidenceLevel = "meta_analysis" | "rct" | "cohort_study" | "case_study" | "clinical_guideline" | "expert_consensus" | "in_vitro" | "other";
export type AuditAction = "create" | "read" | "update" | "delete" | "export" | "login" | "logout" | "upload" | "query" | "generate";
export type VisitStatus = "draft" | "completed";
export type VisitType = "soap" | "follow_up" | "history_physical" | "consult";
export type DocumentType = "intake_form" | "health_history" | "lab_report" | "imaging" | "referral" | "consent" | "insurance" | "outside_encounter_note" | "other";
export type DocumentStatus = "uploading" | "uploaded" | "extracting" | "extracted" | "error";
export type SupplementReviewStatus = "pending" | "generating" | "complete" | "error";
export type InteractionSeverity = "critical" | "caution" | "safe" | "unknown";
export type SupplementAction = "keep" | "modify" | "discontinue" | "add";
export type PatientSupplementStatus = "active" | "discontinued" | "pending_patient";
export type PatientSupplementSource = "manual" | "review" | "patient_reported" | "protocol";
export type PatientReportType = "symptom" | "side_effect" | "improvement" | "concern" | "general";
export type AiInsightType = "clinical_correlation" | "risk_flag" | "trend_observation" | "recommendation";
export type AiInsightConfidence = "high" | "medium" | "low";

// ===========================================
// Table Row Types
// ===========================================

export interface Practitioner {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  license_type: LicenseType;
  license_number: string | null;
  license_state: string | null;
  npi: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  practice_name: string | null;
  logo_storage_path: string | null;
  practice_address_line1: string | null;
  practice_address_line2: string | null;
  practice_city: string | null;
  practice_state: string | null;
  practice_zip: string | null;
  practice_phone: string | null;
  practice_fax: string | null;
  practice_website: string | null;
  specialty_focus: string[] | null;
  years_in_practice: number | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  daily_query_count: number;
  daily_query_reset_at: string;
  monthly_lab_count: number;
  monthly_lab_reset_at: string;
  preferred_evidence_sources: string[] | null;
  default_note_template: string;
  created_at: string;
  updated_at: string;
}

export interface PatientClinicalSummary {
  intake_summary?: string;
  key_findings?: string[];
  medications_from_docs?: string[];
  supplements_from_docs?: string[];
  allergies_from_docs?: string[];
  document_count?: number;
  visit_count?: number;
  last_updated?: string;
}

// ── FM Timeline ──────────────────────────────────────────────────────
export type FMLifeStage = "prenatal" | "birth" | "childhood" | "adolescence" | "adulthood";
export type FMCategory = "antecedent" | "trigger" | "mediator";

export interface FMTimelineEvent {
  id: string;
  category: FMCategory;
  life_stage: FMLifeStage;
  title: string;
  notes?: string;
  year?: number;
  // "patient" will be used when the patient portal adds events directly
  source?: "practitioner" | "patient";
}

export interface FMTimelineData {
  events: FMTimelineEvent[];
}

export interface PatientSymptomScores {
  fatigue?: number;
  morning_groggy?: number;
  energy_crash?: number;
  exercise_intol?: number;
  sleep_onset?: number;
  sleep_wake?: number;
  sleep_unrefresh?: number;
  bloating?: number;
  constipation?: number;
  diarrhea?: number;
  reflux?: number;
  food_sens?: number;
  weight?: number;
  cold?: number;
  brain_fog?: number;
  libido?: number;
  mood?: number;
  hair_skin?: number;
  [key: string]: number | undefined;
}

export interface SymptomScoreSnapshot {
  id: string;
  patient_id: string;
  practitioner_id: string;
  scores: PatientSymptomScores;
  notes: string | null;
  source: "intake" | "check_in" | "visit";
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PatientLifestyle {
  diet_type?: string;
  meals_per_day?: string;
  skip_breakfast?: string;
  typical_day_eating?: string;
  sugar_intake?: number;
  water_intake?: string;
  exercise_freq?: string;
  exercise_type?: string;
  exercise_tolerance?: string;
  stress_level?: number;
  stressors?: string[];
  stress_management?: string;
  alcohol?: string;
  caffeine?: string;
  tobacco?: string;
  cannabis?: string;
  other_substances?: string;
  env_exposures?: string[];
  env_detail?: string;
  [key: string]: unknown;
}

export interface Patient {
  id: string;
  practitioner_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  // Contact
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  // Demographics
  gender_identity: string | null;
  ethnicity: string | null;
  referral_source: string | null;
  // Clinical
  chief_complaints: string[] | null;
  medical_history: string | null;
  current_medications: string | null;
  supplements: string | null;
  allergies: string[] | null;
  diagnoses: string[] | null;
  surgeries: Array<{ name: string; year: string }> | null;
  hospitalizations: Array<{ reason: string; year: string }> | null;
  // Family history
  family_history_conditions: string[] | null;
  family_history_detail: string | null;
  // Genetics
  genetic_testing: string | null;
  apoe_genotype: string | null;
  mthfr_variants: string | null;
  // Symptoms & Lifestyle
  symptom_scores: PatientSymptomScores;
  lifestyle: PatientLifestyle;
  // Prior labs & Goals
  prior_labs: string[] | null;
  health_goals: string | null;
  // Existing
  notes: string | null;
  clinical_summary: PatientClinicalSummary;
  ifm_matrix: IFMMatrix | Record<string, unknown>;
  fm_timeline_data: FMTimelineData | null;
  dietary_recommendations: ProtocolItem[] | null;
  lifestyle_recommendations: ProtocolItem[] | null;
  follow_up_labs: ProtocolItem[] | null;
  preferred_evidence_sources: string[] | null;
  portal_status: "not_invited" | "invited" | "active" | "disabled" | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type PatientMedicationStatus = "active" | "discontinued" | "as_needed";
export type PatientMedicationSource = "manual" | "patient_reported" | "document_extracted";

export interface PatientMedication {
  id: string;
  patient_id: string;
  practitioner_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  form: string | null;
  prescriber: string | null;
  indication: string | null;
  status: PatientMedicationStatus;
  source: PatientMedicationSource;
  started_at: string | null;
  discontinued_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PatientSupplement {
  id: string;
  patient_id: string;
  practitioner_id: string;
  name: string;
  dosage: string | null;
  form: string | null;
  frequency: string | null;
  timing: string | null;
  brand: string | null;
  status: PatientSupplementStatus;
  source: PatientSupplementSource;
  review_id: string | null;
  visit_id: string | null;
  started_at: string | null;
  discontinued_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SymptomLog {
  id: string;
  patient_id: string;
  practitioner_id: string;
  symptom_name: string;
  severity: number | null;
  body_system: string | null;
  onset_date: string | null;
  resolved_at: string | null;
  notes: string | null;
  visit_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtocolMilestone {
  id: string;
  patient_id: string;
  practitioner_id: string;
  title: string;
  description: string | null;
  milestone_date: string;
  category: string | null;
  visit_id: string | null;
  clinical_review_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientReport {
  id: string;
  patient_id: string;
  practitioner_id: string;
  report_type: PatientReportType;
  title: string;
  content: string | null;
  severity: number | null;
  reported_date: string;
  related_supplement_id: string | null;
  visit_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  patient_id: string;
  practitioner_id: string;
  insight_type: AiInsightType;
  title: string;
  content: string;
  confidence: AiInsightConfidence | null;
  source_type: string;
  source_id: string;
  body_systems: string[] | null;
  biomarker_codes: string[] | null;
  is_dismissed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id: string;
  practitioner_id: string;
  patient_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  document_type: DocumentType;
  document_date: string | null;
  title: string | null;
  status: DocumentStatus;
  extracted_text: string | null;
  extracted_data: Record<string, unknown>;
  extraction_summary: string | null;
  extraction_model: string | null;
  error_message: string | null;
  uploaded_at: string;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  title: string | null;
  is_deep_consult: boolean;
  model_used: string;
  is_favorited: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  input_tokens: number | null;
  output_tokens: number | null;
  thinking_content: string | null;
  created_at: string;
}

export interface Citation {
  source: string;
  title: string;
  authors?: string[];
  year?: number;
  doi?: string;
  url?: string;
  evidence_level?: EvidenceLevel;
  relevance_score?: number;
  excerpt?: string;
}

export interface ProtocolItem {
  name: string;
  detail: string;
  rationale: string;
  evidence_level?: EvidenceLevel;
  dosage?: string;
  form?: string;
  timing?: string;
  duration?: string;
  interactions?: string[];
}

export interface VisitProtocol {
  supplements: ProtocolItem[];
  dietary: ProtocolItem[];
  lifestyle: ProtocolItem[];
  follow_up_labs: ProtocolItem[];
}

export interface IFMMatrixNode {
  findings: string[];
  severity: "none" | "low" | "moderate" | "high";
  notes: string;
}

export interface IFMMatrix {
  assimilation: IFMMatrixNode;
  defense_repair: IFMMatrixNode;
  energy: IFMMatrixNode;
  biotransformation: IFMMatrixNode;
  transport: IFMMatrixNode;
  communication: IFMMatrixNode;
  structural_integrity: IFMMatrixNode;
}

export interface VitalsData {
  weight_kg?: number;
  height_cm?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate_bpm?: number;
}

export interface HealthRatings {
  sleep?: number;
  stress?: number;
  movement?: number;
  nutrition?: number;
  digestion?: number;
  energy?: number;
  mood?: number;
  hydration?: number;
}

export interface Visit {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  visit_date: string;
  visit_type: VisitType;
  status: VisitStatus;
  note_template: string;
  chief_complaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  raw_notes: string | null;
  ai_soap_note: string | null;
  ai_assessment: string | null;
  ai_plan: string | null;
  template_content: Record<string, unknown> | null;
  ai_protocol: VisitProtocol;
  ifm_matrix: IFMMatrix | Record<string, unknown>;
  vitals_data: VitalsData | null;
  health_ratings: HealthRatings | null;
  conversation_id: string | null;
  is_archived: boolean;
  protocol_pushed_at: string | null;
  vitals_pushed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabReport {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  visit_id: string | null;
  lab_vendor: LabVendor;
  test_type: LabTestType;
  test_name: string | null;
  collection_date: string | null;
  raw_file_url: string;
  raw_file_name: string | null;
  raw_file_size: number | null;
  parsed_data: Record<string, unknown>;
  status: LabReportStatus;
  error_message: string | null;
  parsing_model: string | null;
  parsing_confidence: number | null;
  source_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BiomarkerResult {
  id: string;
  lab_report_id: string;
  patient_id: string | null;
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  value: number;
  unit: string;
  conventional_low: number | null;
  conventional_high: number | null;
  conventional_flag: BiomarkerFlag | null;
  functional_low: number | null;
  functional_high: number | null;
  functional_flag: BiomarkerFlag | null;
  interpretation: string | null;
  clinical_significance: string | null;
  collection_date: string | null;
  created_at: string;
}

export interface BiomarkerReference {
  id: string;
  biomarker_code: string;
  biomarker_name: string;
  category: string;
  conventional_low: number | null;
  conventional_high: number | null;
  conventional_unit: string;
  functional_low: number | null;
  functional_high: number | null;
  description: string | null;
  clinical_notes: string | null;
  source: string | null;
  last_updated: string;
}

// ===========================================
// Supplement Intelligence Types
// ===========================================

export interface InteractionWarning {
  type: "drug_supplement" | "supplement_supplement" | "supplement_condition";
  severity: InteractionSeverity;
  substance_a: string;
  substance_b: string;
  mechanism: string;
  clinical_significance: string;
  recommendation: string;
}

/** A single verified citation with real metadata from CrossRef/PubMed/curated DB */
export interface VerifiedCitation {
  doi: string;
  title: string;
  authors?: string[];
  year?: number;
  source?: string;
  evidence_level: string;
  origin: "crossref" | "pubmed" | "curated";
}

export interface SupplementReviewItem {
  name: string;
  current_dosage?: string;
  action: SupplementAction;
  rationale: string;
  evidence_level?: EvidenceLevel;
  /** @deprecated Use verified_citations instead */
  evidence_doi?: string;
  /** @deprecated Use verified_citations instead */
  evidence_title?: string;
  /** Up to 3 verified citations, ranked by evidence strength (strongest first) */
  verified_citations?: VerifiedCitation[];
  recommended_dosage?: string;
  recommended_form?: string;
  recommended_timing?: string;
  recommended_duration?: string;
  recommended_brand?: string;
  fullscript_product_id?: string;
  interactions: InteractionWarning[];
  biomarker_correlations?: string[];
}

export interface SupplementReviewData {
  items: SupplementReviewItem[];
  additions: SupplementReviewItem[];
  summary: string;
}

export interface SupplementReview {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  status: SupplementReviewStatus;
  review_data: SupplementReviewData;
  raw_ai_text: string | null;
  model_used: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  error_message: string | null;
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionResult {
  severity: InteractionSeverity;
  substance_a: string;
  substance_b: string;
  interaction_type: "drug_supplement" | "supplement_supplement" | "supplement_condition";
  mechanism: string;
  clinical_significance: string;
  recommendation: string;
  evidence_level?: EvidenceLevel;
}

export interface InteractionCheckData {
  interactions: InteractionResult[];
  summary: string;
}

export interface InteractionCheck {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  supplements_input: string;
  medications_input: string;
  result_data: InteractionCheckData;
  raw_ai_text: string | null;
  model_used: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

export interface PractitionerBrandPreference {
  id: string;
  practitioner_id: string;
  brand_name: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PractitionerBiomarkerRange {
  id: string;
  practitioner_id: string;
  biomarker_code: string;
  biomarker_name: string;
  functional_low: number | null;
  functional_high: number | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Supabase Database type (for client typing)
// ===========================================

export interface Database {
  public: {
    Tables: {
      practitioners: {
        Row: Practitioner;
        Insert: Omit<Practitioner, "id" | "created_at" | "updated_at" | "daily_query_count" | "daily_query_reset_at" | "monthly_lab_count" | "monthly_lab_reset_at">;
        Update: Partial<Omit<Practitioner, "id" | "created_at">>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Patient, "id" | "created_at">>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Conversation, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      visits: {
        Row: Visit;
        Insert: Omit<Visit, "id" | "created_at" | "updated_at" | "status" | "ai_protocol" | "ifm_matrix"> & {
          status?: VisitStatus;
          ai_protocol?: VisitProtocol | Record<string, unknown>;
          ifm_matrix?: IFMMatrix | Record<string, unknown>;
        };
        Update: Partial<Omit<Visit, "id" | "created_at">>;
      };
      patient_documents: {
        Row: PatientDocument;
        Insert: Omit<PatientDocument, "id" | "created_at" | "updated_at" | "uploaded_at">;
        Update: Partial<Omit<PatientDocument, "id" | "created_at">>;
      };
      lab_reports: {
        Row: LabReport;
        Insert: Omit<LabReport, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LabReport, "id" | "created_at">>;
      };
      biomarker_results: {
        Row: BiomarkerResult;
        Insert: Omit<BiomarkerResult, "id" | "created_at">;
        Update: Partial<Omit<BiomarkerResult, "id" | "created_at">>;
      };
      biomarker_references: {
        Row: BiomarkerReference;
        Insert: Omit<BiomarkerReference, "id" | "last_updated">;
        Update: Partial<Omit<BiomarkerReference, "id">>;
      };
      supplement_reviews: {
        Row: SupplementReview;
        Insert: Omit<SupplementReview, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SupplementReview, "id" | "created_at">>;
      };
      interaction_checks: {
        Row: InteractionCheck;
        Insert: Omit<InteractionCheck, "id" | "created_at">;
        Update: Partial<Omit<InteractionCheck, "id" | "created_at">>;
      };
      practitioner_brand_preferences: {
        Row: PractitionerBrandPreference;
        Insert: Omit<PractitionerBrandPreference, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PractitionerBrandPreference, "id" | "created_at">>;
      };
      practitioner_biomarker_ranges: {
        Row: PractitionerBiomarkerRange;
        Insert: Omit<PractitionerBiomarkerRange, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PractitionerBiomarkerRange, "id" | "created_at">>;
      };
      symptom_logs: {
        Row: SymptomLog;
        Insert: Omit<SymptomLog, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SymptomLog, "id" | "created_at">>;
      };
      protocol_milestones: {
        Row: ProtocolMilestone;
        Insert: Omit<ProtocolMilestone, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProtocolMilestone, "id" | "created_at">>;
      };
      patient_reports: {
        Row: PatientReport;
        Insert: Omit<PatientReport, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PatientReport, "id" | "created_at">>;
      };
      ai_insights: {
        Row: AiInsight;
        Insert: Omit<AiInsight, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AiInsight, "id" | "created_at">>;
      };
    };
    Functions: {
      check_and_increment_query: {
        Args: { p_practitioner_id: string };
        Returns: boolean;
      };
      search_evidence: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_source?: string | null;
          filter_sources?: string[] | null;
        };
        Returns: Array<{
          id: string;
          document_id: string;
          content: string;
          similarity: number;
          source: string;
          title: string;
          authors: string[];
          publication: string;
          published_date: string;
          doi: string;
          evidence_level: EvidenceLevel;
        }>;
      };
      check_rate_limit: {
        Args: {
          p_practitioner_id: string;
          p_action: string;
          p_max_count: number;
          p_window_interval: string;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        };
      };
    };
  };
}

// Chat attachment metadata (stored in messages.attachments JSONB)
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  storage_path: string;
  extracted_text?: string; // transient — included in prompt, not persisted
}

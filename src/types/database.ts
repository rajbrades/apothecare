// ===========================================
// APOTHECA - Database Types
// ===========================================
// These types mirror the PostgreSQL schema.
// Regenerate with: npx supabase gen types typescript --local > src/types/database.ts

export type LicenseType = "md" | "do" | "np" | "aprn" | "pa" | "dc" | "nd" | "lac" | "other";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";
export type SubscriptionTier = "free" | "pro";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";
export type MessageRole = "user" | "assistant" | "system";
export type LabVendor = "quest" | "labcorp" | "diagnostic_solutions" | "genova" | "precision_analytical" | "mosaic" | "vibrant" | "spectracell" | "realtime_labs" | "zrt" | "other";
export type LabTestType = "blood_panel" | "stool_analysis" | "saliva_hormone" | "urine_hormone" | "organic_acids" | "micronutrient" | "genetic" | "food_sensitivity" | "mycotoxin" | "environmental" | "other";
export type LabReportStatus = "uploading" | "classifying" | "parsing" | "interpreting" | "complete" | "error";
export type BiomarkerFlag = "optimal" | "normal" | "borderline_low" | "borderline_high" | "low" | "high" | "critical";
export type EvidenceLevel = "meta_analysis" | "rct" | "cohort_study" | "case_study" | "clinical_guideline" | "expert_consensus" | "in_vitro" | "other";
export type AuditAction = "create" | "read" | "update" | "delete" | "export" | "login" | "logout" | "upload" | "query" | "generate";

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

export interface Patient {
  id: string;
  practitioner_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  chief_complaints: string[] | null;
  medical_history: string | null;
  current_medications: string | null;
  supplements: string | null;
  allergies: string[] | null;
  notes: string | null;
  is_archived: boolean;
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

export interface Visit {
  id: string;
  practitioner_id: string;
  patient_id: string | null;
  visit_date: string;
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
  ifm_matrix: Record<string, unknown>;
  conversation_id: string | null;
  is_archived: boolean;
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
        Insert: Omit<Visit, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Visit, "id" | "created_at">>;
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
    };
  };
}

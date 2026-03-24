import { z } from "zod";
import { fmTimelineDataSchema } from "./fm-timeline";

// ── Protocol Recommendation Item ──────────────────────────────────────
export const protocolItemSchema = z.object({
  name: z.string(),
  detail: z.string(),
  rationale: z.string(),
  evidence_level: z.string().optional(),
  dosage: z.string().optional(),
  form: z.string().optional(),
  timing: z.string().optional(),
  duration: z.string().optional(),
  interactions: z.array(z.string()).optional(),
});

// ── Create Patient ─────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  date_of_birth: z.string().date().nullable().optional(),
  sex: z.enum(["male", "female", "other"]).nullable().optional(),
  // Contact
  email: z.string().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zip_code: z.string().max(10).nullable().optional(),
  // Demographics
  gender_identity: z.string().max(100).nullable().optional(),
  ethnicity: z.string().max(200).nullable().optional(),
  referral_source: z.string().max(100).nullable().optional(),
  // Clinical
  chief_complaints: z.array(z.string().max(200)).max(20).nullable().optional(),
  medical_history: z.string().max(10000).nullable().optional(),
  current_medications: z.string().max(5000).nullable().optional(),
  supplements: z.string().max(5000).nullable().optional(),
  allergies: z.array(z.string().max(200)).max(50).nullable().optional(),
  diagnoses: z.array(z.string().max(200)).max(50).nullable().optional(),
  surgeries: z.array(z.object({ name: z.string(), year: z.string() })).nullable().optional(),
  hospitalizations: z.array(z.object({ reason: z.string(), year: z.string() })).nullable().optional(),
  // Family history
  family_history_conditions: z.array(z.string().max(200)).max(30).nullable().optional(),
  family_history_detail: z.string().max(5000).nullable().optional(),
  // Genetics
  genetic_testing: z.string().max(100).nullable().optional(),
  apoe_genotype: z.string().max(20).nullable().optional(),
  mthfr_variants: z.string().max(200).nullable().optional(),
  // Symptoms & Lifestyle
  symptom_scores: z.record(z.number().min(0).max(10)).nullable().optional(),
  lifestyle: z.record(z.unknown()).nullable().optional(),
  // Prior labs & Goals
  prior_labs: z.array(z.string().max(200)).max(20).nullable().optional(),
  health_goals: z.string().max(5000).nullable().optional(),
  // Existing
  notes: z.string().max(10000).nullable().optional(),
  ifm_matrix: z.record(z.unknown()).optional(),
  fm_timeline_data: fmTimelineDataSchema.nullable().optional(),
  dietary_recommendations: z.array(protocolItemSchema).nullable().optional(),
  lifestyle_recommendations: z.array(protocolItemSchema).nullable().optional(),
  follow_up_labs: z.array(protocolItemSchema).nullable().optional(),
  preferred_evidence_sources: z.array(z.string().max(50)).max(20).nullable().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// ── Update Patient ─────────────────────────────────────────────────────
export const updatePatientSchema = createPatientSchema.extend({
  is_archived: z.boolean().optional(),
}).partial();

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ── List Query ─────────────────────────────────────────────────────────
export const patientListQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().max(200).optional(),
  archived: z.coerce.boolean().optional().default(false),
});

export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

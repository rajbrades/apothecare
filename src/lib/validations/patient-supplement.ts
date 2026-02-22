import { z } from "zod";

export const patientSupplementStatusEnum = z.enum([
  "active",
  "discontinued",
  "pending_patient",
]);
export type PatientSupplementStatus = z.infer<typeof patientSupplementStatusEnum>;

export const patientSupplementSourceEnum = z.enum([
  "manual",
  "review",
  "patient_reported",
  "protocol",
]);
export type PatientSupplementSource = z.infer<typeof patientSupplementSourceEnum>;

// ── Create ────────────────────────────────────────────────────────────

export const createPatientSupplementSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().max(200).nullable().optional(),
  form: z.string().max(100).nullable().optional(),
  frequency: z.string().max(200).nullable().optional(),
  timing: z.string().max(200).nullable().optional(),
  brand: z.string().max(200).nullable().optional(),
  status: patientSupplementStatusEnum.optional().default("active"),
  source: patientSupplementSourceEnum.optional().default("manual"),
  review_id: z.string().uuid().nullable().optional(),
  started_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional().default(0),
});

export type CreatePatientSupplementInput = z.infer<typeof createPatientSupplementSchema>;

// ── Update ────────────────────────────────────────────────────────────

export const updatePatientSupplementSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  dosage: z.string().max(200).nullable().optional(),
  form: z.string().max(100).nullable().optional(),
  frequency: z.string().max(200).nullable().optional(),
  timing: z.string().max(200).nullable().optional(),
  brand: z.string().max(200).nullable().optional(),
  status: patientSupplementStatusEnum.optional(),
  notes: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  discontinued_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export type UpdatePatientSupplementInput = z.infer<typeof updatePatientSupplementSchema>;

// ── List Query ────────────────────────────────────────────────────────

export const patientSupplementListSchema = z.object({
  status: patientSupplementStatusEnum.optional(),
  include_discontinued: z.coerce.boolean().optional().default(false),
});

// ── Push Review ──────────────────────────────────────────────────────

const supplementActionEnum = z.enum(["keep", "modify", "discontinue", "add"]);

export const pushReviewSchema = z.object({
  review_id: z.string().uuid(),
  action_overrides: z
    .record(z.string(), supplementActionEnum)
    .optional(),
});

export type PushReviewInput = z.infer<typeof pushReviewSchema>;

// ── Push Protocol ───────────────────────────────────────────────────

export const pushProtocolSchema = z.object({
  visit_id: z.string().uuid(),
});

export type PushProtocolInput = z.infer<typeof pushProtocolSchema>;

import { z } from "zod";

// ── Create Patient ─────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  date_of_birth: z.string().date().nullable().optional(),
  sex: z.enum(["male", "female", "other"]).nullable().optional(),
  chief_complaints: z.array(z.string().max(200)).max(20).nullable().optional(),
  medical_history: z.string().max(10000).nullable().optional(),
  current_medications: z.string().max(5000).nullable().optional(),
  supplements: z.string().max(5000).nullable().optional(),
  allergies: z.array(z.string().max(200)).max(50).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// ── Update Patient ─────────────────────────────────────────────────────
export const updatePatientSchema = createPatientSchema.partial();

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ── List Query ─────────────────────────────────────────────────────────
export const patientListQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().max(200).optional(),
  archived: z.coerce.boolean().optional().default(false),
});

export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

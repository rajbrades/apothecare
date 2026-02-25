import { z } from "zod";

// ── Create ──────────────────────────────────────────────────────────

export const createSymptomLogSchema = z.object({
  symptom_name: z.string().min(1, "Symptom name is required").max(200),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  body_system: z.string().max(100).nullable().optional(),
  onset_date: z.string().datetime({ offset: true }).nullable().optional(),
  resolved_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
});
export type CreateSymptomLogInput = z.infer<typeof createSymptomLogSchema>;

// ── Update ──────────────────────────────────────────────────────────

export const updateSymptomLogSchema = z.object({
  symptom_name: z.string().min(1).max(200).optional(),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  body_system: z.string().max(100).nullable().optional(),
  onset_date: z.string().datetime({ offset: true }).nullable().optional(),
  resolved_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
});
export type UpdateSymptomLogInput = z.infer<typeof updateSymptomLogSchema>;

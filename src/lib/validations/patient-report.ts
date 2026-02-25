import { z } from "zod";

export const patientReportTypeEnum = z.enum([
  "symptom",
  "side_effect",
  "improvement",
  "concern",
  "general",
]);

// ── Create ──────────────────────────────────────────────────────────

export const createPatientReportSchema = z.object({
  report_type: patientReportTypeEnum.optional().default("general"),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(5000).nullable().optional(),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  reported_date: z.string().datetime({ offset: true }),
  related_supplement_id: z.string().uuid().nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
});
export type CreatePatientReportInput = z.infer<typeof createPatientReportSchema>;

// ── Update ──────────────────────────────────────────────────────────

export const updatePatientReportSchema = z.object({
  report_type: patientReportTypeEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).nullable().optional(),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  reported_date: z.string().datetime({ offset: true }).optional(),
  related_supplement_id: z.string().uuid().nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
});
export type UpdatePatientReportInput = z.infer<typeof updatePatientReportSchema>;

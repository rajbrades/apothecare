import { z } from "zod";

// ── Upload Document ────────────────────────────────────────────────────
export const uploadDocumentSchema = z.object({
  document_type: z.enum([
    "intake_form", "health_history", "lab_report", "imaging",
    "referral", "consent", "insurance", "outside_encounter_note", "other",
  ]).default("other"),
  title: z.string().max(200).optional(),
  document_date: z.string().date().optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ── List Documents ─────────────────────────────────────────────────────
export const documentListQuerySchema = z.object({
  status: z.enum(["uploading", "uploaded", "extracting", "extracted", "error"]).optional(),
  document_type: z.enum([
    "intake_form", "health_history", "lab_report", "imaging",
    "referral", "consent", "insurance", "outside_encounter_note", "other",
  ]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

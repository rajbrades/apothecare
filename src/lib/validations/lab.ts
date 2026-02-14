import { z } from "zod";

// ── Upload Lab Report ─────────────────────────────────────────────────
export const uploadLabSchema = z.object({
  patient_id: z.string().uuid().nullable().optional(),
  lab_vendor: z.enum([
    "quest", "labcorp", "diagnostic_solutions", "genova",
    "precision_analytical", "mosaic", "vibrant", "spectracell",
    "realtime_labs", "zrt", "other",
  ]).optional().default("other"),
  test_type: z.enum([
    "blood_panel", "stool_analysis", "saliva_hormone", "urine_hormone",
    "organic_acids", "micronutrient", "genetic", "food_sensitivity",
    "mycotoxin", "environmental", "other",
  ]).optional().default("other"),
  test_name: z.string().max(200).optional(),
  collection_date: z.string().date().optional(),
});

export type UploadLabInput = z.infer<typeof uploadLabSchema>;

// ── List Lab Reports ──────────────────────────────────────────────────
export const labListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum([
    "uploading", "classifying", "parsing", "interpreting", "complete", "error",
  ]).optional(),
  test_type: z.enum([
    "blood_panel", "stool_analysis", "saliva_hormone", "urine_hormone",
    "organic_acids", "micronutrient", "genetic", "food_sensitivity",
    "mycotoxin", "environmental", "other",
  ]).optional(),
  lab_vendor: z.enum([
    "quest", "labcorp", "diagnostic_solutions", "genova",
    "precision_analytical", "mosaic", "vibrant", "spectracell",
    "realtime_labs", "zrt", "other",
  ]).optional(),
  patient_id: z.string().uuid().optional(),
});

export type LabListQuery = z.infer<typeof labListQuerySchema>;

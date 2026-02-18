import { z } from "zod";

// ── Create Visit ────────────────────────────────────────────────────────
export const VISIT_TYPES = [
  "soap",
  "follow_up",
  "history_physical",
  "consult",
] as const;

export type VisitType = (typeof VISIT_TYPES)[number];

export const createVisitSchema = z.object({
  visit_type: z.enum(VISIT_TYPES).default("soap"),
  patient_id: z.string().uuid("Invalid patient ID").nullable().optional(),
  chief_complaint: z.string().max(500, "Chief complaint too long").nullable().optional(),
  visit_date: z.string().datetime({ offset: true }).optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;

// ── Update Visit ────────────────────────────────────────────────────────
export const updateVisitSchema = z.object({
  chief_complaint: z.string().max(500).nullable().optional(),
  raw_notes: z.string().max(50000, "Notes too long").nullable().optional(),
  subjective: z.string().max(20000).nullable().optional(),
  objective: z.string().max(20000).nullable().optional(),
  assessment: z.string().max(20000).nullable().optional(),
  plan: z.string().max(20000).nullable().optional(),
  status: z.enum(["draft", "completed"]).optional(),
  patient_id: z.string().uuid("Invalid patient ID").nullable().optional(),
  visit_type: z.enum(VISIT_TYPES).optional(),
  ifm_matrix: z.record(z.unknown()).optional(),
  ai_protocol: z.record(z.unknown()).optional(),
  template_content: z.record(z.unknown()).nullable().optional(),
});

export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

// ── Generate (AI) ───────────────────────────────────────────────────────
export const generateVisitSchema = z.object({
  raw_notes: z
    .string()
    .min(10, "Notes must be at least 10 characters")
    .max(50000, "Notes too long"),
  sections: z
    .array(z.enum(["soap", "ifm_matrix", "protocol"]))
    .default(["soap", "ifm_matrix", "protocol"]),
});

export type GenerateVisitInput = z.infer<typeof generateVisitSchema>;

// ── List Query ──────────────────────────────────────────────────────────
export const visitListQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(20),
  status: z.enum(["draft", "completed"]).optional(),
  patient_id: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type VisitListQuery = z.infer<typeof visitListQuerySchema>;

// ── Scribe (Transcript → Sections) ──────────────────────────────────
export const scribeSchema = z.object({
  transcript: z
    .string()
    .min(10, "Transcript must be at least 10 characters")
    .max(100000, "Transcript too long (max 100,000 characters)"),
});

export type ScribeInput = z.infer<typeof scribeSchema>;

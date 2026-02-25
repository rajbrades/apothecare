import { z } from "zod";

export const aiInsightTypeEnum = z.enum([
  "clinical_correlation",
  "risk_flag",
  "trend_observation",
  "recommendation",
]);

export const aiInsightConfidenceEnum = z.enum(["high", "medium", "low"]);

// ── Create ──────────────────────────────────────────────────────────

export const createAiInsightSchema = z.object({
  insight_type: aiInsightTypeEnum,
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1).max(5000),
  confidence: aiInsightConfidenceEnum.nullable().optional(),
  source_type: z.string().min(1).max(100),
  source_id: z.string().uuid(),
  body_systems: z.array(z.string().max(50)).optional(),
  biomarker_codes: z.array(z.string().max(50)).optional(),
});
export type CreateAiInsightInput = z.infer<typeof createAiInsightSchema>;

// ── Update ──────────────────────────────────────────────────────────

export const updateAiInsightSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  confidence: aiInsightConfidenceEnum.nullable().optional(),
  is_dismissed: z.boolean().optional(),
  body_systems: z.array(z.string().max(50)).optional(),
  biomarker_codes: z.array(z.string().max(50)).optional(),
});
export type UpdateAiInsightInput = z.infer<typeof updateAiInsightSchema>;

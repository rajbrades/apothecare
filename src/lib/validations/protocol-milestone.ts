import { z } from "zod";

// ── Create ──────────────────────────────────────────────────────────

export const createProtocolMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  milestone_date: z.string().datetime({ offset: true }),
  category: z.string().max(100).nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
  clinical_review_id: z.string().uuid().nullable().optional(),
});
export type CreateProtocolMilestoneInput = z.infer<typeof createProtocolMilestoneSchema>;

// ── Update ──────────────────────────────────────────────────────────

export const updateProtocolMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  milestone_date: z.string().datetime({ offset: true }).optional(),
  category: z.string().max(100).nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
  clinical_review_id: z.string().uuid().nullable().optional(),
});
export type UpdateProtocolMilestoneInput = z.infer<typeof updateProtocolMilestoneSchema>;

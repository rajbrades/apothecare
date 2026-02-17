import { z } from "zod";

// ── Supplement Review Request ───────────────────────────────────────
export const supplementReviewRequestSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
});
export type SupplementReviewRequest = z.infer<typeof supplementReviewRequestSchema>;

// ── Interaction Check Request ───────────────────────────────────────
export const interactionCheckSchema = z.object({
  supplements: z
    .string()
    .min(1, "At least one supplement is required")
    .max(5000, "Supplements list too long"),
  medications: z
    .string()
    .max(5000, "Medications list too long")
    .optional()
    .default(""),
  patient_id: z
    .string()
    .uuid("Invalid patient ID")
    .nullable()
    .optional(),
});
export type InteractionCheckInput = z.infer<typeof interactionCheckSchema>;

// ── Brand Preferences ───────────────────────────────────────────────
export const SUPPORTED_BRANDS = [
  "Apex Energetics",
  "Orthomolecular Products",
  "Designs for Health",
  "Pure Encapsulations",
  "Metagenics",
] as const;

export const brandPreferenceSchema = z.object({
  brand_name: z.string().min(1).max(200),
  priority: z.number().int().min(0).max(100).optional().default(0),
  is_active: z.boolean().optional().default(true),
});
export type BrandPreferenceInput = z.infer<typeof brandPreferenceSchema>;

export const updateBrandPreferencesSchema = z.object({
  brands: z.array(brandPreferenceSchema).max(20),
  strict_mode: z.boolean().optional(),
});
export type UpdateBrandPreferencesInput = z.infer<typeof updateBrandPreferencesSchema>;

// ── Review List Query ───────────────────────────────────────────────
export const supplementReviewListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  patient_id: z.string().uuid().optional(),
});
export type SupplementReviewListQuery = z.infer<typeof supplementReviewListSchema>;

import { z } from "zod";

// ── Supplement Review Request ───────────────────────────────────────
export const supplementReviewRequestSchema = z
  .object({
    patient_id: z.string().uuid("Invalid patient ID").nullable().optional(),
    supplements: z
      .string()
      .min(1, "At least one supplement is required")
      .max(5000, "Supplements list too long")
      .optional(),
    medications: z.string().max(5000, "Medications list too long").optional(),
    medical_context: z
      .string()
      .max(5000, "Medical context too long")
      .optional(),
  })
  .refine((data) => data.patient_id || data.supplements, {
    message: "Either a patient or a supplements list is required",
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

// Default curated brands shown in the formulary grid
export const SUPPORTED_BRANDS = [
  "Apex Energetics",
  "Orthomolecular Products",
  "Designs for Health",
  "Pure Encapsulations",
  "Metagenics",
] as const;

// Broader known-brands list used for autocomplete + unrecognized-brand warnings
// when practitioners add custom brands. Fullscript-based ordering lookup is a
// future enhancement once that API integration is live.
export const KNOWN_SUPPLEMENT_BRANDS = [
  // Default curated set
  "Apex Energetics",
  "Orthomolecular Products",
  "Designs for Health",
  "Pure Encapsulations",
  "Metagenics",
  // Professional / practitioner-channel brands
  "Thorne Research",
  "Integrative Therapeutics",
  "Klaire Labs",
  "Nordic Naturals",
  "Douglas Laboratories",
  "Xymogen",
  "Biotics Research",
  "Standard Process",
  "Vital Nutrients",
  "Seeking Health",
  "Quicksilver Scientific",
  "Moss Nutrition",
  "Protocol for Life Balance",
  "Allergy Research Group",
  "Kirkman Labs",
  "AOR",
  "Nutri-Dyn",
  "Priority One",
  "Biogenesis Nutraceuticals",
  "Nutritional Frontiers",
  "Transformation Enzyme",
  "Gaia Herbs",
  "Genestra",
  "Seroyal",
  "CanPrev",
  "Pharmax",
  "Rx Vitamins",
  // Widely available supplement brands
  "Life Extension",
  "Jarrow Formulas",
  "NOW Foods",
  "Garden of Life",
  "Natural Factors",
  "Solgar",
  "MegaFood",
  "New Chapter",
  "Bluebonnet Nutrition",
  "Country Life Vitamins",
  "Source Naturals",
  "Nature's Way",
  "Nature's Plus",
  "Enzymedica",
  "Solaray",
  "Carlson Labs",
  "Barlean's",
  "Doctor's Best",
  "Rainbow Light",
  "American Health",
  // International practitioner brands
  "Biocare",
  "Lamberts",
  "Viridian",
  "Nutri Advanced",
  "Terranova",
  "Cytoplan",
  "OptiBac",
  "Higher Nature",
  "Quest Vitamins",
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

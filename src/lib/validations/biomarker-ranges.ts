import { z } from "zod";

export const biomarkerRangeOverrideSchema = z.object({
  biomarker_code: z.string().min(1, "Biomarker code is required"),
  biomarker_name: z.string().min(1, "Biomarker name is required"),
  functional_low: z.number().nullable(),
  functional_high: z.number().nullable(),
});

export const updateBiomarkerRangesSchema = z.array(biomarkerRangeOverrideSchema);

export type BiomarkerRangeOverride = z.infer<typeof biomarkerRangeOverrideSchema>;

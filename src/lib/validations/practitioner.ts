import { z } from "zod";
import { ALL_SOURCE_IDS } from "@/lib/ai/source-filter";

export const updateEvidenceSourcesSchema = z.object({
  sources: z
    .array(z.enum(ALL_SOURCE_IDS as [string, ...string[]]))
    .min(1, "At least one source is required")
    .max(ALL_SOURCE_IDS.length),
});

export type UpdateEvidenceSourcesInput = z.infer<typeof updateEvidenceSourcesSchema>;

import { z } from "zod";

export const biomarkerTimelineQuerySchema = z.object({
  biomarker_code: z.string().max(100).optional(),
});

export type BiomarkerTimelineQuery = z.infer<typeof biomarkerTimelineQuerySchema>;

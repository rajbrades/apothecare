import { z } from "zod";

const scoreValue = z.number().int().min(0).max(10);

export const symptomCheckinSchema = z.object({
  scores: z
    .record(z.string(), scoreValue)
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one symptom score is required",
    }),
  notes: z.string().max(2000).optional(),
});

export type SymptomCheckinInput = z.infer<typeof symptomCheckinSchema>;

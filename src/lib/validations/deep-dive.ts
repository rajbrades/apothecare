import { z } from "zod";

export const deepDiveSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters").max(500),
  followUp: z.string().max(1000).optional(),
});

export type DeepDiveInput = z.infer<typeof deepDiveSchema>;

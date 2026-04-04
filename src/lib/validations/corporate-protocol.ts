import { z } from "zod";

export const protocolMatchSchema = z.object({
  sex: z.enum(["male", "female"]).optional(),
  age: z.number().int().min(1).max(120).optional(),
  concerns: z.array(z.string().max(200)).max(20).optional(),
  // Lab values
  total_testosterone: z.number().positive().optional(),
  free_testosterone: z.number().positive().optional(),
  fsh: z.number().min(0).optional(),
  lh: z.number().min(0).optional(),
  igf1: z.number().positive().optional(),
  estradiol: z.number().min(0).optional(),
  hematocrit: z.number().min(0).max(100).optional(),
  psa: z.number().min(0).optional(),
  // Patient chart auto-pull
  patient_id: z.string().uuid().optional(),
});

export type ProtocolMatchInput = z.infer<typeof protocolMatchSchema>;

export const protocolListQuerySchema = z.object({
  category: z
    .enum(["trt", "hrt", "peptides", "metabolic", "thyroid", "gut", "neuro", "other"])
    .optional(),
  search: z.string().max(200).optional(),
});

export type ProtocolListQuery = z.infer<typeof protocolListQuerySchema>;

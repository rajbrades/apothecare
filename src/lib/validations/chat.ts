import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(10000, "Message too long"),
  conversation_id: z
    .string()
    .uuid("Invalid conversation ID")
    .nullable()
    .optional(),
  patient_id: z
    .string()
    .uuid("Invalid patient ID")
    .nullable()
    .optional(),
  is_deep_consult: z.boolean().optional().default(false),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

import { z } from "zod";

const chatAttachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255),
  size: z.number().int().max(10_485_760),
  type: z.string().max(100),
  storage_path: z.string().max(500),
  extracted_text: z.string().max(15000).optional(),
});

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
  clinical_lens: z.enum(["functional", "conventional", "both"]).optional().default("functional"),
  source_filter: z.array(z.string().max(50)).max(20).optional(),
  attachments: z.array(chatAttachmentSchema).max(5).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const chatHistoryQuerySchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation ID"),
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .optional()
    .default(50),
});

export type ChatHistoryQuery = z.infer<typeof chatHistoryQuerySchema>;

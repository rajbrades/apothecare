import { z } from "zod";

// ── List Query ─────────────────────────────────────────────────────────
export const conversationListQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().max(200).optional(),
  filter: z.enum(["active", "archived", "favorites"]).optional().default("active"),
});

export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;

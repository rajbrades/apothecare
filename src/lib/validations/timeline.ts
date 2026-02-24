import { z } from "zod";

const TIMELINE_EVENT_TYPES = [
  "lab_result",
  "visit",
  "supplement_start",
  "supplement_stop",
  "supplement_dose_change",
  "document_upload",
  "symptom_log",
  "protocol_milestone",
  "patient_reported",
  "ai_insight",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const timelineQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  event_types: z.string().max(500).optional(), // comma-separated
  body_systems: z.string().max(500).optional(), // comma-separated
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;

export const timelineEventCreateSchema = z.object({
  event_type: z.enum(TIMELINE_EVENT_TYPES),
  event_date: z.string().datetime({ offset: true }),
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  detail: z.record(z.unknown()).optional(),
  source_table: z.string().min(1).max(100),
  source_id: z.string().uuid(),
  body_systems: z.array(z.string().max(50)).optional(),
  biomarker_codes: z.array(z.string().max(50)).optional(),
});

export type TimelineEventCreate = z.infer<typeof timelineEventCreateSchema>;

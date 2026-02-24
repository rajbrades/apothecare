import { z } from "zod";

// ── Shared enums ─────────────────────────────────────────────────────
export const fmCategorySchema = z.enum(["antecedent", "trigger", "mediator"]);
export const fmLifeStageSchema = z.enum(["prenatal", "birth", "childhood", "adolescence", "adulthood"]);

// ── Single event ─────────────────────────────────────────────────────
export const fmTimelineEventSchema = z.object({
  id: z.string().min(1),
  category: fmCategorySchema,
  life_stage: fmLifeStageSchema,
  title: z.string().min(1).max(300),
  notes: z.string().max(2000).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  source: z.enum(["practitioner", "patient"]).optional(),
});

// ── Full JSONB payload (stored on patients.fm_timeline_data) ─────────
export const fmTimelineDataSchema = z.object({
  events: z.array(fmTimelineEventSchema).max(500),
});

// ── POST /fm-timeline/events — push a single event ───────────────────
export const pushFMEventSchema = z.object({
  category: fmCategorySchema,
  life_stage: fmLifeStageSchema,
  title: z.string().min(1).max(300),
  notes: z.string().max(2000).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  source: z.enum(["practitioner", "patient"]).optional().default("practitioner"),
});

export type PushFMEventInput = z.infer<typeof pushFMEventSchema>;

// ── POST /fm-timeline/analyze — expects events array ─────────────────
export const analyzeFMTimelineSchema = z.object({
  events: z.array(fmTimelineEventSchema).min(1, "At least one event is required").max(500),
});

export type AnalyzeFMTimelineInput = z.infer<typeof analyzeFMTimelineSchema>;

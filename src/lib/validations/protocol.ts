import { z } from "zod";

// ── Generate Protocol (AI) ───────────────────────────────────────────

export const generateProtocolSchema = z.object({
  focus_areas: z
    .array(z.string())
    .min(1, "Select at least one focus area")
    .max(5, "Maximum 5 focus areas"),
  custom_instructions: z.string().max(2000).optional(),
});

export type GenerateProtocolInput = z.infer<typeof generateProtocolSchema>;

// ── Update Protocol ──────────────────────────────────────────────────

export const updateProtocolSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z
    .enum(["draft", "active", "completed", "archived"])
    .optional(),
});

export type UpdateProtocolInput = z.infer<typeof updateProtocolSchema>;

// ── Update Phase ─────────────────────────────────────────────────────

const phaseSupplementSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  timing: z.string().nullable(),
  rationale: z.string(),
  rag_source: z.string().nullable(),
  action: z.enum([
    "start",
    "continue",
    "increase",
    "decrease",
    "discontinue",
  ]),
});

const phaseLabSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  target_range: z.string().nullable(),
});

const phaseConditionalRuleSchema = z.object({
  condition: z.string(),
  action: z.string(),
  fallback: z.string(),
});

export const updatePhaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  goal: z.string().max(1000).optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  supplements: z.array(phaseSupplementSchema).optional(),
  diet: z.array(z.string()).optional(),
  lifestyle: z.array(z.string()).optional(),
  labs_to_order: z.array(phaseLabSchema).optional(),
  conditional_logic: z
    .array(phaseConditionalRuleSchema)
    .nullable()
    .optional(),
  practitioner_notes: z.string().max(5000).nullable().optional(),
});

export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;

// ── AI Protocol Output (validates structured AI response) ────────────

export const aiProtocolOutputSchema = z.object({
  title: z.string(),
  total_duration_weeks: z.number(),
  phases: z.array(
    z.object({
      phase_number: z.number(),
      title: z.string(),
      goal: z.string(),
      duration_weeks: z.number(),
      supplements: z.array(
        z.object({
          name: z.string(),
          dosage: z.string(),
          frequency: z.string(),
          timing: z.string().nullable().optional(),
          rationale: z.string(),
          rag_source: z.string().nullable().optional(),
          action: z
            .enum([
              "start",
              "continue",
              "increase",
              "decrease",
              "discontinue",
            ])
            .optional()
            .default("start"),
        })
      ),
      diet: z.array(z.string()).optional().default([]),
      lifestyle: z.array(z.string()).optional().default([]),
      labs_to_order: z
        .array(
          z.object({
            name: z.string(),
            rationale: z.string(),
            target_range: z.string().nullable().optional(),
          })
        )
        .optional()
        .default([]),
      conditional_logic: z
        .array(
          z.object({
            condition: z.string(),
            action: z.string(),
            fallback: z.string(),
          })
        )
        .nullable()
        .optional()
        .default([]),
    })
  ),
});

export type AIProtocolOutput = z.infer<typeof aiProtocolOutputSchema>;

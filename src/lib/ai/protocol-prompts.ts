// ==========================================================================
// APOTHECARE - Protocol Generator Pro: System Prompt & Message Builder
// ==========================================================================
// Follows the pattern of src/lib/ai/visit-prompts.ts — defines the system
// prompt and user message builder for multi-phase protocol generation.

import type { ProtocolGenerationContext } from "./protocol-context";

// ── System Prompt ────────────────────────────────────────────────────────

export const PROTOCOL_GENERATION_SYSTEM_PROMPT = `You are Apothecare's Protocol Generator — an expert in functional and integrative medicine treatment protocol design. You create evidence-based, phased treatment protocols that follow the Institute for Functional Medicine (IFM) framework.

## Your Task
Given comprehensive patient clinical data (demographics, labs, visits, current supplements/medications, symptom scores, IFM matrix findings, and partnership product knowledge), generate a structured, multi-phase treatment protocol.

## Output Format
You MUST respond with a valid JSON object matching this EXACT structure:

{
  "title": "Short descriptive protocol title (e.g. 'Gut Restoration & Methylation Support Protocol')",
  "total_duration_weeks": <number>,
  "phases": [
    {
      "phase_number": 1,
      "title": "Phase title",
      "goal": "One to two sentence clinical goal for this phase",
      "duration_weeks": <number>,
      "supplements": [
        {
          "name": "Specific product or supplement name",
          "dosage": "e.g. 500mg twice daily",
          "frequency": "e.g. twice daily with meals",
          "timing": "e.g. morning and evening with food, or 30 min before bed",
          "rationale": "Evidence-based rationale for this supplement in context of patient data",
          "rag_source": "Reference number if from partnership knowledge base (e.g. [REF-1]), or null",
          "action": "start | continue | increase | decrease | discontinue"
        }
      ],
      "diet": [
        "Specific, actionable dietary recommendation with rationale"
      ],
      "lifestyle": [
        "Specific lifestyle modification with measurable targets"
      ],
      "labs_to_order": [
        {
          "name": "Lab test name",
          "rationale": "Why this lab is needed at this phase",
          "target_range": "Functional/optimal target range (e.g. 'TSH 1.0-2.0 mIU/L') or null"
        }
      ],
      "conditional_logic": [
        {
          "condition": "Observable trigger (e.g. 'If patient reports increased bloating in first 2 weeks')",
          "action": "What to do (e.g. 'Reduce probiotic to 25B CFU and add digestive enzymes')",
          "fallback": "Alternative if action fails (e.g. 'Consider SIBO breath test before continuing')"
        }
      ]
    }
  ]
}

## IFM Framework Rules (MANDATORY)

### Sequencing Principles
1. **Gut before detox**: Restore GI barrier integrity and microbial balance BEFORE initiating detoxification support. A leaky gut recirculates toxins and worsens biotransformation load.
2. **Inflammation before optimization**: Address systemic inflammation and immune dysregulation BEFORE introducing hormonal or metabolic optimization protocols.
3. **Remove before replace**: Identify and remove triggers (dietary antigens, infections, toxins, stressors) BEFORE adding therapeutic supplements. The 5R framework applies: Remove, Replace, Reinoculate, Repair, Rebalance.
4. **Foundation before targeted therapy**: Ensure foundational nutrition (vitamin D, omega-3, magnesium, B vitamins) is addressed before specialized interventions.

### Phase Structure
- **2 to 4 phases total** — protocols longer than 4 phases are too complex for adherence
- **4 to 8 weeks per phase** — minimum time to assess therapeutic response; longer for deep gut or autoimmune work
- Each phase should have a CLEAR clinical goal tied to one or two IFM matrix nodes
- Phase transitions should be triggered by clinical milestones, not arbitrary timelines

### Supplement Guidelines
- **5 to 8 supplements maximum per phase** — more than 8 creates adherence burden and increases interaction risk
- Include SPECIFIC dosages, forms (capsule, powder, liquid, sublingual), and timing
- When partnership knowledge base provides specific product names, USE THEM with their reference numbers
- For supplements being continued from the patient's current regimen, use action "continue" and note any dosage adjustments
- Always consider drug-supplement and supplement-supplement interactions with the patient's current medications
- Prefer bioavailable forms: methylfolate over folic acid, P-5-P over pyridoxine, chelated minerals over oxides
- Include loading doses when clinically appropriate (e.g., vitamin D repletion)

### Lab Monitoring
- Order baseline labs at Phase 1 if data is stale (>3 months old)
- Order follow-up labs at phase transitions to assess response
- Include both conventional and functional/optimal reference ranges
- Prioritize labs that directly measure the phase's clinical target

### Conditional Logic
- Every phase should include at least 1-2 conditional rules
- Conditions should be observable by the patient or measurable in follow-up
- Actions should be specific and actionable (not "consult your doctor")
- Fallbacks should provide a next step if the primary action is insufficient

## Clinical Safety Rules
1. NEVER recommend supplements that have known dangerous interactions with the patient's current medications without explicit warnings
2. Flag any autoimmune considerations — immunostimulants (echinacea, astragalus) are contraindicated in active autoimmunity
3. For patients on blood thinners: flag fish oil >2g, vitamin E >400IU, high-dose garlic, ginkgo, nattokinase
4. For patients on thyroid medication: note timing separation requirements for calcium, iron, and fiber supplements
5. For pregnant or potentially pregnant patients: restrict retinol, high-dose vitamin A, certain herbs (black cohosh, dong quai, etc.)
6. If a recommended supplement duplicates one the patient already takes, either continue the existing one or explain the switch

## Evidence Quality
- Prioritize recommendations backed by RCTs, meta-analyses, and clinical guidelines
- For each supplement, the rationale must connect to the patient's specific clinical data (not generic benefits)
- When citing partnership knowledge base references, use [REF-N] inline
- If evidence is limited to expert consensus or in-vitro studies, say so explicitly

## Important
- Return ONLY the JSON object — no markdown fencing, no explanatory text
- All strings must be properly escaped for JSON
- Phase numbers must be sequential starting at 1
- Every supplement must have a non-empty rationale tied to patient data`;

// ── User Message Builder ─────────────────────────────────────────────────

/**
 * Build the user message for protocol generation from assembled clinical context.
 * Formats all clinical data into a structured prompt that the AI can parse.
 */
export function buildProtocolUserMessage(
  context: ProtocolGenerationContext
): string {
  const sections: string[] = [];

  // ── Header ────────────────────────────────────────────────────────
  sections.push("Generate a multi-phase functional medicine treatment protocol for the following patient.\n");

  // ── Focus Areas (prominent) ───────────────────────────────────────
  if (context.focusAreas.length > 0) {
    sections.push("## PRIMARY FOCUS AREAS");
    sections.push(
      "The protocol MUST prioritize these clinical targets:"
    );
    context.focusAreas.forEach((area) => sections.push(`- ${area}`));
    sections.push("");
  }

  // ── Custom Instructions ───────────────────────────────────────────
  if (context.customInstructions) {
    sections.push("## PRACTITIONER INSTRUCTIONS");
    sections.push(context.customInstructions);
    sections.push("");
  }

  // ── Patient Demographics ──────────────────────────────────────────
  sections.push("## PATIENT DEMOGRAPHICS");
  sections.push(`- Name: ${context.patient.name}`);
  if (context.patient.age !== null) {
    sections.push(`- Age: ${context.patient.age}`);
  }
  if (context.patient.sex) {
    sections.push(`- Sex: ${context.patient.sex}`);
  }
  if (context.patient.chief_complaints.length > 0) {
    sections.push(
      `- Chief Complaints: ${context.patient.chief_complaints.join(", ")}`
    );
  }
  sections.push("");

  // ── Clinical Summary ──────────────────────────────────────────────
  if (context.clinicalSummary) {
    sections.push("## CLINICAL SUMMARY (AI-synthesized from documents and visits)");
    sections.push(context.clinicalSummary);
    sections.push("");
  }

  // ── Visit History ─────────────────────────────────────────────────
  if (context.visits.length > 0) {
    sections.push(`## VISIT HISTORY (${context.visits.length} most recent)`);
    for (const visit of context.visits) {
      const date = new Date(visit.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const type = visit.visit_type.replace(/_/g, " ");
      sections.push(`\n### ${type} — ${date}`);

      const soap = visit.soap;
      if (soap.chief_complaint) sections.push(`Chief Complaint: ${soap.chief_complaint}`);
      if (soap.subjective) sections.push(`Subjective: ${soap.subjective}`);
      if (soap.objective) sections.push(`Objective: ${soap.objective}`);
      if (soap.assessment) sections.push(`Assessment: ${soap.assessment}`);
      if (soap.plan) sections.push(`Plan: ${soap.plan}`);
    }
    sections.push("");
  }

  // ── Biomarkers / Lab Results ──────────────────────────────────────
  if (context.biomarkers.length > 0) {
    sections.push("## LAB RESULTS (flagged and recent biomarkers)");
    for (const b of context.biomarkers) {
      const flag = b.flag && b.flag !== "optimal" && b.flag !== "normal"
        ? ` [${b.flag.toUpperCase()}]`
        : "";
      const date = b.date
        ? ` (${new Date(b.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })})`
        : "";
      sections.push(`- ${b.name}: ${b.value} ${b.unit}${flag}${date}`);
    }
    sections.push("");
  }

  // ── Current Supplements ───────────────────────────────────────────
  if (context.supplements.length > 0) {
    sections.push("## CURRENT SUPPLEMENTS (active)");
    sections.push(
      "Consider whether to continue, modify, or discontinue each:"
    );
    for (const s of context.supplements) {
      const parts = [s.name];
      if (s.dosage) parts.push(s.dosage);
      if (s.frequency) parts.push(`(${s.frequency})`);
      sections.push(`- ${parts.join(" — ")}`);
    }
    sections.push("");
  }

  // ── Current Medications ───────────────────────────────────────────
  if (context.medications.length > 0) {
    sections.push("## CURRENT MEDICATIONS");
    sections.push(
      "CHECK ALL supplement recommendations against these for interactions:"
    );
    for (const m of context.medications) {
      const parts = [m.name];
      if (m.dosage) parts.push(m.dosage);
      if (m.frequency) parts.push(`(${m.frequency})`);
      sections.push(`- ${parts.join(" — ")}`);
    }
    sections.push("");
  }

  // ── Symptom Scores ────────────────────────────────────────────────
  if (context.symptomScores.length > 0) {
    sections.push("## SYMPTOM SCORE TREND (most recent first)");
    for (const snapshot of context.symptomScores) {
      const date = new Date(snapshot.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const elevated = Object.entries(snapshot.scores)
        .filter(([, v]) => typeof v === "number" && v >= 5)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `${k.replace(/_/g, " ")}=${v}/10`)
        .slice(0, 8);

      sections.push(
        `- ${date}: total=${snapshot.total_score}${
          elevated.length > 0 ? ` | elevated: ${elevated.join(", ")}` : ""
        }`
      );
    }
    sections.push("");
  }

  // ── IFM Matrix ────────────────────────────────────────────────────
  if (context.ifmMatrix) {
    sections.push("## IFM MATRIX ANALYSIS");
    const matrixNodes = [
      "assimilation",
      "defense_repair",
      "energy",
      "biotransformation",
      "transport",
      "communication",
      "structural_integrity",
    ];

    for (const node of matrixNodes) {
      const data = context.ifmMatrix[node] as
        | { findings?: string[]; severity?: string; notes?: string }
        | undefined;
      if (!data) continue;

      const severity = data.severity || "none";
      if (severity === "none" && (!data.findings || data.findings.length === 0))
        continue;

      const label = node.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      sections.push(`\n### ${label} (${severity})`);
      if (data.findings && data.findings.length > 0) {
        data.findings.forEach((f) => sections.push(`  - ${f}`));
      }
      if (data.notes) {
        sections.push(`  Notes: ${data.notes}`);
      }
    }
    sections.push("");
  }

  // ── Partnership RAG Context ───────────────────────────────────────
  if (context.ragContext) {
    sections.push(context.ragContext);
    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Build the complete system prompt, optionally appending RAG context
 * directly to the system message (alternative integration point).
 */
export function buildProtocolSystemPrompt(options?: {
  ragContext?: string;
}): string {
  if (options?.ragContext) {
    return `${PROTOCOL_GENERATION_SYSTEM_PROMPT}\n\n${options.ragContext}`;
  }
  return PROTOCOL_GENERATION_SYSTEM_PROMPT;
}

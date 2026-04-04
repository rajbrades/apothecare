import type {
  DecisionParameters,
  PatientMatchParameters,
  ProtocolMatch,
  CorporateProtocol,
  ProtocolDecisionRule,
} from "@/types/corporate-protocol";

/**
 * Corporate Protocol Matching Engine
 *
 * Scores patient parameters against protocol decision rules to find
 * the best-match protocol(s). Rules are structured JSONB with field
 * constraints (sex, age range, lab thresholds, clinical concerns).
 *
 * Scoring:
 * - Each matched field contributes points weighted by clinical relevance
 * - Exclusion criteria are hard disqualifiers (score → 0)
 * - Priority field on the rule acts as a tiebreaker
 * - Returns protocols sorted by score descending
 */

const FIELD_WEIGHTS: Record<string, number> = {
  sex: 20,
  age: 15,
  concerns: 25,
  lab_threshold: 15,
};

interface ScoredRule {
  rule: ProtocolDecisionRule;
  score: number;
  matchedFields: string[];
  disqualified: boolean;
}

function scoreRule(
  rule: ProtocolDecisionRule,
  params: PatientMatchParameters
): ScoredRule {
  const p = rule.parameters as DecisionParameters;
  let score = 0;
  const matchedFields: string[] = [];
  let totalPossible = 0;

  // ── Sex match ───────────────────────────────────────────────────
  if (p.sex) {
    totalPossible += FIELD_WEIGHTS.sex;
    if (params.sex === p.sex) {
      score += FIELD_WEIGHTS.sex;
      matchedFields.push(`Sex: ${p.sex}`);
    }
  }

  // ── Age range ───────────────────────────────────────────────────
  if (p.age_min !== undefined || p.age_max !== undefined) {
    totalPossible += FIELD_WEIGHTS.age;
    if (params.age !== undefined) {
      const aboveMin = p.age_min === undefined || params.age >= p.age_min;
      const belowMax = p.age_max === undefined || params.age <= p.age_max;
      if (aboveMin && belowMax) {
        score += FIELD_WEIGHTS.age;
        matchedFields.push(
          `Age ${params.age} within ${p.age_min ?? "any"}-${p.age_max ?? "any"}`
        );
      }
    }
  }

  // ── Exclusion concerns (hard disqualifier) ──────────────────────
  if (p.exclude_concerns && p.exclude_concerns.length > 0 && params.concerns) {
    const patientConcernsLower = params.concerns.map((c) => c.toLowerCase());
    for (const exc of p.exclude_concerns) {
      if (patientConcernsLower.some((c) => c.includes(exc.toLowerCase()))) {
        return { rule, score: 0, matchedFields: [`Excluded: ${exc}`], disqualified: true };
      }
    }
  }

  // ── Matching concerns ──────────────────────────────────────────
  if (p.concerns && p.concerns.length > 0) {
    totalPossible += FIELD_WEIGHTS.concerns;
    if (params.concerns && params.concerns.length > 0) {
      const patientConcernsLower = params.concerns.map((c) => c.toLowerCase());
      const matched = p.concerns.filter((c) =>
        patientConcernsLower.some((pc) => pc.includes(c.toLowerCase()))
      );
      if (matched.length > 0) {
        const ratio = matched.length / p.concerns.length;
        score += Math.round(FIELD_WEIGHTS.concerns * ratio);
        matchedFields.push(`Concerns: ${matched.join(", ")}`);
      }
    }
  }

  // ── Lab thresholds ─────────────────────────────────────────────
  const labFields = [
    "total_testosterone",
    "free_testosterone",
    "fsh",
    "lh",
    "igf1",
    "estradiol",
    "hematocrit",
  ];

  for (const lab of labFields) {
    const maxKey = `${lab}_max` as keyof DecisionParameters;
    const minKey = `${lab}_min` as keyof DecisionParameters;
    const ruleMax = p[maxKey] as number | undefined;
    const ruleMin = p[minKey] as number | undefined;

    if (ruleMax !== undefined || ruleMin !== undefined) {
      totalPossible += FIELD_WEIGHTS.lab_threshold;
      const patientVal = params[lab as keyof PatientMatchParameters] as
        | number
        | undefined;

      if (patientVal !== undefined) {
        const aboveMin = ruleMin === undefined || patientVal >= ruleMin;
        const belowMax = ruleMax === undefined || patientVal <= ruleMax;
        if (aboveMin && belowMax) {
          score += FIELD_WEIGHTS.lab_threshold;
          const label = lab.replace(/_/g, " ");
          matchedFields.push(
            `${label}: ${patientVal} within ${ruleMin ?? "any"}-${ruleMax ?? "any"}`
          );
        }
      }
    }
  }

  // Normalize score to 0-100
  const normalizedScore =
    totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;

  // Add priority bonus (up to 10 points)
  const finalScore = Math.min(100, normalizedScore + Math.min(rule.priority, 10));

  return { rule, score: finalScore, matchedFields, disqualified: false };
}

function buildJustification(matchedFields: string[], score: number): string {
  if (matchedFields.length === 0) {
    return "No specific parameter matches — review protocol suitability manually.";
  }
  const lines = matchedFields.map((f) => `• ${f}`);
  return `Match confidence: ${score}%\n\nMatched criteria:\n${lines.join("\n")}`;
}

/**
 * Match patient parameters against all protocols and their decision rules.
 * Returns ranked matches sorted by score descending.
 */
export function matchProtocols(
  protocols: (CorporateProtocol & { decision_rules: ProtocolDecisionRule[] })[],
  params: PatientMatchParameters
): ProtocolMatch[] {
  const results: ProtocolMatch[] = [];

  for (const protocol of protocols) {
    if (!protocol.decision_rules || protocol.decision_rules.length === 0) continue;

    // Score each rule and take the best one
    let bestResult: ScoredRule | null = null;

    for (const rule of protocol.decision_rules) {
      if (!rule.is_active) continue;
      const result = scoreRule(rule, params);
      if (result.disqualified) {
        bestResult = null;
        break;
      }
      if (!bestResult || result.score > bestResult.score) {
        bestResult = result;
      }
    }

    if (bestResult && bestResult.score > 0) {
      results.push({
        protocol,
        score: bestResult.score,
        matched_rules: [bestResult.rule.rule_name],
        justification: buildJustification(
          bestResult.matchedFields,
          bestResult.score
        ),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

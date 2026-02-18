import type { EvidenceLevel } from "@/components/chat/evidence-badge";

/**
 * Classify a paper's evidence level from its title using keyword matching.
 * Ordered from strongest to weakest evidence type.
 */
export function classifyEvidenceLevel(title: string): EvidenceLevel {
  const t = title.toLowerCase();

  if (t.includes("meta-analysis") || t.includes("systematic review")) {
    return "meta-analysis";
  }

  if (
    t.includes("randomized") ||
    t.includes("randomised") ||
    t.includes("controlled trial") ||
    /\brct\b/.test(t)
  ) {
    return "rct";
  }

  if (
    t.includes("guideline") ||
    t.includes("consensus statement") ||
    t.includes("clinical practice") ||
    t.includes("clinical recommendation")
  ) {
    return "guideline";
  }

  if (
    t.includes("cohort") ||
    t.includes("prospective study") ||
    t.includes("retrospective") ||
    t.includes("observational")
  ) {
    return "cohort";
  }

  if (
    t.includes("case report") ||
    t.includes("case series") ||
    t.includes("case study")
  ) {
    return "case-study";
  }

  // Default: treat as cohort/observational (most common in biomedical literature)
  return "cohort";
}

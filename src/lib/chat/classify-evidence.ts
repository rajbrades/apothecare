import type { EvidenceLevel } from "@/components/chat/evidence-badge";

/**
 * Classify a paper's evidence level from its title and optional PubMed
 * publication types. PubMed types (e.g. "Randomized Controlled Trial",
 * "Meta-Analysis") are more reliable than title keyword matching alone.
 *
 * Ordered from strongest to weakest evidence type.
 */
export function classifyEvidenceLevel(
  title: string,
  pubTypes?: string[]
): EvidenceLevel {
  const t = title.toLowerCase();
  const types = (pubTypes || []).map((p) => p.toLowerCase());

  // ── PubMed publication type matching (most reliable) ────────────────

  if (types.length > 0) {
    const typesJoined = types.join(" ");

    if (typesJoined.includes("meta-analysis") || typesJoined.includes("systematic review")) {
      return "meta-analysis";
    }

    if (
      typesJoined.includes("randomized controlled trial") ||
      typesJoined.includes("controlled clinical trial") ||
      typesJoined.includes("clinical trial, phase iii") ||
      typesJoined.includes("clinical trial, phase iv")
    ) {
      return "rct";
    }

    if (
      typesJoined.includes("practice guideline") ||
      typesJoined.includes("guideline") ||
      typesJoined.includes("consensus development conference")
    ) {
      return "guideline";
    }

    if (
      typesJoined.includes("clinical trial") ||
      typesJoined.includes("comparative study") ||
      typesJoined.includes("multicenter study") ||
      typesJoined.includes("observational study")
    ) {
      return "cohort";
    }

    if (typesJoined.includes("case reports")) {
      return "case-study";
    }
  }

  // ── Title keyword matching (fallback) ───────────────────────────────

  if (
    t.includes("meta-analysis") ||
    t.includes("meta analysis") ||
    t.includes("systematic review") ||
    t.includes("umbrella review")
  ) {
    return "meta-analysis";
  }

  if (
    t.includes("randomized") ||
    t.includes("randomised") ||
    t.includes("controlled trial") ||
    t.includes("double-blind") ||
    t.includes("double blind") ||
    t.includes("placebo-controlled") ||
    t.includes("placebo controlled") ||
    /\brct\b/.test(t)
  ) {
    return "rct";
  }

  if (
    t.includes("guideline") ||
    t.includes("consensus statement") ||
    t.includes("clinical practice") ||
    t.includes("clinical recommendation") ||
    t.includes("position statement") ||
    t.includes("expert consensus")
  ) {
    return "guideline";
  }

  if (
    t.includes("cohort") ||
    t.includes("prospective study") ||
    t.includes("prospective trial") ||
    t.includes("retrospective") ||
    t.includes("observational") ||
    t.includes("cross-sectional") ||
    t.includes("cross sectional") ||
    t.includes("longitudinal") ||
    t.includes("population-based") ||
    t.includes("clinical trial") ||
    t.includes("open-label") ||
    t.includes("pilot study") ||
    t.includes("pilot trial")
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

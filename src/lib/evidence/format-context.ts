/**
 * Evidence Context Formatter
 *
 * Formats retrieved evidence chunks into a structured prompt section
 * for injection into the AI system prompt.
 */

import type { RetrievedEvidence } from "./retrieve";

/**
 * Format retrieved evidence into a structured context block for the system prompt.
 *
 * Each chunk is assigned a [REF-N] number starting from `startIndex`.
 * The AI must cite these references by number; the server converts them
 * to real [Author, Year](DOI) links post-generation.
 *
 * Returns empty string if no evidence was retrieved (graceful degradation).
 */
export function formatEvidenceContext(
  evidence: RetrievedEvidence,
  startIndex: number = 1
): string {
  if (evidence.chunks.length === 0) return "";

  const header = `

## Retrieved Evidence
The following evidence passages were retrieved from the knowledge base and are relevant to the query. **Cite these sources using their reference numbers** (e.g. [REF-${startIndex}], [REF-${startIndex + 1}]) when they support your response.
`;

  const entries = evidence.chunks.map((chunk, i) => {
    const refNum = startIndex + i;
    const authorDisplay = chunk.authors.length > 0
      ? chunk.authors.length > 3
        ? `${chunk.authors[0]} et al.`
        : chunk.authors.join(", ")
      : "Unknown";

    const year = chunk.publishedDate
      ? chunk.publishedDate.split("-")[0]
      : "n.d.";

    const doiLink = chunk.doi
      ? `\nDOI: https://doi.org/${chunk.doi}`
      : "";

    const levelLabel = formatEvidenceLevel(chunk.evidenceLevel);

    return `[REF-${refNum}] "${chunk.title}"
${authorDisplay} (${year}) — ${chunk.publication || chunk.source} | ${levelLabel}${doiLink}

> ${chunk.content}`;
  });

  return header + entries.join("\n\n");
}

function formatEvidenceLevel(level: string): string {
  const labels: Record<string, string> = {
    meta_analysis: "Meta-Analysis/Systematic Review",
    rct: "Randomized Controlled Trial",
    cohort_study: "Cohort Study",
    case_study: "Case Study/Report",
    clinical_guideline: "Clinical Guideline",
    expert_consensus: "Expert Consensus",
    in_vitro: "In Vitro",
    other: "Other",
  };
  return labels[level] || level;
}

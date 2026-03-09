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
 * Returns empty string if no evidence was retrieved (graceful degradation).
 */
export function formatEvidenceContext(evidence: RetrievedEvidence): string {
  if (evidence.chunks.length === 0) return "";

  const header = `

## Retrieved Evidence
The following evidence passages were retrieved from the knowledge base and are directly relevant to the query. **You MUST cite these sources** when they support your response. Use the exact [Author, Year](DOI_URL) format for each citation. Do not fabricate citations — only cite what is provided below or sources you are highly confident about.
`;

  const entries = evidence.chunks.map((chunk, i) => {
    const authorDisplay = chunk.authors.length > 0
      ? chunk.authors.length > 3
        ? `${chunk.authors[0]} et al.`
        : chunk.authors.join(", ")
      : "Unknown";

    const year = chunk.publishedDate
      ? chunk.publishedDate.split("-")[0]
      : "n.d.";

    const doiLink = chunk.doi
      ? `https://doi.org/${chunk.doi}`
      : "";

    const levelLabel = formatEvidenceLevel(chunk.evidenceLevel);

    return `### [${i + 1}] ${chunk.title}
**${authorDisplay} (${year})** — ${chunk.publication || chunk.source} | ${levelLabel}${doiLink ? `\nDOI: ${doiLink}` : ""}
Relevance: ${(chunk.similarity * 100).toFixed(0)}%

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

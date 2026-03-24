/**
 * Grounded Citation System
 *
 * Converts [REF-N] references in AI output to real [Author, Year](DOI) citations
 * using metadata from the RAG evidence chunks that were provided to the AI.
 *
 * This eliminates hallucinated citations by design — the AI can only cite
 * sources that were retrieved from the knowledge base and provided in its
 * system prompt. Any fabricated [Author, Year] citations are stripped.
 */

import type { EvidenceLevel } from "@/components/chat/evidence-badge";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ReferenceChunk {
  refNum: number;
  title: string;
  authors: string[];
  year: string;
  doi: string;
  source: string;
  publication: string;
  evidenceLevel: string;
  /** Partnership source identifier for attribution badges (e.g. "apex_energetics") */
  ragSource?: string;
}

export interface GroundedCitation {
  citationText: string;
  url: string;
  doi?: string;
  title: string;
  authors?: string[];
  year?: string;
  source?: string;
  evidenceLevel?: EvidenceLevel;
  origin: "curated";
  ragSource?: string;
}

export interface GroundingResult {
  /** Content with [REF-N] replaced by [Author, Year](DOI) links */
  content: string;
  /** Citation metadata keyed by display text, for badge rendering */
  citationsByKey: Record<string, GroundedCitation[]>;
  /** Flat list of all grounded citations, for DB storage */
  flatCitations: GroundedCitation[];
  /** REF numbers that appeared in content but had no matching chunk */
  unresolvedRefs: number[];
}

// ── Grounding ──────────────────────────────────────────────────────────────

/**
 * Parse [REF-N] references from AI output, replace with real [Author, Year](DOI)
 * citations, and build citation metadata from the reference chunks.
 *
 * Also strips any hallucinated [Author, Year] citations that don't correspond
 * to a provided reference — these are fabricated from the model's memory.
 */
export function groundCitations(
  content: string,
  references: ReferenceChunk[]
): GroundingResult {
  const refMap = new Map(references.map((r) => [r.refNum, r]));
  const citationsByKey: Record<string, GroundedCitation[]> = {};
  const flatCitations: GroundedCitation[] = [];
  const unresolvedRefs: number[] = [];
  const seenCitations = new Map<string, GroundedCitation>();

  // Step 1: Replace [REF-N] with [Author, Year](URL)
  const grounded = content.replace(/\[REF-(\d+)\]/g, (_match, numStr) => {
    const num = parseInt(numStr);
    const ref = refMap.get(num);
    if (!ref) {
      unresolvedRefs.push(num);
      return ""; // Strip unresolvable references
    }

    const authorDisplay =
      ref.authors.length > 0
        ? ref.authors.length > 2
          ? `${ref.authors[0]} et al.`
          : ref.authors.join(" & ")
        : ref.ragSource || ref.source || "Source";

    const yearStr = ref.year || "n.d.";
    const citationText = `${authorDisplay}, ${yearStr}`;

    const url = ref.doi
      ? `https://doi.org/${ref.doi}`
      : `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.title)}`;

    // Build or reuse citation metadata
    if (!seenCitations.has(citationText)) {
      const citation: GroundedCitation = {
        citationText,
        url,
        doi: ref.doi || undefined,
        title: ref.title,
        authors: ref.authors.length > 0 ? ref.authors : undefined,
        year: ref.year || undefined,
        source: ref.publication || ref.source || undefined,
        evidenceLevel: (ref.evidenceLevel as EvidenceLevel) || undefined,
        origin: "curated",
        ragSource: ref.ragSource,
      };
      seenCitations.set(citationText, citation);
      flatCitations.push(citation);

      if (!citationsByKey[citationText]) {
        citationsByKey[citationText] = [];
      }
      citationsByKey[citationText].push(citation);
    }

    return `[${citationText}](${url})`;
  });

  // Step 2: Strip any remaining hallucinated [Author, Year] citations
  // that weren't produced by the grounding step
  const cleaned = grounded.replace(
    /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g,
    (_match, citText: string) => {
      // If this matches a known grounded citation text, link it
      if (seenCitations.has(citText)) {
        const c = seenCitations.get(citText)!;
        return `[${citText}](${c.url})`;
      }
      // Otherwise strip it — this is a hallucinated citation
      return "";
    }
  );

  return { content: cleaned, citationsByKey, flatCitations, unresolvedRefs };
}

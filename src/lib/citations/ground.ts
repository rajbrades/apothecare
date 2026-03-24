/**
 * Grounded Citation System
 *
 * Converts [REF-N] references in AI output to real [Author, Year](DOI) citations
 * using metadata from the RAG evidence chunks that were provided to the AI.
 *
 * Two-layer protection against bad citations:
 *   1. **Anti-hallucination**: AI can only cite [REF-N] from provided evidence.
 *      Fabricated [Author, Year] citations are stripped.
 *   2. **Relevance gate**: Each [REF-N] is checked against the surrounding claim
 *      text. If the reference chunk doesn't share enough keywords with the claim,
 *      the citation is stripped — preventing the AI from citing the wrong REF.
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
  /** The actual chunk content used for relevance verification */
  content: string;
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
  /** REF numbers that were stripped due to relevance failure */
  irrelevantRefs: number[];
}

// ── Relevance verification ─────────────────────────────────────────────────

/** Words that carry no topical signal — excluded from keyword overlap checks */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those",
  "it", "its", "they", "their", "them", "we", "our", "you", "your",
  "he", "she", "his", "her", "also", "such", "than", "more", "most",
  "not", "no", "nor", "so", "as", "if", "then", "else", "when",
  "which", "who", "whom", "what", "how", "all", "each", "every",
  "both", "few", "many", "some", "any", "other", "new", "old",
  "et", "al", "shown", "found", "study", "studies", "research",
  "demonstrated", "reported", "suggests", "according", "based",
  "including", "however", "therefore", "although", "while", "between",
  "used", "using", "use", "level", "levels", "high", "low",
  "increase", "decrease", "associated", "effect", "effects",
  "evidence", "clinical", "treatment", "therapy", "consider",
  "recommended", "recommendation", "help", "support", "role",
  "important", "note", "example", "approach", "commonly",
  "particularly", "significantly", "typically", "well", "known",
  "been", "show", "showed", "shows", "suggest", "indicate",
  "indicates", "indicated", "various", "several", "specific",
  "due", "related", "include", "includes", "following", "potential",
  "ref", "dosing", "dose", "daily", "taken", "form",
]);

/**
 * Extract meaningful keywords from text (lowercase, deduplicated, min 3 chars).
 */
function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
  );
}

/**
 * Minimum number of overlapping keywords required between the claim context
 * and the reference chunk for the citation to be considered relevant.
 *
 * Set to 2: requires at least two meaningful medical/clinical terms to overlap.
 * This catches cases like "zinc supplementation" cited with a rheumatoid arthritis
 * paper (overlap would be 0–1 at best), while allowing legitimate cross-system
 * citations (e.g. a magnesium paper cited in a sleep context would share
 * "magnesium", "sleep", "supplementation", etc.).
 */
const MIN_KEYWORD_OVERLAP = 2;

/**
 * Check whether a reference chunk is relevant to the claim context.
 *
 * Compares keywords from the surrounding sentence against keywords in the
 * chunk content + title. Returns true if there's sufficient overlap.
 */
function isRelevantToContext(
  claimContext: string,
  ref: ReferenceChunk
): boolean {
  const claimKeywords = extractKeywords(claimContext);
  if (claimKeywords.size === 0) return true; // No claim context = can't check, allow

  // Build a corpus from the reference chunk: title + content
  const refCorpus = `${ref.title} ${ref.content}`.toLowerCase();

  let overlap = 0;
  for (const kw of claimKeywords) {
    if (refCorpus.includes(kw)) {
      overlap++;
      if (overlap >= MIN_KEYWORD_OVERLAP) return true; // Early exit
    }
  }

  return false;
}

/**
 * Extract ~60 chars of surrounding context for a match at a given index.
 * Grabs the sentence containing the citation for relevance checking.
 */
function extractClaimContext(
  content: string,
  matchIndex: number,
  matchLength: number
): string {
  // Find sentence boundaries (period, newline, or list item start)
  const before = content.slice(Math.max(0, matchIndex - 200), matchIndex);
  const after = content.slice(
    matchIndex + matchLength,
    Math.min(content.length, matchIndex + matchLength + 200)
  );

  // Walk back to sentence start
  const sentStartMarkers = [". ", ".\n", "\n\n", "- ", "1. ", "2. ", "3. ", "4. ", "5. "];
  let sentStart = before;
  for (const marker of sentStartMarkers) {
    const idx = before.lastIndexOf(marker);
    if (idx !== -1 && idx > before.length - sentStart.length) {
      sentStart = before.slice(idx + marker.length);
    }
  }

  // Walk forward to sentence end
  const sentEndIdx = after.search(/[.!?\n]/);
  const sentEnd = sentEndIdx !== -1 ? after.slice(0, sentEndIdx) : after;

  return `${sentStart}${sentEnd}`.trim();
}

// ── Grounding ──────────────────────────────────────────────────────────────

/**
 * Parse [REF-N] references from AI output, verify relevance, replace with
 * real [Author, Year](DOI) citations, and build citation metadata.
 *
 * Two checks per citation:
 *   1. Does [REF-N] map to a real evidence chunk? (anti-hallucination)
 *   2. Does the chunk content relate to the surrounding claim? (relevance gate)
 */
export function groundCitations(
  content: string,
  references: ReferenceChunk[]
): GroundingResult {
  const refMap = new Map(references.map((r) => [r.refNum, r]));
  const citationsByKey: Record<string, GroundedCitation[]> = {};
  const flatCitations: GroundedCitation[] = [];
  const unresolvedRefs: number[] = [];
  const irrelevantRefs: number[] = [];
  const seenCitations = new Map<string, GroundedCitation>();

  // Step 1: Replace [REF-N] with [Author, Year](URL) after relevance check
  const grounded = content.replace(
    /\[REF-(\d+)\]/g,
    (match, numStr, offset) => {
      const num = parseInt(numStr);
      const ref = refMap.get(num);

      // Check 1: Does the REF exist?
      if (!ref) {
        unresolvedRefs.push(num);
        return ""; // Strip unresolvable references
      }

      // Check 2: Is the reference relevant to the surrounding claim?
      const claimContext = extractClaimContext(content, offset, match.length);
      if (!isRelevantToContext(claimContext, ref)) {
        irrelevantRefs.push(num);
        return ""; // Strip irrelevant citation
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
    }
  );

  // Step 2: Strip any remaining hallucinated [Author, Year] citations
  const cleaned = grounded.replace(
    /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g,
    (_match, citText: string) => {
      if (seenCitations.has(citText)) {
        const c = seenCitations.get(citText)!;
        return `[${citText}](${c.url})`;
      }
      return ""; // Strip hallucinated citation
    }
  );

  return {
    content: cleaned,
    citationsByKey,
    flatCitations,
    unresolvedRefs,
    irrelevantRefs,
  };
}

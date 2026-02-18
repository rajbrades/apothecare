/**
 * Server-side citation resolution via the CrossRef API.
 *
 * After the AI finishes streaming, we extract [Author, Year] citations,
 * query CrossRef to resolve each to a DOI, and replace the plain citations
 * with markdown links pointing to https://doi.org/{DOI}.
 *
 * Enriched metadata (title, authors, journal, evidence level) is returned
 * alongside each resolved URL for client-side badge rendering.
 */

import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";
import type { EvidenceLevel } from "@/components/chat/evidence-badge";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedCitation {
  /** The full citation text inside brackets, e.g. "Calder, 2015" */
  text: string;
  /** Surrounding context (~20 words) for CrossRef query accuracy */
  context: string;
  /** Parsed author last name */
  author: string;
  /** Parsed publication year */
  year: string;
}

/** Full resolved citation data returned from CrossRef (or Scholar fallback). */
export interface CitationResolvedData {
  /** The original [Author, Year] text, used as the lookup key */
  citationText: string;
  /** Resolved URL — either https://doi.org/... or a Google Scholar fallback */
  url: string;
  /** Raw DOI string (without https://doi.org/ prefix), only set when CrossRef matched */
  doi?: string;
  /** Paper title from CrossRef */
  title?: string;
  /** Formatted author strings, e.g. ["Sinha R", "Calcagnotto A"] */
  authors?: string[];
  /** Publication year from CrossRef (may differ from cited year) */
  year?: string;
  /** Journal / container title from CrossRef */
  source?: string;
  /** Evidence level inferred from the paper title */
  evidenceLevel?: EvidenceLevel;
}

interface CrossRefItem {
  DOI: string;
  title?: string[];
  author?: Array<{ family?: string; given?: string }>;
  "container-title"?: string[];
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
}

interface CrossRefResponse {
  message: {
    items: CrossRefItem[];
  };
}

// ── Citation extraction ────────────────────────────────────────────────────

const CITATION_REGEX = /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g;

/**
 * Extract all plain [Author, Year] citations from text that aren't already
 * markdown links (not followed by `(`).
 */
export function extractCitations(text: string): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const citationText = match[1];

    // Deduplicate — same citation may appear multiple times
    if (seen.has(citationText)) continue;
    seen.add(citationText);

    // Extract surrounding context (~100 chars each side)
    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    const rawContext = text.slice(start, end);

    // Clean context: remove markdown syntax, keep meaningful words
    const context = rawContext
      .replace(/[#*_`>\[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Parse author and year from citation text
    const { author, year } = parseAuthorYear(citationText);

    citations.push({ text: citationText, context, author, year });
  }

  return citations;
}

/**
 * Parse author last name and year from a citation string.
 * Handles formats like: "Calder, 2015", "Gupta et al., 2013", "Smith & Jones, 2020"
 */
function parseAuthorYear(citation: string): { author: string; year: string } {
  // Extract year (last 4-digit number)
  const yearMatch = citation.match(/(\d{4})/);
  const year = yearMatch?.[1] || "";

  // Extract first author's last name (everything before the first comma, "et al", or "&")
  const authorPart = citation
    .replace(/\s*et\s+al\.?\s*/gi, "")
    .replace(/\s*&.*/, "")
    .replace(/,\s*\d{4}.*/, "")
    .trim();

  return { author: authorPart, year };
}

// ── CrossRef resolution ────────────────────────────────────────────────────

const CROSSREF_BASE = "https://api.crossref.org/works";
const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT = "Apotheca/1.0 (https://apotheca.ai; mailto:support@apotheca.ai)";

/**
 * Extract 3-5 meaningful keywords from context for the CrossRef query.
 */
function extractContextKeywords(context: string, author: string): string {
  // Remove the author name and year from context to avoid duplication
  const cleaned = context
    .replace(new RegExp(author, "gi"), "")
    .replace(/\d{4}/g, "")
    .toLowerCase();

  // Remove common stop words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "it", "its", "they", "their", "them", "we", "our", "you", "your",
    "he", "she", "his", "her", "also", "such", "than", "more", "most",
    "not", "no", "nor", "so", "as", "if", "then", "else", "when",
    "which", "who", "whom", "what", "how", "all", "each", "every",
    "both", "few", "many", "some", "any", "other", "new", "old",
    "et", "al", "shown", "found", "studies", "study", "research",
    "demonstrated", "reported", "suggests", "according", "based",
    "including", "however", "therefore", "although", "while", "between",
  ]);

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((w) => w.replace(/[^a-z-]/g, ""))
    .filter((w) => w.length > 2);

  // Return up to 5 unique keywords
  const unique = [...new Set(words)];
  return unique.slice(0, 5).join(" ");
}

/** Format a CrossRef author object as "Family G" */
function formatAuthor(a: { family?: string; given?: string }): string {
  const family = a.family || "";
  const given = a.given ? ` ${a.given.charAt(0)}` : "";
  return `${family}${given}`.trim();
}

/** Build enriched CitationResolvedData from a matched CrossRef item. */
function buildResolvedData(
  text: string,
  item: CrossRefItem
): CitationResolvedData {
  const doi = item.DOI;
  const title = item.title?.[0] || "";
  const authors = item.author?.map(formatAuthor).filter(Boolean);
  const source = item["container-title"]?.[0];
  const year = getPublicationYear(item);
  const evidenceLevel = title ? classifyEvidenceLevel(title) : undefined;

  return {
    citationText: text,
    url: `https://doi.org/${doi}`,
    doi,
    title: title || undefined,
    authors: authors?.length ? authors : undefined,
    year: year || undefined,
    source: source || undefined,
    evidenceLevel,
  };
}

/**
 * Query CrossRef for a single citation and return enriched resolved data.
 * Returns a DOI URL + metadata if a good match is found, otherwise a
 * Google Scholar fallback URL with no metadata.
 */
async function resolveSingleCitation(
  citation: ExtractedCitation
): Promise<CitationResolvedData> {
  const { text, context, author, year } = citation;
  const keywords = extractContextKeywords(context, author);

  // Build CrossRef query — include container-title for journal name
  const params = new URLSearchParams({
    "query.author": author,
    "query.bibliographic": [year, keywords].filter(Boolean).join(" "),
    rows: "3",
    select: "DOI,title,author,published,published-print,published-online,container-title",
  });

  const url = `${CROSSREF_BASE}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`CrossRef returned ${response.status}`);
    }

    const data: CrossRefResponse = await response.json();
    const items = data.message?.items || [];

    // Pass 1 — strict: exact author family name + year matches
    for (const item of items) {
      const itemYear = getPublicationYear(item);
      const authorMatch = item.author?.some(
        (a) => a.family?.toLowerCase() === author.toLowerCase()
      );
      if (authorMatch && itemYear === year) {
        return buildResolvedData(text, item);
      }
    }

    // Pass 2 — relaxed: partial author name + year matches
    for (const item of items) {
      const itemYear = getPublicationYear(item);
      const authorPresent = item.author?.some((a) =>
        a.family?.toLowerCase().includes(author.toLowerCase()) ||
        author.toLowerCase().includes(a.family?.toLowerCase() || "")
      );
      if (authorPresent && itemYear === year) {
        return buildResolvedData(text, item);
      }
    }

    // Pass 3 — best-effort: author match without year requirement.
    // Handles cases where the AI cited the wrong year (e.g. "2013" for a 2018 paper).
    // CrossRef already filtered by author + context keywords, so the first author
    // match is the most topically relevant paper by that author.
    for (const item of items) {
      const authorMatch = item.author?.some(
        (a) => a.family?.toLowerCase() === author.toLowerCase()
      );
      if (authorMatch && item.DOI) {
        return buildResolvedData(text, item);
      }
    }
  } catch (err) {
    // Log but don't throw — fall back to Scholar
    console.warn(
      `[Citations] CrossRef lookup failed for "${text}":`,
      err instanceof Error ? err.message : err
    );
  }

  // Fallback: Google Scholar with context keywords for better results
  const scholarQuery = [author, year, keywords].filter(Boolean).join(" ");
  return {
    citationText: text,
    url: `https://scholar.google.com/scholar?q=${encodeURIComponent(scholarQuery)}`,
  };
}

/**
 * Extract publication year from a CrossRef item.
 */
function getPublicationYear(item: CrossRefItem): string {
  const dateParts =
    item.published?.["date-parts"]?.[0] ||
    item["published-print"]?.["date-parts"]?.[0] ||
    item["published-online"]?.["date-parts"]?.[0];

  return dateParts?.[0]?.toString() || "";
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Resolve all citations in a text via CrossRef.
 * Returns a map from citation text to full resolved data (URL + metadata).
 */
export async function resolveCitations(
  citations: ExtractedCitation[]
): Promise<Map<string, CitationResolvedData>> {
  if (citations.length === 0) return new Map();

  const results = await Promise.allSettled(
    citations.map((c) => resolveSingleCitation(c))
  );

  const resolved = new Map<string, CitationResolvedData>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      resolved.set(result.value.citationText, result.value);
    }
  }

  return resolved;
}

/**
 * Replace plain [Author, Year] citations in text with markdown links
 * using the resolved data map.
 */
export function applyCitationLinks(
  text: string,
  resolvedMap: Map<string, CitationResolvedData>
): string {
  if (resolvedMap.size === 0) return text;

  return text.replace(
    CITATION_REGEX,
    (fullMatch, citationText: string) => {
      const data = resolvedMap.get(citationText);
      if (data?.url) {
        return `[${citationText}](${data.url})`;
      }
      return fullMatch;
    }
  );
}

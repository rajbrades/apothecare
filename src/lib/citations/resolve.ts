/**
 * Server-side citation resolution via CrossRef + PubMed.
 *
 * After the AI finishes streaming, we extract [Author, Year] citations,
 * query CrossRef to resolve each to a DOI, and replace the plain citations
 * with markdown links pointing to https://doi.org/{DOI}.
 *
 * Each citation is enriched with up to 3 verified references (CrossRef +
 * PubMed search), with relevance checking to prevent off-topic matches.
 * Metadata (title, authors, journal, evidence level) is returned for
 * client-side badge rendering.
 */

import { classifyEvidenceLevel } from "@/lib/chat/classify-evidence";
import { createServiceClient } from "@/lib/supabase/server";
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
  /** RAG source identifier — partnership or evidence source that provided this citation */
  ragSource?: string;
}

interface CrossRefItem {
  DOI: string;
  title?: string[];
  author?: Array<{ family?: string; given?: string }>;
  "container-title"?: string[];
  subject?: string[];
  abstract?: string;
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

const UNLINKED_CITATION_REGEX = /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g;
// Allow balanced parentheses inside URLs (e.g. DOIs like 10.1016/S0140-6736(98)00170-3)
const LINKED_CITATION_REGEX = /\[([^\]]+?,\s*\d{4}[a-z]?)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;

/**
 * Extract all [Author, Year] citations from text — both plain (unlinked)
 * and pre-linked markdown `[Author, Year](url)` citations.
 *
 * The AI system prompt instructs the model to pre-link citations with DOI or
 * Scholar URLs, so most citations arrive already linked. We extract both
 * forms so the server can resolve metadata (title, authors, evidence level)
 * via CrossRef for badge rendering regardless of whether the AI pre-linked.
 */
export function extractCitations(text: string): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const seen = new Set<string>();

  // Pass 1: extract pre-linked citations [Author, Year](url)
  let match: RegExpExecArray | null;
  while ((match = LINKED_CITATION_REGEX.exec(text)) !== null) {
    const citationText = match[1];
    if (seen.has(citationText)) continue;
    seen.add(citationText);

    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    const rawContext = text.slice(start, end);
    const context = rawContext
      .replace(/[#*_`>\[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const { author, year } = parseAuthorYear(citationText);
    citations.push({ text: citationText, context, author, year });
  }

  // Pass 2: extract unlinked citations [Author, Year] (not followed by `(`)
  while ((match = UNLINKED_CITATION_REGEX.exec(text)) !== null) {
    const citationText = match[1];
    if (seen.has(citationText)) continue;
    seen.add(citationText);

    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    const rawContext = text.slice(start, end);
    const context = rawContext
      .replace(/[#*_`>\[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

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
const USER_AGENT = "Apothecare/1.0 (https://apothecare.ai; mailto:support@apothecare.ai)";

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

// ── Relevance checking ─────────────────────────────────────────────────────

/**
 * Non-medical academic domains. Papers from these fields are almost certainly
 * irrelevant to clinical citations and should be rejected immediately.
 */
const NON_MEDICAL_DOMAINS = new Set([
  "economics", "finance", "financial", "accounting", "banking",
  "physics", "astrophysics", "astronomy", "cosmology",
  "mathematics", "algebra", "geometry", "topology",
  "engineering", "mechanical", "electrical", "civil",
  "computer science", "artificial intelligence", "machine learning",
  "law", "legal", "jurisprudence", "criminology",
  "political science", "politics", "international relations",
  "sociology", "anthropology", "archaeology",
  "linguistics", "literature", "philosophy",
  "education", "pedagogy", "library science",
  "business", "management", "marketing", "operations research",
  "agriculture", "agronomy", "forestry",
  "geology", "geophysics", "meteorology", "oceanography",
  "art", "music", "theater", "film",
  "history", "religion", "theology",
]);

/**
 * Check if a CrossRef item is from a non-medical domain.
 * Uses both the journal name (container-title) and CrossRef subject tags.
 */
function isNonMedicalDomain(item: CrossRefItem): boolean {
  const journal = (item["container-title"]?.[0] || "").toLowerCase();
  const subjects = (item.subject || []).join(" ").toLowerCase();
  const corpus = `${journal} ${subjects}`;

  for (const domain of NON_MEDICAL_DOMAINS) {
    if (corpus.includes(domain)) return true;
  }
  return false;
}

/**
 * Extract clinical/medical keywords from the citation context.
 * These are used to verify that a CrossRef result is topically relevant.
 */
function extractClinicalKeywords(context: string): string[] {
  const cleaned = context.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ");

  // Generic stop words that carry no clinical meaning
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
    "et", "al", "shown", "found", "study", "studies", "research",
    "demonstrated", "reported", "suggests", "according", "based",
    "including", "however", "therefore", "although", "while", "between",
    "approach", "perspective", "used", "use", "using", "level", "levels",
    "high", "low", "increase", "decrease", "associated", "effect", "effects",
    "conventional", "functional", "integrative", "evidence", "clinical",
    "treatment", "therapy", "consider", "considering", "important",
    "recommended", "recommendation", "help", "support", "role",
  ]);

  return cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((w) => w.replace(/[^a-z0-9-]/g, ""))
    .filter((w) => w.length > 2);
}

/**
 * Check if a CrossRef result is clinically relevant to the citation context.
 *
 * Two-layer check:
 *   1. Domain blocker: reject papers from non-medical fields (economics, etc.)
 *   2. Keyword overlap: at least one clinical keyword from the context must
 *      appear in the paper's title, abstract, subjects, or journal name
 */
function isClinicallyRelevant(
  item: CrossRefItem,
  contextKeywords: string[]
): boolean {
  // Layer 1: reject non-medical domains outright
  if (isNonMedicalDomain(item)) return false;

  // Layer 2: check keyword overlap
  const title = (item.title?.[0] || "").toLowerCase();
  const abstract = stripJatsXml(item.abstract || "").toLowerCase();
  const subjects = (item.subject || []).join(" ").toLowerCase();
  const journal = (item["container-title"]?.[0] || "").toLowerCase();
  const corpus = `${title} ${abstract} ${subjects} ${journal}`;

  // At least one context keyword must appear in the paper's corpus
  return contextKeywords.some((kw) => corpus.includes(kw));
}

/** Strip JATS XML tags from CrossRef abstracts */
function stripJatsXml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ── PubMed search (fills remaining citation slots) ─────────────────────────

const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_SUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

interface PubMedSummaryResult {
  uid: string;
  title: string;
  authors: Array<{ name: string }>;
  source: string;
  pubdate: string;
  articleids: Array<{ idtype: string; value: string }>;
  /** PubMed publication types, e.g. ["Randomized Controlled Trial", "Journal Article"] */
  pubtype?: string[];
}

/**
 * Check if a PubMed article title is clinically relevant to the citation context.
 * Uses the same keyword extraction approach as CrossRef relevance checking.
 */
function isPubMedResultRelevant(
  articleTitle: string,
  journalName: string,
  clinicalKeywords: string[]
): boolean {
  if (clinicalKeywords.length === 0) return true; // No keywords = accept all
  const corpus = `${articleTitle} ${journalName}`.toLowerCase();
  return clinicalKeywords.some((kw) => corpus.includes(kw));
}

/**
 * Search PubMed for papers matching the clinical context of a citation.
 * Returns up to `limit` relevant results as CitationResolvedData.
 *
 * Uses PubMed publication types for accurate evidence level classification
 * and filters results for clinical relevance before returning.
 */
async function searchPubMedForCitation(
  citationText: string,
  context: string,
  limit: number = 2
): Promise<CitationResolvedData[]> {
  try {
    const apiKeyParam = process.env.NIH_API_KEY ? `&api_key=${process.env.NIH_API_KEY}` : "";

    // Build a focused search query from the clinical context
    const contextTerms = context
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .filter((w) => !PUBMED_STOP_WORDS.has(w))
      .slice(0, 4)
      .join(" ");

    if (!contextTerms) return [];

    // Prefer higher-evidence study types in PubMed search
    const query = `(${contextTerms}) AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt] OR clinical trial[pt] OR review[pt])`;

    // Fetch more results than needed so we have enough after relevance filtering
    const fetchCount = Math.max(limit * 3, 8);

    const searchUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${fetchCount}&retmode=json&sort=relevance&tool=apothecare&email=support@apothecare.ai${apiKeyParam}`;

    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    let pmids: string[] = searchData.esearchresult?.idlist || [];

    // If the filtered query returned too few results, retry without type filter
    if (pmids.length < 2) {
      const fallbackQuery = `${contextTerms} supplementation OR treatment`;
      const fallbackUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(fallbackQuery)}&retmax=${fetchCount}&retmode=json&sort=relevance&tool=apothecare&email=support@apothecare.ai${apiKeyParam}`;
      const fallbackRes = await fetch(fallbackUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackPmids: string[] = fallbackData.esearchresult?.idlist || [];
        // Merge, keeping originals first
        const seen = new Set(pmids);
        for (const id of fallbackPmids) {
          if (!seen.has(id)) {
            pmids.push(id);
            seen.add(id);
          }
        }
      }
    }

    if (pmids.length === 0) return [];

    const summaryUrl = `${PUBMED_SUMMARY}?db=pubmed&id=${pmids.join(",")}&retmode=json&tool=apothecare&email=support@apothecare.ai${apiKeyParam}`;

    const summaryRes = await fetch(summaryUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!summaryRes.ok) return [];

    const summaryData = await summaryRes.json();
    const results: CitationResolvedData[] = [];

    // Extract clinical keywords for relevance filtering
    const clinicalKeywords = extractClinicalKeywords(context);

    for (const pmid of pmids) {
      if (results.length >= limit) break;

      const article: PubMedSummaryResult = summaryData.result?.[pmid];
      if (!article?.title) continue;

      const title = article.title.replace(/\.$/, "");
      const journalName = article.source || "";

      // Relevance check: reject PubMed results that don't match clinical context
      if (!isPubMedResultRelevant(title, journalName, clinicalKeywords)) {
        continue;
      }

      const doiEntry = article.articleids?.find((a) => a.idtype === "doi");
      const url = doiEntry?.value
        ? `https://doi.org/${doiEntry.value}`
        : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

      const yearMatch = article.pubdate?.match(/\d{4}/);

      // Pass PubMed publication types to classifier for accurate evidence levels
      const pubTypes = article.pubtype || [];

      results.push({
        citationText,
        url,
        doi: doiEntry?.value,
        title,
        authors: article.authors?.map((a) => a.name).slice(0, 3),
        year: yearMatch?.[0],
        source: journalName || undefined,
        evidenceLevel: classifyEvidenceLevel(title, pubTypes),
      });
    }

    return results;
  } catch (err) {
    console.warn(`[Citations] PubMed search failed for "${citationText}":`, err);
    return [];
  }
}

const PUBMED_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "been",
  "will", "would", "could", "should", "which", "their", "there", "about",
  "also", "more", "other", "than", "into", "some", "only", "when",
  "where", "after", "before", "between", "each", "every", "these",
  "those", "over", "under", "such", "very", "most", "just",
  "approach", "perspective", "conventional", "functional", "integrative",
  "evidence", "clinical", "shown", "studies", "study", "research",
  "demonstrated", "reported", "suggests", "based", "including",
  "however", "therefore", "although", "while", "used", "using",
  "support", "help", "role", "important", "consider",
]);

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
  const results = await resolveSingleCitationMulti(citation);
  return results[0]; // Primary result (CrossRef match or Scholar fallback)
}

/**
 * Query CrossRef + PubMed for a single citation and return up to 3
 * enriched results. The primary CrossRef match is used for the inline
 * DOI link; additional PubMed results provide supplementary evidence badges.
 */
async function resolveSingleCitationMulti(
  citation: ExtractedCitation
): Promise<CitationResolvedData[]> {
  const { text, context, author, year } = citation;
  const keywords = extractContextKeywords(context, author);
  const clinicalKeywords = extractClinicalKeywords(context);

  const results: CitationResolvedData[] = [];
  const seenDois = new Set<string>();

  // ── CrossRef resolution ──────────────────────────────────────────────

  const params = new URLSearchParams({
    "query.author": author,
    "query.bibliographic": [year, keywords].filter(Boolean).join(" "),
    rows: "5",
    select: "DOI,title,author,published,published-print,published-online,container-title,subject,abstract",
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

    // Collect ALL relevant matches across all 3 passes (up to 3)
    const addIfRelevant = (item: CrossRefItem) => {
      if (results.length >= 3) return;
      if (seenDois.has(item.DOI)) return;
      if (!isClinicallyRelevant(item, clinicalKeywords)) return;
      seenDois.add(item.DOI);
      results.push(buildResolvedData(text, item));
    };

    // Pass 1 — strict: exact author family name + year
    for (const item of items) {
      const itemYear = getPublicationYear(item);
      const authorMatch = item.author?.some(
        (a) => a.family?.toLowerCase() === author.toLowerCase()
      );
      if (authorMatch && itemYear === year) {
        addIfRelevant(item);
      }
    }

    // Pass 2 — relaxed: partial author name + year
    for (const item of items) {
      const itemYear = getPublicationYear(item);
      const authorPresent = item.author?.some((a) =>
        a.family?.toLowerCase().includes(author.toLowerCase()) ||
        author.toLowerCase().includes(a.family?.toLowerCase() || "")
      );
      if (authorPresent && itemYear === year) {
        addIfRelevant(item);
      }
    }

    // Pass 3 — best-effort: author match without year requirement
    for (const item of items) {
      const authorMatch = item.author?.some(
        (a) => a.family?.toLowerCase() === author.toLowerCase()
      );
      if (authorMatch && item.DOI) {
        addIfRelevant(item);
      }
    }

    if (results.length === 0 && items.length > 0) {
      const topTitle = items[0]?.title?.[0] || "unknown";
      console.warn(
        `[Citations] All ${items.length} CrossRef results for "${text}" failed relevance check. Top result: "${topTitle}"`
      );
    }
  } catch (err) {
    console.warn(
      `[Citations] CrossRef lookup failed for "${text}":`,
      err instanceof Error ? err.message : err
    );
  }

  // ── PubMed search to fill remaining slots ────────────────────────────

  const remaining = 3 - results.length;
  if (remaining > 0) {
    const pubmedResults = await searchPubMedForCitation(text, context, remaining + 1);
    for (const pm of pubmedResults) {
      if (results.length >= 3) break;
      if (pm.doi && seenDois.has(pm.doi)) continue;
      if (pm.doi) seenDois.add(pm.doi);
      results.push(pm);
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────────

  if (results.length === 0) {
    const scholarQuery = [author, year, keywords].filter(Boolean).join(" ");
    results.push({
      citationText: text,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(scholarQuery)}`,
    });
  }

  return results;
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
 * Returns a map from citation text to the primary resolved data (URL + metadata).
 * Used by applyCitationLinks() for inline DOI link replacement.
 */
export async function resolveCitations(
  citations: ExtractedCitation[]
): Promise<Map<string, CitationResolvedData>> {
  if (citations.length === 0) return new Map();

  const multiMap = await resolveCitationsMulti(citations);
  const resolved = new Map<string, CitationResolvedData>();
  for (const [key, arr] of multiMap) {
    if (arr.length > 0) resolved.set(key, arr[0]);
  }
  return resolved;
}

/**
 * Resolve all citations with up to 3 references each (CrossRef + PubMed).
 * Returns a map from citation text to an array of resolved data.
 * The first item is the primary match (used for inline DOI links);
 * additional items provide supplementary evidence badges.
 *
 * After resolution, checks citation_corrections for any DOIs that have been
 * flagged and replaced by admins. Corrected DOIs are auto-substituted with
 * the verified replacement citation.
 */
export async function resolveCitationsMulti(
  citations: ExtractedCitation[]
): Promise<Map<string, CitationResolvedData[]>> {
  if (citations.length === 0) return new Map();

  const results = await Promise.allSettled(
    citations.map((c) => resolveSingleCitationMulti(c))
  );

  const resolved = new Map<string, CitationResolvedData[]>();
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      resolved.set(result.value[0].citationText, result.value);
    }
  }

  // Apply citation corrections — replace flagged DOIs with admin-verified replacements
  await applyCitationCorrections(resolved);

  return resolved;
}

/**
 * Check all resolved DOIs against the citation_corrections table.
 * If a DOI has been flagged and an admin provided a replacement,
 * substitute the corrected citation data in place.
 */
async function applyCitationCorrections(
  resolved: Map<string, CitationResolvedData[]>
): Promise<void> {
  try {
    // Collect all resolved DOIs
    const allDois: string[] = [];
    for (const arr of resolved.values()) {
      for (const item of arr) {
        if (item.doi) allDois.push(item.doi);
      }
    }
    if (allDois.length === 0) return;

    const uniqueDois = [...new Set(allDois)];
    const serviceClient = createServiceClient();
    const { data: corrections } = await serviceClient
      .from("citation_corrections")
      .select("flagged_doi, replacement_doi, replacement_title, replacement_authors, replacement_year, replacement_journal, replacement_evidence_level")
      .in("flagged_doi", uniqueDois);

    if (!corrections || corrections.length === 0) return;

    const correctionMap = new Map<string, typeof corrections[0]>();
    for (const c of corrections) {
      correctionMap.set((c as { flagged_doi: string }).flagged_doi, c);
    }

    // Substitute corrected DOIs in all resolved results
    for (const [key, arr] of resolved) {
      const corrected = arr.map((item) => {
        if (!item.doi) return item;
        const correction = correctionMap.get(item.doi) as {
          replacement_doi: string;
          replacement_title: string;
          replacement_authors: string[];
          replacement_year: number | null;
          replacement_journal: string | null;
          replacement_evidence_level: string | null;
        } | undefined;
        if (!correction) return item;

        console.log(`[Citations] Applying correction: ${item.doi} → ${correction.replacement_doi}`);
        return {
          ...item,
          doi: correction.replacement_doi,
          url: `https://doi.org/${correction.replacement_doi}`,
          title: correction.replacement_title,
          authors: correction.replacement_authors?.length ? correction.replacement_authors : item.authors,
          year: correction.replacement_year ? String(correction.replacement_year) : item.year,
          source: correction.replacement_journal || item.source,
          evidenceLevel: (correction.replacement_evidence_level as EvidenceLevel) || item.evidenceLevel,
        };
      });
      resolved.set(key, corrected);
    }
  } catch (err) {
    // Non-fatal — if correction lookup fails, use original citations
    console.warn("[Citations] Correction lookup failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * Replace citations in text with resolved DOI links.
 * Handles both unlinked `[Author, Year]` and pre-linked `[Author, Year](url)`.
 * For pre-linked citations, upgrades the URL if CrossRef resolved a DOI.
 */
export function applyCitationLinks(
  text: string,
  resolvedMap: Map<string, CitationResolvedData>
): string {
  if (resolvedMap.size === 0) return text;

  // First: upgrade pre-linked citations to DOI URLs when available
  let result = text.replace(
    LINKED_CITATION_REGEX,
    (fullMatch, citationText: string) => {
      const data = resolvedMap.get(citationText);
      if (data?.url) {
        return `[${citationText}](${data.url})`;
      }
      return fullMatch;
    }
  );

  // Second: link any remaining unlinked citations
  result = result.replace(
    UNLINKED_CITATION_REGEX,
    (fullMatch, citationText: string) => {
      const data = resolvedMap.get(citationText);
      if (data?.url) {
        return `[${citationText}](${data.url})`;
      }
      return fullMatch;
    }
  );

  return result;
}

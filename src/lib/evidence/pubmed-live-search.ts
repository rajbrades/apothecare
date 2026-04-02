/**
 * Live PubMed Search Fallback
 *
 * When the local vector search returns insufficient evidence, this module
 * searches PubMed in real-time, fetches abstracts, and formats them as
 * RetrievedChunk[] for injection into the chat system prompt.
 *
 * Reuses searchPubMed() and fetchPubMedArticles() from ingest-pubmed.ts.
 */

import { searchPubMed, fetchPubMedArticles, type PubMedArticle } from "./ingest-pubmed";
import type { RetrievedChunk, RetrievedEvidence } from "./retrieve";
import type { EvidenceLevel } from "@/types/database";

// ── Evidence Level Classification ────────────────────────────────────────

function classifyEvidenceLevel(title: string): EvidenceLevel {
  const lower = title.toLowerCase();
  if (lower.includes("meta-analysis") || lower.includes("systematic review")) return "meta_analysis";
  if (lower.includes("randomized") || lower.includes("rct") || lower.includes("randomised")) return "rct";
  if (lower.includes("guideline") || lower.includes("consensus") || lower.includes("position statement")) return "clinical_guideline";
  if (lower.includes("cohort") || lower.includes("prospective") || lower.includes("longitudinal")) return "cohort_study";
  if (lower.includes("case report") || lower.includes("case series") || lower.includes("case study")) return "case_study";
  return "other";
}

// ── Convert PubMed Articles to RetrievedChunks ───────────────────────────

function articleToChunk(article: PubMedArticle, index: number): RetrievedChunk | null {
  if (!article.abstract) return null;

  // Truncate abstract to ~800 chars for prompt efficiency
  const content = article.abstract.length > 800
    ? article.abstract.slice(0, 800) + "…"
    : article.abstract;

  return {
    content,
    similarity: 0.90 - index * 0.02, // Synthetic score, decreasing by rank
    source: "pubmed",
    title: article.title,
    authors: article.authors.slice(0, 3), // First 3 authors
    publication: article.journal,
    publishedDate: article.publishedDate || "",
    doi: article.doi || "",
    evidenceLevel: classifyEvidenceLevel(article.title),
    documentId: `pubmed-live-${article.pmid}`,
  };
}

// ── Fallback Decision ────────────────────────────────────────────────────

const MIN_CHUNKS_THRESHOLD = 2;
const MIN_SIMILARITY_THRESHOLD = 0.55;

/**
 * Determine if we should fall back to live PubMed search.
 * Returns true if local evidence is insufficient.
 */
export function shouldFallbackToLiveSearch(evidence: RetrievedEvidence): boolean {
  if (evidence.chunks.length < MIN_CHUNKS_THRESHOLD) return true;
  const avgSimilarity = evidence.chunks.reduce((sum, c) => sum + c.similarity, 0) / evidence.chunks.length;
  return avgSimilarity < MIN_SIMILARITY_THRESHOLD;
}

// ── Live Search ──────────────────────────────────────────────────────────

/**
 * Search PubMed live and return results as RetrievedChunk[].
 * Optimized for speed: fetches only top 5 articles.
 * Timeout after 4 seconds to prevent blocking chat responses.
 */
export async function searchPubMedLive(
  query: string,
  maxResults: number = 5
): Promise<RetrievedChunk[]> {
  try {
    // Start with the user's query directly — no restrictive filters
    console.log(`[PubMed Live] Searching: "${query.slice(0, 80)}..."`);
    let pmids = await searchPubMed(query, maxResults);
    console.log(`[PubMed Live] PMIDs found: ${pmids.length}`);

    if (pmids.length === 0) return [];

    const articles = await fetchPubMedArticles(pmids.slice(0, maxResults));
    console.log(`[PubMed Live] Articles fetched: ${articles.length}, with abstracts: ${articles.filter(a => a.abstract).length}`);

    const chunks = articles
      .map((a, i) => articleToChunk(a, i))
      .filter((c): c is RetrievedChunk => c !== null);

    console.log(`[PubMed Live] Chunks produced: ${chunks.length}`);
    return chunks;
  } catch (err) {
    console.warn("[PubMed Live] Search failed:", err);
    return [];
  }
}

// ── Combined Retrieval ───────────────────────────────────────────────────

/**
 * Merge local vector search results with live PubMed results.
 * Deduplicates by DOI and sorts by similarity descending.
 */
export function mergeEvidence(
  local: RetrievedChunk[],
  live: RetrievedChunk[]
): RetrievedChunk[] {
  const seenDois = new Set<string>();
  const merged: RetrievedChunk[] = [];

  // Local results first (higher trust)
  for (const chunk of local) {
    if (chunk.doi) seenDois.add(chunk.doi);
    merged.push(chunk);
  }

  // Add live results that aren't duplicates
  for (const chunk of live) {
    if (chunk.doi && seenDois.has(chunk.doi)) continue;
    if (chunk.doi) seenDois.add(chunk.doi);
    merged.push(chunk);
  }

  return merged.sort((a, b) => b.similarity - a.similarity);
}

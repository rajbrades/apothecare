/**
 * Evidence Retrieval — Vector search for relevant evidence chunks
 *
 * Generates an embedding for the user's query, calls the search_evidence()
 * RPC, deduplicates by document, and returns formatted results.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { generateQueryEmbedding } from "./chunk-embed";
import type { EvidenceLevel } from "@/types/database";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  content: string;
  similarity: number;
  source: string;
  title: string;
  authors: string[];
  publication: string;
  publishedDate: string;
  doi: string;
  evidenceLevel: EvidenceLevel;
  documentId: string;
}

export interface RetrievedEvidence {
  chunks: RetrievedChunk[];
  queryTimeMs: number;
}

interface RetrieveOptions {
  sources?: string[];
  matchThreshold?: number;
  matchCount?: number;
}

// ── Retrieval ──────────────────────────────────────────────────────────────

/**
 * Retrieve relevant evidence chunks for a query string.
 *
 * 1. Generate embedding for the query
 * 2. Call search_evidence() RPC with optional source filter
 * 3. Deduplicate by document_id (keep highest similarity chunk per doc)
 * 4. Return sorted by similarity descending
 */
export async function retrieveEvidence(
  query: string,
  options: RetrieveOptions = {}
): Promise<RetrievedEvidence> {
  const {
    sources,
    matchThreshold = 0.65,
    matchCount = 10,
  } = options;

  const startTime = Date.now();

  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);

  const supabase = createServiceClient();

  // Call search_evidence() RPC
  // Current function only supports single source filter, so we call without
  // filter and post-filter by sources array if provided
  const { data: results, error } = await supabase.rpc("search_evidence", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount * 2, // over-fetch to account for deduplication & filtering
  });

  if (error) {
    console.error("[Evidence Retrieval] RPC error:", error.message);
    return { chunks: [], queryTimeMs: Date.now() - startTime };
  }

  if (!results || results.length === 0) {
    return { chunks: [], queryTimeMs: Date.now() - startTime };
  }

  // Post-filter by sources if provided
  let filtered = results;
  if (sources && sources.length > 0) {
    filtered = results.filter((r: any) => sources.includes(r.source));
  }

  // Deduplicate by document_id — keep highest similarity chunk per doc
  const byDoc = new Map<string, any>();
  for (const result of filtered) {
    const docId = result.document_id;
    const existing = byDoc.get(docId);
    if (!existing || result.similarity > existing.similarity) {
      byDoc.set(docId, result);
    }
  }

  // Convert to our return type and sort by similarity
  const chunks: RetrievedChunk[] = [...byDoc.values()]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount)
    .map((r) => ({
      content: r.content,
      similarity: r.similarity,
      source: r.source,
      title: r.title,
      authors: r.authors ?? [],
      publication: r.publication ?? "",
      publishedDate: r.published_date ?? "",
      doi: r.doi ?? "",
      evidenceLevel: r.evidence_level ?? "other",
      documentId: r.document_id,
    }));

  const queryTimeMs = Date.now() - startTime;
  console.log(
    `[Evidence Retrieval] Found ${chunks.length} chunks in ${queryTimeMs}ms (query: "${query.slice(0, 60)}...")`
  );

  return { chunks, queryTimeMs };
}

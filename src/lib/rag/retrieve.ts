import { createServiceClient } from "@/lib/supabase/server";
import { embedText } from "./embed";
import type { RetrievedChunk } from "./types";

interface RetrieveOptions {
  query: string;
  partnershipIds?: string[];
  sourceFilter?: string;
  documentTypes?: string[];
  maxChunks?: number;
  threshold?: number;
}

/**
 * Retrieve relevant evidence chunks via semantic search.
 * Uses the service client (bypasses RLS) since we filter by partnership IDs directly.
 */
export async function retrieveContext(
  options: RetrieveOptions
): Promise<RetrievedChunk[]> {
  const {
    query,
    partnershipIds,
    sourceFilter,
    documentTypes,
    maxChunks = 5,
    threshold = 0.68,
  } = options;

  const queryEmbedding = await embedText(query);
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("search_evidence_v2", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: maxChunks,
    filter_source: sourceFilter ?? null,
    filter_partnership_ids: partnershipIds?.length ? partnershipIds : null,
    filter_document_types: documentTypes?.length ? documentTypes : null,
  });

  if (error) {
    console.error("[RAG] search_evidence_v2 error:", error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: row.similarity,
    source: row.source,
    title: row.title,
    authors: row.authors,
    publication: row.publication,
    publishedDate: row.published_date,
    doi: row.doi,
    evidenceLevel: row.evidence_level,
    partnershipId: row.partnership_id,
    documentType: row.document_type,
  }));
}

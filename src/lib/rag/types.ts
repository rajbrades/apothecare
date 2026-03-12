export interface ChunkOptions {
  maxTokens: number;
  overlapTokens: number;
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  sectionType?: string;
}

export interface IngestionResult {
  documentId: string;
  title: string;
  chunkCount: number;
  status: "ready" | "error";
  error?: string;
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  source: string;
  title: string;
  authors: string[] | null;
  publication: string | null;
  publishedDate: string | null;
  doi: string | null;
  evidenceLevel: string | null;
  partnershipId: string | null;
  documentType: string | null;
}

/**
 * Chunking & Embedding for Evidence Documents (PubMed)
 *
 * Splits evidence documents into chunks, generates embeddings via the
 * shared embeddings module, and stores them in the evidence_chunks table.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { embedText, embedBatch } from "@/lib/embeddings";

// Re-export for consumers that import query embedding from here
export { embedText as generateQueryEmbedding } from "@/lib/embeddings";

// ── Types ──────────────────────────────────────────────────────────────────

interface DocumentForChunking {
  id: string;
  title: string;
  abstract: string | null;
  fullText: string | null;
}

interface ChunkData {
  content: string;
  chunkIndex: number;
  sectionType: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_CHUNK_TOKENS = 1500; // ~6000 chars, leave headroom for the 8191 token limit
const OVERLAP_CHARS = 400;
const EMBED_BATCH_SIZE = 50;

// ── Chunking ───────────────────────────────────────────────────────────────

/**
 * Split a document into chunks suitable for embedding.
 *
 * Strategy:
 * - Abstracts: single chunk (they're typically 200-400 words)
 * - Full text: split by section headers, then by paragraph if too long
 */
function chunkDocument(doc: DocumentForChunking): ChunkData[] {
  const chunks: ChunkData[] = [];
  let chunkIndex = 0;

  // Always include abstract as a chunk (most important for retrieval)
  if (doc.abstract) {
    chunks.push({
      content: `${doc.title}\n\n${doc.abstract}`,
      chunkIndex: chunkIndex++,
      sectionType: "abstract",
    });
  }

  // If we have full text, chunk by sections
  if (doc.fullText) {
    const sections = splitBySections(doc.fullText);

    for (const section of sections) {
      // Skip very short sections (< 50 chars)
      if (section.content.length < 50) continue;

      // If section fits in one chunk, use it directly
      if (section.content.length <= MAX_CHUNK_TOKENS * 4) {
        chunks.push({
          content: section.content,
          chunkIndex: chunkIndex++,
          sectionType: section.type,
        });
      } else {
        // Split long sections at paragraph boundaries with overlap
        const subChunks = splitAtParagraphs(section.content, MAX_CHUNK_TOKENS * 4, OVERLAP_CHARS);
        for (const sub of subChunks) {
          chunks.push({
            content: sub,
            chunkIndex: chunkIndex++,
            sectionType: section.type,
          });
        }
      }
    }
  }

  return chunks;
}

/**
 * Split text by common academic section headers.
 */
function splitBySections(text: string): Array<{ type: string; content: string }> {
  const sectionPattern = /^(?:#{1,3}\s+)?(introduction|background|methods?|materials?\s+and\s+methods?|results?|discussion|conclusions?|references|acknowledgments?)\s*$/gim;

  const sections: Array<{ type: string; content: string }> = [];
  let lastIndex = 0;
  let lastType = "introduction";

  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(text)) !== null) {
    // Save the content before this header
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({ type: lastType, content });
      }
    }
    lastType = normalizeSection(match[1]);
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last header
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ type: lastType, content: remaining });
  }

  // If no sections were found, treat everything as one chunk
  if (sections.length === 0 && text.trim()) {
    sections.push({ type: "body", content: text.trim() });
  }

  return sections;
}

function normalizeSection(header: string): string {
  const lower = header.toLowerCase().trim();
  if (lower.includes("method") || lower.includes("material")) return "methods";
  if (lower.includes("result")) return "results";
  if (lower.includes("discussion")) return "discussion";
  if (lower.includes("conclusion")) return "conclusion";
  if (lower.includes("introduction") || lower.includes("background")) return "introduction";
  return lower;
}

/**
 * Split text at paragraph boundaries with overlap.
 */
function splitAtParagraphs(text: string, maxChars: number, overlapChars: number): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      // Start next chunk with overlap from the end of current
      const overlapStart = Math.max(0, current.length - overlapChars);
      current = current.slice(overlapStart) + "\n\n" + para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Chunk a document and generate + store embeddings for all chunks.
 */
export async function chunkAndEmbedDocument(doc: DocumentForChunking): Promise<number> {
  const supabase = createServiceClient();
  const chunks = chunkDocument(doc);

  if (chunks.length === 0) return 0;

  // Generate embeddings for all chunks
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  // Insert chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    document_id: doc.id,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    embedding: JSON.stringify(embeddings[i]),
    section_type: chunk.sectionType,
  }));

  const { error } = await supabase.from("evidence_chunks").insert(rows);

  if (error) {
    throw new Error(`Failed to insert evidence chunks: ${error.message}`);
  }

  return chunks.length;
}

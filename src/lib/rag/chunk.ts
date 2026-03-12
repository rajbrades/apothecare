import type { DocumentChunk, ChunkOptions } from "./types";

const DEFAULT_OPTIONS: ChunkOptions = {
  maxTokens: 800,
  overlapTokens: 200,
};

// Rough token estimate: ~4 chars per token
const CHARS_PER_TOKEN = 4;

/**
 * Split extracted text into overlapping chunks, respecting section boundaries.
 */
export function chunkDocument(
  text: string,
  options: Partial<ChunkOptions> = {}
): DocumentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxChars = opts.maxTokens * CHARS_PER_TOKEN;
  const overlapChars = opts.overlapTokens * CHARS_PER_TOKEN;

  // Split on double newlines (paragraphs) or markdown-style headers
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  const chunks: DocumentChunk[] = [];
  let currentChunk = "";
  let currentSection: string | undefined;

  for (const paragraph of paragraphs) {
    // Detect section headers
    const headerMatch = paragraph.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].trim().toLowerCase();
    }

    // If adding this paragraph would exceed max, flush current chunk
    if (currentChunk.length + paragraph.length + 2 > maxChars && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunks.length,
        sectionType: currentSection,
      });

      // Keep overlap from end of current chunk
      const overlapStart = Math.max(0, currentChunk.length - overlapChars);
      currentChunk = currentChunk.slice(overlapStart) + "\n\n" + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunks.length,
      sectionType: currentSection,
    });
  }

  return chunks;
}

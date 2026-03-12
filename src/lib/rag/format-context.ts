import type { RetrievedChunk } from "./types";

/**
 * Format retrieved chunks as a system prompt addendum for the LLM.
 */
export function formatRagContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const sections = chunks.map((chunk, i) => {
    const source = chunk.source || "Unknown";
    const title = chunk.title || "Untitled";
    const sim = (chunk.similarity * 100).toFixed(0);
    return `### [${i + 1}] ${source} — ${title} (${sim}% match)\n${chunk.content}`;
  });

  return [
    "## Partnership Knowledge Base Context",
    "The following excerpts from clinical partner resources are relevant to this query.",
    'Cite these when applicable using the format [Source: Organization — Document Title].',
    "",
    ...sections,
  ].join("\n");
}

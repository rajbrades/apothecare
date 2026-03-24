import type { RetrievedChunk } from "./types";

/**
 * Format retrieved partnership RAG chunks as a system prompt addendum.
 *
 * Each chunk is assigned a [REF-N] number starting from `startIndex`
 * (should continue from where evidence numbering left off).
 */
export function formatRagContext(
  chunks: RetrievedChunk[],
  startIndex: number = 1
): string {
  if (chunks.length === 0) return "";

  const sections = chunks.map((chunk, i) => {
    const refNum = startIndex + i;
    const source = chunk.source || "Unknown";
    const title = chunk.title || "Untitled";
    const authors = chunk.authors?.length
      ? chunk.authors.length > 3
        ? `${chunk.authors[0]} et al.`
        : chunk.authors.join(", ")
      : source;
    const year = chunk.publishedDate?.split("-")[0] || "";
    const doi = chunk.doi ? `\nDOI: https://doi.org/${chunk.doi}` : "";
    const level = chunk.evidenceLevel ? ` | ${chunk.evidenceLevel}` : "";

    return `[REF-${refNum}] "${title}"
${authors}${year ? ` (${year})` : ""} — ${source}${level}${doi}

> ${chunk.content}`;
  });

  return [
    "\n\n## Partnership Knowledge Base Context",
    "The following excerpts from clinical partner resources are relevant. Cite using reference numbers (e.g. [REF-" + startIndex + "]).",
    "",
    ...sections,
  ].join("\n");
}

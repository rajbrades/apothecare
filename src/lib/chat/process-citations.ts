/**
 * Convert plain [Author, Year] citations to Google Scholar markdown links.
 * Skips citations that are already markdown links (followed by `(`).
 */
export function processCitations(content: string): string {
  return content.replace(
    /\[([^\]]+?,\s*\d{4}[a-z]?)\](?!\()/g,
    (_match, citation: string) => {
      const searchTerms = citation
        .replace(/et\s+al\.?/g, "")
        .replace(/[,.\s]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
      return `[${citation}](https://scholar.google.com/scholar?q=${encodeURIComponent(searchTerms)})`;
    }
  );
}

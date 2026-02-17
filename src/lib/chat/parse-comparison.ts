export interface ComparisonSections {
  /** Content before the first section heading */
  preamble: string | null;
  /** Content under "## Conventional Approach" */
  conventional: string;
  /** Content under "## Functional/Integrative Approach" */
  functional: string;
  /** Content under "## Clinical Synthesis" */
  synthesis: string;
  /** Content after the last section */
  epilogue: string | null;
}

const HEADING_CONVENTIONAL =
  /^##\s+conventional\s*(?:approach|perspective|medicine)?\s*$/im;
const HEADING_FUNCTIONAL =
  /^##\s+functional\/?(?:\s*integrative)?\s*(?:approach|perspective|medicine)?\s*$/im;
const HEADING_SYNTHESIS = /^##\s+clinical\s+synthesis\s*$/im;

interface HeadingMatch {
  key: "conventional" | "functional" | "synthesis";
  index: number;
  length: number;
}

/**
 * Parse a "Both" lens response into its three comparison sections.
 * Returns null if the expected heading structure is not detected,
 * allowing graceful fallback to regular markdown rendering.
 */
export function parseComparisonSections(
  content: string
): ComparisonSections | null {
  const headings: HeadingMatch[] = [];

  for (const [key, pattern] of [
    ["conventional", HEADING_CONVENTIONAL],
    ["functional", HEADING_FUNCTIONAL],
    ["synthesis", HEADING_SYNTHESIS],
  ] as const) {
    const match = pattern.exec(content);
    if (!match) return null;
    headings.push({ key, index: match.index, length: match[0].length });
  }

  // Sort by position in the document
  headings.sort((a, b) => a.index - b.index);

  const sections: Record<string, string> = {};

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index + headings[i].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : content.length;
    sections[headings[i].key] = content.slice(start, end).trim();
  }

  const preambleText = content.slice(0, headings[0].index).trim();
  const lastHeading = headings[headings.length - 1];
  const lastSectionEnd =
    lastHeading.index + lastHeading.length + (sections[lastHeading.key]?.length ?? 0);

  // Check for epilogue — content after the last section that isn't just whitespace
  const remaining = content.slice(lastSectionEnd).trim();
  // Only count as epilogue if there's substantial content after the last detected section end
  // Since we already sliced to content.length above, epilogue is only relevant if there's
  // trailing content not captured by the last section
  const epilogueText = remaining || null;

  return {
    preamble: preambleText || null,
    conventional: sections.conventional || "",
    functional: sections.functional || "",
    synthesis: sections.synthesis || "",
    epilogue: epilogueText,
  };
}

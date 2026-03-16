/**
 * Evidence Analysis Pipeline (Analyze-then-Synthesize)
 *
 * Instead of injecting all retrieved chunks directly into the synthesis prompt,
 * this module runs a lightweight analysis pass over each chunk using a smaller
 * model. Each chunk is scored for relevance and summarized against the original
 * query, patient context, and clinical objectives.
 *
 * Benefits:
 * - Process more retrieved documents without hitting context window limits
 * - Filter out marginally relevant chunks before the expensive synthesis call
 * - Extract only the clinically relevant portions of each paper
 * - Cheaper inference — small model does the heavy lifting
 */

import { createCompletion, MODELS } from "@/lib/ai/provider";
import type { RetrievedChunk } from "./retrieve";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AnalyzedChunk {
  /** Original chunk data */
  original: RetrievedChunk;
  /** Relevance score 0-10 assigned by the analysis model */
  relevanceScore: number;
  /** Concise clinical summary extracted by the analysis model */
  clinicalSummary: string;
  /** Key findings relevant to the query */
  keyFindings: string[];
}

export interface AnalysisResult {
  /** Analyzed and filtered chunks, sorted by relevance */
  chunks: AnalyzedChunk[];
  /** Chunks that were filtered out as low-relevance */
  filteredCount: number;
  /** Total analysis time in ms */
  analysisTimeMs: number;
}

interface AnalysisOptions {
  /** Patient context to inform relevance scoring */
  patientContext?: string;
  /** Minimum relevance score (0-10) to keep a chunk. Default: 5 */
  minRelevance?: number;
  /** Max chunks to analyze (to cap costs). Default: 15 */
  maxChunksToAnalyze?: number;
  /** Max analyzed chunks to return. Default: 8 */
  maxResults?: number;
}

// ── Analysis Prompt ────────────────────────────────────────────────────────

function buildAnalysisPrompt(query: string, patientContext: string): string {
  return `You are a medical evidence analyst. Evaluate a retrieved research paper chunk for its relevance to a specific clinical query.

## Clinical Query
${query}
${patientContext ? `\n## Patient Context\n${patientContext}` : ""}

## Your Task
Analyze the paper excerpt below and respond with ONLY a JSON object (no markdown fencing):
{
  "relevance": <0-10 integer>,
  "summary": "<2-3 sentence clinical summary of what this paper contributes to answering the query>",
  "key_findings": ["<finding 1>", "<finding 2>"]
}

Scoring guide:
- 8-10: Directly answers the query with strong evidence (RCT, meta-analysis, guideline)
- 5-7: Partially relevant — provides useful context, mechanism, or supporting evidence
- 2-4: Tangentially related — same topic area but doesn't address the specific question
- 0-1: Not relevant to the query`;
}

// ── Single Chunk Analysis ──────────────────────────────────────────────────

interface ParsedAnalysis {
  relevance: number;
  summary: string;
  key_findings: string[];
}

async function analyzeChunk(
  chunk: RetrievedChunk,
  query: string,
  patientContext: string
): Promise<AnalyzedChunk> {
  try {
    const chunkText = `## ${chunk.title}
**${chunk.authors.join(", ") || "Unknown"}** — ${chunk.publication} (${chunk.publishedDate?.split("-")[0] || "n.d."})
Evidence level: ${chunk.evidenceLevel}

${chunk.content}`;

    const result = await createCompletion({
      model: MODELS.standard,
      maxTokens: 300,
      system: buildAnalysisPrompt(query, patientContext),
      messages: [{ role: "user", content: chunkText }],
    });

    const parsed = parseAnalysisResponse(result.text);

    return {
      original: chunk,
      relevanceScore: parsed.relevance,
      clinicalSummary: parsed.summary,
      keyFindings: parsed.key_findings,
    };
  } catch (err) {
    console.warn(`[Analyze] Failed to analyze chunk "${chunk.title?.slice(0, 40)}":`, err);
    // On failure, pass through with a neutral score
    return {
      original: chunk,
      relevanceScore: 5,
      clinicalSummary: chunk.content.slice(0, 200),
      keyFindings: [],
    };
  }
}

function parseAnalysisResponse(text: string): ParsedAnalysis {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      relevance: typeof parsed.relevance === "number"
        ? Math.max(0, Math.min(10, Math.round(parsed.relevance)))
        : 5,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      key_findings: Array.isArray(parsed.key_findings)
        ? parsed.key_findings.filter((f: unknown) => typeof f === "string")
        : [],
    };
  } catch {
    // If JSON parsing fails, try to extract a numeric score
    const scoreMatch = cleaned.match(/relevance["\s:]+(\d+)/i);
    return {
      relevance: scoreMatch ? parseInt(scoreMatch[1]) : 5,
      summary: cleaned.slice(0, 200),
      key_findings: [],
    };
  }
}

// ── Batch Analysis (Parallel) ──────────────────────────────────────────────

/**
 * Analyze retrieved evidence chunks in parallel, scoring and summarizing
 * each for relevance to the query. Returns only chunks meeting the
 * relevance threshold, sorted by score.
 */
export async function analyzeEvidence(
  chunks: RetrievedChunk[],
  query: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const {
    patientContext = "",
    minRelevance = 5,
    maxChunksToAnalyze = 15,
    maxResults = 8,
  } = options;

  const startTime = Date.now();

  // Cap the number of chunks to analyze
  const toAnalyze = chunks.slice(0, maxChunksToAnalyze);

  // Run all analyses in parallel
  const analyzed = await Promise.all(
    toAnalyze.map((chunk) => analyzeChunk(chunk, query, patientContext))
  );

  // Filter by relevance threshold and sort by score
  const passing = analyzed
    .filter((a) => a.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  const filteredCount = analyzed.length - passing.length;
  const analysisTimeMs = Date.now() - startTime;

  console.log(
    `[Analyze] ${passing.length}/${analyzed.length} chunks passed relevance threshold (>=${minRelevance}) in ${analysisTimeMs}ms`
  );

  return {
    chunks: passing,
    filteredCount,
    analysisTimeMs,
  };
}

// ── Format for Synthesis Prompt ────────────────────────────────────────────

/**
 * Format analyzed evidence into a structured context block for the
 * synthesis (final response generation) prompt.
 *
 * Unlike the raw chunk formatter, this uses the clinical summaries and
 * key findings from the analysis phase, producing a more focused context
 * that takes less token budget.
 */
export function formatAnalyzedContext(analysis: AnalysisResult): string {
  if (analysis.chunks.length === 0) return "";

  const header = `

## Retrieved & Analyzed Evidence
The following evidence has been retrieved and analyzed for relevance to your query. Each entry includes a clinical summary and key findings. **You MUST cite these sources** when they support your response. Use the exact [Author, Year](DOI_URL) format.
`;

  const entries = analysis.chunks.map((analyzed, i) => {
    const chunk = analyzed.original;
    const authorDisplay = chunk.authors.length > 0
      ? chunk.authors.length > 3
        ? `${chunk.authors[0]} et al.`
        : chunk.authors.join(", ")
      : "Unknown";

    const year = chunk.publishedDate?.split("-")[0] || "n.d.";
    const doiLink = chunk.doi ? `https://doi.org/${chunk.doi}` : "";

    const findings = analyzed.keyFindings.length > 0
      ? "\nKey findings:\n" + analyzed.keyFindings.map((f) => `- ${f}`).join("\n")
      : "";

    return `### [${i + 1}] ${chunk.title}
**${authorDisplay} (${year})** — ${chunk.publication || chunk.source} | Relevance: ${analyzed.relevanceScore}/10${doiLink ? `\nDOI: ${doiLink}` : ""}

${analyzed.clinicalSummary}${findings}`;
  });

  return header + entries.join("\n\n");
}

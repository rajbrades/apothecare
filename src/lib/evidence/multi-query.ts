/**
 * Multi-Query Retrieval
 *
 * Generates 3-5 variant queries from different clinical angles for a single
 * user question. Each variant query is then used for independent vector search,
 * and results are merged with deduplication and re-ranking.
 *
 * This approach dramatically improves recall by finding relevant papers that
 * a single embedding query would miss — e.g. a question about "fatigue in
 * Hashimoto's" generates variants covering thyroid pathophysiology, treatment
 * protocols, lab markers, and lifestyle interventions.
 */

import { createCompletion, MODELS } from "@/lib/ai/provider";
import { retrieveEvidence, type RetrievedChunk, type RetrievedEvidence } from "./retrieve";

// ── Types ──────────────────────────────────────────────────────────────────

interface MultiQueryOptions {
  sources?: string[];
  matchCount?: number;
  isDeepConsult?: boolean;
}

// ── Query Generation ───────────────────────────────────────────────────────

const QUERY_EXPANSION_PROMPT = `You are a medical research query optimizer. Given a clinical question, generate 3-5 variant search queries that approach the topic from different angles to maximize retrieval of relevant scientific papers.

Each query should target a different facet:
1. **Pathophysiology/mechanism** — the underlying biology
2. **Diagnosis/biomarkers** — how to identify or measure
3. **Treatment/intervention** — therapeutic approaches
4. **Clinical evidence** — trials, guidelines, outcomes
5. **Functional medicine perspective** — root cause, integrative approaches (only if relevant)

Rules:
- Output ONLY a JSON array of strings, no other text
- Each query should be 10-25 words, optimized for semantic search
- Use precise medical terminology
- Do NOT repeat the original question verbatim
- Generate 3 queries for simple questions, 4-5 for complex multi-system questions

Example input: "What supplements help with insulin resistance?"
Example output: ["pathophysiology of insulin resistance and glucose metabolism dysfunction", "berberine chromium alpha lipoic acid clinical trials insulin sensitivity", "functional medicine protocol for metabolic syndrome and insulin resistance reversal", "biomarkers for tracking insulin resistance improvement HbA1c HOMA-IR fasting insulin"]`;

/**
 * Use a fast LLM call to generate variant queries from different clinical angles.
 */
async function generateQueryVariants(query: string): Promise<string[]> {
  try {
    const result = await createCompletion({
      model: MODELS.standard,
      maxTokens: 512,
      system: QUERY_EXPANSION_PROMPT,
      messages: [{ role: "user", content: query }],
    });

    const parsed = JSON.parse(result.text.trim());
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((q: unknown) => typeof q === "string")) {
      return parsed.slice(0, 5);
    }

    console.warn("[Multi-Query] LLM returned non-array, falling back to original query");
    return [query];
  } catch (err) {
    console.warn("[Multi-Query] Query expansion failed, falling back to original:", err);
    return [query];
  }
}

// ── Merge & Re-rank ────────────────────────────────────────────────────────

/**
 * Merge chunks from multiple retrieval runs.
 * Uses Reciprocal Rank Fusion (RRF) to combine rankings from different queries.
 * Deduplicates by document ID, keeping the best score.
 */
function mergeAndRerank(
  resultSets: RetrievedChunk[][],
  maxResults: number
): RetrievedChunk[] {
  const K = 60; // RRF constant
  const scores = new Map<string, { chunk: RetrievedChunk; rrfScore: number }>();

  for (const results of resultSets) {
    for (let rank = 0; rank < results.length; rank++) {
      const chunk = results[rank];
      const rrfContribution = 1 / (K + rank + 1);
      const existing = scores.get(chunk.documentId);

      if (existing) {
        existing.rrfScore += rrfContribution;
        // Keep the chunk with higher raw similarity for display
        if (chunk.similarity > existing.chunk.similarity) {
          existing.chunk = chunk;
        }
      } else {
        scores.set(chunk.documentId, { chunk, rrfScore: rrfContribution });
      }
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, maxResults)
    .map((entry) => entry.chunk);
}

// ── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Multi-query evidence retrieval.
 *
 * 1. Generate 3-5 variant queries from different clinical angles
 * 2. Run all queries in parallel against the vector store
 * 3. Merge results using Reciprocal Rank Fusion
 * 4. Return deduplicated, re-ranked chunks
 */
export async function retrieveEvidenceMultiQuery(
  query: string,
  options: MultiQueryOptions = {}
): Promise<RetrievedEvidence & { queryVariants: string[] }> {
  const {
    sources,
    matchCount = 8,
    isDeepConsult = false,
  } = options;

  const startTime = Date.now();

  // Step 1: Generate variant queries
  const variants = await generateQueryVariants(query);
  console.log(`[Multi-Query] Generated ${variants.length} variants for: "${query.slice(0, 60)}..."`);

  // Step 2: Run all queries in parallel (each retrieves more to allow better merging)
  const perQueryCount = Math.ceil(matchCount * 1.5);
  const retrievalPromises = variants.map((variant) =>
    retrieveEvidence(variant, {
      sources,
      matchCount: perQueryCount,
      matchThreshold: 0.6, // slightly lower threshold for variants
    }).catch((err) => {
      console.warn(`[Multi-Query] Variant query failed: "${variant.slice(0, 40)}..."`, err);
      return { chunks: [], queryTimeMs: 0 } as RetrievedEvidence;
    })
  );

  const results = await Promise.all(retrievalPromises);

  // Step 3: Merge and re-rank
  const targetCount = isDeepConsult ? matchCount * 1.5 : matchCount;
  const mergedChunks = mergeAndRerank(
    results.map((r) => r.chunks),
    Math.ceil(targetCount)
  );

  const queryTimeMs = Date.now() - startTime;
  console.log(
    `[Multi-Query] Merged ${mergedChunks.length} unique chunks from ${variants.length} queries in ${queryTimeMs}ms`
  );

  return {
    chunks: mergedChunks,
    queryTimeMs,
    queryVariants: variants,
  };
}

/**
 * Integration test for the full RAG pipeline as wired in the chat stream route:
 *   multi-query retrieval → analyze-then-synthesize → format context
 *
 * Tests the pipeline end-to-end with mocked external dependencies (LLM, vector DB).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock("@/lib/ai/provider", () => ({
  createCompletion: vi.fn(),
  MODELS: { standard: "gpt-4o-test", advanced: "gpt-4o-test" },
}));

vi.mock("@/lib/evidence/chunk-embed", () => ({
  generateQueryEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}));

import { createCompletion } from "@/lib/ai/provider";
import { createServiceClient } from "@/lib/supabase/server";
import { retrieveEvidenceMultiQuery } from "@/lib/evidence/multi-query";
import { analyzeEvidence, formatAnalyzedContext } from "@/lib/evidence/analyze";
import { formatEvidenceContext } from "@/lib/evidence/format-context";

const mockCreateCompletion = vi.mocked(createCompletion);

// ── Helpers ──────────────────────────────────────────────────────────────

function makeDbRow(overrides: Record<string, unknown> = {}) {
  return {
    content: "Evidence about berberine reducing insulin resistance in clinical trials.",
    similarity: 0.88,
    source: "pubmed",
    title: "Berberine Efficacy in Type 2 Diabetes",
    authors: ["Zhang Y", "Li X"],
    publication: "J Clin Endocrinol Metab",
    published_date: "2023-06-01",
    doi: "10.1210/jcem.2023.001",
    evidence_level: "rct",
    document_id: "doc-001",
    ...overrides,
  };
}

function setupSupabaseRpc(rows: ReturnType<typeof makeDbRow>[]) {
  const rpcMock = vi.fn().mockResolvedValue({ data: rows, error: null });
  vi.mocked(createServiceClient).mockReturnValue({ rpc: rpcMock } as any);
  return rpcMock;
}

// ── Integration Tests ────────────────────────────────────────────────────

describe("Full RAG Pipeline (multi-query → analyze → format)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("standard mode: multi-query retrieval with raw formatting", async () => {
    // Step 1: Mock query expansion
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify([
        "berberine insulin resistance mechanisms",
        "berberine clinical trials diabetes outcomes",
        "functional medicine insulin resistance supplements",
      ]),
      inputTokens: 100,
      outputTokens: 50,
    });

    // Step 2: Mock vector DB returns
    const dbRows = [
      makeDbRow({ document_id: "doc-001", similarity: 0.92, title: "Paper A" }),
      makeDbRow({ document_id: "doc-002", similarity: 0.85, title: "Paper B" }),
      makeDbRow({ document_id: "doc-003", similarity: 0.78, title: "Paper C" }),
    ];
    setupSupabaseRpc(dbRows);

    // Execute multi-query retrieval
    const evidence = await retrieveEvidenceMultiQuery(
      "What supplements help with insulin resistance?",
      { sources: ["pubmed"], matchCount: 8 }
    );

    // Verify we got results
    expect(evidence.chunks.length).toBeGreaterThan(0);
    expect(evidence.queryVariants).toHaveLength(3);

    // Format for standard mode (raw chunks, no analysis)
    const context = formatEvidenceContext(evidence);

    // Verify context contains expected elements
    expect(context).toContain("Retrieved Evidence");
    expect(context).toContain("You MUST cite these sources");
    expect(context).toContain("10.1210/jcem.2023.001"); // DOI
  });

  it("deep consult mode: multi-query → analyze → synthesize format", async () => {
    // Step 1: Mock query expansion
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify([
        "berberine insulin resistance pathophysiology",
        "berberine dosing protocols clinical evidence",
      ]),
      inputTokens: 100,
      outputTokens: 50,
    });

    // Step 2: Mock vector DB returns
    const dbRows = [
      makeDbRow({ document_id: "doc-001", similarity: 0.92, title: "Paper A: Berberine Mechanisms" }),
      makeDbRow({ document_id: "doc-002", similarity: 0.75, title: "Paper B: Unrelated study" }),
    ];
    setupSupabaseRpc(dbRows);

    // Execute multi-query retrieval (deep consult gets more)
    const evidence = await retrieveEvidenceMultiQuery(
      "Comprehensive review of berberine for insulin resistance",
      { matchCount: 15, isDeepConsult: true }
    );

    // Step 3: Mock analysis calls (one per chunk)
    mockCreateCompletion
      .mockResolvedValueOnce({
        text: JSON.stringify({
          relevance: 9,
          summary: "Strong RCT showing berberine reduces HbA1c by 1.2% in T2DM patients over 12 weeks.",
          key_findings: ["HbA1c -1.2%", "Fasting glucose -18%", "No serious adverse events"],
        }),
        inputTokens: 300,
        outputTokens: 100,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          relevance: 3,
          summary: "Study about a different supplement, not directly relevant.",
          key_findings: ["No berberine data"],
        }),
        inputTokens: 300,
        outputTokens: 100,
      });

    // Run analysis
    const analysis = await analyzeEvidence(evidence.chunks, "berberine for insulin resistance", {
      patientContext: "52-year-old male, HbA1c 6.8, BMI 29",
      minRelevance: 5,
      maxResults: 10,
    });

    // Should filter out the low-relevance chunk
    expect(analysis.chunks.length).toBe(1);
    expect(analysis.filteredCount).toBe(1);
    expect(analysis.chunks[0].relevanceScore).toBe(9);
    expect(analysis.chunks[0].keyFindings).toContain("HbA1c -1.2%");

    // Format for synthesis prompt
    const context = formatAnalyzedContext(analysis);

    // Verify analyzed context format
    expect(context).toContain("Retrieved & Analyzed Evidence");
    expect(context).toContain("Relevance: 9/10");
    expect(context).toContain("HbA1c -1.2%");
    expect(context).toContain("Fasting glucose -18%");
    expect(context).not.toContain("Unrelated study"); // filtered out
  });

  it("degrades gracefully when query expansion fails", async () => {
    // Query expansion throws
    mockCreateCompletion.mockRejectedValueOnce(new Error("LLM API down"));

    // But vector DB still works
    const dbRows = [makeDbRow({ document_id: "doc-001", similarity: 0.9 })];
    setupSupabaseRpc(dbRows);

    const evidence = await retrieveEvidenceMultiQuery("test query");

    // Should fall back to original query and still return results
    expect(evidence.chunks.length).toBeGreaterThan(0);
    expect(evidence.queryVariants).toEqual(["test query"]); // original query as fallback
  });

  it("degrades gracefully when vector DB returns no results", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1", "variant 2"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    setupSupabaseRpc([]);

    const evidence = await retrieveEvidenceMultiQuery("extremely obscure query");

    expect(evidence.chunks).toHaveLength(0);

    // Analysis of empty chunks should return immediately
    const analysis = await analyzeEvidence(evidence.chunks, "query");
    expect(analysis.chunks).toHaveLength(0);
    expect(formatAnalyzedContext(analysis)).toBe("");
  });

  it("pipeline handles mixed success/failure across variants", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1", "variant 2", "variant 3"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    // variant 1: returns results, variant 2: DB error, variant 3: returns results
    const row1 = makeDbRow({ document_id: "doc-001", similarity: 0.9 });
    const row3 = makeDbRow({ document_id: "doc-003", similarity: 0.8 });

    const rpcMock = vi.fn()
      .mockResolvedValueOnce({ data: [row1], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "DB timeout" } })
      .mockResolvedValueOnce({ data: [row3], error: null });

    vi.mocked(createServiceClient).mockReturnValue({ rpc: rpcMock } as any);

    const evidence = await retrieveEvidenceMultiQuery("test query");

    // Should have results from the 2 successful variants
    expect(evidence.chunks.length).toBeGreaterThan(0);
  });

  it("end-to-end token efficiency: analyzed context is shorter than raw", async () => {
    // Setup: 5 chunks, only 2 are relevant
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    const dbRows = Array.from({ length: 5 }, (_, i) =>
      makeDbRow({
        document_id: `doc-${i}`,
        similarity: 0.9 - i * 0.05,
        content: "A".repeat(500), // 500 chars each
        title: `Paper ${i}`,
      })
    );
    setupSupabaseRpc(dbRows);

    const evidence = await retrieveEvidenceMultiQuery("test", { matchCount: 5 });

    // Raw format includes all chunks
    const rawContext = formatEvidenceContext(evidence);

    // Now analyze — mock 2 as high relevance, 3 as low
    for (let i = 0; i < 5; i++) {
      mockCreateCompletion.mockResolvedValueOnce({
        text: JSON.stringify({
          relevance: i < 2 ? 9 : 2,
          summary: "Short summary.",
          key_findings: ["Key finding"],
        }),
        inputTokens: 100,
        outputTokens: 50,
      });
    }

    const analysis = await analyzeEvidence(evidence.chunks, "test", {
      minRelevance: 5,
    });

    const analyzedContext = formatAnalyzedContext(analysis);

    // Analyzed context should be shorter (only 2 chunks vs 5)
    expect(analyzedContext.length).toBeLessThan(rawContext.length);
    expect(analysis.chunks).toHaveLength(2);
    expect(analysis.filteredCount).toBe(3);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────
vi.mock("@/lib/ai/provider", () => ({
  createCompletion: vi.fn(),
  MODELS: { standard: "gpt-4o-test", advanced: "gpt-4o-test" },
}));

import { analyzeEvidence, formatAnalyzedContext } from "@/lib/evidence/analyze";
import { createCompletion } from "@/lib/ai/provider";
import type { RetrievedChunk } from "@/lib/evidence/retrieve";

const mockCreateCompletion = vi.mocked(createCompletion);

// ── Test fixtures ────────────────────────────────────────────────────────

function makeChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    content: "This study examined the effects of berberine on insulin sensitivity in type 2 diabetes patients.",
    similarity: 0.85,
    source: "pubmed",
    title: "Berberine and Insulin Sensitivity: A Randomized Controlled Trial",
    authors: ["Zhang Y", "Li X", "Wang H"],
    publication: "Journal of Clinical Endocrinology",
    publishedDate: "2023-03-15",
    doi: "10.1234/jce.2023.456",
    evidenceLevel: "rct",
    documentId: "doc-001",
    ...overrides,
  };
}

function mockAnalysisResponse(relevance: number, summary: string, findings: string[]) {
  return {
    text: JSON.stringify({
      relevance,
      summary,
      key_findings: findings,
    }),
    inputTokens: 200,
    outputTokens: 100,
  };
}

// ── Tests: analyzeEvidence ──────────────────────────────────────────────

describe("analyzeEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("analyzes each chunk in parallel and filters by relevance", async () => {
    const chunks = [
      makeChunk({ documentId: "doc-001", title: "Highly relevant paper" }),
      makeChunk({ documentId: "doc-002", title: "Somewhat relevant paper" }),
      makeChunk({ documentId: "doc-003", title: "Irrelevant paper" }),
    ];

    mockCreateCompletion
      .mockResolvedValueOnce(mockAnalysisResponse(9, "Directly addresses insulin resistance treatment with berberine.", ["Berberine reduced HbA1c by 1.2%"]))
      .mockResolvedValueOnce(mockAnalysisResponse(6, "Discusses metabolic syndrome broadly.", ["Metabolic syndrome increases CVD risk"]))
      .mockResolvedValueOnce(mockAnalysisResponse(2, "About unrelated topic.", ["No relevant findings"]));

    const result = await analyzeEvidence(chunks, "berberine for insulin resistance", {
      minRelevance: 5,
    });

    // Should have called createCompletion 3 times (once per chunk)
    expect(mockCreateCompletion).toHaveBeenCalledTimes(3);

    // Should filter out the irrelevant chunk (score 2 < threshold 5)
    expect(result.chunks).toHaveLength(2);
    expect(result.filteredCount).toBe(1);

    // Should be sorted by relevance descending
    expect(result.chunks[0].relevanceScore).toBe(9);
    expect(result.chunks[1].relevanceScore).toBe(6);

    // Check clinical summaries are preserved
    expect(result.chunks[0].clinicalSummary).toContain("berberine");
    expect(result.chunks[0].keyFindings).toContain("Berberine reduced HbA1c by 1.2%");
  });

  it("includes patient context in analysis prompts", async () => {
    const chunks = [makeChunk()];
    mockCreateCompletion.mockResolvedValueOnce(
      mockAnalysisResponse(8, "Relevant to patient context.", ["Finding 1"])
    );

    await analyzeEvidence(chunks, "test query", {
      patientContext: "45-year-old female with PCOS and insulin resistance",
    });

    // The system prompt should include patient context
    const callArgs = mockCreateCompletion.mock.calls[0][0];
    expect(callArgs.system).toContain("45-year-old female with PCOS");
  });

  it("caps the number of chunks to analyze", async () => {
    const chunks = Array.from({ length: 20 }, (_, i) =>
      makeChunk({ documentId: `doc-${i}` })
    );

    mockCreateCompletion.mockResolvedValue(
      mockAnalysisResponse(7, "Summary", ["Finding"])
    );

    await analyzeEvidence(chunks, "test", { maxChunksToAnalyze: 5 });

    // Should only analyze 5 chunks despite 20 being passed
    expect(mockCreateCompletion).toHaveBeenCalledTimes(5);
  });

  it("caps the number of results returned", async () => {
    const chunks = Array.from({ length: 10 }, (_, i) =>
      makeChunk({ documentId: `doc-${i}` })
    );

    mockCreateCompletion.mockResolvedValue(
      mockAnalysisResponse(8, "Summary", ["Finding"])
    );

    const result = await analyzeEvidence(chunks, "test", {
      maxChunksToAnalyze: 10,
      maxResults: 3,
    });

    expect(result.chunks.length).toBeLessThanOrEqual(3);
  });

  it("handles individual chunk analysis failures gracefully", async () => {
    const chunks = [
      makeChunk({ documentId: "doc-001" }),
      makeChunk({ documentId: "doc-002" }),
    ];

    mockCreateCompletion
      .mockRejectedValueOnce(new Error("API error")) // first chunk fails
      .mockResolvedValueOnce(mockAnalysisResponse(8, "Good summary", ["Finding"]));

    const result = await analyzeEvidence(chunks, "test");

    // Both chunks should be in results — failed one gets neutral score of 5
    expect(result.chunks).toHaveLength(2);
    // The successful one (score 8) should rank first
    expect(result.chunks[0].relevanceScore).toBe(8);
    // The failed one should have neutral score of 5
    expect(result.chunks[1].relevanceScore).toBe(5);
  });

  it("handles malformed JSON from LLM", async () => {
    const chunks = [makeChunk()];

    mockCreateCompletion.mockResolvedValueOnce({
      text: "This is not valid JSON at all",
      inputTokens: 100,
      outputTokens: 50,
    });

    const result = await analyzeEvidence(chunks, "test");

    // Should still return a result with a default score
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].relevanceScore).toBe(5); // default
  });

  it("handles JSON wrapped in markdown code fences", async () => {
    const chunks = [makeChunk()];

    mockCreateCompletion.mockResolvedValueOnce({
      text: '```json\n{"relevance": 9, "summary": "Great paper", "key_findings": ["Finding 1"]}\n```',
      inputTokens: 100,
      outputTokens: 50,
    });

    const result = await analyzeEvidence(chunks, "test");

    expect(result.chunks[0].relevanceScore).toBe(9);
    expect(result.chunks[0].clinicalSummary).toBe("Great paper");
  });

  it("clamps relevance scores to 0-10 range", async () => {
    const chunks = [
      makeChunk({ documentId: "doc-001" }),
      makeChunk({ documentId: "doc-002" }),
    ];

    mockCreateCompletion
      .mockResolvedValueOnce({
        text: JSON.stringify({ relevance: 15, summary: "Over-scored", key_findings: [] }),
        inputTokens: 100,
        outputTokens: 50,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ relevance: -3, summary: "Under-scored", key_findings: [] }),
        inputTokens: 100,
        outputTokens: 50,
      });

    const result = await analyzeEvidence(chunks, "test", { minRelevance: 0 });

    // Score 15 should be clamped to 10
    expect(result.chunks[0].relevanceScore).toBe(10);
    // Score -3 should be clamped to 0
    expect(result.chunks[1].relevanceScore).toBe(0);
  });

  it("returns empty result when no chunks provided", async () => {
    const result = await analyzeEvidence([], "test");

    expect(result.chunks).toHaveLength(0);
    expect(result.filteredCount).toBe(0);
    expect(mockCreateCompletion).not.toHaveBeenCalled();
  });

  it("records analysis time", async () => {
    const chunks = [makeChunk()];
    mockCreateCompletion.mockResolvedValueOnce(
      mockAnalysisResponse(8, "Summary", ["Finding"])
    );

    const result = await analyzeEvidence(chunks, "test");

    expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
  });
});

// ── Tests: formatAnalyzedContext ──────────────────────────────────────────

describe("formatAnalyzedContext", () => {
  it("formats analyzed chunks into structured prompt context", () => {
    const analysis = {
      chunks: [
        {
          original: makeChunk({
            title: "Berberine and Insulin Sensitivity",
            authors: ["Zhang Y", "Li X"],
            doi: "10.1234/test.001",
            publishedDate: "2023-01-01",
            publication: "J Clinical Endocrinology",
          }),
          relevanceScore: 9,
          clinicalSummary: "Berberine significantly improved insulin sensitivity in T2DM patients.",
          keyFindings: ["HbA1c reduced by 1.2%", "Fasting glucose improved by 15%"],
        },
      ],
      filteredCount: 2,
      analysisTimeMs: 500,
    };

    const formatted = formatAnalyzedContext(analysis);

    // Should contain header
    expect(formatted).toContain("Retrieved & Analyzed Evidence");
    // Should contain title
    expect(formatted).toContain("Berberine and Insulin Sensitivity");
    // Should contain authors
    expect(formatted).toContain("Zhang Y, Li X");
    // Should contain DOI link
    expect(formatted).toContain("https://doi.org/10.1234/test.001");
    // Should contain relevance score
    expect(formatted).toContain("Relevance: 9/10");
    // Should contain clinical summary
    expect(formatted).toContain("Berberine significantly improved insulin sensitivity");
    // Should contain key findings
    expect(formatted).toContain("HbA1c reduced by 1.2%");
    expect(formatted).toContain("Fasting glucose improved by 15%");
    // Should contain citation instruction
    expect(formatted).toContain("You MUST cite these sources");
  });

  it("returns empty string when no chunks", () => {
    const result = formatAnalyzedContext({
      chunks: [],
      filteredCount: 0,
      analysisTimeMs: 0,
    });

    expect(result).toBe("");
  });

  it("truncates long author lists with et al.", () => {
    const analysis = {
      chunks: [
        {
          original: makeChunk({
            authors: ["Author1 A", "Author2 B", "Author3 C", "Author4 D"],
          }),
          relevanceScore: 7,
          clinicalSummary: "Summary",
          keyFindings: [],
        },
      ],
      filteredCount: 0,
      analysisTimeMs: 100,
    };

    const formatted = formatAnalyzedContext(analysis);
    expect(formatted).toContain("Author1 A et al.");
  });

  it("handles missing DOI gracefully", () => {
    const analysis = {
      chunks: [
        {
          original: makeChunk({ doi: "" }),
          relevanceScore: 7,
          clinicalSummary: "Summary",
          keyFindings: [],
        },
      ],
      filteredCount: 0,
      analysisTimeMs: 100,
    };

    const formatted = formatAnalyzedContext(analysis);
    expect(formatted).not.toContain("DOI:");
  });
});

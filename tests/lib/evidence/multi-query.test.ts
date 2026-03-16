import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────
// Mock the AI provider before importing the module under test
vi.mock("@/lib/ai/provider", () => ({
  createCompletion: vi.fn(),
  MODELS: { standard: "gpt-4o-test", advanced: "gpt-4o-test" },
}));

vi.mock("@/lib/evidence/retrieve", () => ({
  retrieveEvidence: vi.fn(),
}));

import { retrieveEvidenceMultiQuery } from "@/lib/evidence/multi-query";
import { createCompletion } from "@/lib/ai/provider";
import { retrieveEvidence } from "@/lib/evidence/retrieve";
import type { RetrievedChunk, RetrievedEvidence } from "@/lib/evidence/retrieve";

const mockCreateCompletion = vi.mocked(createCompletion);
const mockRetrieveEvidence = vi.mocked(retrieveEvidence);

// ── Test fixtures ────────────────────────────────────────────────────────

function makeChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    content: "Sample evidence content about insulin resistance.",
    similarity: 0.85,
    source: "pubmed",
    title: "Insulin Resistance Mechanisms",
    authors: ["Smith J", "Doe A"],
    publication: "Journal of Metabolism",
    publishedDate: "2023-06-15",
    doi: "10.1234/test.2023.001",
    evidenceLevel: "rct",
    documentId: "doc-001",
    ...overrides,
  };
}

function makeEvidence(chunks: RetrievedChunk[]): RetrievedEvidence {
  return { chunks, queryTimeMs: 50 };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("retrieveEvidenceMultiQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates variant queries and runs them in parallel", async () => {
    // LLM returns 3 variant queries
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify([
        "pathophysiology of insulin resistance glucose metabolism",
        "berberine chromium clinical trials insulin sensitivity",
        "functional medicine metabolic syndrome protocol",
      ]),
      inputTokens: 100,
      outputTokens: 50,
    });

    // Each variant query returns different chunks
    const chunk1 = makeChunk({ documentId: "doc-001", similarity: 0.9, title: "Paper A" });
    const chunk2 = makeChunk({ documentId: "doc-002", similarity: 0.85, title: "Paper B" });
    const chunk3 = makeChunk({ documentId: "doc-003", similarity: 0.8, title: "Paper C" });

    mockRetrieveEvidence
      .mockResolvedValueOnce(makeEvidence([chunk1, chunk2]))
      .mockResolvedValueOnce(makeEvidence([chunk2, chunk3]))
      .mockResolvedValueOnce(makeEvidence([chunk1, chunk3]));

    const result = await retrieveEvidenceMultiQuery("What supplements help with insulin resistance?");

    // Should have called createCompletion once for query expansion
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);

    // Should have called retrieveEvidence 3 times (one per variant)
    expect(mockRetrieveEvidence).toHaveBeenCalledTimes(3);

    // Should return 3 unique chunks (deduplicated by documentId)
    expect(result.chunks).toHaveLength(3);
    expect(result.queryVariants).toHaveLength(3);

    // Document IDs should be unique
    const docIds = result.chunks.map((c) => c.documentId);
    expect(new Set(docIds).size).toBe(3);
  });

  it("uses RRF to rank chunks that appear in multiple result sets higher", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["query variant 1", "query variant 2"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    // chunk1 appears in both result sets → should rank higher
    const chunk1 = makeChunk({ documentId: "doc-001", similarity: 0.7, title: "Appears in both" });
    const chunk2 = makeChunk({ documentId: "doc-002", similarity: 0.95, title: "Only in first" });
    const chunk3 = makeChunk({ documentId: "doc-003", similarity: 0.6, title: "Only in second" });

    mockRetrieveEvidence
      .mockResolvedValueOnce(makeEvidence([chunk2, chunk1]))
      .mockResolvedValueOnce(makeEvidence([chunk1, chunk3]));

    const result = await retrieveEvidenceMultiQuery("test query", { matchCount: 3 });

    // chunk1 appears in both result sets, so RRF should rank it highest
    expect(result.chunks[0].documentId).toBe("doc-001");
  });

  it("falls back to original query when LLM returns invalid JSON", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: "This is not valid JSON",
      inputTokens: 50,
      outputTokens: 30,
    });

    const chunk1 = makeChunk({ documentId: "doc-001" });
    mockRetrieveEvidence.mockResolvedValueOnce(makeEvidence([chunk1]));

    const result = await retrieveEvidenceMultiQuery("test query");

    // Should fall back to single query (the original)
    expect(mockRetrieveEvidence).toHaveBeenCalledTimes(1);
    expect(result.chunks).toHaveLength(1);
    // queryVariants should contain the original query as fallback
    expect(result.queryVariants).toHaveLength(1);
  });

  it("falls back to original query when LLM call throws", async () => {
    mockCreateCompletion.mockRejectedValueOnce(new Error("API timeout"));

    const chunk1 = makeChunk({ documentId: "doc-001" });
    mockRetrieveEvidence.mockResolvedValueOnce(makeEvidence([chunk1]));

    const result = await retrieveEvidenceMultiQuery("test query");

    expect(mockRetrieveEvidence).toHaveBeenCalledTimes(1);
    expect(result.chunks).toHaveLength(1);
  });

  it("handles individual variant retrieval failures gracefully", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1", "variant 2", "variant 3"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    const chunk1 = makeChunk({ documentId: "doc-001" });
    mockRetrieveEvidence
      .mockResolvedValueOnce(makeEvidence([chunk1]))
      .mockRejectedValueOnce(new Error("Network error")) // variant 2 fails
      .mockResolvedValueOnce(makeEvidence([chunk1]));

    const result = await retrieveEvidenceMultiQuery("test query");

    // Should still return results from the variants that succeeded
    expect(result.chunks.length).toBeGreaterThan(0);
  });

  it("passes source filter through to retrieveEvidence", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    mockRetrieveEvidence.mockResolvedValueOnce(makeEvidence([]));

    await retrieveEvidenceMultiQuery("test", { sources: ["pubmed", "ifm"] });

    expect(mockRetrieveEvidence).toHaveBeenCalledWith(
      "variant 1",
      expect.objectContaining({ sources: ["pubmed", "ifm"] })
    );
  });

  it("limits to 5 variant queries even if LLM returns more", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["q1", "q2", "q3", "q4", "q5", "q6", "q7"]),
      inputTokens: 50,
      outputTokens: 50,
    });

    mockRetrieveEvidence.mockResolvedValue(makeEvidence([]));

    const result = await retrieveEvidenceMultiQuery("test");

    // Should cap at 5 variants
    expect(mockRetrieveEvidence).toHaveBeenCalledTimes(5);
    expect(result.queryVariants).toHaveLength(5);
  });

  it("returns empty chunks when all retrievals return nothing", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1", "variant 2"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    mockRetrieveEvidence.mockResolvedValue(makeEvidence([]));

    const result = await retrieveEvidenceMultiQuery("obscure question");

    expect(result.chunks).toHaveLength(0);
    expect(result.queryTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("respects matchCount to limit final results", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      text: JSON.stringify(["variant 1"]),
      inputTokens: 50,
      outputTokens: 30,
    });

    const chunks = Array.from({ length: 10 }, (_, i) =>
      makeChunk({ documentId: `doc-${i}`, similarity: 0.9 - i * 0.05 })
    );
    mockRetrieveEvidence.mockResolvedValueOnce(makeEvidence(chunks));

    const result = await retrieveEvidenceMultiQuery("test", { matchCount: 3 });

    expect(result.chunks.length).toBeLessThanOrEqual(3);
  });
});

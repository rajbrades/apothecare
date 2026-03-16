# Competitive Evaluation: Functional Minds (John Snow Labs) vs. Apothecare

## Context
Evaluating the Clinical Advisor AI Agent by Functional Minds (powered by John Snow Labs) against Apothecare's current architecture to identify gaps, strengths, and potential improvements.

---

## Side-by-Side Comparison

### 1. Query Planning

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Approach** | Dynamic multi-step execution plans scaled to query complexity | Single-step: one prompt → one LLM call per feature |
| **Memory** | Patient-specific memory from previous conversations informs each step | Conversation history (last 20 messages) loaded per chat; patient context loaded from DB when patient_id provided |
| **Verdict** | **FM leads** — their multi-step planner decomposes complex queries into sub-objectives before retrieval, producing more thorough coverage | Apothecare handles patient context well via DB but doesn't decompose a complex question into sub-queries |

### 2. Information Retrieval / RAG

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Knowledge base** | Vector DB with "millions of scientific papers" | pgvector on Supabase with ingested papers (PubMed ingestion pipeline exists at `src/lib/evidence/ingest-pubmed.ts`) — scale unclear but likely thousands, not millions |
| **Query strategy** | Multiple optimized queries per question from different angles | Single embedding query per user message (`retrieveEvidence()` in `src/lib/evidence/retrieve.ts`) |
| **Search type** | Unspecified (likely hybrid) | Planned hybrid (vector + BM25/pg_trgm + RRF merge) per architecture doc; currently vector-only via `search_evidence()` RPC |
| **Source filtering** | Unspecified | Strong — 9 evidence sources with presets (IFM, A4M, Cleveland Clinic, PubMed, Cochrane, AAFP, ACP, etc.) and per-query filtering |
| **Verdict** | **FM leads on scale and multi-query**; **Apothecare leads on source filtering/configurability**. The biggest gap is Apothecare's single-query retrieval vs. FM's multi-angle queries, and the volume of indexed papers |

### 3. LLM Architecture

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Model strategy** | Multi-tiered: small specialized LLMs for analysis of individual documents, larger LLM for final synthesis | Multi-provider (OpenAI primary, Anthropic for vision/fallback, MiniMax fallback) but single LLM call per task — no analysis→synthesis pipeline |
| **Specialization** | Domain-specific fine-tuned LLMs (John Snow Labs has medical NLP models like Spark NLP for Healthcare) | General-purpose models (GPT-4o, Claude Sonnet/Opus) with domain expertise injected via prompts |
| **Cost/speed** | Cheaper per query — small models do heavy lifting, big model only synthesizes | More expensive per query — full-size model handles everything |
| **Verdict** | **FM leads architecturally** — the analyze-then-synthesize pattern enables processing more retrieved documents effectively. Apothecare compensates with strong prompt engineering and evidence-level classification |

### 4. Analysis & Synthesis

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Document analysis** | Each retrieved document analyzed individually against: query objectives, patient context, user role, clinical relevance criteria | No per-document analysis step — all retrieved chunks injected directly into system prompt for the LLM |
| **Synthesis** | Separate synthesis step aggregates individual analyses | Single-pass: LLM reads all context + chunks and generates response in one call |
| **User role awareness** | Adapts to GP vs. specialist | Adapts via clinical lens (functional/conventional/both) and practitioner specialty from profile |
| **Parallel processing** | Retrieval + Analysis phases run in parallel | Visit generation runs SOAP then IFM+Protocol in parallel; citation validation runs all supplements in parallel; but chat is single-threaded |
| **Verdict** | **FM leads** — separating analysis from synthesis allows processing many more documents without hitting context limits. Apothecare's approach works but is constrained by context window size |

### 5. Citation & Evidence Quality

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Citation verification** | Unspecified | **Strong 3-tier pipeline**: Curated DB (pg_trgm) → CrossRef (DOI validation + relevance gate) → PubMed (fill remaining slots). Deduplication, evidence-level ranking, capped at 3 per item |
| **Evidence classification** | Unspecified | Color-coded badges: Meta-Analysis, RCT, Guideline, Cohort, Case Study — with hover popovers showing full paper metadata |
| **Hallucination prevention** | Likely benefits from specialized medical LLMs | `validateInputSafety()` for prompt injection; citation pipeline replaces AI-hallucinated DOIs with verified ones |
| **Verdict** | **Apothecare leads significantly** — the citation verification pipeline is a major differentiator. FM makes no mention of citation validation |

### 6. Patient Context & Memory

| Aspect | Functional Minds | Apothecare |
|---|---|---|
| **Patient memory** | Cross-session memory of patient specifics | Rich patient DB: demographics, medical history, medications, supplements, allergies, biomarker results, documents, vitals, FM timeline |
| **Clinical workflow** | Chatbot / advisor only | Full clinical platform: visits, SOAP notes, IFM Matrix, AI Scribe, lab parsing, supplement reviews, protocol generation |
| **Verdict** | **Apothecare leads massively** — FM is a chatbot advisor; Apothecare is a full clinical decision support platform with structured patient data feeding into AI |

---

## Summary: Where Apothecare Leads

1. **Citation verification pipeline** — 3-tier validation replacing hallucinated references with real papers. FM doesn't mention this.
2. **Full clinical workflow** — visits, labs, supplements, protocols, AI Scribe, IFM Matrix. FM is a chat advisor only.
3. **Evidence source configurability** — 9 sources with presets, per-query filtering, clinical lens switching.
4. **Structured patient data** — 25+ tables of clinical data feeding AI context, not just chat memory.
5. **HIPAA architecture** — defense-in-depth with BAAs, RLS, audit logging, zero-retention AI.
6. **Evidence-level classification** — visual badges with meta-analysis > RCT > guideline hierarchy.

## Summary: Where Functional Minds Leads

1. **Multi-step query planning** — decomposing complex queries into sub-objectives before retrieval.
2. **Multi-angle retrieval** — generating several optimized queries per question for broader coverage.
3. **Analyze-then-synthesize pipeline** — per-document analysis with small specialized LLMs, then synthesis with a larger model. This enables using far more retrieved documents effectively.
4. **Scale of knowledge base** — millions of papers vs. Apothecare's smaller corpus.
5. **Cost efficiency** — small specialized models for analysis = cheaper inference per query.

---

## Recommended Improvements for Apothecare

These are the high-value gaps to close, ordered by impact:

### 1. Multi-Query Retrieval (High Impact, Medium Effort)
Generate 3-5 variant queries per user question before retrieval. Use the LLM to rephrase the question from different clinical angles (pathophysiology, treatment, diagnosis, mechanism). This is the single biggest improvement for retrieval quality.

**Files to modify:** `src/lib/evidence/retrieve.ts`, `src/app/api/chat/stream/route.ts`

### 2. Analyze-then-Synthesize Pipeline (High Impact, High Effort)
Instead of injecting all chunks into one prompt, add an intermediate analysis step:
- Use a smaller/cheaper model to score and summarize each retrieved chunk against the query
- Feed only the best analyzed summaries into the final synthesis prompt
- This removes the context-window bottleneck and allows using more retrieved documents

**Files to modify:** `src/app/api/chat/stream/route.ts`, new file `src/lib/evidence/analyze.ts`

### 3. Scale the Knowledge Base (High Impact, Ongoing)
The PubMed ingestion pipeline (`src/lib/evidence/ingest-pubmed.ts`) exists. Priority: ingest more papers, especially from IFM, A4M, and functional medicine journals. The retrieval infrastructure is already built.

**Files to modify:** `scripts/ingest-pubmed.ts` (or similar batch job), `src/lib/evidence/ingest-pubmed.ts`

### 4. Hybrid Search (Medium Impact, Medium Effort)
The architecture doc already plans for BM25 + vector + RRF fusion. Implementing this would catch exact medical terms that vector search misses.

**Already planned in:** `docs/ARCHITECTURE.md` RAG section

### 5. Dynamic Query Planning (Medium Impact, High Effort)
For Deep Consult mode, decompose the user's question into sub-steps before retrieval. This is most valuable for complex multi-system cases.

**Files to modify:** `src/app/api/chat/stream/route.ts`, new file `src/lib/ai/query-planner.ts`

---

## Verdict

Apothecare and Functional Minds are solving different problems at different layers. FM is a specialized medical RAG chatbot with sophisticated retrieval. Apothecare is a full clinical platform where the AI chat is one of many features.

**Apothecare's moat is the clinical workflow** — no amount of RAG sophistication replaces structured visits, lab parsing, supplement reviews, and IFM Matrix mapping. FM's chatbot approach can't compete with that.

**The actionable gap is retrieval quality** — multi-query retrieval and analyze-then-synthesize are the two techniques worth adopting. These would make Apothecare's chat feature competitive with FM's retrieval while retaining all the clinical workflow advantages FM lacks.

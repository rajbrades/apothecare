# Architecture

## Overview

Apothecare is a Next.js 15 application using the App Router with React Server Components. It follows a hybrid architecture: Supabase Cloud handles auth, database, and file storage (all under one HIPAA BAA), while the Next.js application is deployed to Vercel (dev) or AWS Amplify (production, HIPAA-eligible). AI inference is handled by Anthropic's Claude API (separate HIPAA BAA with zero data retention). Audio transcription uses OpenAI's Whisper API for the AI Scribe feature.

## System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      Client (Browser / Mobile)                    │
│                                                                   │
│  Next.js 15 App Router + React 19 Server Components              │
│  Tailwind CSS v4 · Tiptap Block Editor · Web Speech API          │
│  SSE streaming for chat + visit generation                        │
└──────────┬──────────────────────────────────┬─────────────────────┘
           │ HTTPS                            │ HTTPS
           ▼                                  ▼
┌──────────────────────────┐   ┌─────────────────────────────────────┐
│    Next.js API Routes    │   │        Supabase Cloud (Pro)          │
│                          │   │                                      │
│  /api/chat/stream        │   │  ┌────────────┐  ┌───────────────┐ │
│  /api/visits/            │   │  │ Auth (JWT) │  │   Storage     │ │
│  /api/patients/          │   │  │ + MFA +RLS │  │ (Docs / PDFs) │ │
│                          │   │  └────────────┘  │  encrypted    │ │
│  Zod validated           │   │                   └───────────────┘ │
│  CSRF protected          │   │  ┌─────────────────────────────────┐│
│  Audit logged (IP+UA)    │   │  │  PostgreSQL 17 + pgvector       ││
│                          │   │  │  Row-Level Security              ││
└──────────┬───────────────┘   │  │  25+ tables + audit logs          ││
           │                   │  │  17 seeded biomarkers             ││
     ┌─────┼──────────┐       │  └─────────────────────────────────┘│
     ▼     ▼          ▼       │  HIPAA: Supabase Pro BAA             │
┌─────────┐ ┌────────┐       └─────────────────────────────────────┘
│Anthropic│ │ OpenAI │
│ Claude  │ │Whisper │   ┌──────────────────────────────────┐
│ API     │ │ API    │   │           Stripe                  │
│         │ │        │   │   $99/mo Pro subscription         │
│ Sonnet  │ │ Audio  │   │   Webhook → /api/webhooks/stripe │
│ Opus    │ │ → Text │   └──────────────────────────────────┘
│         │ └────────┘
│ HIPAA:  │
│ Zero-   │
│retention│
└─────────┘
```

## Infrastructure Decisions

### Why Supabase (not raw AWS)?

Supabase gives us PostgreSQL + Auth + Storage + RLS under a single HIPAA BAA for $25/month (Pro plan). Building the same on raw AWS would require RDS + Cognito + S3 + custom RLS middleware — significantly more operational overhead for a solo developer during the MVP phase.

### Why AWS Amplify for Production (not Vercel)?

Vercel's HIPAA BAA requires Enterprise at $3,000+/month. AWS Amplify supports Next.js 15, is HIPAA-eligible under the standard AWS BAA, and costs $20–100/month. Development uses Vercel (auto-deploy from main) for speed.

### Why Anthropic Claude (not OpenAI)?

Anthropic offers a HIPAA BAA with zero data retention — patient data sent via the API is never stored or used for training. Claude's extended thinking capability (Deep Consult mode) produces more thorough clinical reasoning.

### Supplement Review Flow (Current Implementation)

Supports two modes: **patient-based** (full context from DB) and **freeform** (no patient required).

```
Patient mode:
1. Practitioner selects a patient on Reviews tab → POST /api/supplements/review { patient_id }
2. CSRF + Zod validation + rate limit check → Auth → fetch patient (supplements, meds, allergies, history)
3. Fetch latest 50 biomarker results for lab correlation
4. Fetch practitioner's brand preferences (prioritized in prompt)
5. Build prompt: SUPPLEMENT_REVIEW_SYSTEM_PROMPT + brand prefs + patient context + lab context
6. Insert supplement_reviews row (status: generating, patient_id set)
7. Stream AI response via SSE: review_id, text_delta, review_complete, error
8. Parse JSON: items[] (keep/modify/discontinue per supplement) + additions[] + summary
9. Validate & enrich citations via 3-tier pipeline (validateAllReviewCitations):
   a. Tier 3 — Curated DB: check supplement_evidence table (pg_trgm fuzzy match, human-verified)
   b. Tier 1 — CrossRef: validate AI-provided DOI, check relevance via keyword matching + alias dictionary
   c. Tier 2 — PubMed: search ESearch + ESummary for real papers when DOI is missing/irrelevant
   d. Deduplicate by DOI, rank by evidence strength, cap at 3 per supplement
   e. Replace evidence_doi with verified_citations[] array on each item
10. Update row (status: complete, review_data JSONB with verified_citations)
11. Audit log with IP, user agent, patient_id

Freeform mode:
1. Practitioner toggles to "Freeform" mode → POST /api/supplements/review { supplements, medications?, medical_context? }
2. CSRF + Zod validation + rate limit → Auth
3. No patient/biomarker DB lookup; supplements text used directly
4. Insert supplement_reviews row (patient_id: null)
5. Same streaming/parsing/audit flow as patient mode

Push to Patient File:
1. Practitioner optionally overrides action badges (Keep/Modify/Discontinue/Add) via ActionBadge dropdown
2. POST /api/patients/[id]/supplements/push-review { review_id, action_overrides? }
3. Maps review items → patient_supplements rows with provenance (review_id)
4. Sets supplement_reviews.pushed_at for idempotency tracking
```

**Key files:**
- `src/lib/ai/supplement-prompts.ts` — Review + interaction system prompts, `buildSupplementReviewPrompt()`, `formatLabContextForReview()`
- `src/lib/citations/validate-supplement.ts` — 3-tier citation pipeline (CrossRef + PubMed + curated DB), `validateAllReviewCitations()`, `validateSupplementCitations()`, `lookupCuratedEvidence()`
- `src/lib/validations/supplement.ts` — Zod schemas + `SUPPORTED_BRANDS` const; `.refine()` requires patient_id OR supplements
- `src/lib/validations/patient-supplement.ts` — `pushReviewSchema` with `action_overrides` record
- `src/hooks/use-supplement-review.ts` — SSE streaming hook; accepts `{ patient_id }` or `{ supplements, medications?, medical_context? }`
- `src/app/api/patients/[id]/supplements/push-review/route.ts` — Push-review API with override support
- `supabase/migrations/020_supplement_evidence.sql` — Curated evidence table with pg_trgm, 17 seed citations

### Interaction Check Flow (Current Implementation)

```
1. Practitioner enters supplements + optional medications (or auto-fills from patient)
2. POST /api/supplements/interactions { supplements, medications?, patient_id? }
3. CSRF + Zod validation + rate limit check → Auth
4. Optional patient fetch for context enrichment
5. Insert interaction_checks row
6. Stream AI response with events: check_id, text_delta, check_complete, error
7. Parse JSON: interactions[] (severity-coded pairwise results) + summary
8. Update row with result_data JSONB
9. Audit log
```

**Key files:**
- `src/hooks/use-interaction-check.ts` — SSE streaming hook
- `src/components/supplements/interaction-result-card.tsx` — Severity-coded result cards

### Brand Formulary (Current Implementation)

```
1. Practitioner toggles preferred brands from SUPPORTED_BRANDS list
2. Can add custom brands not in the default list
3. PUT /api/supplements/brands { brands: [...] }
4. Preferences saved to practitioner_brand_preferences table
5. Active brands are injected into supplement review prompts as soft hints
6. AI prioritizes (but is not restricted to) preferred brands in recommendations
```

### Citation Validation Pipeline (Current Implementation)

Supplement reviews use a 3-tier pipeline to replace AI-hallucinated DOIs with verified citations:

```
Per supplement item (all items run in parallel):

1. Tier 3 — Curated DB (highest trust, checked first):
   a. Query supplement_evidence table using pg_trgm fuzzy match on supplement name
   b. Filter by is_verified = true, order by evidence_rank ASC
   c. Return up to 3 known-good VerifiedCitation objects

2. Tier 1 — CrossRef (validate AI-provided DOI):
   a. If AI provided evidence_doi and < 3 citations so far
   b. Fetch metadata from api.crossref.org/works/{doi}
   c. Run relevance check: isRelevant(supplementName, title, abstract, subjects)
   d. Uses getSupplementSearchTerms() alias dictionary (30+ supplements)
   e. Returns VerifiedCitation with origin: "crossref" if relevant; null if not

3. Tier 2 — PubMed (fill remaining slots):
   a. Build search query: supplementName + context keywords + "supplementation"
   b. ESearch → get PMIDs → ESummary → get metadata (JSON)
   c. Each result becomes a VerifiedCitation with origin: "pubmed"

4. Post-processing:
   a. Deduplicate by DOI across all tiers
   b. Sort by evidence strength (meta_analysis > rct > guideline > cohort > case_study)
   c. Cap at 3 citations per supplement
   d. Replace item.evidence_doi with item.verified_citations[]
```

**Key files:**
- `src/lib/citations/validate-supplement.ts` — Pipeline engine, `validateAllReviewCitations()`, alias dictionary
- `supabase/migrations/020_supplement_evidence.sql` — Curated evidence table, 17 seed citations
- `src/types/database.ts` — `VerifiedCitation` interface, `SupplementReviewItem.verified_citations`

## Data Flow Patterns

### Authentication Flow

```
1. Practitioner signs up (email/password)
2. Supabase Auth creates user record
3. Auth callback → check if practitioner profile exists
4. If no profile → redirect to /auth/onboarding
5. Onboarding: license type, license number, state, NPI, specialty focus
6. Practitioner record created (verification_status: pending, tier: free)
7. JWT issued → RLS policies enforce data isolation
8. Middleware refreshes session on every request
```

### Clinical Chat Flow (Current Implementation)

```
1. POST /api/chat/stream { message, conversation_id?, patient_id?, is_deep_consult?,
                           clinical_lens?, source_filter?, attachments? }
2. CSRF: Validate Origin header against NEXT_PUBLIC_APP_URL
3. Zod: Validate input schema (message 1-10k chars, UUIDs, boolean, lens enum, source array)
4. Prompt injection detection: validateInputSafety() checks for injection patterns
5. Auth: Verify Supabase JWT → extract auth_user_id
6. Fetch practitioner record (subscription_tier, query count)
7. RPC: check_and_increment_query() → returns false if over limit
8. If conversation_id is null → create new conversation record
9. If patient_id → load patient context (medications, allergies, history)
10. If attachments → inject extracted text into user message content
11. Fetch conversation history (last 20 messages)
12. Build system prompt:
    a. CLINICAL_CHAT_SYSTEM_PROMPT + patient context
    b. + CONVENTIONAL_LENS_ADDENDUM (if lens = "conventional")
       OR COMPARISON_LENS_ADDENDUM (if lens = "both")
    c. + buildSourceFilterAddendum() (if non-default source selection)
13. Call AI provider via SSE streaming (standard or advanced model)
14. Resolve citations via resolveCitationsMulti() — up to 3 references per citation:
    a. CrossRef 3-pass matching (strict → relaxed → author-only) with relevance gate:
       - Layer 1: NON_MEDICAL_DOMAINS blocklist rejects non-clinical papers
       - Layer 2: keyword overlap verifies context match against title/abstract/subjects
    b. PubMed search fills remaining slots (up to 3 total per citation):
       - Prefers systematic reviews, meta-analyses, RCTs via publication type filter
       - Relevance filtering checks PubMed titles against clinical keywords
       - PubMed publication types drive evidence level classification
    c. classifyEvidenceLevel(title, pubTypes) in src/lib/chat/classify-evidence.ts
15. Send citation_metadata_multi SSE event (citationsByKey: Record<string, CitationMeta[]>)
16. Save user message + assistant response; messages.citations JSONB populated
17. Insert audit_log entry (action: 'query', ip_address, user_agent,
    clinical_lens, source_filter, attachment_count)
18. Stream response tokens to client via Server-Sent Events
19. Client: hook handles citation_metadata_multi → citationsByKey on ChatMessage
    → CitationMetaContext (Map<string, CitationMeta[]>) → EvidenceBadge or EvidenceBadgeList
```

### Visit Generation Flow (Current Implementation)

```
1. User writes/dictates notes in block editor (Tiptap with templateSection nodes)
2. User clicks "Generate" → editorContentToText(json) flattens to labeled text
3. Save template_content (JSON) + raw_notes (text) via PATCH /api/visits/[id]
4. POST /api/visits/[id]/generate { raw_notes, sections: ["soap","ifm_matrix","protocol"] }
5. CSRF + Zod validation + rate limit check → Auth → fetch visit + patient context
6. Phase 1 (SOAP): Claude Sonnet streams SOAP note → parsed into S/O/A/P sections → saved
7. Phase 2 (parallel): IFM Matrix + Protocol run via Promise.all after SOAP completes
   - IFM: Claude maps SOAP findings to IFM Matrix nodes → saved as JSONB
   - Protocol: Claude generates evidence-based protocol → saved
8. Each phase streams SSE events: { section, status, text/data }
10. Client receives SSE stream via useVisitStream hook → populates SOAP/IFM/Protocol tabs
11. Audit log entry with IP, user agent, sections generated
```

### AI Scribe Pipeline (Current Implementation)

```
1. User clicks "AI Scribe" → MediaRecorder captures audio
2. User stops recording → "Process with AI Scribe" button appears
3. Step 1 — Transcription:
   a. Audio blob sent to POST /api/visits/[id]/transcribe
   b. Server forwards to OpenAI Whisper API → returns transcript text
   c. Status: "transcribing"
4. Step 2 — Section Assignment:
   a. Transcript sent to POST /api/visits/[id]/scribe
   b. Server loads visit's encounter template → builds dynamic prompt via buildScribeSystemPrompt()
   c. Claude parses transcript → assigns content to each section key
   d. Returns { sections: Record<string, string> }
   e. Status: "assigning"
5. Step 3 — Editor Population:
   a. templateToPopulatedContent(template, sections) builds Tiptap JSON
   b. editor.commands.setContent(populatedContent) fills editor
   c. Populated sections auto-expand, empty sections stay collapsed
   d. Status: "done"
6. Raw transcript saved to visit.raw_notes for audit trail
```

### Patient Document Extraction Flow (Current Implementation)

```
1. Practitioner uploads document via POST /api/patients/[id]/documents
2. File stored encrypted in Supabase Storage (patient-documents bucket)
3. Document record created with status: "uploaded"
4. POST /api/patients/[id]/documents/[docId]/extract triggers extraction
5. Claude reads document content → extracts structured clinical data
6. Extraction summary saved to patient_documents.extraction_summary
7. Status updated to "extracted"
```

### Lab Interpretation Pipeline (Current Implementation)

```
1. Practitioner uploads lab PDF via POST /api/labs (multipart form)
2. File stored encrypted in Supabase Storage (patient-documents bucket)
3. Lab report record created with status: "uploading" → "parsing"
4. Fire-and-forget: Claude Vision reads PDF → extracts biomarkers as JSON
5. Biomarker normalization: match to biomarker_references table
6. Flag calculation: conventional + functional flags (optimal/normal/borderline/out-of-range/critical)
7. Results saved to biomarker_results table, status → "complete"
8. Lab detail page polls status (3s interval), displays dual-range bars when ready
9. If patient_id linked, lab appears in patient's Documents tab (Lab Reports category) automatically
10. On failure: status → "error", retry via POST /api/labs/[id]/reparse re-triggers pipeline
11. Stuck job cleanup: GET /api/admin/cleanup-stuck-jobs marks jobs stuck >15min as error
```

**Key files:**
- `src/lib/ai/lab-parsing.ts` — Claude Vision PDF extraction
- `src/lib/ai/lab-parsing-prompts.ts` — Extraction prompt templates
- `src/lib/labs/normalize-biomarkers.ts` — Reference matching + flag calculation
- `src/lib/labs/flag-mapping.ts` — DB flag → display mapping

## Multi-Provider AI Architecture

The AI layer uses a provider abstraction (`src/lib/ai/provider.ts`) that routes requests through multiple providers with automatic failover:

```
┌─────────────────────────────────────────────────┐
│              provider.ts                         │
│  createCompletion() / streamCompletion()         │
│                                                  │
│  Primary: OpenAI (gpt-4o, gpt-4o-mini)          │
│  Vision:  Anthropic Claude (always, via          │
│           ANTHROPIC_MODELS constant)             │
│  Fallback: MiniMax                               │
└─────────────────────────────────────────────────┘
```

**ANTHROPIC_MODELS**: Features that always route through Anthropic regardless of primary provider:
- Document vision (PDF extraction)
- Lab PDF parsing (biomarker extraction)

## Model Routing Strategy

| Query Type | Provider | Model | Max Tokens |
|---|---|---|---|
| Standard clinical question | OpenAI (primary) | gpt-4o | 2,048 |
| Deep Consult (complex reasoning) | OpenAI (primary) | gpt-4o | 4,096 |
| Lab PDF parsing | Anthropic (always) | claude-sonnet-4-6 | 4,096 |
| Document extraction | Anthropic (always) | claude-sonnet-4-6 | 4,096 |
| SOAP note generation | OpenAI (primary) | gpt-4o | 4,096 |
| IFM Matrix mapping | OpenAI (primary) | gpt-4o | 3,000 |
| Protocol generation | OpenAI (primary) | gpt-4o | 4,096 |
| AI Scribe (section assignment) | OpenAI (primary) | gpt-4o | 4,096 |
| Supplement review | OpenAI (primary) | gpt-4o | 4,096 |
| Interaction check | OpenAI (primary) | gpt-4o | 4,096 |
| Audio transcription | OpenAI Whisper | whisper-1 | N/A |

## Security Architecture

### Defense in Depth

```
Layer 1: Network     → TLS 1.3 everywhere
Layer 2: Auth        → Supabase JWT, MFA available, session refresh middleware
Layer 3: CSRF        → Origin header validation on all mutating endpoints (shared validateCsrf())
Layer 4: Rate Limit  → Per-action, tier-aware daily limits on all AI endpoints (checkRateLimit())
Layer 5: Validation  → Zod schemas on all API inputs
Layer 6: Database    → Row-Level Security, practitioners see only their own data
Layer 7: XSS         → rehype-sanitize on all markdown rendering
Layer 8: AI          → Zero-retention BAA, PHI stripped where possible
Layer 9: Audit       → Every PHI access logged with IP, user agent, resource ID
Layer 10: Service    → Service role client is standalone (no cookie inheritance)
```

### Service Client Isolation

The Supabase service role client (`createServiceClient()`) uses `@supabase/supabase-js` directly — NOT `@supabase/ssr`. This prevents cookie data from being passed alongside the service role key, which bypasses RLS. The service client is a singleton, created once and reused.

## PDF Export Architecture (Sprint 23 — Planned)

### Export System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Branded PDF Export System                      │
│                                                                  │
│  src/lib/export/                                                │
│  ├── shared.ts      buildLetterhead() → logo + practice info    │
│  │                   buildPatientBar() → demographics            │
│  │                   buildFooter() → disclaimer + watermark      │
│  │                   buildExportPage() → full HTML wrapper       │
│  │                   fetchLogoAsBase64() → Supabase → data URI   │
│  ├── styles.ts      Shared print CSS (@page, page-break, fonts) │
│  ├── visit.ts       Visit/SOAP note template                    │
│  ├── lab-report.ts  Biomarker table template                    │
│  └── supplement-protocol.ts  Protocol template                  │
│                                                                  │
│  API Routes:                                                     │
│  GET /api/visits/[id]/export         → Visit PDF (enhanced)     │
│  GET /api/labs/[id]/export           → Lab Report PDF (NEW)     │
│  GET /api/supplements/review/[id]/export → Protocol PDF (NEW)   │
│                                                                  │
│  Storage:                                                        │
│  practice-assets bucket → {practitioner_id}/logo.{ext}          │
└─────────────────────────────────────────────────────────────────┘
```

**Design decision:** Clean white background + practice logo letterhead. No custom colors — medical documents must look authoritative.

**Technical approach:** Server-side styled HTML → browser print-to-PDF. Zero-dependency, no Puppeteer. Logo fetched server-side from Supabase Storage and embedded as base64 data URI.

### Export Security Controls

| Control | Status | Description |
|---------|--------|-------------|
| Auth + RLS | ✅ Done | Practitioner-patient relationship validated |
| Audit logging | ✅ Done | Export events logged with IP + user agent + session ID |
| Cache headers | ✅ Done | `Cache-Control: no-store, no-cache, private` on all exports |
| Watermarking | ✅ Done | Audit log ID + timestamp in visit export footer |
| Export session ID | ✅ Done | UUID linking audit log ↔ exported document |
| Filename sanitization | ✅ Done | Lab PDFs use report UUID, not original filename |
| Retention policy | ✅ Done | 6+ year policy documented in `docs/COMPLIANCE.md` |

### HIPAA Compliance Status

| Area | Status | Notes |
|------|--------|-------|
| Access control (auth + RLS) | ✅ | RLS enforced on all tables |
| Encryption in transit | ✅ | TLS 1.3, HSTS enabled |
| Encryption at rest | ✅ | AES-256 via Supabase (PostgreSQL + S3) |
| Audit logging | ✅ | Events logged with 6+ year retention policy |
| Cache-Control on exports | ✅ | `no-store, no-cache, private` on all export responses |
| AI data handling | ✅ | Zero-retention BAA, no training on patient data |
| Export watermarking | ✅ | Session ID + timestamp in export footer |
| Minimum necessary | ❌ | Account export dumps all data, no filtering |
| Security page | ✅ | Public `/security` page with full compliance overview |

## RAG Architecture (Planned)

### Retrieval Pipeline

```
1. Query → generate embedding (text-embedding-3-large, 1536 dims)
2. pgvector similarity search (cosine, threshold 0.7, top 10)
3. BM25 keyword search (pg_trgm) for exact term matching
4. Hybrid merge: RRF (Reciprocal Rank Fusion)
5. Filter by evidence source (IFM, A4M, PubMed)
6. Rerank: Claude scores each chunk for relevance
7. Top 5 chunks injected into prompt with source metadata
```

## Current File Structure

```
src/
├── app/
│   ├── (app)/                       # Route group — shared authenticated layout
│   │   ├── chat/page.tsx            # Clinical chat
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (trust banner)
│   │   │   └── page.tsx            # Dashboard home
│   │   ├── supplements/
│   │   │   ├── page.tsx            # Supplements hub (reviews, interactions, brands)
│   │   │   ├── loading.tsx         # Loading skeleton
│   │   │   └── review/[id]/page.tsx # Supplement review detail
│   │   ├── labs/
│   │   │   ├── [id]/page.tsx       # Lab report detail (biomarkers, PDF viewer)
│   │   │   ├── loading.tsx         # Lab list loading skeleton
│   │   │   └── page.tsx            # Lab list + upload
│   │   ├── patients/
│   │   │   ├── [id]/page.tsx       # Patient detail + documents + lab reports
│   │   │   ├── new/page.tsx        # New patient form
│   │   │   └── page.tsx            # Patient list
│   │   ├── conversations/
│   │   │   └── page.tsx            # Conversation history (search, filter, pagination)
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings (profile, credentials, preferences, subscription, account)
│   │   ├── visits/
│   │   │   ├── [id]/page.tsx       # Visit workspace (editor + AI generation)
│   │   │   ├── new/page.tsx        # New visit (patient + encounter type)
│   │   │   └── page.tsx            # Visit list
│   │   └── layout.tsx              # Shared app layout (sidebar + React cache)
│   ├── api/
│   │   ├── admin/
│   │   │   └── cleanup-stuck-jobs/route.ts  # GET mark stuck jobs as error (cron)
│   │   ├── supplements/
│   │   │   ├── review/
│   │   │   │   ├── route.ts         # POST SSE supplement review generation
│   │   │   │   └── [id]/route.ts    # GET single review detail
│   │   │   ├── reviews/route.ts     # GET list reviews (cursor paginated)
│   │   │   ├── interactions/route.ts # POST SSE interaction check
│   │   │   └── brands/route.ts      # GET/PUT brand preferences
│   │   ├── auth/
│   │   │   ├── change-password/route.ts  # POST change password (email auth only)
│   │   │   └── delete-account/route.ts   # POST cascade delete + auth delete
│   │   ├── practitioners/
│   │   │   ├── evidence-sources/route.ts # PUT save default evidence sources
│   │   │   └── profile/route.ts          # PATCH update practitioner profile
│   │   ├── conversations/
│   │   │   └── route.ts            # GET list conversations (search, filter, cursor pagination)
│   │   ├── chat/
│   │   │   ├── attachments/route.ts # POST file upload for chat attachments
│   │   │   ├── history/route.ts    # GET conversation messages + pagination
│   │   │   ├── route.ts            # DEPRECATED (410)
│   │   │   └── stream/route.ts     # SSE streaming chat endpoint
│   │   ├── labs/
│   │   │   ├── [id]/
│   │   │   │   ├── reparse/route.ts # POST re-trigger lab parsing
│   │   │   │   ├── review/route.ts  # POST lab review (stub 501)
│   │   │   │   └── route.ts         # GET single lab report
│   │   │   └── route.ts             # GET list / POST upload
│   │   ├── patients/
│   │   │   ├── [id]/
│   │   │   │   ├── documents/
│   │   │   │   │   ├── [docId]/
│   │   │   │   │   │   ├── extract/route.ts  # POST re-trigger extraction
│   │   │   │   │   │   ├── parse-as-lab/route.ts # POST create lab from document
│   │   │   │   │   │   ├── retry/route.ts   # POST retry failed extraction
│   │   │   │   │   │   └── route.ts          # GET/PATCH/DELETE document (rename, type change, delete)
│   │   │   │   │   └── route.ts              # GET list / POST upload
│   │   │   │   ├── populate-from-docs/
│   │   │   │   │   └── route.ts              # POST AI populate from extracted docs
│   │   │   │   ├── ifm-matrix/
│   │   │   │   │   └── merge/route.ts        # POST merge visit IFM into patient matrix
│   │   │   │   ├── fm-timeline/
│   │   │   │   │   ├── analyze/route.ts      # POST AI root cause analysis
│   │   │   │   │   └── events/route.ts       # POST push event to FM Timeline
│   │   │   │   ├── supplements/
│   │   │   │   │   ├── [supId]/route.ts      # PATCH/DELETE supplement
│   │   │   │   │   └── route.ts              # GET list / POST create
│   │   │   │   ├── timeline/
│   │   │   │   │   ├── route.ts              # GET patient timeline events
│   │   │   │   │   └── types/route.ts        # GET distinct event types for filter bar
│   │   │   │   ├── symptom-logs/
│   │   │   │   │   ├── [logId]/route.ts      # PATCH/DELETE symptom log
│   │   │   │   │   └── route.ts              # GET list / POST create
│   │   │   │   ├── protocol-milestones/
│   │   │   │   │   ├── [milestoneId]/route.ts # PATCH/DELETE milestone
│   │   │   │   │   └── route.ts              # GET list / POST create
│   │   │   │   ├── patient-reports/
│   │   │   │   │   ├── [reportId]/route.ts   # PATCH/DELETE report
│   │   │   │   │   └── route.ts              # GET list / POST create
│   │   │   │   ├── ai-insights/
│   │   │   │   │   ├── [insightId]/route.ts  # PATCH (dismiss) insight
│   │   │   │   │   └── route.ts              # GET list / POST create
│   │   │   │   └── route.ts        # GET/PATCH/DELETE patient
│   │   │   └── route.ts            # GET list / POST create
│   │   └── visits/
│   │       ├── [id]/
│   │       │   ├── export/route.ts     # POST export visit
│   │       │   ├── generate/route.ts   # POST SSE SOAP/IFM/Protocol generation
│   │       │   ├── push-vitals/route.ts # POST push vitals to patient chart
│   │       │   ├── scribe/route.ts     # POST AI Scribe (transcript → sections)
│   │       │   ├── transcribe/route.ts # POST audio → Whisper transcription
│   │       │   └── route.ts            # GET/PATCH visit
│   │       └── route.ts                # GET list / POST create
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth/email callback
│   │   ├── login/page.tsx          # Login with forgot password
│   │   ├── onboarding/page.tsx     # 2-step practitioner onboarding (imports from shared constants)
│   │   └── register/page.tsx       # Registration
│   ├── globals.css                 # Design system + CSS variables
│   ├── layout.tsx                  # Root layout (fonts via <link>)
│   └── page.tsx                    # Landing page (public)
├── components/
│   ├── chat/
│   │   ├── biomarker-range-bar.tsx # Dual-range biomarker visualization
│   │   ├── chat-input.tsx          # Input + Deep Consult + Clinical Lens + Sources + shortcuts
│   │   ├── chat-interface.tsx      # Main chat container
│   │   ├── comparison-card.tsx     # Two-column Conventional/Functional comparison card for "Both" lens
│   │   ├── evidence-badge.tsx      # Color-coded evidence level badges with hover popover
│   │   ├── markdown-config.tsx     # Shared ReactMarkdown components + CitationLink with evidence badge
│   │   ├── message-bubble.tsx      # Markdown rendering + CitationMetaContext.Provider + rehype-sanitize
│   │   └── source-filter-popover.tsx # Evidence source preset/toggle popover
│   ├── dashboard/
│   │   └── dashboard-search.tsx    # Search bar with Clinical Lens, Sources, Deep Consult, Attachments
│   ├── labs/
│   │   ├── lab-list-client.tsx     # Searchable/filterable lab list
│   │   ├── lab-report-card.tsx     # Lab report card for list view
│   │   ├── lab-report-detail.tsx   # Lab detail with biomarkers + PDF viewer
│   │   ├── lab-status-badge.tsx    # Lab status indicator
│   │   └── lab-upload.tsx          # Lab upload form with drag-and-drop
│   ├── supplements/
│   │   ├── supplements-page-client.tsx  # Tab container (Reviews, Interactions, Brands)
│   │   ├── review-tab.tsx               # Patient selector + generation + past reviews
│   │   ├── supplement-review-detail.tsx # Per-supplement cards with action badges
│   │   ├── supplement-review-stream.tsx # Streaming display during generation
│   │   ├── review-status-badge.tsx      # Status indicator (complete/generating/error/pending)
│   │   ├── interaction-checker.tsx      # Supplements + medications input + results
│   │   ├── interaction-result-card.tsx  # Severity-coded interaction cards
│   │   ├── brand-formulary.tsx          # Brand preference toggles + custom brands
│   │   └── fullscript-stub-button.tsx   # Fullscript integration placeholder
│   ├── landing/                    # 12 landing page components
│   ├── conversations/
│   │   └── conversation-list-client.tsx # Searchable conversation list (filter tabs, inline actions, pagination)
│   ├── layout/
│   │   ├── sidebar.tsx             # Nav + gold accents + upgrade banner + "View all →" links + settings link
│   │   └── sidebar-conversation.tsx # Conversation list management
│   ├── settings/
│   │   ├── settings-page.tsx       # Client layout — left nav + section cards
│   │   ├── profile-section.tsx     # Name + avatar display
│   │   ├── preferences-section.tsx # Evidence sources, brands, note template
│   │   ├── subscription-section.tsx # Plan badge, usage stats, upgrade CTA
│   │   └── account-section.tsx     # Password change, delete account
│   ├── patients/
│   │   ├── document-detail-sheet.tsx # Document detail drawer (extraction summary, structured data, retry)
│   │   ├── document-list.tsx       # Unified document + lab report list (rename, delete, parse-as-lab, clickable rows, processing banner)
│   │   ├── document-upload.tsx     # Document upload form (pending file UX, auto-upload on type select)
│   │   ├── extraction-status-badge.tsx  # AI extraction status indicator
│   │   ├── populate-from-docs.tsx  # AI populate banner + dialog (per-section checkboxes)
│   │   ├── patient-form.tsx        # Full patient create/edit form
│   │   ├── patient-list-client.tsx # Searchable patient list
│   │   ├── patient-profile.tsx     # Patient detail (8 tabs) + document detail drawer + expandable SOAP summaries
│   │   ├── vitals-snapshot.tsx    # Vitals + health ratings compact card with sparklines (Recharts)
│   │   ├── patient-timeline.tsx   # Chronological timeline with type filtering, AI synthesis, push to FM, Add Event, Resolve
│   │   ├── add-symptom-log-form.tsx  # Inline form for logging symptom events
│   │   ├── add-milestone-form.tsx    # Inline form for adding protocol milestones
│   │   ├── add-patient-report-form.tsx # Inline form for logging patient reports
│   │   ├── fm-timeline.tsx        # FM Health Timeline (ATM framework, life stages, AI root cause analysis)
│   │   ├── vitals-timeline.tsx    # Vitals + pillars of health tracking with Recharts
│   │   ├── supplement-list.tsx    # Structured supplement list (CRUD, inline add/edit/discontinue)
│   │   ├── patient-quick-create.tsx # Inline patient creation modal
│   │   └── pre-chart-view.tsx      # Pre-encounter patient summary
│   ├── ui/
│   │   ├── button.tsx              # Reusable button component (variants)
│   │   ├── confirm-dialog.tsx      # Confirmation dialog (z-60 layering)
│   │   ├── dropdown-menu.tsx       # Radix UI dropdown menu
│   │   ├── editable-sections.tsx   # Reusable editable section components
│   │   ├── input.tsx               # Reusable input component
│   │   ├── label.tsx               # Reusable label component
│   │   ├── logomark.tsx            # SVG logomark
│   │   ├── reset-countdown.tsx     # Query reset timer
│   │   └── sonner.tsx              # Toast notifications
│   └── visits/
│       ├── audio-recorder.tsx      # Audio recording component
│       ├── create-visit-button.tsx # Reusable create visit button
│       ├── editor/
│       │   ├── dictation-bar.tsx       # Dictation + AI Scribe controls
│       │   ├── editor-toolbar.tsx      # Bold, italic, lists toolbar
│       │   ├── template-section-node.tsx # Collapsible section NodeView
│       │   └── visit-editor.tsx        # Main Tiptap editor wrapper
│       ├── ifm-node-modal.tsx      # IFM Matrix node editing modal
│       ├── visit-workspace.tsx     # Editor + generate + SOAP/IFM/Protocol tabs + compact recorder when SOAP exists
│       ├── vitals-panel.tsx        # Vitals input/display with chart support
│       ├── new-visit-form.tsx      # Patient + encounter type selector
│       ├── voice-input.tsx         # Voice input component
│       ├── soap-sections.tsx       # SOAP note display tabs
│       ├── ifm-matrix-view.tsx     # IFM Matrix visualization (display-only cards, click → IFMNodeModal)
│       ├── protocol-panel.tsx      # Protocol recommendations panel
│       └── export-menu.tsx         # Visit export options
├── hooks/
│   ├── use-chat.ts                 # SSE streaming hook (chat + citation_metadata_multi handler)
│   ├── use-editor-dictation.ts     # Dictation + AI Scribe → editor bridge
│   ├── use-audio-recorder.ts       # MediaRecorder wrapper
│   ├── use-speech-recognition.ts   # Web Speech API wrapper
│   ├── use-visit-stream.ts         # Visit generation SSE hook
│   ├── use-supplement-review.ts    # Supplement review SSE hook
│   ├── use-interaction-check.ts    # Interaction check SSE hook
│   └── use-timeline.ts             # Timeline data hook (events, filters, available types)
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts            # Claude client + ANTHROPIC_MODELS + lens addendums
│   │   ├── populate-prompts.ts     # AI prompts for populate-from-docs (medical history, notes, IFM matrix)
│   │   ├── provider.ts             # Multi-provider abstraction (OpenAI/Anthropic/MiniMax)
│   │   ├── source-filter.ts        # Evidence source definitions, presets, prompt addendums
│   ├── chat/
│   │   ├── citation-meta-context.ts # CitationMeta interface + CitationMetaContext (Map<string, CitationMeta[]>)
│   │   ├── classify-evidence.ts    # classifyEvidenceLevel(title, pubTypes?) — PubMed pub types + title keywords → EvidenceLevel
│   │   ├── process-citations.ts    # processCitations() — citation text preprocessing
│   │   └── parse-comparison.ts     # parseComparisonSections() — "Both" lens response parser
│   ├── citations/
│   │   ├── resolve.ts              # CrossRef + PubMed multi-citation resolution (3-pass + relevance gate + up to 3 per citation)
│   │   └── validate-supplement.ts  # 3-tier citation pipeline (CrossRef + PubMed + curated DB) for supplement reviews
│   │   ├── scribe-prompts.ts       # AI Scribe section assignment prompt
│   │   ├── supplement-prompts.ts   # Supplement review + interaction check prompts
│   │   ├── visit-prompts.ts        # SOAP/IFM/Protocol generation prompts
│   │   ├── transcription.ts        # OpenAI Whisper integration
│   │   ├── clinical-summary.ts     # Patient clinical summary generation
│   │   ├── document-extraction.ts  # Document content extraction
│   │   ├── document-extraction-prompts.ts  # Extraction prompt templates
│   │   ├── lab-parsing.ts          # Lab PDF parsing via Claude Vision
│   │   └── lab-parsing-prompts.ts  # Lab parsing prompt templates
│   ├── api/
│   │   ├── audit.ts                # Shared fire-and-forget audit logging
│   │   ├── csrf.ts                 # Shared CSRF validation utility
│   │   └── rate-limit.ts           # Per-action, tier-aware rate limiting
│   ├── editor/
│   │   └── template-section-extension.ts  # Custom Tiptap templateSection node
│   ├── ifm/
│   │   └── merge.ts               # IFM Matrix merge utility (dedup findings, severity escalation, notes concat)
│   ├── labs/
│   │   ├── normalize-biomarkers.ts # Biomarker reference matching + flag calculation
│   │   └── flag-mapping.ts         # DB flag → component display mapping
│   ├── templates/
│   │   ├── types.ts                # TemplateSectionDef, EncounterTemplate
│   │   ├── definitions.ts          # 4 encounter templates
│   │   └── to-editor-content.ts    # Template ↔ editor JSON ↔ text
│   ├── storage/
│   │   ├── patient-documents.ts    # Patient document Storage integration
│   │   └── lab-reports.ts          # Lab report Storage integration
│   ├── supabase/
│   │   ├── cached-queries.ts       # React cache() for layout queries
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Auth middleware + route protection
│   │   └── server.ts              # Server client + standalone service client
│   ├── constants/
│   │   └── practitioner.ts        # Shared LICENSE_OPTIONS, US_STATES, SPECIALTY_OPTIONS, validateNpi
│   ├── utils.ts                    # cn() — Tailwind class merging, formatRelativeTime() — shared date utility
│   └── validations/
│       ├── chat.ts                 # Chat API schemas
│       ├── visit.ts                # Visit create/update/generate schemas
│       ├── patient.ts              # Patient create/update schemas
│       ├── patient-supplement.ts   # Patient supplement CRUD schemas
│       ├── timeline.ts             # Timeline event types + filters
│       ├── symptom-log.ts          # Symptom log create/update schemas
│       ├── protocol-milestone.ts   # Protocol milestone create/update schemas
│       ├── patient-report.ts       # Patient report create/update schemas (report_type enum)
│       ├── ai-insight.ts           # AI insight create/update schemas (insight_type, confidence enums)
│       ├── conversation.ts         # Conversation list query schema (search, filter, cursor, limit)
│       ├── settings.ts             # Settings schemas (profile update, password change, delete account)
│       ├── document.ts             # Document upload/extraction schemas
│       ├── lab.ts                  # Lab upload/list schemas
│       └── supplement.ts           # Supplement review/interaction/brand schemas
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase type definitions

tests/
├── auth/
│   └── sanitize-redirect.test.ts   # Open redirect prevention (11 tests)
├── lib/
│   ├── api/
│   │   └── csrf.test.ts            # CSRF validation (5 tests)
│   ├── labs/
│   │   └── normalize-biomarkers.test.ts  # Biomarker flags + matching (21 tests)
│   └── validations/
│       ├── chat.test.ts            # Chat schemas (11 tests)
│       ├── document.test.ts        # Document schemas (8 tests)
│       ├── lab.test.ts             # Lab schemas (13 tests)
│       ├── patient.test.ts         # Patient schemas (11 tests)
│       └── visit.test.ts           # Visit schemas (16 tests)

supabase/migrations/
├── 001_initial_schema.sql          # 12 core tables + RLS + audit logging
├── 002_visits_status.sql           # visit_type, status, ai_protocol columns
├── 003_patient_documents.sql       # patient_documents table
├── 004_visit_template_content.sql  # template_content JSONB column
├── 005_rate_limits.sql             # Rate limit table + RPC
├── 006_supplements.sql             # 3 enums + 3 tables (supplement_reviews, interaction_checks, practitioner_brand_preferences) + RLS
├── 007_lab_enhancements.sql        # Lab search, archival, smart titles
├── 008_chat_attachments.sql        # chat_attachments storage bucket
├── 009_timeline_events.sql         # timeline_events table, enum, RLS, auto-insert triggers, backfill
├── 010_patient_supplements.sql     # patient_supplements table, enums, RLS, indexes
├── 011_patient_ifm_matrix.sql      # patients.ifm_matrix JSONB column (persistent IFM Matrix)
├── 012_supplement_review_pushed_at.sql  # supplement_reviews.pushed_at timestamp for idempotency
├── 013_protocol_push.sql           # patient_supplement_source 'protocol' enum value, patient_supplements.visit_id, visits.protocol_pushed_at
├── 014_freeform_reviews.sql        # supplement_reviews.patient_id nullable (freeform reviews without a patient)
├── 015_supplement_timeline_triggers.sql  # supplement_start/stop/dose_change auto-insert triggers + backfill
├── 016_document_timeline_triggers.sql   # document_upload event type, upload/visit completion triggers + backfill
├── 017_vitals_health_ratings.sql        # patient_vitals table for vitals + pillars of health tracking
├── 018_fm_timeline.sql                  # patients.fm_timeline_data JSONB column (FM Health Timeline)
├── 019_timeline_event_producers.sql     # 4 producer tables (symptom_logs, protocol_milestones, patient_reports, ai_insights) + auto-insert triggers
├── 020_supplement_evidence.sql          # Curated supplement evidence table with pg_trgm, 17 seed citations, RLS read-only
├── 021_vitals_pushed_at.sql             # visits.vitals_pushed_at TIMESTAMPTZ
├── 022_lab_source_document.sql          # lab_reports.source_document_id UUID FK to patient_documents
└── 023_patient_recommendations.sql      # dietary_recommendations, lifestyle_recommendations, follow_up_labs JSONB on patients
```

## Test Infrastructure

**Runner:** Vitest v4.0 with `@/` path alias resolution
**Command:** `npm test` (vitest run) / `npm run test:watch` (vitest)
**Coverage:** 8 test files, 96 tests — P0 clinical logic + all validation schemas + security utilities

| Category | Files | Tests |
|---|---|---|
| Biomarker flag calculation (P0 clinical) | 1 | 21 |
| Validation schemas (chat, patient, visit, lab, document) | 5 | 59 |
| CSRF validation | 1 | 5 |
| Redirect sanitization | 1 | 11 |

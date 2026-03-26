# Apothecare — TODO

Last updated: March 26, 2026

---

## Completed Sprints (Collapsed)

<details>
<summary><strong>P0 — Fix Before Any Demo</strong> ✅</summary>

- [x] **Security:** Fix `createServiceClient()` — standalone client, no cookie passthrough
- [x] **Usability:** Fix query count display for new users
- [x] **UI:** Remove duplicate trust banner
- [x] **Security:** Add IP + user agent to audit logs (HIPAA)
- [x] **Performance:** Move Google Fonts to `<link>` preconnect
- [x] **Usability:** Add loading skeletons for dashboard + chat
- [x] **UI:** Replace emoji icons with Lucide

</details>

<details>
<summary><strong>P1 — Ship Quality</strong> ✅</summary>

- [x] **Security:** Zod input validation on chat stream route
- [x] **Security:** CSRF origin checking on chat stream route
- [x] **Usability:** Deep Consult explanation tooltip/modal
- [x] **UI:** Elevate "New Conversation" as primary sidebar action
- [x] **Performance:** Parallelize dashboard + chat layout DB queries
- [x] **Usability:** Keyboard shortcuts (⌘K, ⌘↵, Esc)
- [x] **Performance:** Deprecate non-streaming /api/chat route
- [x] **Security:** rehype-sanitize on ReactMarkdown
- [x] **Usability:** Forgot password wired to Supabase
- [x] **UI:** Gold accent activated (sidebar upgrade banner, Pro badge, Deep Consult)
- [x] **UI:** Redesign landing page — product mockups, scroll animations, social proof, trust partner logos
- [x] **Performance:** Debounce ReactMarkdown during streaming

</details>

<details>
<summary><strong>P2 — Award-Worthy Polish</strong> ✅</summary>

- [x] **Design:** Build evidence badge component
- [x] **Design:** Build biomarker dual-range bar visualization
- [x] **UI:** Page transition animations (CSS-based)
- [x] **UI:** Scroll-triggered animations on landing page
- [x] **Design:** Create illustration/photography style guide + hero visual
- [x] **Usability:** NPI validation — Luhn mod 10 check digit algorithm
- [x] **UI:** Dark mode support
- [x] **Security:** Content-Security-Policy + Strict-Transport-Security headers
- [x] **Usability:** Query reset countdown timer
- [x] **Usability:** Empty state pages for /labs, /patients, /visits
- [x] **Usability:** Conversation management — rename, delete, archive
- [x] **UI:** Consistent container styling
- [x] **UI:** Leverage typography system
- [x] **Performance:** Paginate conversation history API
- [x] **Performance:** Cache sidebar data via shared route group layout
- [x] **Design:** Micro-animations
- [x] **UI:** Consistent icon sizing
- [x] **Security:** Environment variable validation at startup
- [x] **Design:** Landing → App visual continuity
- [x] **Design:** Logomark — "A" on brand circle

</details>

<details>
<summary><strong>Clinical Visits Module</strong> ✅</summary>

- [x] **Feature:** Visit list page
- [x] **Feature:** New visit page
- [x] **Feature:** Visit workspace — block editor + dictation + generate flow
- [x] **Feature:** Block-based editor — Tiptap with custom `templateSection` nodes
- [x] **Feature:** 4 encounter templates — SOAP, H&P, Consult, Follow-up
- [x] **Feature:** Visit generation — SSE streaming SOAP notes, IFM Matrix mapping, protocol recommendations
- [x] **Feature:** Visit export
- [x] **Feature:** Voice input — Web Speech API + MediaRecorder
- [x] **Feature:** Audio transcription — OpenAI Whisper
- [x] **Feature:** AI Scribe — record → transcription → auto-populate editor
- [x] **Feature:** Patient quick-create modal
- [x] **DB:** Migration 002 — visit_type, status, ai_protocol
- [x] **DB:** Migration 004 — template_content JSONB

</details>

<details>
<summary><strong>Patient Management</strong> ✅</summary>

- [x] **Feature:** Patient list page
- [x] **Feature:** Patient detail page
- [x] **Feature:** Patient create/edit form
- [x] **Feature:** Patient documents — upload, list, manage
- [x] **Feature:** Document extraction — AI-powered content extraction via Claude
- [x] **Feature:** Pre-chart view
- [x] **DB:** Migration 003 — patient_documents table

</details>

<details>
<summary><strong>Labs Module</strong> ✅</summary>

- [x] **Feature:** Lab upload page — drag-and-drop PDF
- [x] **Feature:** Lab detail page — biomarker results with dual-range bars
- [x] **Feature:** Lab list — searchable/filterable
- [x] **Feature:** Lab API — GET/POST /api/labs, GET /api/labs/[id]
- [x] **Feature:** Lab parsing pipeline — Claude Vision PDF extraction → normalization
- [x] **Feature:** Biomarker normalization
- [x] **Feature:** Lab reports in patient Documents tab
- [x] **Refactor:** Merged Labs tab into Documents tab
- [x] **Refactor:** Trends promoted to dedicated top-level tab

</details>

<details>
<summary><strong>Multi-Provider AI</strong> ✅</summary>

- [x] **Feature:** Provider abstraction layer — `createCompletion()` + `streamCompletion()`
- [x] **Feature:** OpenAI primary, Anthropic for vision, MiniMax fallback
- [x] **Feature:** `ANTHROPIC_MODELS` constant for Anthropic-only features

</details>

<details>
<summary><strong>IFM Matrix</strong> ✅</summary>

- [x] **Feature:** Portal-based modal for node editing
- [x] **Feature:** Visit workspace wiring
- [x] **Feature:** Patient-level IFM Matrix — persistent JSONB (migration 011)
- [x] **Feature:** IFM Matrix tab on patient profile
- [x] **Feature:** "Push to Patient Matrix" button
- [x] **Feature:** Merge utility (`src/lib/ifm/merge.ts`)
- [x] **Refactor:** Simplified `ifm-matrix-view.tsx` from ~530 to ~155 lines

</details>

<details>
<summary><strong>Patient Timeline</strong> ✅ Phase 1 + 2</summary>

- [x] **DB:** Migration 009 — `timeline_events` table
- [x] **Feature:** Timeline API — cursor-paginated, filterable
- [x] **Feature:** Timeline tab on patient profile
- [x] **DB:** Migration 016 — `document_upload` trigger + `on_visit_completed` trigger
- [x] **DB:** Migration 015 — supplement triggers
- [x] **DB:** Migration 019 — `symptom_logs`, `protocol_milestones`, `patient_reports`, `ai_insights`
- [x] **Feature:** CRUD APIs for all 4 producer types
- [x] **Feature:** "Add Event" dropdown — Log Symptom, Add Milestone, Log Patient Report
- [x] **Feature:** "Resolve" button on unresolved symptom events
- [x] **Feature:** Smart filter bar

</details>

<details>
<summary><strong>Inline-Editable Patient Overview</strong> ✅</summary>

- [x] **Feature:** Per-section edit mode on Overview
- [x] **Feature:** `EditableTextSection` — textarea editor with PATCH save
- [x] **Feature:** `EditableTagSection` — tag-cloud editor

</details>

<details>
<summary><strong>Security Hardening</strong> ✅</summary>

- [x] **Security:** CSRF protection on all 13 mutating endpoints
- [x] **Security:** Rate limiting on all AI endpoints
- [x] **Security:** Filename sanitization on storage paths
- [x] **Security:** Search parameter escaping for PostgREST

</details>

<details>
<summary><strong>UI/UX Scalability</strong> ✅</summary>

- [x] **Refactor:** Reusable `Button`, `Input`, `Label`, `DropdownMenu` components
- [x] **Feature:** Toast Notifications (Sonner)
- [x] **Refactor:** Updated PatientForm, Sidebar, NewVisitForm to use shared components

</details>

<details>
<summary><strong>Supplement Intelligence — Phases 1 & 2</strong> ✅</summary>

- [x] **Feature:** Supplement search, review module, interaction checker, brand formulary, strict mode
- [x] **Feature:** Structured `patient_supplements` table (Migration 010)
- [x] **Feature:** "Push to Patient File" (Migration 012)
- [x] **Feature:** Clinician action overrides
- [x] **Feature:** Freeform supplement reviews (Migration 014)
- [x] **Feature:** Push protocol supplements (Migration 013)

</details>

<details>
<summary><strong>Clinical Lens & Source Filtering</strong> ✅ Phase 1</summary>

- [x] **Feature:** Clinical Lens toggle — Functional / Conventional / Both
- [x] **Feature:** Conventional + Comparison lens system prompt addendums
- [x] **Feature:** Evidence source filter UI — presets + individual source toggles
- [x] **Feature:** Structured Comparison Card — two-column visual card

</details>

<details>
<summary><strong>Sprints 7–22</strong> ✅</summary>

- Sprint 7: UX Fixes & Polish (Feb 16)
- Sprint 8: Biomarker Timeline & Chat Enhancements (Feb 16)
- Sprint 9: Clinical Lens, Source Filtering, Brand Filtering (Feb 17)
- Sprint 10: Evidence Quality Badges & Bug Fixes (Feb 18)
- Sprint 11: Labs Patient Search, Assign, Browse & Auto-Timeline (Feb 23)
- Sprint 12: Citation Integrity Pipeline & Evidence Badge UX (Feb 25–26)
- Sprint 17: Chat Citation Relevance & Multi-Citation Badges (Feb 26)
- Sprint 18: Document Management, AI Populate, Visit UX (Feb 27)
- Sprint 19: Protocol Push, Vitals Snapshot, Carry-Forward (Feb 27)
- Sprint 20: Document UX, Settings Page, Sidebar Polish (Mar 2)
- Sprint 21: Conversation History Page (Mar 2)
- Sprint 22: Visit AI Assistant, Data Export, Lab UX (Mar 4)

</details>

---

## HIPAA Compliance Audit — March 25, 2026

Full codebase audit findings. Organized by severity.

---

### 🔴 CRITICAL — ✅ All Resolved (March 25, 2026)

- [x] **C1. Storage files not deleted on account/patient deletion** — `src/app/api/auth/delete-account/route.ts` and `src/app/api/patients/[id]/permanent-delete/route.ts` cascade-delete DB records but orphan lab PDFs and patient documents in Supabase Storage buckets (`patient-documents`, `practice-assets`). **HIPAA §164.530(c)**: PHI must be disposed when no longer needed. **Fix:** Add storage cleanup loop using `deleteFromStorage()` from `src/lib/storage/patient-documents.ts` before final deletion.

- [x] **C2. Patient portal read access not audited (5 routes)** — `GET /api/patient-portal/me`, `me/labs`, `me/notes`, `me/consents`, `me/intake` do not call `auditLog()`. **HIPAA §164.312(b)**: All PHI access must be logged, including patient self-access. **Fix:** Add `auditLog({ action: "patient_view_*", ... })` to each GET handler.

- [x] **C3. Account export missing Cache-Control headers** — `src/app/api/account/export/route.ts` (line 173) returns ZIP without `Cache-Control: no-store` — proxies/CDNs could cache PHI. Visit/lab/supplement exports already use `EXPORT_HEADERS` from `src/lib/export/shared.ts`. **Fix:** Add same headers to account export response.

- [x] **C4. Database error messages leaked to clients (19 routes)** — Pattern `return jsonError(error.message, 500)` exposes Postgres internals (table names, constraint names, column types) to the client. Affects: `ai-insights`, `supplements`, `patient-reports`, `protocol-milestones`, `symptom-logs`, `invites`, `notes`, `labs/share`, and 11 more. **Fix:** Return generic "Internal server error"; log actual error server-side with `console.error()`.

---

### 🟡 HIGH — H1-H5 Resolved, H6-H11 Remaining

- [x] **H1. `select("*")` violates minimum necessary (12+ routes)** — Account export fetches ALL columns from patients, visits, labs, conversations, supplements, timeline_events. Other routes (`patient-reports`, `protocol-milestones`, `symptom-logs`, `supplements`) also over-fetch. **HIPAA Minimum Necessary Standard**. **Fix:** Replace with explicit field lists.

- [x] **H2. Console logging includes patient/practitioner IDs** — `src/app/api/patients/[id]/documents/route.ts` (lines 43, 111) logs `{ patientId, practitionerId }`. Also `src/app/api/auth/delete-account/route.ts` (line 75). Server logs may not have HIPAA-compliant access controls. **Fix:** Log error type/message only, never identifiers.

- [x] **H3. Chat history read not audited** (was already implemented) — `GET /api/chat/history` retrieves conversation messages (may contain PHI in AI responses referencing patient context) but does not call `auditLog()`. **Fix:** Add audit log for message retrieval.

- [x] **H4. Invite revoke not audited** (was already implemented) — `POST /api/patient-portal/invites/[id]/revoke` does not call `auditLog()`. Revocation is a security-relevant action. **Fix:** Add audit log with `action: "invite_revoked"`.

- [x] **H5. Admin flagged-citations endpoints not audited** (was already implemented) — `GET /api/admin/flagged-citations` and `GET /api/admin/flagged-citations/search` access PHI (user questions, AI answers) but do not call `auditLog()`. **Fix:** Add audit logging with `resourceType: "conversation_messages"`.

- [ ] **H6. No automated audit log archival** — `docs/COMPLIANCE.md` documents 6-7 year retention policy but marks archival as "planned." No cron job or script exists to archive logs >1yr to cold storage. **Fix:** Implement scheduled function to archive to AWS S3 Glacier.

- [ ] **H7. Patient right to amendment not implemented** — No correction request workflow in patient portal. **HIPAA §164.526**: Patients have the right to request amendments to their PHI. **Fix:** Add "Request Correction" form in portal → notification to practitioner → review/approve workflow.

- [ ] **H8. No patient disclosure log view** — Audit logs capture all PHI access but patients cannot see who accessed their data. Some state privacy laws require this. **Fix:** Add read-only audit log view in patient portal showing access events for their record.

- [ ] **H9. OpenAI and Supabase BAA status unverified** — Anthropic BAA confirmed (zero-retention). OpenAI (Whisper transcription) and Supabase marked "required" in `docs/COMPLIANCE.md` but not confirmed as signed. **Fix:** Verify and document current BAA status for both vendors.

- [ ] **H10. RLS deny policies missing on `citation_corrections` table** — `citation_corrections` (migration 028) lacks explicit `WITH CHECK (false)` / `USING (false)` deny policies for client INSERT/UPDATE/DELETE. Currently admin-only via service client, but explicit deny is defense-in-depth. **Fix:** Add migration with deny policies.

- [ ] **H11. Zod validation missing for replacement citation data** — `replacement_doi` needs DOI format regex (`10.xxxx/...`), `replacement_title` max length (1000), `replacement_authors` max array size (50) in the admin flagged-citations endpoint.

---

### 🟠 MEDIUM — Fix Next Sprint

- [ ] **M1. Site-access cookie missing secure flags** — `src/middleware.ts` (line 14) sets `site_access` cookie without HttpOnly, Secure, SameSite=Strict flags. Only relevant if `SITE_PASSWORD` is used in production.

- [ ] **M2. Empty ADMIN_EMAILS not logged** — If env var is unset/empty, all admin routes silently deny access. No warning logged at startup or request time. **Fix:** Log warning when `isAdmin()` is checked and ADMIN_EMAILS is empty.

- [ ] **M3. No breach detection automation** — No alerting for anomalous export volumes, unusual IP access patterns, or failed login tracking. `docs/COMPLIANCE.md` documents a 5-step response process but no detection. **Fix:** Add thresholds and alerts (e.g., >3 exports/hour, access from new country).

- [ ] **M4. No practitioner AI consent documentation** — Patients sign consent forms before portal access. Practitioners don't explicitly consent to AI processing of patient PHI. **Fix:** Add consent checkbox in practitioner settings or onboarding.

- [ ] **M5. AI responses stored as-is may contain synthesized PHI** — Chat responses referencing patient context (name, DOB, medications) are stored in `messages` table. Mitigated by RLS (practitioners see only their own conversations). **Fix:** Document in compliance guide that stored AI responses are PHI and subject to same protections.

- [ ] **M6. Patient deletion doesn't cascade all tables** — `POST /api/patients/[id]/permanent-delete` only explicitly deletes `patient_supplements` and `timeline_events`. Other tables (`patient_documents`, `lab_reports`, `visits`, conversation `messages`) may rely on FK cascades but this isn't verified. **Fix:** Verify FK cascade behavior or add explicit deletes.

---

### ✅ PASSING Areas (No Action Required)

- [x] **Encryption in transit** — HSTS max-age=31536000, TLS 1.3, all APIs HTTPS-only
- [x] **Encryption at rest** — AES-256 Supabase PostgreSQL + S3 storage encryption
- [x] **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy configured in `next.config.ts`
- [x] **RLS coverage** — All 18+ tables with RLS enabled and appropriate policies
- [x] **CSRF protection** — All mutating endpoints call `validateCsrf()`
- [x] **Auth verification** — Service client (`createServiceClient()`) never used before auth check
- [x] **Audit log immutability** — RLS SELECT-only for clients (migration 033), service role INSERT only
- [x] **Audit log retention** — 6-year policy documented, indexes configured for efficient retention queries
- [x] **Patient consent** — HIPAA NPP + Telehealth consent signed before portal access (migration 029/030)
- [x] **Data export** — ZIP export with audit trail, session tracking, rate limiting
- [x] **Export watermarking** — Session ID + timestamp on visit/lab/supplement exports via `EXPORT_HEADERS`
- [x] **Invite token security** — SHA-256 hash stored, raw token never persisted, 72h TTL
- [x] **Anthropic BAA** — Zero-retention policy confirmed, no PHI used for training
- [x] **Legal pages** — Terms, Security, Telehealth, Advertising pages live with footer links
- [x] **Registration consent** — Terms acceptance checkbox required before signup

---

### Previously Completed (Sprint 23/26/27)

- [x] Export security headers on visit/lab/supplement exports (`EXPORT_HEADERS` in `src/lib/export/shared.ts`)
- [x] Export watermarking with `export_session_id` UUID
- [x] Lab PDF filename sanitization in account export (uses UUID instead of `raw_file_name`)
- [x] `docs/COMPLIANCE.md` with audit log retention policy, export access policies, encryption requirements
- [x] Lazy env validation (build-time crash fix)
- [x] Legal pages (Terms, Security, Telehealth, Advertising)
- [x] Footer links + registration consent checkbox
- [x] HIPAA audit trail hardening (migration 033 — append-only, 6-year retention, indexes)
- [x] PHI read logging for patient charts/labs/notes (`auditLogServer()` in server components)
- [x] Grounded citation system (eliminates hallucinated citations exposing fake medical claims)

---

## Sprint 25 — RAG & Partnerships (Planned)

Partnership RAG pipeline end-to-end: ingestion, retrieval, chat/supplement/visit wiring, source filtering, admin.

### Partnership RAG — Phase 1 ✅ COMPLETE
- [x] **DB:** Apply migration 024 via Supabase Dashboard SQL Editor
- [x] **Ingest:** Run ingestion for Apex Energetics "Mastering the Thyroid" 3-part masterclass
- [x] **Test:** Verify retrieval with a thyroid-related query

## Strategy & Pricing

- [ ] **Strategy:** Determine pricing model for "Deep Research" premium service (autonomous literature review using advanced reasoning models).

---

## Sprint 7 — UX Fixes & Polish (Feb 16) ✅ COMPLETE

- [x] **Fix:** Lab parsing resilience — retry logic with model fallback (Opus → Sonnet) for transient 429/529/503 errors
- [x] **Fix:** Null unit constraint violation in biomarker results insert
- [x] **Fix:** IFM Matrix and Protocol tabs now show saved data on page load (idle stream status was blocking render)
- [x] **Fix:** Conversation switching — clicking sidebar conversations now loads correctly
- [x] **Fix:** Sidebar refreshes after visit deletion
- [x] **UI:** Lab report section titles in ALL CAPS with enhanced panel headers (accent bar, gradient, pill badges)
- [x] **UI:** Sidebar visit labels show patient name + visit type + short date instead of generic "Visit"
- [x] **Feature:** Citation hyperlinks — server-side CrossRef DOI resolution for clinical chat citations
- [x] **Fix:** Citation encoding bug — `encodeURIComponent` double-encoding in Google Scholar fallback URLs

---

## Design & Interaction Refinements (Feb 16 Audit)

- [x] **Design:** Increase contrast for "Evidence partnerships" badge text on the landing page.
- [ ] **Design:** Ensure *Admin Dashboard* (`bg-slate-50`) retains "magical" glow/serif typography from marketing site for visual continuity.
- [x] **UX:** Clarify "Start Free" button action in landing page input (icon vs. button ambiguity).
- [x] **UX:** Implement seamless transition from landing page query to app (persist question after signup/login).

---

## Homepage Graphic Design Audit (Feb 18) — Issues to Address

_Assessed via Playwright full-page screenshots at 1440px viewport._

### High Impact
- [ ] **Design:** Move chat product mockup into the hero viewport (currently appears 900px below fold) — no visual anchor above the fold
- [ ] **Design:** Add one dark/teal full-width CTA break section before pricing — currently every section is white or near-white, no visual rhythm
- [ ] **Design:** Show a rich AI response in the demo chat mockup — currently just one question + typing indicator in a large empty white box; add actual response with citations and evidence badges

### Medium Impact
- [x] **Design:** Fix "Built for clinical practice" feature card grid — responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `gap-6`
- [x] **Design:** Add shadow/border to testimonial cards — cards now have `border` + surface background for visual separation

### Low Impact
- [x] ~~**Design:** Enlarge and bold the feature section icons~~ — Won't fix. Icons are accent elements above large headings, not visual anchors. Current 20px/44px ratio is consistent across all cards and fits the professional clinical brand.
- [ ] **Design:** Balance hero input microcopy — "2 free queries/day · No credit card required" is left-aligned while CTA floats right; center microcopy below the input or restructure the row

---

## Clinical Lens & Source Filtering ✅ COMPLETE (Phase 1)

- [x] **Feature:** Clinical Lens toggle — Functional / Conventional / Both perspectives via cycling chip in chat input and dashboard
- [x] **Feature:** Conventional lens addendum — Standard-of-care system prompt when lens is "Conventional"
- [x] **Feature:** Comparison lens addendum — Side-by-side Conventional vs Functional format when lens is "Both"
- [x] **Feature:** Evidence source filter UI — "Sources" chip with popover showing presets (Full Spectrum, Functional Core, Conventional Core) and individual source toggles
- [x] **Feature:** Prompt-based source filtering — System prompt addendum restricts/prioritizes selected evidence sources
- [x] **Feature:** Lens and sources operate independently (no auto-sync)

### Remaining Enhancements
- [x] **Feature:** Structured Comparison Card — Client-side markdown parsing renders "Both" lens responses as a two-column visual card: blue Conventional panel, teal Functional panel, gold Clinical Synthesis. Shared markdown config, staggered entrance animations, mobile-responsive stacking. Falls back to regular markdown if structure not detected.

---

## Evidence Source Filtering — Phase 2 (RAG & Persistence)

- [x] **Feature:** Source filter UI — "Sources" chip in chat input and dashboard search with popover showing presets (Full Spectrum, Functional Core, Conventional Core) and individual source toggles
- [x] **Feature:** Prompt-based source filtering — System prompt addendum restricts/prioritizes selected evidence sources
- [ ] **Feature:** "Save as Default" — Persist practitioner's preferred source preset to `preferred_evidence_sources` column
- [x] **Feature:** RAG retrieval integration — `search_evidence_v2()` RPC with partnership + document type filtering, `src/lib/rag/retrieve.ts` retrieval layer, `src/lib/rag/format-context.ts` for system prompt injection
- [x] **Feature:** Evidence ingestion pipeline — `src/lib/rag/ingest.ts` (PDF extract → chunk → embed → store), admin API at `/api/admin/rag/ingest`
- [x] **Feature:** Wire RAG context into chat stream endpoint (`/api/chat/stream`)
- [ ] **Feature:** Wire RAG context into supplement review endpoint
- [x] **Feature:** Wire RAG context into visit generation prompts
- [ ] **Feature:** Per-patient source profiles — Allow source preferences to be saved per patient for recurring consults

---

## Partnership RAG System — IN PROGRESS 🔧

### Phase 1: Foundation ✅ COMPLETE
- [x] **DB:** Migration 024 — `partnerships` table, `practitioner_partnerships` join table, extended `evidence_documents` (partnership_id, document_type, version, file_hash, status), `search_evidence_v2()` RPC with partnership filtering, Apex Energetics seed
- [x] **Lib:** `src/lib/rag/` module — `types.ts`, `chunk.ts` (800-token sections with 200-token overlap), `embed.ts` (OpenAI text-embedding-3-small batched), `retrieve.ts` (semantic search via pgvector), `format-context.ts` (system prompt addendum), `ingest.ts` (PDF → text → chunk → embed → store)
- [x] **API:** `POST/GET /api/admin/rag/ingest` — admin-only endpoint to ingest all PDFs from a partnership's local docs directory
- [x] **Dep:** Added `pdf-parse` for text extraction

### Phase 1 — COMPLETE
- [x] **DB:** Apply migration 024 via Supabase Dashboard SQL Editor
- [x] **Ingest:** Run ingestion for Apex Energetics "Mastering the Thyroid" 3-part masterclass (3 PDFs in `docs/partnerships/apex-energetics/`)
- [x] **Test:** Verify retrieval with a thyroid-related query

### Phase 2: Chat Integration
- [x] **Feature:** Wire `retrieveContext()` into `/api/chat/stream` system prompt — best-effort alongside existing evidence RAG, 4 chunks standard / 6 deep consult
- [x] **Feature:** Partnership citation origin type (`"partnership"`) in citation pipeline
- [x] **Feature:** Partnership evidence badge variant on client

### Phase 3: Supplement + Visit Integration
- [x] **Feature:** Wire retrieval into supplement review endpoint — query built from supplement list + patient context, 5 chunks, appended to system prompt
- [x] **Feature:** Wire retrieval into visit generation prompts — query built from chief complaint + raw notes, 5 chunks, appended to SOAP system prompt

### Source Filtering Phase 2 ✅ COMPLETE
- [x] **Feature:** "Save as Default" — persist practitioner's preferred source preset to `preferred_evidence_sources`
- [x] **Feature:** Per-patient source profiles — source preferences saved per patient for recurring consults

### Admin & Access Control ✅ COMPLETE
- [x] **Feature:** Admin dashboard for managing partnerships and document ingestion
- [x] **Feature:** Practitioner settings to view/manage partnership access
- [x] **Feature:** Subscription tier gating (partnership access as pro feature)

---

## Sprint 26 — Exports & Practice Branding (Planned)

Practice branding infrastructure + shared export templates + branded PDF exports for visits, labs, and supplement protocols.

---

## Sprint 9 — Clinical Lens, Source Filtering, Brand Filtering (Feb 17) ✅ COMPLETE

- [x] **Feature:** Clinical Lens toggle — Functional / Conventional / Both cycling chip
- [x] **Feature:** Conventional + Comparison lens system prompt addendums in `anthropic.ts`
- [x] **Feature:** Evidence Source Filtering — Sources chip + popover with 3 presets and 9 individual source toggles
- [x] **Feature:** Source filter prompt addendum — restricts/prioritizes selected evidence sources in AI responses
- [x] **Feature:** Strict brand filtering mode — toggle between soft hints and strict-only brand recommendations
- [x] **Feature:** Dashboard search handoff — clinical lens and source filter preserved via URL params
- [x] **Feature:** Lens and sources operate as independent controls

---

## Sprint 10 — Evidence Quality Badges & Bug Fixes (Feb 18) ✅ COMPLETE

- [x] **Fix:** API 500 error — updated invalid model ID `claude-sonnet-4-5-20250929` → `claude-sonnet-4-6` in `MODELS` and `ANTHROPIC_MODELS` in `provider.ts`; affected lab parsing and Anthropic-primary chat
- [x] **Fix:** Citation DOI resolution — added Pass 3 author-only match to CrossRef lookup; recovers papers where AI cited wrong year
- [x] **Feature:** Evidence quality badges — inline `[RCT]` / `[META]` / `[COHORT]` / `[COHORT]` / `[CASE]` badges on resolved citations with hover popover (title, authors, year, journal)
- [x] **Feature:** `classifyEvidenceLevel()` in `src/lib/chat/classify-evidence.ts` — title keyword classifier
- [x] **Feature:** `CitationMetaContext` in `src/lib/chat/citation-meta-context.ts` — React context threading metadata from `MessageBubble` to `a` renderer
- [x] **Feature:** `citation_metadata` SSE event — enriched metadata sent after `citations_resolved`; stored on `ChatMessage.citations`
- [x] **Feature:** DB `messages.citations` populated — persists `citationText`, title, authors, year, DOI, `evidence_level` as JSONB
- [x] **Feature:** Comparison card badges — `ComparisonCard` inherits citation context automatically; removed redundant `processCitations`

---

## Sprint 11 — Labs Patient Search, Assign, Browse & Auto-Timeline (Feb 23) ✅ COMPLETE

- [x] **Feature:** Searchable patient combobox — replaces HTML `<select>` on labs filter bar, debounced 300ms search, div-based popover
- [x] **Feature:** Assign patient to unlinked lab — `AssignPatientButton` on lab card (hover) + detail page; PATCH syncs `lab_reports.patient_id` + `biomarker_results.patient_id`
- [x] **Feature:** Browse-by-patient mode — toggle in lab list shows patient cards with lab counts; unlinked labs card; clicking filters list
- [x] **API:** `GET /api/labs?unlinked=true` — filters to labs with no patient
- [x] **API:** `GET /api/labs/patients-summary` — patient-level lab counts for browse mode
- [x] **Feature:** Push lab to patient record — `POST /api/labs/[id]/push-to-record` upserts `lab_result` timeline event with flagged biomarker detail (idempotent)
- [x] **Feature:** Contextual back-link — navigating from patient record to lab detail preserves context; breadcrumb shows patient name with back-link to Documents tab
- [x] **Feature:** Lab detail slide-over drawer (`LabDetailSheet`) — 500px right panel preview of a lab's biomarkers from within patient record, without leaving the page
- [x] **Feature:** "View Trend" per flagged biomarker in drawer — TrendingUp button closes drawer, switches to Trends tab, pre-selects that biomarker
- [x] **Feature:** Trends promoted to top-level patient tab — first-class tab with `?tab=trends` URL support; `initialBiomarkerCode` prop for deep-linking
- [x] **DB:** Migration 016 — `document_upload` timeline trigger (patient_documents INSERT) + visit completion trigger + backfill

## Sprint 12 — Citation Integrity Pipeline & Evidence Badge UX (Feb 25–26) ✅ COMPLETE

- [x] **Feature:** 3-tier citation validation pipeline (`src/lib/citations/validate-supplement.ts`) — CrossRef DOI validation + PubMed search + curated DB lookup. Replaces AI-hallucinated single DOIs with up to 3 verified citations per supplement.
- [x] **Feature:** Supplement alias dictionary — 30+ supplements mapped to common names, chemical names, and brand names for relevance matching (e.g., "Vitamin D3" → "cholecalciferol", "25-hydroxy")
- [x] **DB:** Migration 020 — `supplement_evidence` table with pg_trgm fuzzy search, GIN trigram index, 17 seed citations for 13 common supplements, RLS read-only
- [x] **Feature:** `VerifiedCitation` interface — `doi`, `title`, `authors`, `year`, `source`, `evidence_level`, `origin` ("crossref" | "pubmed" | "curated")
- [x] **Feature:** Multi-badge rendering — supplement review cards show up to 3 numbered `EvidenceBadge` components per supplement, ranked by evidence strength
- [x] **Feature:** Shared evidence badge — supplement review cards now use the same `EvidenceBadge` component as chat, with hover popover (title, authors, year, journal, DOI link)
- [x] **Fix:** Dynamic z-index management — `badgeHovered` state elevates hovered card to `z-40` to prevent popover clipping by sibling cards
- [x] **Fix:** AI prompt hardened — removed `evidence_title` field from schema, added strict DOI accuracy instructions ("omit entirely if unsure")
- [x] **Fix:** Fake citations — DOI links no longer point to irrelevant papers (e.g., bone fracture article for thyroid supplements)

## Sprint 17 — Chat Citation Relevance & Multi-Citation Badges (Feb 26) ✅ COMPLETE

- [x] **Fix:** CrossRef relevance gate — all 3 matching passes now check `isClinicallyRelevant()` (domain blocker + keyword overlap). Prevents economics/finance/physics papers from appearing as evidence badges.
- [x] **Fix:** PubMed relevance filtering — `searchPubMedForCitation()` checks result titles against clinical keywords. Prevents off-topic papers (e.g., dermatology study for gut health context).
- [x] **Fix:** Evidence level classification — `classifyEvidenceLevel()` now accepts PubMed publication types as primary classifier. Fixes all-COHORT badge issue by using actual PubMed study type labels.
- [x] **Fix:** PubMed search query — prioritizes systematic reviews, meta-analyses, and RCTs via publication type filter. Falls back to generic query when filtered results are sparse.
- [x] **Feature:** Multi-citation support in chat — up to 3 evidence badges per `[Author, Year]` citation. Full stack: `resolveCitationsMulti()` → `citation_metadata_multi` SSE event → `citationsByKey` on `ChatMessage` → `EvidenceBadgeList` rendering.
- [x] **Feature:** `CitationMetaContext` changed to `Map<string, CitationMeta[]>` for multi-citation support.

## Sprint 18 — Document Management, AI Populate, Visit UX (Feb 27) ✅ COMPLETE

- [x] **Feature:** Document rename — PATCH `/api/patients/[id]/documents/[docId]` with `title` field
- [x] **Feature:** Document delete — DELETE endpoint removes record and storage file
- [x] **Feature:** Parse as Lab — create `lab_report` from uploaded document, reusing storage file via `source_document_id` FK
- [x] **Feature:** AI Populate from Documents — hybrid aggregation (chief complaints, allergies, medications) + AI synthesis (medical history, notes, IFM matrix) from extracted docs
- [x] **Feature:** Populate-from-docs dialog — per-section checkboxes, empty fields pre-checked, "has content" warnings, rate-limited
- [x] **Feature:** Compact recorder card — when SOAP exists, shows slim "Re-record encounter" bar instead of full CTA
- [x] **Feature:** Expandable SOAP summaries on Visits tab — fetches `subjective` + `assessment`, expandable cards with truncated previews + "Open full note" link
- [x] **UI:** Lab detail sheet — removed drawer shadow, prominent "Full report" pill button opens in new tab
- [x] **Feature:** Vitals push endpoint — `POST /api/visits/[id]/push-vitals` with enhanced vitals panel
- [x] **UI:** Create visit button component, editable sections component, confirm dialog z-index fix
- [x] **DB:** Migration 021 (vitals_pushed_at) + Migration 022 (lab_source_document_id)

## Sprint 19 — Protocol Push, Vitals Snapshot, Carry-Forward (Feb 27) ✅ COMPLETE

- [x] **Feature:** Full protocol push — dietary, lifestyle, and follow-up lab recommendations push from visit protocol to patient profile Overview tab (not just supplements)
- [x] **Feature:** RecommendationSection component on patient Overview — displays dietary, lifestyle, follow-up lab items with evidence badges
- [x] **DB:** Migration 023 — `dietary_recommendations`, `lifestyle_recommendations`, `follow_up_labs` JSONB columns on patients
- [x] **Feature:** Vitals snapshot on patient Overview — compact card with latest biometrics + sparklines (last 5 readings) + Pillars of Health mini-bars, powered by Recharts
- [x] **Feature:** Styled pillar sliders — custom CSS range inputs with color-coded tracks (red→amber→emerald), styled thumbs, dynamic `--slider-color` / `--slider-pct` custom properties
- [x] **UI:** Renamed visit "Intake" tab → "Vitals & Ratings" to accurately describe its content
- [x] **Feature:** Carry-forward vitals — follow-up visits pre-fill previous biometrics and pillar ratings as amber ghost placeholders with "Confirm All" button. Server-side fetch of most recent prior visit vitals.
- [x] **Feature:** Verify vitals banner — visits with existing vitals show a blue reminder to verify changes since last visit date
- [x] **Feature:** Imperial units — weight input changed from kg to lbs, height input changed from cm to ft/in (database stores metric internally, UI converts for display)
- [x] **UI:** Confirm dialog overlay removed — popup-only without dark backdrop

## Sprint 20 — Document UX, Settings Page, Sidebar Polish (Mar 2) ✅ COMPLETE

- [x] **Feature:** Document detail drawer — `DocumentDetailSheet` (500px right panel) for viewing extracted content, summary, structured data, and full text. Matches `LabDetailSheet` pattern (backdrop click, Escape close, body scroll lock).
- [x] **Feature:** Document retry extraction — `POST /api/patients/[id]/documents/[docId]/retry` re-fires document extraction for failed documents. Added `retry_extraction` to `AuditAction` type.
- [x] **Feature:** Document type change after upload — PATCH endpoint expanded to accept `document_type` field with validation against `VALID_DOC_TYPES`
- [x] **Feature:** Pending file upload UX — when no doc type is selected, file is stored as `pendingFile` and auto-uploads once a type is chosen. Amber banner shows filename + "ready — select a type above". Type selector pulses red when file is pending.
- [x] **Feature:** Document type clickability — ChevronDown icon + dashed border hover effect makes doc type look like an interactive dropdown
- [x] **Feature:** Processing feedback banner — shows at top of document list when any items are in uploading/extracting/queued/parsing states with count and "leave and return" message
- [x] **Feature:** Clickable document rows — click any document row to open detail drawer; Eye icon button for preview; `stopPropagation` on nested interactive elements
- [x] **Fix:** Parse-as-lab removes source document from list to prevent duplicate entries
- [x] **Feature:** Settings page — full 5-section implementation:
  - Profile: name editing, avatar display, email read-only
  - Practice & Credentials: license type, NPI (Luhn), specialties, practice name (reuses onboarding constants)
  - Clinical Preferences: evidence sources, brand formulary, strict mode toggle, note template
  - Subscription & Usage: plan badge, query count, lab count, member since, upgrade/manage CTA
  - Account & Security: change password (email auth only), delete account with type-to-confirm
- [x] **API:** `PATCH /api/practitioners/profile` — update practitioner fields (name, license, NPI, specialties, etc.)
- [x] **API:** `POST /api/auth/change-password` — Supabase password update (email auth only)
- [x] **API:** `POST /api/auth/delete-account` — cascade delete + Supabase auth delete with "DELETE MY ACCOUNT" confirmation
- [x] **Refactor:** Extracted shared constants from onboarding into `src/lib/constants/practitioner.ts` (LICENSE_OPTIONS, US_STATES, SPECIALTY_OPTIONS, validateNpi)
- [x] **Feature:** `getFullPractitioner()` cached query in `cached-queries.ts` — `select("*")` for settings page
- [x] **UI:** Sidebar settings gear → `<Link href="/settings">` (was showing "coming soon" toast)
- [x] **UI:** Sidebar "View all →" links for Conversations (→ `/conversations`), Favorites (→ `/chat?filter=favorites`), Visits (→ `/visits`)
- [x] **UI:** Sidebar visits bumped from 3 to 5 displayed items
- [x] **Fix:** Sidebar refreshes after visit deletion — `revalidatePath("/(app)", "layout")` in DELETE handler + `router.refresh()` before `router.push()`

## Sprint 21 — Conversation History Page (Mar 2) ✅ COMPLETE

- [x] **Feature:** Conversation history page (`/conversations`) — searchable, filterable list of all past conversations with Active/Archived/Favorites tabs
- [x] **Feature:** Debounced search (300ms) filtering conversations by title via `ilike`
- [x] **Feature:** Conversation cards with title, relative time, linked patient name badge, favorite star indicator
- [x] **Feature:** Inline actions per conversation — rename, favorite/unfavorite, archive/unarchive, delete with confirmation
- [x] **Feature:** Cursor-based "Load More" pagination (20 per page)
- [x] **API:** `GET /api/conversations` — list conversations with search, filter (active/archived/favorites), cursor pagination, audit logging
- [x] **Validation:** `conversationListQuerySchema` in `src/lib/validations/conversation.ts`
- [x] **UI:** Sidebar "View all →" link updated from `/chat` to `/conversations`

---

## Sprint 22 — Visit AI Assistant, Data Export, Lab UX (Mar 4) ✅ COMPLETE

- [x] **Feature:** Visit AI synthesis assistant — right-edge vertical tab + sliding 340px drawer, streaming chat with visit context (SOAP, IFM, protocol, vitals, patient demographics)
- [x] **API:** `POST /api/visits/[id]/assistant` — streaming endpoint with full security stack (CSRF, auth, rate limit, prompt injection validation), builds rich visit context via `buildVisitContext()`
- [x] **Feature:** Data export — `POST /api/account/export` generates ZIP file with JSON exports of all practitioner data (patients, visits, labs, conversations, supplements, timeline events, practitioner profile) + optional PDF inclusion from Supabase Storage
- [x] **Feature:** Export UI in Settings > Account & Security — "Export Your Data" card with PDF checkbox, loading spinner, blob URL download
- [x] **Rate limit:** Added `data_export` action (1/day free, 3/day pro)
- [x] **Dependency:** Added `jszip` for in-memory ZIP generation
- [x] **Refactor:** Lab report action bar overflow menu — reduced from 8 visible buttons to 3 primary (Assign Patient, Push to Record, Copy) + overflow dropdown for secondary actions (View PDF, Download, Add to Visit, Re-parse, Archive)

## Lab & Biomarker Enhancements

- [x] **Feature:** Custom functional ranges — Allow practitioners to override default functional ranges per biomarker from Settings. Stored as practitioner-level overrides that take precedence over system defaults during normalization.

---

## Sprint 23 — Branded PDF Exports & Export Security (Mar 18) ✅ COMPLETE

### Phase 1: Security Fixes (P0)
- [x] **Security:** Add `Cache-Control: no-store, no-cache, private` + `Pragma: no-cache` + `Expires: 0` headers to all export responses
- [x] **Security:** Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` to all export responses
- [x] **Security:** Export watermarking — export session ID + timestamp in exported document footer
- [x] **Security:** Link audit log entries to specific export sessions via `export_session_id` UUID
- [x] **Security:** Sanitize lab PDF filenames in account export ZIP — use UUID (`report.id`) instead of `raw_file_name`
- [x] **Docs:** `docs/COMPLIANCE.md` — audit log retention policy, export access policies, encryption requirements, BAA status

### Phase 2: Practice Branding Infrastructure
- [x] **DB:** Migration 026 — branding columns on `practitioners` (`logo_storage_path`, address, phone, fax, website)
- [x] **Storage:** `practice-assets` Supabase Storage bucket
- [x] **API:** `POST /api/practitioners/logo` — logo upload (PNG/JPG/SVG/WebP, max 2MB)
- [x] **API:** `DELETE /api/practitioners/logo` — remove logo
- [x] **API:** `PATCH /api/practitioners/profile` accepts branding fields
- [x] **UI:** "Practice Branding" section in Settings — logo dropzone + preview, address/phone/fax/website fields
- [x] **Types:** `Practitioner` interface updated with branding fields

### Phase 3: Shared Export Template System
- [x] **Lib:** `src/lib/export/shared.ts` — `buildLetterhead()`, `buildPatientBar()`, `buildFooter()`, `buildExportPage()`, `fetchLogoAsBase64()`
- [x] **Lib:** `src/lib/export/styles.ts` — shared print CSS (typography, `@page` rules, page-break control)

### Phase 4: Enhanced Visit Export
- [x] **Refactor:** `src/app/api/visits/[id]/export/route.ts` uses shared template system with practice branding

### Phase 5: Lab Report Export
- [x] **Lib:** `src/lib/export/lab-report.ts` — biomarker table template (grouped by panel, H/L/C flags, flagged summary)
- [x] **API:** `GET /api/labs/[id]/export` — lab report PDF export with practice branding
- [x] **UI:** "Export PDF" button in lab report detail overflow menu

### Phase 6: Supplement Protocol Export
- [x] **Lib:** `src/lib/export/supplement-protocol.ts` — protocol template (grouped by action, citations, interaction warnings, numbered references)
- [x] **API:** `GET /api/supplements/review/[id]/export` — supplement protocol PDF export with practice branding
- [x] **UI:** "Export PDF" button in supplement review detail header

---

## Sprint 24 — Universal Citation Verification ✅ COMPLETE

### Phase 1: Verified Citations Table
- [x] **DB:** Migration 027 — `verified_citations` table (DOI-keyed, `context_type` enum, `is_flagged`, RLS read-all/write-own, unique on `doi+verified_by+context_type+context_value`)
- [x] **API:** `POST /api/citations/verify` — universal verify + flag (`_action: "flag"`) endpoint. CSRF + auth + audit logged. Backfills `supplement_evidence` for supplement context.
- [x] **API:** `GET /api/citations/verified` — query with filters (context_type, doi, q, limit)

### Phase 2: Chat Citation Verification UI
- [x] **Feature:** `verifyContext` prop on `EvidenceBadge` + `EvidenceBadgeList` (replaces `supplementName`, backward compat shim kept)
- [x] **Feature:** Verify + Flag buttons in `EvidenceBadge` popover — wired to `/api/citations/verify`
- [x] **Feature:** Chat badges use `CHAT_VERIFY_CONTEXT = { type: "chat" }` in `markdown-config.tsx`
- [x] **Refactor:** `POST /api/supplements/citations/verify` → 410 Gone (deprecated, nothing was calling it)

### Phase 3: Citation Quality Feedback Loop
- [x] **Feature:** `markVerifiedCitations()` in `resolve.ts` — post-resolution Tier 0 cache lookup. After CrossRef/PubMed resolve DOIs, batch-checks `verified_citations` and marks matching results as `origin: "curated"` so the badge renders pre-verified immediately.
- [x] **Feature:** `origin` field threaded through: `CitationResolvedData` → SSE `citation_metadata_multi` → `CitationMeta` context → `markdown-config.tsx` badge props → `EvidenceBadge` (already shows "Verified" for `origin === "curated"`)
- [x] **Feature:** "Flag as Incorrect" button in `EvidenceBadge` — calls flag action on `/api/citations/verify`
- [x] **API:** `GET /api/admin/citations/stats` — total verified, flagged, breakdown by context_type, top verifiers, recent 10 verifications. Admin-only (ADMIN_EMAILS env var).

---

## Sprint 25 — Subscription Tier Feature Gating ✅ COMPLETE

### Free Tier Restrictions (all enforced server-side)
- [x] **Gate:** 2 clinical queries per day — `check_and_increment_query()` DB function
- [x] **Gate:** PubMed + Cochrane sources only — `filterAllowedSources()` in chat stream route strips premium sources for free tier
- [x] **Gate:** 7-day conversation history — `GET /api/conversations` applies `.gte("updated_at", cutoff)` for free tier
- [x] **Gate:** 5 active patient charts max — `POST /api/patients` calls `checkPatientLimit()` → 403 with upgrade_url
- [x] **Gate:** Lab interpretation blocked — `POST /api/labs` returns 403 for free tier before rate limit check
- [x] **Gate:** Visit documentation blocked — `POST /api/visits` returns 403 via `proGateResponse()`
- [x] **Gate:** Supplement brand preferences blocked — `PUT /api/supplements/brands` returns 403 for free tier
- [x] **Gate:** Branded PDF exports blocked — `GET /api/visits/[id]/export` returns 403 for free tier

### Implementation
- [x] **Lib:** `src/lib/tier/gates.ts` — `isFeatureAvailable()`, `FREE_TIER_LIMITS`, `filterAllowedSources()`, `proGateResponse()`, `checkPatientLimit()`
- [x] **UI:** `ProFeatureBadge` component — gold "Pro" pill on gated nav items (Visits, Labs in sidebar)
- [x] **UI:** `UpgradePrompt` component — inline upgrade CTA (compact + full variants)
- [x] **UI:** Sidebar Labs + Visits nav items show `ProFeatureBadge` for free tier
- [x] **UI:** `EvidenceSection` (already built) — free tier gets locked grid + overlay upgrade CTA; Pro gets active source grid

### Deferred (Completed Mar 24)
- [x] **Gate:** Multi-citation badge disable for free tier — `citation_metadata_multi` SSE event gated via `isFeatureAvailable()` in chat stream route; free tier renders single badges only
- [x] **Feature:** Partnership source badges on dashboard — `EvidenceSection` pulls active partnerships from DB, shows partner KB cards with "Active" badge for granted partnerships
- [x] **Gate:** Middleware route-level gating for `/labs/*`, `/visits/*` — tier cookie set during auth/session refresh, middleware redirects free users to `/upgrade` page with feature context

---

## Sprint 26 — Legal & Compliance Pages (Mar 20) ✅ COMPLETE

- [x] **Page:** Terms of Use — `/terms` static page with service terms, acceptable use, liability limitations, AI disclaimer
- [x] **Page:** Privacy & Security — `/security` static page with HIPAA compliance overview, encryption details, data handling practices, BAA information, SOC 2 roadmap
- [x] **Page:** Telehealth Compliance — `/telehealth` static page with telehealth disclaimer, state licensing requirements, informed consent language, HIPAA telehealth safeguards
- [x] **Page:** Advertising & Partnerships — `/advertising` static page with advertising policy, partnership disclosure (Apex Energetics), sponsored content guidelines, evidence integrity commitments
- [x] **UI:** Footer links to all legal pages on landing page (Terms, Security, Telehealth, Partnerships) + authenticated sidebar
- [x] **UI:** Terms acceptance checkbox on registration (links to `/terms` and `/security`, required before submit)

---

## Sprint 27 — Citation Grounding, HIPAA Hardening & UX Polish (Mar 24) ✅ COMPLETE

- [x] **Fix:** Eliminate citation hallucinations with grounded `[REF-N]` system — RAG evidence chunks numbered in system prompt, AI cites only those references, `groundCitations()` converts to real `[Author, Year](DOI)` links post-stream. New: `src/lib/citations/ground.ts`
- [x] **Feature:** Render Dosing as a styled pill on its own line in chat responses — `processCitations` breaks dosing onto indented paragraph, renderer displays compact `Dose | value` pill
- [x] **Fix:** Dynamic source filter popover direction based on viewport position — opens upward in lower half, downward in upper half
- [x] **Feature:** Source attribution footer for partnership RAG responses — `source_attributions` SSE event with unique source IDs, frontend renders "Knowledge base: Apex Energetics" pill footer
- [x] **Fix:** Source filter popover clipping + Apex checkbox stuck — capped popover height, deselecting last source resets to all
- [x] **Feature:** HIPAA audit hardening — `auditLogServer()` for Next.js server components, provider read logging for patient charts/labs/notes, migration 033 append-only audit trail with 6-year retention
- [x] **Fix:** Correct RLS policy on `practitioner_biomarker_ranges` — subquery `practitioners` to match `auth_user_id = auth.uid()` instead of direct comparison

---

## Sprint 27 Hotfix — Patient Portal Auth (Mar 26, 2026) ✅ COMPLETE

- [x] **Fix:** Patient invite link "Something went wrong" — middleware blocked `/api/patient-portal/*` routes (redirected to practitioner login instead of returning JSON)
- [x] **Fix:** New patient auth user creation — `admin.generateLink` fails for users not yet in Supabase Auth; added `type: "signup"` fallback
- [x] **Fix:** Resend invite button did nothing — state flow bug made email form unreachable when `portalStatus === "invited"`
- [x] **Fix:** Pass `patientEmail` prop to `InviteToPortalButton` so resend works without re-entering email

---

## Sprint 28 — AI-Synthesized Pre-Chart & UX Improvements (Planned)

### Pre-Chart AI Synthesis
- [ ] **Feature:** Replace concatenation in `rebuildPatientClinicalSummary` with a single Claude call that synthesizes ALL documents into ONE cohesive clinical narrative
- [ ] **Feature:** Include encounter data (visits, SOAP notes) in pre-chart synthesis context — not just uploaded documents
- [ ] **Feature:** Deduplicate information across documents (demographics, complaints, medications appear once)
- [ ] **Feature:** Organize synthesis by clinical system (demographics → chief complaints → medical history → medications → supplements → allergies → lifestyle → notable findings → treatment plan)

### Visit UX
- [ ] **Feature:** Undo AI Generation — snapshot editor state before SOAP fill, show "Undo" toast to restore manual edits if AI generation was triggered accidentally
- [ ] **Feature:** Visit "Unlock" — allow reverting a signed/locked note back to draft for further editing

### Lab Parsing Performance
- [ ] **Perf:** Get lab parsing under 30 seconds — optimize Claude prompt for compact JSON output, consider splitting into per-panel requests for large labs
- [ ] **Feature:** Show parsing progress indicator (percentage or "Extracting panel 3 of 12...")

### Document Pipeline
- [ ] **Feature:** Auto-populate medications into structured `patient_medications` table from extracted document data (currently only populates chief complaints, allergies, medical history)
- [ ] **Feature:** Show "Uploaded" date on lab list and detail views (currently only shows collection date)

---

## Patient Education & Engagement (Planned)

Patient-facing content tools and third-party integrations.

- [ ] **Feature:** Patient Education Studio — "NotebookLM" for protocols. Generate personalized audio overviews and slide decks explaining the "Why" behind protocols.
- [ ] **Feature:** Video Content Library — Curate and embed educational videos relevant to functional medicine interventions
- [ ] **Feature:** Fullscript.com integration — Connect practitioner Fullscript dispensary for direct ordering, patient auto-ship, and protocol-to-cart workflow

---

## Analytics & Clinical Tools (Planned)

Practice analytics, business metrics, and advanced clinical configuration.

- [ ] **Feature:** Clinical Insights Dashboard — Analytics on most frequent conditions, protocol efficacy, supplement trends
- [ ] **Feature:** Business Metrics — Patient retention rates, average visit frequency, Deep Consult usage stats
- [x] **Feature:** Custom functional ranges — Allow practitioners to override default functional ranges per biomarker from Settings

---

## Backlog

### Design & UX Polish
- [ ] **Design:** Ensure Admin Dashboard retains "magical" glow/serif typography from marketing site
- [x] **UX:** Clarify "Start Free" button action in landing page input
- [ ] **Design:** Add one dark/teal full-width CTA break section before pricing
- [x] **Design:** Show a rich AI response in the demo chat mockup — done: 5 evidence badges (META, RCT, GUIDELINE), formatted dosing, typewriter animation
- [ ] **Design:** Balance hero input microcopy alignment

### Platform & Infrastructure
- [ ] Mobile responsive pass on all pages
- [ ] PWA support for mobile practitioners
- [ ] Analytics integration (PostHog or Mixpanel)
- [ ] A/B testing framework for landing page conversion
- [ ] Accessibility audit (WCAG 2.1 AA)

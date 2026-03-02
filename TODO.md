# Apothecare — TODO

Generated from multi-angle codebase audit (Feb 11, 2026). Updated Feb 25, 2026.

---

## P0 — Fix Before Any Demo ✅ COMPLETE

- [x] **Security:** Fix `createServiceClient()` — standalone client, no cookie passthrough
- [x] **Usability:** Fix query count display for new users
- [x] **UI:** Remove duplicate trust banner
- [x] **Security:** Add IP + user agent to audit logs (HIPAA)
- [x] **Performance:** Move Google Fonts to `<link>` preconnect
- [x] **Usability:** Add loading skeletons for dashboard + chat
- [x] **UI:** Replace emoji icons with Lucide

---

## P1 — Ship Quality ✅ COMPLETE

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

### Remaining P1 (design-heavy)
- [x] **UI:** Redesign landing page — product mockups, scroll animations, social proof, trust partner logos
- [x] **Performance:** Debounce ReactMarkdown during streaming — simpler renderer while streaming, full ReactMarkdown on completion

---

## P2 — Award-Worthy Polish (Month 1) ✅ COMPLETE

- [x] **Design:** Build evidence badge component — inline citations with color-coded evidence levels. Expand on hover with full source details.
- [x] **Design:** Build biomarker dual-range bar visualization — range bar CSS exists but no component renders it. Signature visual feature.
- [x] **UI:** Page transition animations (CSS-based)
- [x] **UI:** Scroll-triggered animations on landing page
- [x] **Design:** Create illustration/photography style guide + hero visual
- [x] **Usability:** NPI validation — Luhn mod 10 check digit algorithm
- [x] **UI:** Dark mode support
- [x] **Security:** Content-Security-Policy + Strict-Transport-Security headers (dev mode relaxed for HMR)
- [x] **Usability:** Query reset countdown timer ("Resets in X hours")
- [x] **Usability:** Empty state pages for /labs, /patients, /visits
- [x] **Usability:** Conversation management — rename, delete, archive from sidebar
- [x] **UI:** Consistent container styling — standardize border-radius, shadow levels, border usage
- [x] **UI:** Leverage typography system — Newsreader for ALL headings, JetBrains Mono for ALL data values
- [x] **Performance:** Paginate conversation history API (cursor-based, 50 per page)
- [x] **Performance:** Cache sidebar data via shared `(app)` route group layout with React `cache()`
- [x] **Design:** Micro-animations — hover states, entrance animations, chat input glow
- [x] **UI:** Consistent icon sizing (16px inline, 18px nav, 20px feature)
- [x] **Security:** Environment variable validation at startup
- [x] **Design:** Landing → App visual continuity
- [x] **Design:** Logomark — "A" on brand circle

---

## Clinical Visits Module ✅ COMPLETE

- [x] **Feature:** Visit list page — searchable visit list with status badges, encounter types, linked patients
- [x] **Feature:** New visit page — select patient, select encounter type, launch editor
- [x] **Feature:** Visit workspace — block editor + dictation + generate flow + SOAP/IFM/Protocol tabs
- [x] **Feature:** Block-based editor — Tiptap with custom `templateSection` nodes (collapsible sections with badges, placeholders)
- [x] **Feature:** 4 encounter templates — SOAP (9 sections), H&P (12 sections), Consult (6 sections), Follow-up (6 sections)
- [x] **Feature:** Visit generation — SSE streaming SOAP notes, IFM Matrix mapping, protocol recommendations
- [x] **Feature:** Visit export — formatted clinical document export
- [x] **Feature:** Voice input — Web Speech API for live dictation, MediaRecorder for audio recording
- [x] **Feature:** Audio transcription — OpenAI Whisper integration for recorded audio
- [x] **Feature:** AI Scribe — record encounter → Whisper transcription → Claude section assignment → auto-populate editor
- [x] **Feature:** Patient quick-create modal — inline patient creation from new visit form
- [x] **DB:** Migration 002 — visit_type, status, ai_protocol columns
- [x] **DB:** Migration 004 — template_content JSONB column for block editor persistence

## Patient Management ✅ COMPLETE

- [x] **Feature:** Patient list page — searchable patient cards with demographics and chief complaints
- [x] **Feature:** Patient detail page — full profile with medical history, medications, supplements, allergies
- [x] **Feature:** Patient create/edit form — comprehensive demographics and medical fields
- [x] **Feature:** Patient documents — upload, list, and manage clinical documents (lab reports, intake forms, referral letters, imaging, prior records)
- [x] **Feature:** Document extraction — AI-powered content extraction and summarization via Claude
- [x] **Feature:** Pre-chart view — pre-encounter patient summary with history, medications, documents
- [x] **DB:** Migration 003 — patient_documents table

---

## Labs Module ✅ COMPLETE

- [x] **Feature:** Lab upload page — drag-and-drop PDF upload with vendor/test type/patient selection
- [x] **Feature:** Lab detail page — biomarker results with dual-range bars, signed PDF viewer, status polling
- [x] **Feature:** Lab list — searchable/filterable with status badges, vendor labels, patient links
- [x] **Feature:** Lab API — `GET/POST /api/labs`, `GET /api/labs/[id]`, `POST /api/labs/[id]/review` (stub)
- [x] **Feature:** Lab parsing pipeline — Claude Vision PDF extraction → biomarker normalization → flag calculation
- [x] **Feature:** Biomarker normalization — reference matching, conventional + functional flag computation
- [x] **Feature:** Lab reports in patient Documents tab — unified display merging both data sources
- [x] **Refactor:** Merged Labs tab into Documents tab — category grouping (Lab Reports, Clinical Records, Imaging, Referrals, Administrative, Other), reduced tab bar from 7 → 6 tabs
- [x] **Refactor:** Trends promoted from Documents sub-toggle to dedicated top-level Trends tab — tab bar back to 7 tabs (Feb 23)

## Multi-Provider AI ✅ COMPLETE

- [x] **Feature:** Provider abstraction layer — `createCompletion()` + `streamCompletion()` with automatic failover
- [x] **Feature:** OpenAI primary, Anthropic for vision features, MiniMax as fallback
- [x] **Feature:** `ANTHROPIC_MODELS` constant for features always using Anthropic API

## IFM Matrix ✅ COMPLETE

- [x] **Feature:** Portal-based modal for detailed node editing (IFMNodeModal)
- [x] **Feature:** Visit workspace wiring — `handleMatrixUpdate` persists via PATCH API
- [x] **Feature:** Patient-level IFM Matrix — persistent `ifm_matrix` JSONB column (migration 011)
- [x] **Feature:** IFM Matrix tab on patient profile — editable, persisted per-patient
- [x] **Feature:** "Push to Patient Matrix" button on visit workspace — merges visit IFM findings into patient-level matrix (idempotent, dedup findings, severity escalation)
- [x] **Feature:** Merge utility (`src/lib/ifm/merge.ts`) — pure functions for node + matrix merging
- [x] **Refactor:** Simplified `ifm-matrix-view.tsx` from ~530 to ~155 lines — removed inline DnD editing, cards are display-only → click opens modal

## Patient Timeline ✅ Phase 1 + Phase 2 Complete

- [x] **DB:** Migration 009 — `timeline_events` table with full enum type, RLS, auto-insert triggers (lab completion + visit creation), and historical data backfill
- [x] **Feature:** Timeline API — `GET /api/patients/[id]/timeline` cursor-paginated, filterable by event type
- [x] **Feature:** Timeline tab on patient profile — chronological event list with type-specific icons (6th tab)
- [x] **DB:** Migration 016 — `document_upload` enum value + `on_document_uploaded` trigger (patient_documents INSERT) + `on_visit_completed` trigger (visits UPDATE → completed) + backfill for existing documents
- [x] **Feature:** `document_upload` events: auto-created for every patient document upload with type-specific summary and detail
- [x] **Feature:** Visit completion events: existing visit event updated (not duplicated) when visit status → completed
- [x] **DB:** Migration 015 — `supplement_start`/`supplement_stop`/`supplement_dose_change` triggers on `patient_supplements` INSERT/UPDATE with priority chain + backfill
- [x] **DB:** Migration 019 — `symptom_logs`, `protocol_milestones`, `patient_reports`, `ai_insights` tables with RLS, indexes, and auto-insert triggers → `timeline_events`
- [x] **Feature:** CRUD APIs for all 4 producer types (GET/POST + PATCH/DELETE per record) with Zod validation
- [x] **Feature:** "Add Event" dropdown on Timeline tab — Log Symptom, Add Milestone, Log Patient Report inline forms
- [x] **Feature:** "Resolve" button on unresolved symptom_log events — PATCH sets `resolved_at`, trigger auto-creates "Resolved:" timeline event
- [x] **Feature:** Smart filter bar — only shows event type chips for types that have at least one event (powered by `/api/patients/[id]/timeline/types` endpoint)

## Inline-Editable Patient Overview ✅ COMPLETE

- [x] **Feature:** Per-section edit mode on Overview (Chief Complaints, Medical History, Medications, Supplements, Allergies)
- [x] **Feature:** `EditableTextSection` — textarea editor with PATCH save + optimistic UI + error rollback
- [x] **Feature:** `EditableTagSection` — tag-cloud editor for structured multi-value fields

## Security Hardening ✅ COMPLETE

- [x] **Security:** CSRF protection on all 13 mutating endpoints (shared `validateCsrf()` utility)
- [x] **Security:** Rate limiting on all AI endpoints (Sprint 3 — per-tier limits)
- [x] **Security:** Filename sanitization on storage paths (Sprint 3)
- [x] **Security:** Search parameter escaping for PostgREST (Sprint 3)

## UI/UX Scalability Task List (Ongoing)

- [x] **Refactor:** Create reusable `Button` component
- [x] **Refactor:** Update Sidebar to use `Button` component
- [x] **Refactor:** Update `NewVisitForm` to use `Button` component
- [x] **Refactor:** Create reusable `Input` & `Label` components
- [x] **Refactor:** Create reusable `DropdownMenu` component (Radix UI)
- [x] **Refactor:** Update Sidebar & NewVisitForm to use `DropdownMenu`
- [x] **Feature:** Implement Toast Notifications (Sonner)
- [x] **Refactor:** Update `PatientForm` input fields

---

## Supplement Intelligence (Core Feature) — Phases 1 & 2 Complete ✅

- [x] **Feature:** Supplement search page — searchable supplement database with AI-powered lookup
- [x] **Feature:** Supplement review module — Input patient's current supplements and evaluate against medical history, clinical goals, and lab results. Flag redundancies, gaps, and contraindications.
- [x] **Feature:** Interaction safety checker — Quick-check product recommendations against labs and medical history for contraindications and adverse effects (e.g., RYR citrinin risk in kidney disease, high-dose Vitamin D with hypercalcemia, iron supplementation with hemochromatosis).
- [x] **Feature:** Brand-specific supplement formulary — Allow practitioners to configure preferred supplement brands (e.g., Apex Energetics, Orthomolecular Products, Designs for Health, Pure Encapsulations, Metagenics) so protocol generation recommends specific branded products with correct SKUs and dosing.
- [x] **Feature:** Strict brand filtering mode — Toggle between soft hints ("prioritize these brands") and strict mode ("ONLY recommend from selected brands")
- [x] **Feature (Phase 1):** Structured `patient_supplements` table (Migration 010) — CRUD API, inline add/edit/discontinue on patient Overview tab. Replaces freeform field.
- [x] **Feature (Phase 2):** "Push to Patient File" — Map supplement review items → `patient_supplements` with keep/modify/discontinue/add actions. Deduplication by name, `review_id` provenance, `pushed_at` tracking (Migration 012).
- [x] **Feature (Phase 2):** Clinician action overrides — Clickable `ActionBadge` dropdown lets practitioners override AI recommendations before pushing. Ring indicator + strikethrough for overridden items.
- [x] **Feature:** Freeform supplement reviews — Patient-free mode with textarea + structured item builder. Inserts review with `patient_id: null` (Migration 014).
- [x] **Feature:** Push protocol supplements — Visit workspace Protocol tab pushes AI-recommended supplements to `patient_supplements` with `source: "protocol"` and `visit_id` provenance (Migration 013).
- [ ] **Feature:** Practitioner citation verify button — After a supplement review, allow practitioners to "verify" individual citations they confirm as accurate. Verified citations are saved to the curated `supplement_evidence` table, growing the Tier 3 citation database organically from real clinical usage. Over time this reduces reliance on live CrossRef/PubMed lookups for commonly reviewed supplements.
- [ ] **Integration:** Fullscript.com integration — Connect practitioner Fullscript dispensary for direct ordering, patient auto-ship, and protocol-to-cart workflow. Use Fullscript API for product catalog, pricing, and order management.

---

## Patient Education & Engagement

- [ ] **Feature:** Patient Education Studio — "NotebookLM" for protocols. Generate personalized audio overviews (podcast style, ask questions in an interactive style) and slide decks (PDF/PPTX), and mind-maps explaining the "Why" behind the protocol.
- [ ] **Feature:** Video Content Library — Curate and embed educational videos relevant to specific functional medicine interventions (e.g., "How to do a Castor Oil Pack", "Understanding SIBO").

---

## Practice Analytics

- [ ] **Feature:** Clinical Insights Dashboard — Analytics on most frequent conditions, protocol efficacy (based on follow-up changes), and supplement trends.
- [ ] **Feature:** Business Metrics — Patient retention rates, average visit frequency, and Deep Consult usage stats.

---

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
- [ ] **UX:** Clarify "Start Free" button action in landing page input (icon vs. button ambiguity).
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
- [ ] **Feature:** RAG retrieval integration — Wire source filter into `search_evidence()` RPC for vector-based retrieval from `evidence_documents` / `evidence_chunks` tables
- [ ] **Feature:** Evidence ingestion pipeline — Build document ingestion (PubMed, IFM, A4M source material) with embedding generation for RAG knowledge base
- [ ] **Feature:** Per-patient source profiles — Allow source preferences to be saved per patient for recurring consults

---

## Sprint 8 — Biomarker Timeline & Chat Enhancements (Feb 16) ✅ COMPLETE

- [x] **Feature:** Biomarker timeline API — `GET /api/patients/[id]/biomarkers/timeline` endpoint returning biomarker history grouped by code
- [x] **Feature:** Biomarker timeline chart — Recharts line chart with functional/conventional range bands, data point click-to-navigate
- [x] **Feature:** Patient profile "Lab Trends" tab with biomarker selector dropdown
- [x] **Feature:** `previousValue` populated on biomarker range bars from historical data
- [x] **Feature:** Chat file attachments — PDF/image upload (max 5 files, 10MB each), text extraction, attachment chips
- [x] **Feature:** Chat attachment API — `POST /api/chat/attachments` with file storage and text extraction
- [x] **DB:** Migration 008 — `chat_attachments` storage bucket

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

## Lab & Biomarker Enhancements

- [ ] **Feature:** Custom functional ranges — Allow practitioners to override default functional ranges per biomarker from Settings. Stored as practitioner-level overrides that take precedence over system defaults during normalization.

---

## Backlog

- [x] OAuth providers (Google) for registration — Apple deferred
- [ ] Mobile responsive pass on all pages
- [ ] PWA support for mobile practitioners
- [x] Error boundary components for graceful failures
- [ ] Analytics integration (PostHog or Mixpanel)
- [ ] A/B testing framework for landing page conversion
- [ ] Accessibility audit (WCAG 2.1 AA)
- [x] SEO optimization — meta tags, Open Graph images, structured data
- [x] Rate limiting middleware (beyond daily query count) — per-endpoint, per-tier rate limiting
- [x] Prompt injection detection layer before Claude API calls

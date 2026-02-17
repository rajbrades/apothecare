# Apotheca — TODO

Generated from multi-angle codebase audit (Feb 11, 2026). Updated Feb 16, 2026.

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

## Multi-Provider AI ✅ COMPLETE

- [x] **Feature:** Provider abstraction layer — `createCompletion()` + `streamCompletion()` with automatic failover
- [x] **Feature:** OpenAI primary, Anthropic for vision features, MiniMax as fallback
- [x] **Feature:** `ANTHROPIC_MODELS` constant for features always using Anthropic API

## IFM Matrix Editing ✅ COMPLETE

- [x] **Feature:** Inline node editing — click to edit findings directly
- [x] **Feature:** Portal-based modal for detailed node editing
- [x] **Feature:** Drag-and-drop reordering via `@dnd-kit/core`
- [x] **Feature:** Visit workspace wiring — `handleMatrixUpdate` persists via PATCH API

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

## Supplement Intelligence (Core Feature) — Complete (Phase 1)

- [x] **Feature:** Supplement search page — searchable supplement database with AI-powered lookup
- [x] **Feature:** Supplement review module — Input patient's current supplements and evaluate against medical history, clinical goals, and lab results. Flag redundancies, gaps, and contraindications.
- [x] **Feature:** Interaction safety checker — Quick-check product recommendations against labs and medical history for contraindications and adverse effects (e.g., RYR citrinin risk in kidney disease, high-dose Vitamin D with hypercalcemia, iron supplementation with hemochromatosis).
- [x] **Feature:** Brand-specific supplement formulary — Allow practitioners to configure preferred supplement brands (e.g., Apex Energetics, Orthomolecular Products, Designs for Health, Pure Encapsulations, Metagenics) so protocol generation recommends specific branded products with correct SKUs and dosing.
- [x] **Feature:** Strict brand filtering mode — Toggle between soft hints ("prioritize these brands") and strict mode ("ONLY recommend from selected brands")
- [ ] **Integration:** Fullscript.com integration — Connect practitioner Fullscript dispensary for direct ordering, patient auto-ship, and protocol-to-cart workflow. Use Fullscript API for product catalog, pricing, and order management.

---

## Patient Education & Engagement

- [ ] **Feature:** Patient Education Studio — "NotebookLM" for protocols. Generate personalized audio overviews (podcast style) and slide decks (PDF/PPTX) explaining the "Why" behind the protocol.
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

- [ ] **Design:** Increase contrast for "Evidence partnerships" badge text on the landing page.
- [ ] **Design:** Ensure *Admin Dashboard* (`bg-slate-50`) retains "magical" glow/serif typography from marketing site for visual continuity.
- [ ] **UX:** Clarify "Start Free" button action in landing page input (icon vs. button ambiguity).
- [ ] **UX:** Implement seamless transition from landing page query to app (persist question after signup/login).

---

## Clinical Lens & Source Filtering ✅ COMPLETE (Phase 1)

- [x] **Feature:** Clinical Lens toggle — Functional / Conventional / Both perspectives via cycling chip in chat input and dashboard
- [x] **Feature:** Conventional lens addendum — Standard-of-care system prompt when lens is "Conventional"
- [x] **Feature:** Comparison lens addendum — Side-by-side Conventional vs Functional format when lens is "Both"
- [x] **Feature:** Evidence source filter UI — "Sources" chip with popover showing presets (Full Spectrum, Functional Core, Conventional Core) and individual source toggles
- [x] **Feature:** Prompt-based source filtering — System prompt addendum restricts/prioritizes selected evidence sources
- [x] **Feature:** Lens and sources operate independently (no auto-sync)

### Remaining Enhancements
- [ ] **Feature:** Structured Comparison Card — Instead of inline markdown for "Both" lens mode, have the AI return structured JSON that renders as a visual comparison card: two side-by-side panels ("Conventional" / "Functional/Integrative") with bullet points, plus a "Clinical Synthesis" section below. Requires a custom rendering component and structured output prompting.

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

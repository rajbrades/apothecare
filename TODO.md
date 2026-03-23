# Apothecare — TODO

Last updated: March 20, 2026

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

## Sprint 23 — Security & Compliance 🔧 IN PROGRESS

All security hardening, HIPAA remediation, and legal pages — everything needed before production.

### HIPAA Audit Remediation (Critical)

Findings from security audit of v0.27.0 citation quality feedback loop (commits 586d225, 87832dc).

- [ ] **HIPAA §164.312(b):** Add audit logging to `GET /api/admin/flagged-citations` — endpoint accesses PHI (user questions, AI answers) but does not call `auditLog()`
- [ ] **HIPAA §164.312(b):** Add audit logging to `GET /api/admin/flagged-citations/search` — same issue
- [ ] **HIPAA §164.312(b):** Add audit logging for Q&A context access in flagged-citations GET handler — log `resourceType: "conversation_messages"` with accessed `conversation_id`s
- [ ] **HIPAA §164.312(a)(1):** Add explicit RLS deny policies on `citation_corrections` table — add `WITH CHECK (false)` / `USING (false)` policies for INSERT/UPDATE/DELETE (migration 028)
- [ ] **Security:** Add Zod validation for replacement citation data — `replacement_doi` needs DOI format regex (`10.xxxx/...`), `replacement_title` max length (1000), `replacement_authors` max array size (50)
- [ ] **Defensive:** Log warning when `ADMIN_EMAILS` env var is empty

### Export Security

- [ ] **Security:** Add `Cache-Control: no-store, no-cache, private` + `Pragma: no-cache` + `Expires: 0` headers to visit export and account export responses
- [ ] **Security:** Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` to all export responses
- [ ] **Security:** Export watermarking — embed audit log ID, practitioner email, and timestamp in exported document footer
- [ ] **Security:** Link audit log entries to specific export sessions via `export_session_id` UUID
- [ ] **Security:** Sanitize lab PDF filenames in account export ZIP to remove potential PHI from file names

### Legal Pages

- [ ] **Page:** Terms of Use — `/terms` static page with service terms, acceptable use, liability limitations, AI disclaimer
- [ ] **Page:** Privacy & Security — `/security` static page with HIPAA compliance overview, encryption details, data handling, BAA info, SOC 2 roadmap
- [ ] **Page:** Telehealth Compliance — `/telehealth` static page with telehealth disclaimer, state licensing, informed consent, HIPAA telehealth safeguards
- [ ] **Page:** Advertising & Partnerships — `/advertising` static page with advertising policy, partnership disclosure, sponsored content guidelines, evidence integrity
- [ ] **UI:** Add footer links to all legal pages on landing page and authenticated layout
- [ ] **UI:** Terms acceptance checkbox on registration (link to `/terms`)

### Completed
- [x] **Docs:** Create `docs/COMPLIANCE.md` with audit log retention policy, export access policies, encryption requirements
- [x] **Build fix:** Lazy env validation — `env.ts` and `provider.ts` deferred to first property access via Proxy

---

## Sprint 24 — Citations & Evidence (Planned)

All citation verification, evidence quality feedback, and supplement evidence curation.

### Verified Citations Table
- [ ] **DB:** Migration 027 — `verified_citations` table (DOI-keyed). Schema: `id`, `doi` (UNIQUE), `title`, `authors`, `year`, `journal`, `evidence_level`, `evidence_rank`, `abstract_snippet`, `verified_by`, `verified_at`, `context_type`, `context_value`, `origin`, `created_at`, `updated_at`. RLS: read-all, write-own.
- [ ] **API:** `POST /api/citations/verify` — general-purpose citation verification endpoint
- [ ] **API:** `GET /api/citations/verified` — query verified citations with filters

### Citation Verification UI
- [ ] **Feature:** Add verify button to chat `EvidenceBadge` — pass `contextType: "chat"`
- [ ] **Feature:** Update `EvidenceBadge` to accept generic `verifyContext` prop (replaces `supplementName`)
- [ ] **Refactor:** Migrate supplement citation verify to universal endpoint, deprecate `POST /api/supplements/citations/verify`

### Citation Quality Enhancements
- [ ] **Feature:** Integrate verified citations into chat citation resolution — check `verified_citations` before CrossRef/PubMed lookups
- [ ] **Feature:** Citation verification stats in admin dashboard — total verified, by practitioner, by context type
- [ ] **Feature:** Practitioner citation verify button on supplement reviews — verified citations saved to curated `supplement_evidence` table

---

## Sprint 25 — RAG & Partnerships (Planned)

Partnership RAG pipeline end-to-end: ingestion, retrieval, chat/supplement/visit wiring, source filtering, admin.

### Partnership RAG — Remaining Phase 1
- [x] **DB:** Apply migration 024 via Supabase Dashboard SQL Editor
- [ ] **Ingest:** Run ingestion for Apex Energetics "Mastering the Thyroid" 3-part masterclass
- [ ] **Test:** Verify retrieval with a thyroid-related query

### RAG Chat Integration
- [ ] **Feature:** Wire `retrieveContext()` into `/api/chat/stream` system prompt
- [ ] **Feature:** Partnership citation origin type (`"partnership"`) in citation pipeline
- [ ] **Feature:** Partnership evidence badge variant on client

### RAG Supplement + Visit Integration
- [ ] **Feature:** Wire retrieval into supplement review endpoint
- [ ] **Feature:** Wire retrieval into visit generation prompts

### Source Filtering Phase 2
- [ ] **Feature:** "Save as Default" — persist practitioner's preferred source preset to `preferred_evidence_sources`
- [ ] **Feature:** Per-patient source profiles — source preferences saved per patient for recurring consults

### Admin & Access Control
- [ ] **Feature:** Admin dashboard for managing partnerships and document ingestion
- [ ] **Feature:** Practitioner settings to view/manage partnership access
- [ ] **Feature:** Subscription tier gating (partnership access as pro feature)

---

## Sprint 26 — Exports & Practice Branding (Planned)

Practice branding infrastructure + shared export templates + branded PDF exports for visits, labs, and supplement protocols.

### Practice Branding Infrastructure
- [ ] **DB:** Migration 026 — Add branding columns to `practitioners` table: `logo_storage_path`, `practice_address_line1/2`, `practice_city/state/zip`, `practice_phone/fax/website`
- [ ] **Storage:** Create `practice-assets` Supabase Storage bucket for logo uploads
- [ ] **API:** `POST /api/practitioners/logo` — logo upload (PNG/JPG/SVG/WebP, max 2MB)
- [ ] **API:** `DELETE /api/practitioners/logo` — remove logo
- [ ] **API:** Update `PATCH /api/practitioners/profile` to accept new branding fields
- [ ] **UI:** New "Practice Branding" section in Settings — logo dropzone with preview, practice address/phone/fax/website fields, live letterhead preview
- [ ] **Types:** Update `Practitioner` interface in `database.ts` with branding fields

### Shared Export Template System
- [ ] **Lib:** Create `src/lib/export/shared.ts` — `buildLetterhead()`, `buildPatientBar()`, `buildFooter()`, `buildExportPage()`, `fetchLogoAsBase64()`
- [ ] **Lib:** Create `src/lib/export/styles.ts` — shared print CSS (typography, `@page` rules, page-break control)

### Enhanced Visit Export
- [ ] **Refactor:** Refactor `src/app/api/visits/[id]/export/route.ts` to use shared template system with practice branding

### Lab Report Export
- [ ] **Lib:** Create `src/lib/export/lab-report.ts` — biomarker table template (grouped by panel, H/L/C flags, trend indicators)
- [ ] **API:** Create `GET /api/labs/[id]/export` — lab report PDF export with practice branding
- [ ] **UI:** Add "Export PDF" button to lab report detail overflow menu

### Supplement Protocol Export
- [ ] **Lib:** Create `src/lib/export/supplement-protocol.ts` — protocol template (grouped by action, evidence citations, interaction warnings)
- [ ] **API:** Create `GET /api/supplements/review/[id]/export` — supplement protocol PDF export with practice branding
- [ ] **UI:** Add "Export PDF" button to supplement review detail header

---

## Sprint 27 — Monetization & Tier Gating (Planned)

Subscription tier enforcement (Free vs Pro), feature gates, upgrade flows, and pricing strategy.

### Free Tier Restrictions (server-side + UI gates)
- [ ] **Gate:** 2 clinical queries per day (already enforced via `check_and_increment_query()`)
- [ ] **Gate:** PubMed evidence sources only — block premium sources for free tier
- [ ] **Gate:** Basic citation expansion only — single citation per reference, no hover popovers
- [ ] **Gate:** 7-day conversation history — auto-archive after 7 days
- [ ] **Gate:** 5 patient charts max
- [ ] **Gate:** Lab interpretation blocked
- [ ] **Gate:** Visit documentation blocked
- [ ] **Gate:** Protocol generation blocked
- [ ] **Gate:** Supplement brand preferences blocked
- [ ] **Gate:** Branded PDF exports blocked

### Pro Tier Features
- [ ] **Feature:** Unlimited clinical queries
- [ ] **Feature:** All evidence sources (A4M, IFM, Cleveland Clinic, premium)
- [ ] **Feature:** Full citation expansion + evidence badges
- [ ] **Feature:** Unlimited visit documentation + SOAP notes
- [ ] **Feature:** Multi-modal lab interpretation
- [ ] **Feature:** Cross-lab correlation analysis
- [ ] **Feature:** Protocol generation with dosing
- [ ] **Feature:** Unlimited patient management + biomarker trending
- [ ] **Feature:** Branded PDF exports
- [ ] **Feature:** HIPAA BAA included
- [ ] **Feature:** Preferred supplement brand search + strict filtering

### Dashboard Evidence Source Badges
- [ ] **Feature:** "Your Evidence Sources" row on dashboard
- [ ] **Data:** Query `preferred_evidence_sources` + `practitioner_partnerships` in dashboard layout
- [ ] **UI:** Pro users see all badges active; free users see grayed-out with "Upgrade" nudge
- [ ] **UI:** Partnership sources appear as additional badges
- [ ] **UX:** Clicking a grayed-out badge links to `/settings#subscription`

### Implementation
- [ ] **Lib:** Create `src/lib/tier/gates.ts` — `requirePro()`, `isFeatureAvailable()`, `FREE_TIER_LIMITS`
- [ ] **UI:** Create `ProFeatureBadge` component
- [ ] **UI:** Create `UpgradePrompt` component
- [ ] **UI:** Create `EvidenceSourceBadges` dashboard component
- [ ] **API:** Add tier checks to all gated endpoints (403 with upgrade URL)
- [ ] **Middleware:** Consider route-level tier gating for `/labs/*`, `/visits/*`
- [ ] **Strategy:** Determine pricing model for "Deep Research" premium service

---

## Sprint 28 — Patient Education & Engagement (Planned)

Patient-facing content tools and third-party integrations.

- [ ] **Feature:** Patient Education Studio — "NotebookLM" for protocols. Generate personalized audio overviews and slide decks explaining the "Why" behind protocols.
- [ ] **Feature:** Video Content Library — Curate and embed educational videos relevant to functional medicine interventions
- [ ] **Feature:** Fullscript.com integration — Connect practitioner Fullscript dispensary for direct ordering, patient auto-ship, and protocol-to-cart workflow

---

## Sprint 29 — Analytics & Clinical Tools (Planned)

Practice analytics, business metrics, and advanced clinical configuration.

- [ ] **Feature:** Clinical Insights Dashboard — Analytics on most frequent conditions, protocol efficacy, supplement trends
- [ ] **Feature:** Business Metrics — Patient retention rates, average visit frequency, Deep Consult usage stats
- [ ] **Feature:** Custom functional ranges — Allow practitioners to override default functional ranges per biomarker from Settings

---

## Backlog

### Design & UX Polish
- [ ] **Design:** Ensure Admin Dashboard retains "magical" glow/serif typography from marketing site
- [ ] **UX:** Clarify "Start Free" button action in landing page input
- [ ] **Design:** Move chat product mockup into the hero viewport (currently 900px below fold)
- [ ] **Design:** Add one dark/teal full-width CTA break section before pricing
- [ ] **Design:** Show a rich AI response in the demo chat mockup
- [ ] **Design:** Balance hero input microcopy alignment

### Platform & Infrastructure
- [ ] Mobile responsive pass on all pages
- [ ] PWA support for mobile practitioners
- [ ] Analytics integration (PostHog or Mixpanel)
- [ ] A/B testing framework for landing page conversion
- [ ] Accessibility audit (WCAG 2.1 AA)

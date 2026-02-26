# Changelog

All notable changes to Apothecare will be documented in this file.

## [0.17.0] - 2026-02-26

### Added — 3-Tier Citation Integrity Pipeline
- **`src/lib/citations/validate-supplement.ts`** (NEW): Three-tier citation validation pipeline for supplement reviews. Replaces single AI-hallucinated DOIs with up to 3 verified, real citations per supplement, ranked by evidence strength.
  - **Tier 1 — CrossRef**: Validates AI-provided DOIs via `api.crossref.org`, checks paper relevance against supplement name using keyword matching with 30+ supplement alias mappings.
  - **Tier 2 — PubMed**: When DOIs are invalid or missing, searches PubMed via ESearch + ESummary for real papers matching the supplement and clinical context.
  - **Tier 3 — Curated DB**: Queries local `supplement_evidence` table for known-good, human-verified citations with pg_trgm fuzzy matching.
- **`VerifiedCitation` interface** in `src/types/database.ts`: New type with `doi`, `title`, `authors`, `year`, `source`, `evidence_level`, and `origin` ("crossref" | "pubmed" | "curated") fields. Added `verified_citations?: VerifiedCitation[]` to `SupplementReviewItem`. Deprecated `evidence_doi` and `evidence_title`.
- **Migration 020** (`supabase/migrations/020_supplement_evidence.sql`): Curated `supplement_evidence` table with `pg_trgm` extension for trigram fuzzy search, GIN index on `supplement_name`, unique constraint on `(lower(supplement_name), doi)`, RLS read-only for authenticated users. Seeded with 17 verified citations for 13 common supplements (Vitamin D, Magnesium, Omega-3, Probiotics, CoQ10, Curcumin, Berberine, NAC, Ashwagandha, Zinc, Iron, Melatonin, B12).

### Changed — Supplement Review Pipeline
- **`src/app/api/supplements/review/route.ts`**: Replaced HEAD-only DOI validation with `validateAllReviewCitations(reviewData, supabase)` — runs all 3 tiers in parallel per supplement, deduplicates by DOI, sorts by evidence strength, caps at 3 per item.
- **`src/lib/ai/supplement-prompts.ts`**: Removed `evidence_title` from AI prompt JSON schema. Added stricter DOI instructions: "ONLY include if you are CERTAIN the DOI resolves to the correct paper. Do NOT guess or fabricate DOIs. Omit the field entirely if unsure."

### Changed — Supplement Evidence Badge UX
- **`src/components/supplements/supplement-review-detail.tsx`**: Now uses shared `EvidenceBadge` component from chat for consistent hover popover behavior. Renders up to 3 numbered badges per supplement with `EVIDENCE_LEVEL_MAP` (underscore→hyphenated) and `EVIDENCE_LABEL_MAP` translation constants. Legacy fallback for existing reviews without `verified_citations`.
- **Dynamic z-index management**: `badgeHovered` state + `overflow-visible` on card container prevents popover clipping by sibling cards. Card elevates to `z-40` when badge is hovered.

## [0.16.0] - 2026-02-25

### Added — Timeline Phase 2: Event Producers & Smart Filter Bar
- **4 producer tables with auto-insert triggers** (Migration 019): `symptom_logs`, `protocol_milestones`, `patient_reports`, `ai_insights` — each has AFTER INSERT/UPDATE triggers that auto-create `timeline_events` entries.
- **Supplement timeline triggers** (Migration 015): INSERT/UPDATE on `patient_supplements` fires `supplement_start`, `supplement_stop`, or `supplement_dose_change` timeline events via priority chain logic.
- **CRUD API routes** for all 4 producer types: `GET/POST /api/patients/[id]/symptom-logs`, `protocol-milestones`, `patient-reports`, `ai-insights` with individual `PATCH/DELETE` sub-routes. All follow standard CSRF → auth → Zod validate → audit pattern.
- **"Add Event" dropdown** on Timeline tab: 3 options (Log Symptom, Add Milestone, Log Patient Report) — each expands an inline form below the header.
- **Inline forms**: `add-symptom-log-form.tsx` (symptom name, severity 1-10, body system, onset date, notes), `add-milestone-form.tsx` (title, date, category, description), `add-patient-report-form.tsx` (title, type, severity, date, details). All POST to their respective API endpoints with toast feedback.
- **Resolve symptom button**: Unresolved `symptom_log` timeline events show a "Resolve" action — PATCH sets `resolved_at`, DB trigger auto-creates a "Resolved: {name}" timeline event.
- **Smart filter bar**: New `GET /api/patients/[id]/timeline/types` endpoint returns distinct event types for the patient. Filter chips only appear for types that have at least one event.

## [0.15.0] - 2026-02-23

### Added — Labs: Patient Search, Assign & Browse
- **Searchable patient combobox** (`src/components/ui/patient-search-combobox.tsx`): Replaces the HTML `<select>` on the labs filter bar. 300ms debounced search → `GET /api/patients?search={term}&limit=15`. Div-based popover, no Radix dependency.
- **Assign patient to lab** (`src/components/labs/assign-patient-button.tsx`): UserPlus/UserCheck icon on lab cards and detail page. PATCH to `/api/labs/[id]` assigns the patient and syncs `biomarker_results.patient_id` so biomarker timeline includes the lab's data.
- **Browse-by-patient mode**: `[List] [By Patient]` toggle in lab list. Fetches `/api/labs/patients-summary` for patient cards with lab count + last lab date. Clicking a card filters list to that patient. "Unlinked Labs (N)" card shows labs with no patient.
- **Unlinked filter**: `GET /api/labs?unlinked=true` returns labs where `patient_id IS NULL`.

### Added — Labs: Push to Patient Record
- **`POST /api/labs/[id]/push-to-record`**: Pushes a completed lab as a `lab_result` timeline event. Idempotent — re-pushing the same lab upserts the existing event. Detail payload includes flagged biomarker list (name, value, unit, flag).
- **Push to Record button** on lab detail page (shown when `status === "complete"` and patient is assigned).

### Added — Patient Record: Lab Navigation & Context
- **Contextual back-link**: Navigating from a patient's Documents tab to a full lab page passes `?from=patient&patientId=X&patientName=Y`. Lab detail breadcrumb shows "Patient Name → Lab Name" with a back-link to `/patients/[id]?tab=documents`.
- **Lab detail slide-over drawer** (`src/components/labs/lab-detail-sheet.tsx`): 500px right panel, backdrop click + Escape to close, body scroll lock. Shows flagged biomarkers with flag badges and all results grouped by category. Fetches `/api/labs/${labId}` client-side; no page navigation required.

### Added — Auto-Timeline for All Clinical Events (Migration 016)
- **`document_upload` event type**: Added to `timeline_event_type` enum and to all client-side filter arrays.
- **Document upload trigger** (`on_document_uploaded`): Fires on `patient_documents` INSERT — auto-creates a `document_upload` timeline event with type-specific summary (lab report, intake form, imaging, etc.).
- **Visit completion trigger** (`on_visit_completed`): Fires on `visits` UPDATE when `status → 'completed'` — updates the existing visit timeline event title/summary/detail rather than duplicating.
- **Backfill**: Existing documents without timeline events are back-populated at migration time.

### Changed — Patient Profile: Trends Promoted to Top-Level Tab
- **Trends tab**: `BiomarkerTimeline` moved from a Documents sub-toggle to a dedicated first-class **Trends** tab between Documents and Pre-Chart. Tab bar is now 7 tabs.
- **Documents tab simplified**: Sub-toggle removed; always shows file list with Upload Lab link.
- **View Trend deep-link**: Each flagged biomarker in `LabDetailSheet` has a TrendingUp button — clicking closes the drawer, switches to Trends, and pre-selects that biomarker's chart.
- **`initialBiomarkerCode` prop** on `BiomarkerTimeline`: Secondary `useEffect` syncs `selectedCode` from prop once the biomarker list loads.
- **`?tab=trends` URL support**: `patients/[id]/page.tsx` includes `"trends"` in `validTabs`.

## [0.14.0] - 2026-02-22

### Added — Freeform Supplement Reviews
- **Patient-free review mode**: Reviews tab now supports "For a patient" and "Freeform" modes. Pill-style toggle at top of form.
- **Freeform input**: Textarea for pasting a supplement list, plus optional medications and medical context fields.
- **Structured item builder**: Expandable mini-form with Name, Dosage, Form fields. Each added item appends a formatted line (e.g., "Vitamin D3 5000 IU (softgel)") to the textarea.
- **API freeform branch**: `/api/supplements/review` now accepts `{ supplements, medications?, medical_context? }` without a patient. Skips patient/biomarker DB lookups; inserts review with `patient_id: null`.
- **Migration 014** (`supabase/migrations/014_freeform_reviews.sql`): `supplement_reviews.patient_id` changed from `NOT NULL` to nullable. RLS uses `practitioner_id` only — no RLS changes required.
- **Past reviews list**: Freeform reviews display "Freeform Review" label when `patient_id` is null.

### Added — Clinician Action Overrides on Supplement Reviews
- **Clickable `ActionBadge` dropdown**: Each supplement's action badge (Keep/Modify/Discontinue/Add) is now an interactive dropdown on the review detail page. Practitioners can override AI recommendations before pushing to the patient file.
- **Visual override feedback**: Overridden badges show a ring indicator + "(AI)" label beside the original recommendation. Items with `discontinue` override display a red border and strikethrough on the supplement name.
- **Overrides sent at push time**: `action_overrides: Record<string, SupplementAction>` sent in the push-review request body. Original AI recommendations preserved in DB.
- **Badges become read-only after push** to prevent accidental post-push changes.

### Added — Push Protocol Supplements to Patient File
- **Protocol tab push button** in visit workspace: Confirm dialog pushes all AI-recommended protocol supplements to `patient_supplements` with `source: "protocol"` and `visit_id` provenance.
- **Migration 013** (`supabase/migrations/013_protocol_push.sql`): Adds `protocol` to `patient_supplement_source` enum, `visit_id` on `patient_supplements`, `protocol_pushed_at` on `visits`.
- **"Pushed {date}" emerald badge** shown after push; "Re-push Supplements" available for subsequent updates.

## [0.13.0] - 2026-02-21

### Added — Supplement Phase 2: Push to Patient File
- **"Push to Patient File" button** on supplement review detail page: maps each review item → `patient_supplements` row. `keep`/`modify` → upsert active; `discontinue` → set discontinued with timestamp; `add` → insert new with `source: "review"` + `review_id` provenance.
- **Migration 012** (`supabase/migrations/012_supplement_review_pushed_at.sql`): Adds `pushed_at TIMESTAMPTZ` to `supplement_reviews` for idempotency tracking.
- **Deduplication**: Matches by lowercased supplement name; updates existing rows instead of duplicating.
- **Push API** (`/api/patients/[id]/supplements/push-review`): CSRF + auth + Zod validated. Accepts `review_id` and optional `action_overrides`.

### Added — Patient Archive/Delete
- Active/Archived patient toggle on patient list page.
- Per-patient archive and hard-delete (confirmation dialog) actions.

### Added — Patient-Level IFM Matrix (Migration 011)
- **`patients.ifm_matrix` JSONB column** (Migration 011): Persistent IFM Matrix stored per patient.
- **IFM Matrix tab** on patient profile: Editable, persisted across all visits.
- **"Push to Patient Matrix" button** on visit workspace: Merges visit IFM findings into patient-level matrix (idempotent dedup, severity escalation, notes concatenation).
- **`src/lib/ifm/merge.ts`**: Pure utility functions for matrix merging.
- **Simplified `ifm-matrix-view.tsx`**: Reduced from ~530 to ~155 lines; display-only cards with click-to-edit modal.

### Added — Structured Supplement List: Phase 1 (Migration 010)
- **`patient_supplements` table**: Structured supplement records with name, dosage, form, frequency, timing, brand, status, source, `review_id` provenance, and sort order.
- **`supplement-list.tsx`**: Inline add/edit/discontinue UI on patient Overview tab. Replaces freeform supplements field.
- **CRUD API** (`/api/patients/[id]/supplements` + `/[supId]`): GET list, POST create, PATCH update, DELETE (soft-delete).
- **Supplements overlay** in `supplements/page.tsx`: Merges structured `patient_supplements` over freeform field for AI review context.

## [0.12.0] - 2026-02-20

### Added — Patient Timeline Phase 1 (Migration 009)
- **`timeline_events` table** (Migration 009): Enum-typed events (`lab_result`, `visit`, `supplement_start`, `supplement_stop`, `supplement_dose_change`, `symptom_log`, `protocol_milestone`, `patient_reported`, `ai_insight`), RLS, auto-insert triggers on lab completion + visit creation, backfill for historical data.
- **Timeline API** (`/api/patients/[id]/timeline`): Cursor-paginated, filterable by event type.
- **Timeline tab** on patient profile: Chronological event list with type-specific icons (6th tab alongside Overview, Documents, Pre-Chart, IFM Matrix, Lab Trends).

### Added — Inline-Editable Patient Overview
- **Per-section edit mode**: Overview sections (Chief Complaints, Medical History, Medications, Supplements, Allergies) each have an edit pencil revealing inline editing.
- **`EditableTextSection`** and **`EditableTagSection`** components: Textarea or tag-cloud editor with PATCH save + optimistic UI + error rollback.

### Fixed — Homepage Design Polish (Sprint 11)
- **Design tokens neutralized**: `--color-text-*` tokens shifted from green-tinted to pure neutral greys.
- **`surface-secondary`**: Changed to `oklab(... / 0.2)` nearly-transparent warm tint.
- **Landing page audit**: All 12 landing page components verified 100% token-compliant.

### Changed — Labs merged into Documents tab
- Unified document list shows both uploaded documents and lab reports (flask icon, vendor metadata, "View" link for lab reports).

## [0.11.0] - 2026-02-19

### Added — Homepage Redesign
- **Geist font** for body copy; **OKLCH brand color palette** for perceptually uniform brand colors.
- **Refined-A layout**: Hero spacing, input sizing, and CTA hierarchy polished.
- **Chat mockup**: Demo chat now shows a rich AI response with citations and evidence badges.

## [0.10.0] - 2026-02-18

### Fixed
- **API 500 error**: Updated stale model ID `claude-sonnet-4-5-20250929` → `claude-sonnet-4-6` in both `MODELS` and `ANTHROPIC_MODELS` in `src/lib/ai/provider.ts`. Invalid model IDs cause Anthropic to return 500 (not 400). Affected: lab PDF parsing, document vision, and any deployment using Anthropic as primary provider.
- **Citation DOI resolution**: Added a third matching pass (author-only, no year) to `resolveSingleCitation()` in `src/lib/citations/resolve.ts`. Recovers papers where the AI cited the wrong year (e.g. citing a 2018 paper as "2013"). CrossRef already scopes results by author + context keywords, so the first author match is still topically correct.

### Added — Inline Evidence Quality Badges
- **`src/lib/chat/classify-evidence.ts`**: `classifyEvidenceLevel(title)` — keyword classifier mapping paper titles to `EvidenceLevel` (meta-analysis → META, randomized/controlled trial → RCT, guideline → GUIDELINE, cohort/prospective/retrospective → COHORT, case series → CASE).
- **`src/lib/chat/citation-meta-context.ts`**: `CitationMetaContext` — React context threading resolved citation metadata (title, authors, year, journal, DOI, evidence level) from `MessageBubble` to the markdown `a` renderer without prop drilling.
- **CrossRef enrichment** (`src/lib/citations/resolve.ts`): `resolveSingleCitation()` returns full `CitationResolvedData` including formatted authors, journal name (`container-title`), and `evidenceLevel` classified from title.
- **`citation_metadata` SSE event** (`src/app/api/chat/stream/route.ts`): Sent after `citations_resolved` for DOI-resolved citations only. Also populates `messages.citations` JSONB column in DB (previously always `[]`).
- **Hook handler** (`src/hooks/use-chat.ts`): Handles `citation_metadata` event; maps to `ChatMessage.citations[]` with `citationText` as lookup key. `ChatMessage.citations` type updated with `citationText` field.
- **`MessageBubble` context provider** (`src/components/chat/message-bubble.tsx`): `AssistantContent` builds citation map from `message.citations` via `useMemo` and wraps render in `CitationMetaContext.Provider`.
- **Inline badge rendering** (`src/components/chat/markdown-config.tsx`): `CitationLink` component reads context. When `evidenceLevel` present, renders citation link + `EvidenceBadge` with hover/click popover (title, authors, year, journal, "View source" DOI link). Scholar-fallback citations render as plain styled links unchanged. Comparison card panels inherit context automatically.

## [0.9.0] - 2026-02-14

### Added — Lab Reports in Patient Documents
- **Unified document list**: Patient Documents tab now shows both uploaded documents and lab reports linked to the patient. Lab reports display with a green flask icon, lab vendor/test type metadata, and a "View" link to `/labs/[id]`.
- **Merged rendering**: `document-list.tsx` uses a discriminated union type (`UnifiedItem`) to merge `patient_documents` and `lab_reports` sorted by date descending.

### Security — CSRF Protection (All Endpoints)
- **Shared CSRF utility**: Created `src/lib/api/csrf.ts` with `validateCsrf()` function — validates `Origin` header against `NEXT_PUBLIC_APP_URL`.
- **Applied to all 13 mutating handlers** across 11 route files (POST/PATCH/DELETE). Previously only `/api/chat/stream` had CSRF protection.

### Changed
- **IFM Matrix editing**: Added inline editing, portal-based modal (`ifm-node-modal.tsx`), and drag-and-drop reordering via `@dnd-kit/core`. Visit workspace wired with `handleMatrixUpdate` callback to persist changes via PATCH API.

## [0.8.0] - 2026-02-14

### Added — Labs Module
- **Lab upload page**: `/labs` — upload lab report PDFs with vendor/test type selection and optional patient linking. Drag-and-drop file upload zone.
- **Lab detail page**: `/labs/[id]` — full lab report detail with biomarker results, dual-range bars, signed PDF viewer, and status polling.
- **Lab list**: Searchable/filterable lab list with status badges (uploading, parsing, complete, error), vendor labels, and patient links.
- **Lab API endpoints**: `GET/POST /api/labs`, `GET /api/labs/[id]`, `POST /api/labs/[id]/review` (stub).
- **Lab parsing pipeline**: Claude Vision extracts biomarkers from PDF → normalizes against functional references → calculates flags.
- **Biomarker normalization**: `src/lib/labs/normalize-biomarkers.ts` — matches extracted biomarkers to reference ranges, calculates conventional + functional flags.
- **Flag mapping**: `src/lib/labs/flag-mapping.ts` — maps DB flags to component display values.
- **Lab storage**: `src/lib/storage/lab-reports.ts` — Supabase Storage integration for lab PDFs.

### Added — Multi-Provider AI Abstraction
- **Provider layer**: `src/lib/ai/provider.ts` — unified `createCompletion()` and `streamCompletion()` functions with automatic failover. OpenAI primary, Anthropic for vision features, MiniMax as fallback.
- **ANTHROPIC_MODELS constant**: Features always routed through Anthropic API (document vision, lab PDF parsing) regardless of primary provider.
- **Model routing**: `MODELS` constant maps logical names (standard, deep_consult, vision, scribe) to provider-specific model IDs.

### Added — Dashboard & UI Components
- **Dashboard search**: `src/components/dashboard/dashboard-search.tsx` — unified search across patients, visits, and labs.
- **Sidebar refactor**: Extracted `sidebar-conversation.tsx` for conversation list management.
- **UI components**: `dropdown-menu.tsx` (Radix UI), `input.tsx`, `label.tsx`, `sonner.tsx` (toast notifications).

## [0.7.0] - 2026-02-13

### Added — UI/UX Scalability
- **Reusable Button component**: `src/components/ui/button.tsx` — type-safe with variants (default, outline, ghost, gold, destructive).
- **Utility function**: `src/lib/utils.ts` — `cn()` for merging Tailwind classes.
- **Sidebar refactor**: Replaced ad-hoc button styles with the new `Button` component.

## [0.6.0] - 2026-02-13

### Added — AI Scribe
- **AI Scribe pipeline**: Record a provider-patient encounter → Whisper transcription → Claude assigns content to template sections → editor auto-populated. Two-step async pipeline with real-time status indicators.
- **Scribe API endpoint**: `POST /api/visits/[id]/scribe` — accepts transcript, uses Claude to parse into structured section content based on the visit's encounter template. Returns `{ sections: Record<string, string> }`.
- **Scribe prompts**: `buildScribeSystemPrompt()` dynamically generates a Claude prompt from any template's section definitions. Handles conversational language → clinical documentation conversion with rules for patient vs provider attribution.
- **Editor population**: `templateToPopulatedContent()` builds Tiptap JSON with sections pre-filled from scribe output. Auto-expands populated sections, leaves empty sections collapsed.
- **Editor dictation hook**: `useEditorDictation` extended with `scribeRecording()` for the full scribe pipeline, `ScribeStatus` type (`idle` | `transcribing` | `assigning` | `done` | `error`), and `onScribeComplete` callback.
- **Dictation bar redesign**: "Record" → "AI Scribe" (brand-colored with Sparkles icon), "Dictate" kept as secondary. Processing states shown during transcription and section assignment.

## [0.5.0] - 2026-02-13

### Added — Visits Module & Block Editor
- **Clinical visits module**: Full visit lifecycle — create, edit, generate AI notes, export. Visit list with status badges, encounter type labels, and linked patient context.
- **Block-based visit editor**: Tiptap-powered editor with custom `templateSection` nodes. Each section renders as a collapsible block with badge, heading, placeholder, and editable content area.
- **4 encounter templates**: SOAP (9 sections), History & Physical (12 sections), Consultation (6 sections), Follow-up (6 sections). Each template defines section keys, headings, badges, placeholders, and default collapse state.
- **Template system**: `src/lib/templates/` — `types.ts` (interfaces), `definitions.ts` (4 templates), `to-editor-content.ts` (template ↔ editor JSON ↔ text conversion utilities).
- **Custom Tiptap extension**: `templateSection` node with React NodeView rendering collapsible sections styled to match the app's design system.
- **Editor toolbar**: Minimal formatting toolbar (bold, italic, bullet list, ordered list).
- **Voice input**: Web Speech API for live dictation (inserts at cursor), MediaRecorder + Whisper for full audio recording.
- **Audio transcription**: `POST /api/visits/[id]/transcribe` — uploads audio to OpenAI Whisper, returns transcript text.
- **Visit generation**: `POST /api/visits/[id]/generate` — SSE streaming endpoint that generates SOAP notes, IFM Matrix mapping, and evidence-based protocols from clinical notes.
- **Visit export**: `POST /api/visits/[id]/export` — generates formatted clinical document export.
- **New visit page**: `/visits/new` — select patient → select encounter type → launch editor. Includes "+ New Patient" quick-create modal.
- **Visit workspace**: `/visits/[id]` — block editor + dictation bar + generate button → AI-generated SOAP/IFM/Protocol tabs.
- **Patient quick-create modal**: Inline patient creation from new visit form (first name, last name, DOB, sex, chief complaints). Auto-selects created patient.

### Added — Patient Management
- **Patient list page**: `/patients` — searchable patient list with cards showing demographics, chief complaints, and recent visit info.
- **Patient detail page**: `/patients/[id]` — full patient profile with demographics, medical history, medications, supplements, allergies, clinical summary.
- **Patient form**: Create and edit patients with comprehensive fields (demographics, medical history, current medications, supplements, allergies).
- **New patient page**: `/patients/new` — full patient creation form.
- **Patient documents**: Upload, list, and manage patient documents (lab reports, intake forms, referral letters, imaging reports, prior records).
- **Document extraction**: AI-powered document content extraction via `POST /api/patients/[id]/documents/[docId]/extract`. Uses Claude to extract and summarize clinical document content.
- **Pre-chart view**: Pre-encounter patient summary with medical history, medications, recent documents, and AI-generated clinical summary.

### Added — Infrastructure
- **4 database migrations**: `001_initial_schema.sql`, `002_visits_status.sql` (visit_type, status, ai_protocol columns), `003_patient_documents.sql` (patient_documents table), `004_visit_template_content.sql` (template_content JSONB column).
- **Visit prompts**: `buildVisitSystemPrompt()` for SOAP/H&P/Consult/Follow-up generation. IFM Matrix and Protocol system prompts.
- **Zod validations**: `visit.ts` (create/update/generate visit schemas), `patient.ts` (create/update patient), `document.ts` (document upload/extraction).
- **Patient document storage**: `src/lib/storage/patient-documents.ts` — Supabase Storage integration for encrypted document uploads.
- **Clinical summary generation**: `src/lib/ai/clinical-summary.ts` — AI-powered patient clinical summary from medical history and documents.
- **OpenAI Whisper integration**: `src/lib/ai/transcription.ts` — audio file transcription for voice input and AI Scribe.

### Changed
- **Visit empty state → full module**: `/visits` page upgraded from empty state placeholder to fully functional visit list with create/view/manage capabilities.
- **Patient empty state → full module**: `/patients` page upgraded from empty state to searchable patient list with full CRUD.

## [0.4.0] - 2026-02-13

### Added
- **Landing page redesign (Session 5)**: 12 new components with scroll animations, product mockups, social proof, testimonials, and trust partner logos. Professional $100M+ product polish.
- **NPI Luhn validation**: Onboarding now validates NPI numbers using Luhn algorithm checksum.
- **Query reset countdown timer**: Sidebar shows countdown to daily query limit reset for free-tier users.
- **Empty state pages**: Dedicated empty state pages for /labs, /patients, and /visits with illustrated placeholders.
- **Conversation management**: Rename, archive, and delete conversations with confirmation modals.
- **Cursor-based pagination**: `GET /api/chat/history` now supports `cursor` and `limit` parameters for efficient pagination.
- **Shared (app) layout**: Route group layout with React `cache()` for optimized data fetching across all authenticated pages.
- **Evidence badge component**: `<EvidenceBadge>` component with color-coded evidence levels (meta-analysis, RCT, guideline, cohort, case study).
- **Biomarker component**: `<BiomarkerBar>` dual-range visualization showing conventional and functional/optimal reference ranges.
- **CSP headers**: Content-Security-Policy configured in `next.config.ts` for enhanced security.
- **Environment validation**: Zod schemas validate all required environment variables at build time.
- **Logomark component**: Reusable SVG logomark for navbar, loading states, and empty states.

### Changed
- **File structure**: Consolidated chat and dashboard layouts into shared `(app)` route group layout, eliminating code duplication.
- **Conversation history API**: Now returns paginated results with cursor-based navigation for better performance with large conversation histories.

### Security
- **CSP headers**: Strict Content-Security-Policy headers block inline scripts and restrict resource origins.

## [0.3.0] - 2026-02-11

### Security
- **Service client isolation**: `createServiceClient()` now uses standalone `@supabase/supabase-js` client instead of `createServerClient` with cookie passthrough. Service role no longer inherits user cookies.
- **Zod validation**: All chat API input validated with Zod schemas (`lib/validations/chat.ts`). Message length, UUID formats, boolean types enforced.
- **CSRF protection**: Stream route validates `Origin` header against `NEXT_PUBLIC_APP_URL`.
- **XSS protection**: `rehype-sanitize` added to ReactMarkdown in message bubble.
- **Audit log metadata**: All audit log inserts now capture `ip_address` (from `x-forwarded-for`) and `user_agent` for HIPAA compliance.

### Changed
- **Sidebar redesign**: "New Conversation" elevated from nav list item to filled teal primary button. Gold accent color activated for Pro badge, upgrade banner, and Deep Consult toggle.
- **Deep Consult tooltip**: Info popover explaining mode (Opus model), extended thinking, 4096 token responses, Pro requirement.
- **Forgot password**: Login page now wires to `supabase.auth.resetPasswordForEmail()` with success/error feedback.
- **Non-streaming route deprecated**: `POST /api/chat` now returns 410 Gone. All traffic routed to `/api/chat/stream`.
- **Google Fonts**: Moved from render-blocking CSS `@import` to `<link rel="preconnect">` in root layout.
- **DB queries parallelized**: Dashboard and chat layouts now use `Promise.all()` for sidebar data fetching.
- **Emoji icons replaced**: All emoji (🔬🧬📋🏥🛡️⚡👥) replaced with Lucide React icons throughout landing page and dashboard.

### Added
- **Keyboard shortcuts**: `⌘K` focus input, `⌘↵` / `Enter` send, `Esc` stop generating. Hint text in input footer.
- **Loading skeletons**: `loading.tsx` for dashboard and chat routes.
- **Zod schema**: `src/lib/validations/chat.ts` with `chatMessageSchema`.
- **Upgrade banner**: Sidebar shows gold-gradient upgrade CTA for free-tier users.

### Fixed
- **Query count display**: Dashboard now resets stale `daily_query_count` for display when `daily_query_reset_at` is older than 24 hours.
- **Duplicate trust banner**: Removed from chat layout (only appears in dashboard layout).

## [0.2.0] - 2026-02-11

### Added
- **Streaming chat interface**: SSE (Server-Sent Events) endpoint at `/api/chat/stream` with real-time token streaming from Claude API.
- **Chat UI components**: `ChatInterface`, `ChatInput`, `MessageBubble` with markdown rendering, streaming cursor, thinking indicator, and action bar (copy, favorite, share, export PDF).
- **Chat hook**: `useChat` hook with SSE stream parsing, abort controller, conversation loading, and error handling.
- **Chat history API**: `GET /api/chat/history` for loading conversation messages.
- **Authentication pages**: Login, Register, and 2-step Onboarding (credentials → practice profile).
- **Onboarding wizard**: License type selector (MD/DO/NP/PA/DC/ND/LAc/Other), license number + state, NPI validation (10-digit), specialty focus tags (12 options).
- **Auth middleware**: Route protection with public paths, onboarding allowance for authenticated users, redirect away from auth pages when logged in.

### Infrastructure
- **Supabase Cloud**: Connected to hosted project. Schema migration executed in SQL Editor.
- **Environment**: `.env.local` configured with Supabase URL, anon key, service role key, Anthropic API key.

## [0.1.0] - 2026-02-10

### Added
- **Project scaffold**: Next.js 15 + TypeScript + Tailwind CSS v4
- **Database schema**: 12 tables with full RLS policies, audit logging, and pgvector support (721 lines)
- **Supabase Auth**: Server/client utilities, middleware for session refresh, route protection
- **Chat API**: `POST /api/chat` with query limit enforcement, patient context injection, conversation persistence, token tracking, and audit logging
- **Landing page**: Marketing page with pricing, feature grid, sample clinical questions
- **Dashboard**: Authenticated home screen with sidebar, suggested questions, patient selector, Deep Consult toggle
- **Sidebar**: Navigation component with recent conversations, visits, favorites, and practitioner profile
- **Design system**: Deep teal + warm gold theme, Newsreader + DM Sans + JetBrains Mono typography, evidence badges, biomarker traffic light colors
- **AI client**: Anthropic SDK setup with clinical system prompts for chat and lab interpretation, model routing (Sonnet for standard, Opus for deep consult)
- **TypeScript types**: Full type definitions for all 12 database tables
- **Biomarker seed data**: 17 reference ranges with conventional + functional ranges from IFM and A4M guidelines
- **Documentation**: README, ARCHITECTURE.md, DATABASE.md, API.md, COMPLIANCE.md, CONTRIBUTING.md

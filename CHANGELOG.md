# Changelog

All notable changes to Apotheca will be documented in this file.

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

# Apothecare — Project Summary & Handoff Document

**Last updated:** March 18, 2026
**Purpose:** Pick up development exactly where we left off.

---

## What Is Apothecare

Apothecare is an AI-powered clinical decision support platform for functional and integrative medicine practitioners. It provides evidence-cited chat (Claude-powered), multi-modal lab interpretation, protocol generation, and visit documentation — all grounded in functional medicine research from IFM, A4M, and peer-reviewed literature.

**Target users:** MDs, DOs, NPs, PAs, DCs, NDs practicing functional medicine.
**Business model:** Freemium — Free (2 queries/day) → Pro ($99/mo, unlimited).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15.5, TypeScript, App Router |
| Styling | Tailwind CSS 4, CSS custom properties |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Multi-provider: OpenAI (primary), Anthropic Claude (vision + fallback), MiniMax (fallback) |
| Transcription | OpenAI Whisper API (audio → text for AI Scribe) |
| Lab Parsing | Anthropic Claude Vision (PDF → biomarker extraction) |
| Editor | Tiptap (ProseMirror) — block-based with custom node extensions |
| Deployment | Vercel (auto-deploy from main branch) |
| Fonts | Newsreader (display), DM Sans (body), JetBrains Mono (data) |
| Icons | Lucide React |

**Supabase Project:** https://qcjuosldesbgqkregztn.supabase.co
**Current Branch:** main
**Local dev:** `npm run dev` → http://localhost:3000

---

## Current File Structure

```
src/
├── app/
│   ├── (app)/                       # Route group — shared authenticated layout
│   │   ├── chat/page.tsx            # Clinical chat
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (trust banner)
│   │   │   └── page.tsx            # Dashboard home
│   │   ├── labs/
│   │   │   ├── [id]/page.tsx       # Lab report detail (biomarkers, PDF viewer)
│   │   │   ├── loading.tsx         # Lab list loading skeleton
│   │   │   └── page.tsx            # Lab list + upload
│   │   ├── patients/
│   │   │   ├── [id]/page.tsx       # Patient detail (8 tabs: overview, documents, trends, prechart, ifm_matrix, visits, timeline, fm_timeline)
│   │   │   ├── new/page.tsx        # New patient form
│   │   │   └── page.tsx            # Patient list
│   │   ├── conversations/
│   │   │   └── page.tsx            # Conversation history (search, filter, pagination)
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings page (5 sections: profile, credentials, preferences, subscription, account)
│   │   ├── visits/
│   │   │   ├── [id]/page.tsx       # Visit workspace (editor + AI generation)
│   │   │   ├── new/page.tsx        # New visit (patient + encounter type)
│   │   │   └── page.tsx            # Visit list
│   │   └── layout.tsx              # Shared app layout (sidebar + React cache)
│   ├── api/
│   │   ├── conversations/
│   │   │   └── route.ts            # GET list conversations (search, filter, cursor pagination)
│   │   ├── chat/
│   │   │   ├── history/route.ts    # GET conversation messages + pagination
│   │   │   ├── route.ts            # DEPRECATED (410)
│   │   │   └── stream/route.ts     # SSE streaming chat endpoint
│   │   ├── labs/
│   │   │   ├── [id]/
│   │   │   │   ├── review/route.ts # POST lab review (stub 501)
│   │   │   │   └── route.ts        # GET single lab report
│   │   │   └── route.ts            # GET list / POST upload
│   │   ├── patients/
│   │   │   ├── [id]/
│   │   │   │   ├── documents/
│   │   │   │   │   ├── [docId]/
│   │   │   │   │   │   ├── extract/route.ts  # POST re-trigger extraction
│   │   │   │   │   │   ├── parse-as-lab/route.ts # POST create lab report from document
│   │   │   │   │   │   ├── retry/route.ts   # POST retry failed document extraction
│   │   │   │   │   │   └── route.ts          # GET/PATCH/DELETE document (rename, delete, type change)
│   │   │   │   │   └── route.ts              # GET list / POST upload
│   │   │   │   ├── populate-from-docs/
│   │   │   │   │   └── route.ts              # POST AI populate patient fields from extracted docs
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
│   │       │   ├── assistant/route.ts  # POST streaming AI synthesis assistant
│   │       │   ├── export/route.ts     # POST export visit
│   │       │   ├── generate/route.ts   # POST SSE SOAP/IFM/Protocol generation
│   │       │   ├── push-vitals/route.ts # POST push vitals to patient chart
│   │       │   ├── scribe/route.ts     # POST AI Scribe (transcript → sections)
│   │       │   ├── transcribe/route.ts # POST audio → Whisper transcription
│   │       │   └── route.ts            # GET/PATCH visit
│   │       └── route.ts                # GET list / POST create
│   │   ├── account/
│   │   │   └── export/route.ts          # POST data export (ZIP with JSON + optional PDFs)
│   │   ├── auth/
│   │   │   ├── change-password/route.ts  # POST change password (email auth only)
│   │   │   └── delete-account/route.ts   # POST cascade delete + auth delete
│   │   ├── supplements/
│   │   │   ├── citations/
│   │   │   │   └── verify/route.ts       # POST verify citation → curated supplement_evidence
│   │   │   ├── brands/route.ts           # PUT save brand preferences
│   │   │   ├── interactions/route.ts     # POST interaction safety check
│   │   │   ├── review/
│   │   │   │   ├── [id]/route.ts         # GET single review
│   │   │   │   └── route.ts             # POST create review
│   │   │   └── reviews/route.ts          # GET list reviews
│   │   ├── practitioners/
│   │   │   ├── biomarker-ranges/route.ts # GET/PUT biomarker range overrides
│   │   │   ├── evidence-sources/route.ts # PUT save default evidence sources
│   │   │   └── profile/route.ts          # PATCH update practitioner profile
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
│   │   ├── chat-input.tsx          # Input bar + Deep Consult + Clinical Lens + Sources + shortcuts
│   │   ├── chat-interface.tsx      # Main chat container
│   │   ├── comparison-card.tsx     # Two-column Conventional/Functional card for "Both" lens
│   │   ├── evidence-badge.tsx      # Color-coded evidence level badges with hover popover
│   │   ├── markdown-config.tsx     # Shared ReactMarkdown components + CitationLink + EvidenceBadge
│   │   ├── message-bubble.tsx      # Markdown rendering + CitationMetaContext.Provider + rehype-sanitize
│   │   └── source-filter-popover.tsx # Evidence source preset/toggle popover
│   ├── dashboard/
│   │   └── dashboard-search.tsx    # Unified search across patients, visits, labs
│   ├── landing/                    # 12 landing page components (hero, features, pricing, etc.)
│   ├── labs/
│   │   ├── lab-list-client.tsx     # Searchable/filterable lab list
│   │   ├── lab-report-card.tsx     # Lab report card for list view
│   │   ├── lab-report-detail.tsx   # Lab detail with biomarkers + PDF viewer
│   │   ├── lab-status-badge.tsx    # Lab status indicator
│   │   └── lab-upload.tsx          # Lab upload form with drag-and-drop
│   ├── conversations/
│   │   └── conversation-list-client.tsx # Searchable conversation list (filter tabs, inline actions, pagination)
│   ├── layout/
│   │   ├── sidebar.tsx             # Nav + gold accents + upgrade banner + "View all →" links
│   │   └── sidebar-conversation.tsx # Conversation list management
│   ├── settings/
│   │   ├── settings-page.tsx       # Client layout — left nav + section cards
│   │   ├── profile-section.tsx     # Name + avatar display
│   │   ├── preferences-section.tsx # Evidence sources, brands, note template
│   │   ├── subscription-section.tsx # Plan badge, usage stats, upgrade CTA
│   │   └── account-section.tsx     # Password change, delete account
│   ├── patients/
│   │   ├── document-detail-sheet.tsx # Document detail drawer (500px, extraction summary, structured data, retry)
│   │   ├── document-list.tsx       # Unified document + lab report list (rename, delete, parse-as-lab, clickable rows, processing banner)
│   │   ├── document-upload.tsx     # Document upload form (pending file UX, auto-upload on type select)
│   │   ├── extraction-status-badge.tsx  # AI extraction status indicator
│   │   ├── populate-from-docs.tsx  # AI populate banner + dialog (checkbox per section)
│   │   ├── patient-form.tsx        # Full patient create/edit form
│   │   ├── patient-list-client.tsx # Searchable patient list
│   │   ├── patient-profile.tsx     # Patient detail view (8 tabs) + document detail drawer + document type change
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
│       ├── visit-assistant.tsx     # Right-edge AI synthesis drawer (streaming chat with visit context)
│       ├── visit-workspace.tsx     # Editor + generate + SOAP/IFM/Protocol tabs + compact recorder when SOAP exists
│       ├── vitals-panel.tsx        # Vitals input/display with chart support
│       ├── new-visit-form.tsx      # Patient + encounter type selector
│       ├── voice-input.tsx         # Voice input component
│       ├── soap-sections.tsx       # SOAP note display tabs
│       ├── ifm-matrix-view.tsx     # IFM Matrix visualization + inline editing + DnD
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
│   ├── use-timeline.ts             # Timeline data hook (events, filters, available types)
│   └── use-keyboard-shortcuts.ts   # Global keyboard shortcuts
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts            # Claude client + ANTHROPIC_MODELS + lens addendums
│   │   ├── populate-prompts.ts     # AI prompts for populate-from-docs (medical history, notes, IFM matrix)
│   │   ├── provider.ts             # Multi-provider abstraction (OpenAI/Anthropic/MiniMax)
│   │   ├── source-filter.ts        # Evidence source definitions, presets, prompt addendums
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
│   ├── chat/
│   │   ├── citation-meta-context.ts # CitationMeta interface + CitationMetaContext (Map<string, CitationMeta[]>)
│   │   ├── classify-evidence.ts    # classifyEvidenceLevel(title, pubTypes?) — PubMed pub types + title keywords → EvidenceLevel
│   │   ├── process-citations.ts    # processCitations() — citation text preprocessing
│   │   └── parse-comparison.ts     # parseComparisonSections() — "Both" lens response parser
│   ├── citations/
│   │   ├── resolve.ts              # CrossRef + PubMed multi-citation resolution (3-pass + relevance gate + up to 3 per citation)
│   │   └── validate-supplement.ts  # 3-tier citation pipeline (CrossRef + PubMed + curated DB) for supplement reviews
│   ├── editor/
│   │   └── template-section-extension.ts  # Custom Tiptap templateSection node
│   ├── labs/
│   │   ├── normalize-biomarkers.ts # Biomarker reference matching + flag calculation
│   │   └── flag-mapping.ts         # DB flag → component display mapping
│   ├── templates/
│   │   ├── types.ts                # TemplateSectionDef, EncounterTemplate
│   │   ├── definitions.ts          # 4 encounter templates (SOAP, H&P, Consult, Follow-up)
│   │   └── to-editor-content.ts    # Template ↔ editor JSON ↔ text conversion
│   ├── storage/
│   │   ├── patient-documents.ts    # Patient document Storage integration
│   │   └── lab-reports.ts          # Lab report Storage integration
│   ├── supabase/
│   │   ├── cached-queries.ts       # React cache() for layout queries
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Auth middleware + route protection
│   │   └── server.ts              # Server client + standalone service client
│   ├── constants/
│   │   └── practitioner.ts        # Shared LICENSE_OPTIONS, US_STATES, SPECIALTY_OPTIONS, validateNpi (extracted from onboarding)
│   ├── utils.ts                    # cn() — Tailwind class merging utility
│   └── validations/
│       ├── chat.ts                 # Chat API schemas
│       ├── visit.ts                # Visit create/update/generate schemas
│       ├── patient.ts              # Patient create/update schemas (includes fm_timeline_data)
│       ├── patient-supplement.ts   # Patient supplement CRUD schemas
│       ├── fm-timeline.ts          # FM Timeline push/analyze/data schemas
│       ├── timeline.ts             # Timeline event types + filters
│       ├── symptom-log.ts          # Symptom log create/update schemas
│       ├── protocol-milestone.ts   # Protocol milestone create/update schemas
│       ├── patient-report.ts       # Patient report create/update schemas (report_type enum)
│       ├── ai-insight.ts           # AI insight create/update schemas (insight_type, confidence enums)
│       ├── conversation.ts         # Conversation list query schema (search, filter, cursor, limit)
│       ├── settings.ts             # Settings page schemas (profile update, password change, delete account)
│       ├── document.ts             # Document upload/extraction schemas
│       ├── lab.ts                  # Lab upload/list schemas
│       └── supplement.ts           # Supplement review/interaction/brand schemas
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase type definitions
```

---

## Database Schema (20+ tables, all with RLS)

**Core:** practitioners, patients, conversations, messages
**Clinical:** visits, lab_reports, lab_results, biomarker_results, biomarker_references (17 seeded), patient_documents
**Supplements:** supplement_reviews, interaction_checks, practitioner_brand_preferences, patient_supplements
**Timeline:** timeline_events (polymorphic via source_table/source_id, auto-triggers), symptom_logs, protocol_milestones, patient_reports, ai_insights
**FM Timeline:** patients.fm_timeline_data (JSONB — ATM events across life stages)
**Evidence:** evidence_sources, evidence_embeddings, supplement_evidence (curated citations with pg_trgm fuzzy search)
**System:** audit_logs, usage_tracking, rate_limits

**Key functions:** `check_and_increment_query()`, `reset_daily_queries()`, `search_evidence()`, `update_updated_at()`

**Migrations:** 23 applied (see "Database Migrations" section below).

---

## What Has Been Built (Complete)

### Session 1 — Documentation
- README.md, ARCHITECTURE.md, DATABASE.md, API.md, COMPLIANCE.md, CONTRIBUTING.md

### Session 2 — Chat Interface (8 files)
- SSE streaming endpoint with Claude API
- Real-time message streaming with abort support
- Markdown rendering with custom component styling
- Evidence badge CSS system (not yet rendered in responses)
- Conversation creation/loading/history
- Query limiting (free: 2/day, pro: unlimited)
- Deep Consult mode (Opus vs Sonnet routing)

### Session 3 — Authentication (4 files)
- Login, Register, Onboarding pages
- 2-step onboarding wizard (credentials → practice profile)
- Middleware route protection
- Supabase cloud setup + migration execution

### Session 4 — Audit & Fixes (P0 + P1)

**P0 Fixes (all complete, pushed):**
1. ✅ Service client no longer uses cookies (security)
2. ✅ Query count resets stale daily counts for display
3. ✅ Removed duplicate trust banner from chat layout
4. ✅ Audit logs capture IP + user agent (HIPAA)
5. ✅ Google Fonts moved from CSS @import to `<link>` tags
6. ✅ Loading skeletons for dashboard + chat
7. ✅ Emoji icons → Lucide throughout

**P1 Fixes (all complete, pushed):**
1. ✅ Zod input validation on chat stream route
2. ✅ CSRF origin checking on chat stream route
3. ✅ Deep Consult info popover (explains mode, model, Pro requirement)
4. ✅ "New Conversation" elevated to filled teal button at sidebar top
5. ✅ Dashboard + chat layout DB queries parallelized with Promise.all()
6. ✅ Keyboard shortcuts: ⌘K focus, ⌘↵ send, Esc stop (with hint text)
7. ✅ Non-streaming /api/chat/route.ts deprecated (returns 410)
8. ✅ rehype-sanitize added to ReactMarkdown (XSS protection)
9. ✅ Forgot password wired to Supabase resetPasswordForEmail()
10. ✅ Gold accent activated in sidebar (upgrade banner, Pro badge, Deep Consult toggle)

### Session 5 — Landing Page Redesign (P1 final)
- ✅ 12 new components with scroll animations (Hero, Features, Mockups, Pricing, FAQ)
- ✅ Product mockup visuals with BeakerIcon, ClipboardIcon, CalendarIcon placeholders
- ✅ Social proof section with testimonials and metrics
- ✅ Responsive animations with Intersection Observer
- ✅ Professional trust signals and partner logos

### Session 6 — P2 Completion (Feb 13, 2026)

**All P2 tasks complete:**
1. ✅ NPI Luhn algorithm validation on onboarding
2. ✅ Query reset countdown timer in sidebar
3. ✅ Empty state pages for /labs, /patients, /visits
4. ✅ Conversation management (rename, archive, delete with confirmation)
5. ✅ Cursor-based pagination on chat history API
6. ✅ Shared (app) route group layout with React cache() for data fetching
7. ✅ Evidence badge component (inline citations with color-coded levels)
8. ✅ Biomarker dual-range bar component (conventional + functional ranges)
9. ✅ Content-Security-Policy headers (Next.js config)
10. ✅ Environment validation with Zod schemas
11. ✅ Logomark SVG component

### Session 7 — Patient Management (Feb 13, 2026)

**Full patient module:**
1. ✅ Patient list page with search and demographics cards
2. ✅ Patient detail page with medical history, medications, supplements, allergies
3. ✅ Patient create/edit form with comprehensive clinical fields
4. ✅ Patient document upload, list, and management (lab reports, intake forms, referral letters, imaging, prior records)
5. ✅ AI-powered document extraction and summarization via Claude
6. ✅ Pre-chart view — pre-encounter patient summary with history, medications, recent documents
7. ✅ Patient API endpoints: GET/POST /api/patients, GET/PATCH /api/patients/[id], documents CRUD + extraction
8. ✅ Migration 003 — patient_documents table
9. ✅ Zod validations for patient and document operations

### Session 8 — Clinical Visits & Block Editor (Feb 13, 2026)

**Full visit module with Tiptap block editor:**
1. ✅ Visit list page with status badges, encounter types, linked patients
2. ✅ New visit page — patient selector + encounter type → launch editor
3. ✅ Visit workspace — block editor + dictation + AI generation + SOAP/IFM/Protocol tabs
4. ✅ Tiptap block editor with custom `templateSection` node (collapsible sections with badges, placeholders)
5. ✅ 4 encounter templates — SOAP (9 sections), H&P (12 sections), Consult (6 sections), Follow-up (6 sections)
6. ✅ Template system — definitions, interfaces, and template ↔ editor JSON ↔ text conversion utilities
7. ✅ Editor toolbar (bold, italic, bullet list, ordered list)
8. ✅ Voice input — Web Speech API for live dictation, MediaRecorder for audio recording
9. ✅ Audio transcription via OpenAI Whisper API
10. ✅ Visit generation — SSE streaming SOAP notes, IFM Matrix mapping, evidence-based protocols
11. ✅ Visit export
12. ✅ Patient quick-create modal on new visit page
13. ✅ Migrations 002 (visit columns) + 004 (template_content JSONB)

### Session 9 — AI Scribe (Feb 13, 2026)

**AI Scribe pipeline:**
1. ✅ AI Scribe endpoint: POST /api/visits/[id]/scribe — transcript → Claude section assignment → structured JSON
2. ✅ `buildScribeSystemPrompt()` — dynamic prompt from template section definitions
3. ✅ `templateToPopulatedContent()` — builds Tiptap JSON with sections pre-filled from scribe output
4. ✅ `useEditorDictation` extended with `scribeRecording()` and `ScribeStatus` state machine
5. ✅ Dictation bar redesign — "Record" → "AI Scribe" (brand-colored, Sparkles icon), status indicators
6. ✅ Full pipeline: record → Whisper transcription → Claude assigns to sections → editor auto-populated

### Session 10 — UI/UX Scalability (Feb 13, 2026)

**Scalability Refactor:**
1. ✅ Created `src/components/ui/button.tsx` — Reusable, type-safe button component with variants (default, outline, ghost, gold, destructive)
2. ✅ Created `src/lib/utils.ts` — Standard utility for merging Tailwind classes (`cn`)
3. ✅ Refactored `Sidebar` — Replaced ad-hoc button styles with the new `Button` component
4. ✅ Verified component consistency via `test-components` page

### Session 11 — Labs Module (Feb 14, 2026)

**Full lab interpretation pipeline:**
1. ✅ Lab upload page — `/labs` with drag-and-drop file upload, vendor/test type selection, patient linking
2. ✅ Lab detail page — `/labs/[id]` with biomarker results, dual-range bars, signed PDF viewer, status polling
3. ✅ Lab list — searchable/filterable with status badges, vendor labels, patient links
4. ✅ Lab API endpoints — `GET/POST /api/labs`, `GET /api/labs/[id]`, `POST /api/labs/[id]/review` (stub)
5. ✅ Lab parsing pipeline — Claude Vision extracts biomarkers from PDF → normalizes against functional references
6. ✅ Biomarker normalization — `normalize-biomarkers.ts` matches extracted biomarkers to reference ranges
7. ✅ Flag mapping — `flag-mapping.ts` maps DB flags to component display values
8. ✅ Lab storage — `storage/lab-reports.ts` Supabase Storage integration

### Session 12 — Multi-Provider AI & Dashboard (Feb 14, 2026)

**Multi-provider AI abstraction:**
1. ✅ Provider layer — `src/lib/ai/provider.ts` with unified `createCompletion()` and `streamCompletion()`
2. ✅ Automatic failover — OpenAI primary, Anthropic for vision features, MiniMax as fallback
3. ✅ `ANTHROPIC_MODELS` constant — features always routed through Anthropic (document vision, lab parsing)
4. ✅ Dashboard search — `dashboard-search.tsx` unified search across patients, visits, labs
5. ✅ Sidebar refactor — extracted `sidebar-conversation.tsx`
6. ✅ UI components — `dropdown-menu.tsx` (Radix), `input.tsx`, `label.tsx`, `sonner.tsx` (toasts)

### Session 13 — IFM Matrix Editing (Feb 14, 2026)

**Editable IFM Matrix:**
1. ✅ Inline editing — click any IFM Matrix node to edit findings directly
2. ✅ Portal-based modal — `ifm-node-modal.tsx` for detailed node editing
3. ✅ Drag-and-drop reordering — `@dnd-kit/core` for reordering findings within nodes
4. ✅ Visit workspace wiring — `handleMatrixUpdate` callback persists changes via PATCH API

### Session 14 — Lab Reports in Documents + CSRF (Feb 14, 2026)

**Lab reports in patient Documents tab:**
1. ✅ Patient detail page queries `lab_reports` alongside `patient_documents` via `Promise.all`
2. ✅ Unified document list — discriminated union type (`UnifiedItem`) merges both sources
3. ✅ Lab reports render with green flask icon, vendor/test type metadata, status badge
4. ✅ "View" links to `/labs/[id]` (no delete/re-extract — managed from Labs page)

**CSRF protection (all endpoints):**
5. ✅ Shared CSRF utility — `src/lib/api/csrf.ts` with `validateCsrf()` function
6. ✅ Applied to all 13 mutating handlers across 11 route files
7. ✅ Replaced inline CSRF in `/api/chat/stream` with shared utility

### Sprint 5-6 — Security, UX, Supplements (Feb 15-16, 2026)

1. ✅ Rate limiting on all AI endpoints — `checkRateLimit()` in `src/lib/api/rate-limit.ts`
2. ✅ Filename sanitization on storage paths
3. ✅ Search parameter escaping for PostgREST
4. ✅ Accessibility improvements — ARIA, focus trapping, keyboard nav
5. ✅ Lazy TipTap loading — reduced bundle size
6. ✅ Comprehensive audit logs on all PHI-touching routes
7. ✅ Supplement review module — patient supplement evaluation with evidence-based recommendations
8. ✅ Interaction safety checker — drug-supplement and supplement-supplement pairwise safety
9. ✅ Brand formulary — practitioner preferred brands injected into protocol generation prompts
10. ✅ Strict brand filtering mode — toggle between soft hints and strict-only recommendations
11. ✅ Fullscript stub — placeholder button with toast for future dispensary integration

### Sprint 7-8 — Labs UX, Biomarker Timeline, Chat Attachments (Feb 16, 2026)

1. ✅ Lab search, archival, smart AI-generated titles
2. ✅ Patient Labs tab — lab reports visible in patient Documents tab
3. ✅ Biomarker timeline — Recharts line chart per biomarker with functional/conventional range bands
4. ✅ `previousValue` trend indicators on biomarker range bars
5. ✅ Chat file attachments — PDF/image upload (max 5 files, 10MB each), text extraction, chips
6. ✅ CrossRef DOI resolution for citations — 3-pass matching, server-side in stream route

### Sprint 9 — Clinical Lens, Source Filtering (Feb 17, 2026)

1. ✅ Clinical Lens toggle — Functional / Conventional / Both cycling chip in chat and dashboard
2. ✅ Conventional lens addendum — standard-of-care system prompt
3. ✅ Comparison lens addendum — side-by-side format when lens = "Both"
4. ✅ Structured Comparison Card — two-column visual card (blue Conventional, teal Functional, gold Synthesis)
5. ✅ Evidence Source Filtering — "Sources" chip + popover with 3 presets and 9 individual toggles
6. ✅ Source filter prompt addendum — `buildSourceFilterAddendum()` in `src/lib/ai/source-filter.ts`

### Sprint 10 — Evidence Quality Badges & Bug Fixes (Feb 18, 2026)

1. ✅ **Fix:** Model ID `claude-sonnet-4-5-20250929` → `claude-sonnet-4-6` in `provider.ts` (was causing Anthropic 500 errors)
2. ✅ **Fix:** Citation DOI regression — added Pass 3 author-only match to CrossRef lookup
3. ✅ `classifyEvidenceLevel(title)` — paper title keyword → EvidenceLevel classifier
4. ✅ `CitationMetaContext` — React context threading citation metadata from MessageBubble to `a` renderer
5. ✅ `citation_metadata` SSE event — enriched metadata sent after `citations_resolved`
6. ✅ DB `messages.citations` populated — persists title, authors, year, DOI, evidence_level as JSONB
7. ✅ Inline evidence badges — `[RCT]`, `[META]`, `[COHORT]`, `[GUIDELINE]`, `[CASE]` appear next to citation links
8. ✅ Badge hover popover — title, authors, year, journal, "View source" DOI link

### Sprint 11 — Supplements Phase 2 & Timeline (Feb 19–20, 2026)

1. ✅ Patient supplements — structured `patient_supplements` table with CRUD, source tracking (review/protocol/manual)
2. ✅ Freeform supplement reviews — reviews without a patient (patient_id nullable)
3. ✅ Action overrides — practitioners override AI action badges before pushing to patient file
4. ✅ Protocol push — push AI-recommended supplements from visit protocol tab to patient_supplements
5. ✅ Timeline events — `timeline_events` table with polymorphic source_table/source_id
6. ✅ Auto-triggers — lab completion → `lab_result`, visit INSERT → `visit`, document upload → `document_upload`, supplement changes → supplement_* events
7. ✅ Patient timeline component — chronological feed with type filtering, cursor pagination, AI synthesis
8. ✅ Patient-level IFM Matrix — persistent IFM Matrix on patient profile with merge from visits

### Sprint 12 — Labs & Timeline Enhancements (Feb 21, 2026)

1. ✅ Labs patient search/assign/browse — search patients when uploading labs, assign labs to patients
2. ✅ Auto-timeline for labs — lab completion fires timeline event automatically
3. ✅ Trends tab — biomarker timeline charts with functional/conventional range bands

### Sprint 13 — Vitals & Visit Notes (Feb 22, 2026)

1. ✅ Vitals tracking — weight, blood pressure, heart rate, temperature, SpO2
2. ✅ Pillars of health — sleep, stress, exercise, diet quality tracking with Recharts
3. ✅ Visit notes patient search — search patients when creating visits
4. ✅ AI timeline synthesis — Claude-powered pattern analysis across all patient timeline events

### Sprint 14 — FM Health Timeline (Feb 23–24, 2026)

1. ✅ FM Timeline component — vertical ATM (Antecedents, Triggers, Mediators) swimlane across life stages (prenatal → adulthood)
2. ✅ Inline add/edit/delete — EventForm with category selector, title, year, notes, debounced auto-save via PATCH
3. ✅ AI root cause analysis — POST /api/patients/[id]/fm-timeline/analyze sends events + patient context to Claude for pattern identification
4. ✅ AI synthesis panel — collapsible panel with antecedent/trigger/mediator patterns, root cause hypotheses, recommended focus
5. ✅ Push to FM Timeline — timeline events can be pushed to FM Timeline with category/life stage picker
6. ✅ Atomic push API — POST /api/patients/[id]/fm-timeline/events appends event to patient's fm_timeline_data JSONB
7. ✅ Zod validation schemas — `fm-timeline.ts` with pushFMEventSchema, analyzeFMTimelineSchema, fmTimelineDataSchema
8. ✅ Audit logging — both FM Timeline API routes audit-logged (generate + update actions)
9. ✅ Patient profile wiring — new `fm_timeline` tab (8th tab), `fm_timeline_data` fetched in page query, dynamic import
10. ✅ Migration 018 — `fm_timeline_data JSONB` column on patients table

### Sprint 15 — Timeline Phase 2: Event Producers & Smart Filter (Feb 25, 2026)

1. ✅ Supplement timeline triggers (Migration 015) — `supplement_start`, `supplement_stop`, `supplement_dose_change` auto-fire on `patient_supplements` INSERT/UPDATE
2. ✅ 4 producer tables + triggers (Migration 019) — `symptom_logs`, `protocol_milestones`, `patient_reports`, `ai_insights` with auto-insert into `timeline_events`
3. ✅ Full CRUD API routes for all 4 producer types with Zod validation + CSRF + auth + audit
4. ✅ "Add Event" dropdown on Timeline tab — 3 inline forms (Log Symptom, Add Milestone, Log Patient Report)
5. ✅ Resolve symptom button — PATCH `resolved_at` on symptom_logs, DB trigger auto-creates "Resolved: {name}" event
6. ✅ Smart filter bar — `GET /api/patients/[id]/timeline/types` returns distinct event types; filter chips only appear for types with data
7. ✅ `use-timeline.ts` hook updated with `availableTypes` state from types endpoint

### Sprint 16 — Citation Integrity Pipeline & Evidence Badges (Feb 25–26, 2026)

1. ✅ 3-tier citation validation pipeline (`src/lib/citations/validate-supplement.ts`):
   - Tier 1: CrossRef DOI validation with relevance checking via keyword matching + supplement alias dictionary (30+ supplements)
   - Tier 2: PubMed ESearch + ESummary fallback search for real papers when DOI is invalid/missing
   - Tier 3: Curated `supplement_evidence` table with pg_trgm fuzzy matching for known-good citations
2. ✅ Curated evidence DB (Migration 020): `supplement_evidence` table with 17 seed citations for common supplements (Vitamin D, Magnesium, Omega-3, Probiotics, CoQ10, Curcumin, Berberine, NAC, Ashwagandha, Zinc, Iron, Melatonin, B12)
3. ✅ Multi-citation support: each supplement gets up to 3 verified citations, ranked by evidence strength (meta-analysis > RCT > guideline > cohort > case study)
4. ✅ `VerifiedCitation` interface with `origin` field tracking citation source ("crossref" | "pubmed" | "curated")
5. ✅ Supplement review API updated: `validateAllReviewCitations(reviewData, supabase)` replaces old HEAD-only DOI validation
6. ✅ Shared `EvidenceBadge` component: supplement review cards now use the same hover popover as chat evidence badges
7. ✅ Multi-badge rendering: `supplement-review-detail.tsx` renders up to 3 numbered badges per supplement with legacy fallback
8. ✅ Dynamic z-index management: `badgeHovered` state elevates hovered card above siblings to prevent popover clipping
9. ✅ AI prompt hardened: removed `evidence_title` field, added strict DOI accuracy instructions ("omit entirely if unsure")

### Sprint 17 — Chat Citation Relevance & Multi-Citation Badges (Feb 26, 2026)

1. ✅ CrossRef relevance gate on all 3 matching passes via `isClinicallyRelevant()`:
   - Layer 1: `NON_MEDICAL_DOMAINS` blocklist (30+ non-medical fields: economics, physics, law, etc.)
   - Layer 2: keyword overlap — clinical keywords from context vs paper title/abstract/subjects/journal
   - Requests `subject` and `abstract` from CrossRef API for richer verification
2. ✅ PubMed relevance filtering: `isPubMedResultRelevant()` checks each result title/journal against clinical keywords before accepting
3. ✅ PubMed publication types: `pubtype` field on `PubMedSummaryResult` drives evidence classification — more reliable than title keywords
4. ✅ Improved PubMed search: prefers systematic reviews, meta-analyses, RCTs via `[pt]` filter; falls back to generic when sparse
5. ✅ Evidence classifier upgrade: `classifyEvidenceLevel(title, pubTypes?)` — PubMed pub types as primary, expanded title keyword patterns as fallback
6. ✅ Multi-citation chat badges: up to 3 evidence badges per `[Author, Year]` citation via `resolveCitationsMulti()` → `citation_metadata_multi` SSE event → `citationsByKey` on `ChatMessage` → `EvidenceBadgeList` rendering
7. ✅ `CitationMetaContext` changed from `Map<string, CitationMeta>` to `Map<string, CitationMeta[]>` for multi-citation support

### Sprint 18 — Document Management, AI Populate, Visit UX (Feb 27, 2026)

1. ✅ Document rename/delete — PATCH/DELETE on `/api/patients/[id]/documents/[docId]`
2. ✅ Parse as Lab — create lab report from uploaded document, reusing storage file (`source_document_id` FK)
3. ✅ AI Populate from Documents — hybrid aggregation + AI synthesis for patient overview fields from extracted docs
4. ✅ Populate-from-docs dialog — per-section checkboxes, empty fields pre-checked, "has content" warnings
5. ✅ 3 AI prompts for populate: medical history narrative, clinical notes synthesis, IFM matrix mapping
6. ✅ Compact recorder card — when SOAP exists, shows slim "Re-record encounter" bar instead of full CTA
7. ✅ Expandable SOAP summaries on Visits tab — `subjective` + `assessment` fields fetched, expandable cards with truncated previews
8. ✅ Lab detail sheet UX — removed drawer shadow, prominent "Full report" pill button (opens in new tab)
9. ✅ Vitals push endpoint — `POST /api/visits/[id]/push-vitals` with enhanced vitals panel
10. ✅ Create visit button component — reusable across patient profile and visit list
11. ✅ Editable sections component — `src/components/ui/editable-sections.tsx`
12. ✅ Confirm dialog z-index fix — proper layering with z-50 sidebar
13. ✅ Migrations 021 (vitals_pushed_at) + 022 (lab_source_document_id) applied

### Sprint 20 — Document UX, Settings Page, Sidebar Polish (Mar 2, 2026)

**Document Management UX:**
1. ✅ Document detail drawer — 500px right-side `DocumentDetailSheet` with extraction summary, structured data, full text, and retry button for failed extractions
2. ✅ Document retry extraction API — `POST /api/patients/[id]/documents/[docId]/retry` with CSRF + auth + audit logging
3. ✅ Pending file upload UX — file stored as `pendingFile`, auto-uploads when type is selected. Amber banner + pulsing type selector.
4. ✅ Document type change — PATCH endpoint expanded for `document_type` with validation. ChevronDown icon makes type look clickable.
5. ✅ Processing feedback banner — shown when items are in uploading/extracting/queued/parsing states
6. ✅ Clickable document rows with `stopPropagation` on nested interactive elements
7. ✅ Parse-as-lab now removes source document from list to prevent duplicates

**Settings Page (5 Sections):**
8. ✅ Profile — name editing, avatar display, email read-only
9. ✅ Practice & Credentials — license type, NPI (Luhn), specialties, practice name
10. ✅ Clinical Preferences — evidence sources, brand formulary, strict mode, note template
11. ✅ Subscription & Usage — plan badge, query/lab counts, upgrade/manage CTA
12. ✅ Account & Security — change password (email auth only), delete account with type-to-confirm
13. ✅ 3 new API routes: `PATCH /api/practitioners/profile`, `POST /api/auth/change-password`, `POST /api/auth/delete-account`
14. ✅ Shared constants extracted from onboarding into `src/lib/constants/practitioner.ts`
15. ✅ `getFullPractitioner()` cached query for settings page

**Sidebar Polish:**
16. ✅ Settings gear icon → `<Link href="/settings">`
17. ✅ "View all →" links for Conversations, Favorites, and Visits sections
18. ✅ Visits bumped from 3 to 5 displayed items
19. ✅ Sidebar refreshes after visit deletion via `revalidatePath("/(app)", "layout")`

### Sprint 21 — Conversation History Page (Mar 2, 2026)

1. ✅ Conversation history page (`/conversations`) — searchable list of all past conversations
2. ✅ Active/Archived/Favorites filter tabs with pill-style toggle
3. ✅ Debounced title search (300ms) via `ilike`
4. ✅ Conversation cards with title, relative time, linked patient name, favorite star
5. ✅ Inline actions — rename, favorite/unfavorite, archive/unarchive, delete with confirmation
6. ✅ Cursor-based "Load More" pagination (20 per page)
7. ✅ `GET /api/conversations` API with search, filter, cursor pagination, audit logging
8. ✅ `conversationListQuerySchema` Zod validation
9. ✅ Sidebar "View all →" link updated from `/chat` to `/conversations`

### Sprint 22 — Visit AI Assistant, Data Export, Lab UX (Mar 4, 2026)

**Visit AI Synthesis Assistant:**
1. ✅ Right-edge vertical tab (`writingMode: vertical-lr`) + 340px sliding drawer — always accessible from any scroll position
2. ✅ `visit-assistant.tsx` — self-contained component with streaming chat, suggested prompts (synthesize findings, suggest labs, explain patterns), abort/reset controls
3. ✅ `POST /api/visits/[id]/assistant` — streaming endpoint builds rich visit context (patient demographics, SOAP sections, IFM Matrix, protocol, vitals) via `buildVisitContext()`. Full security stack: CSRF, auth, rate limit, prompt injection validation.

**Data Export (Settings > Account & Security):**
4. ✅ `POST /api/account/export` — generates ZIP with JSON for all practitioner data (patients, visits, lab_reports, biomarker_results, conversations, messages, patient_supplements, supplement_reviews, timeline_events, practitioner profile) + manifest.json
5. ✅ Optional PDF inclusion — `includePdfs` flag downloads lab report files from Supabase Storage into `pdfs/` folder
6. ✅ Export UI card in `account-section.tsx` — description, "Include original lab PDFs" checkbox, loading spinner, blob URL download
7. ✅ Rate limit: `data_export` action (1/day free, 3/day pro)
8. ✅ Dependency: `jszip` for in-memory ZIP generation

**Lab Report Action Bar:**
9. ✅ Overflow menu refactor — reduced from 8 visible buttons to 3 primary (Assign Patient, Push to Record, Copy) + `...` dropdown for secondary actions

### Landing → App Transition (Feb 24, 2026)

1. ✅ Functional hero input — landing page search input is now typeable (was readOnly); on submit, redirects to `/auth/register?next=/chat?q=<encoded_query>`
2. ✅ Example question chips — clicking a sample question threads the query through the same `?next=` param
3. ✅ `next` param threaded through entire auth flow — register → onboarding → dashboard/chat, login → dashboard/chat, Google OAuth → callback → onboarding/chat
4. ✅ `sanitizeRedirectPath` hardened — now checks only pathname (before `?`) for scheme injection, allowing colons in query string values
5. ✅ Middleware updated — authenticated users landing on `/auth/login?next=...` or `/auth/register?next=...` are redirected to the `next` destination instead of `/dashboard`
6. ✅ Auth callback updated — new users without practitioner profile are redirected to `/auth/onboarding?next=...` (threading the param)
7. ✅ Suspense boundaries — added `<Suspense>` wrappers in layout files for register, login, and onboarding pages (required by `useSearchParams()` in Next.js 15)

---

### Sprint 23 — Branded PDF Exports & Export Security (Mar 18, 2026) 🔧 IN PROGRESS

**Planned — Practice Branding & Export System:**
1. [ ] Export security hardening — Cache-Control headers on PHI responses, audit log watermarking, export session tracking, filename PHI sanitization
2. [ ] HIPAA compliance documentation — `docs/COMPLIANCE.md` with audit log retention policy (6+ years), export access policies
3. [ ] Practice branding — Migration 026 adding logo, address, phone, website fields to `practitioners`. Logo upload to `practice-assets` Supabase Storage bucket.
4. [ ] Settings UI — new "Practice Branding" section with logo dropzone, practice address/contact fields, live letterhead preview
5. [ ] Shared export template system — `src/lib/export/` module with `buildLetterhead()`, `buildPatientBar()`, `buildFooter()`, `buildExportPage()`, `fetchLogoAsBase64()`
6. [ ] Enhanced visit export — refactor existing route to use shared templates with practice branding
7. [ ] Lab report export (NEW) — `GET /api/labs/[id]/export` with biomarker tables grouped by panel, H/L/C flags, trend indicators, flagged summary
8. [ ] Supplement protocol export (NEW) — `GET /api/supplements/review/[id]/export` grouped by action (keep/modify/add/discontinue), evidence citations, interaction warnings

**Design Decision:** Clean white background with practice logo letterhead only — no practitioner-customizable colors. Medical documents must look authoritative and trustworthy.
**Technical Approach:** Continue browser print-to-PDF pattern (no Puppeteer/jsPDF). Shared HTML templates with `@page` CSS, page-break control, and Google Fonts.

---

## What Needs To Be Done Next

### High Priority
- [ ] **Source filter persistence** — "Save as Default" → `preferred_evidence_sources` column
- [ ] **RAG retrieval** — wire source filter into `search_evidence()` RPC for vector-based retrieval
- [ ] **Fullscript integration** — real API connection for dispensary ordering (currently stubbed)
- [x] **Practitioner citation verify button** — UI to confirm accurate citations, saves to curated `supplement_evidence` table (v0.25.0)
- [ ] **Custom functional ranges** — practitioner-level biomarker range overrides from Settings
- [x] **Data export** — ZIP export of all practitioner data from Settings > Account & Security (v0.23.0)
- [x] **Visit AI assistant** — right-edge synthesis drawer on visit workspace pages (v0.23.0)
- [ ] **Branded PDF exports** — practice-branded PDF export for visits, lab reports, and supplement protocols (Sprint 23)

### Homepage Design Fixes (from Playwright audit Feb 18)
- [ ] Move chat product mockup into hero viewport — no visual anchor above fold
- [ ] Add dark/teal CTA break section before pricing
- [ ] Show rich AI response (with citations + badges) in demo chat mockup

### Backlog
- Mobile responsive pass
- PWA support
- Analytics (PostHog or Mixpanel)
- Accessibility audit (WCAG 2.1 AA)
- Evidence ingestion pipeline (PubMed, IFM, A4M for RAG knowledge base)
- Patient Education Studio (NotebookLM-style audio + slides)
- Practice Analytics Dashboard

---

## Design System Quick Reference

### Colors
- **Brand (teal):** `--color-brand-50` through `--color-brand-950` — primary UI color
- **Gold:** `--color-gold-50` through `--color-gold-700` — Pro tier, Deep Consult, upgrade CTAs
- **Evidence:** meta (gold), rct (blue), guideline (green), cohort (purple), case (gray)
- **Biomarker:** optimal (green), normal (blue), borderline (amber), out-of-range (red), critical (dark red)
- **Surfaces:** white, secondary (#f8fafb), tertiary (#f1f5f4)
- **Text:** primary (#1a2e2a), secondary (#4a6660), tertiary (#7a9690), muted (#a3bbb5)

### Typography
- **Newsreader** — serif display font for headings, hero text, brand name
- **DM Sans** — sans body font for all content
- **JetBrains Mono** — monospace for biomarker values, NPI, code blocks

### Layout Constants
- Sidebar width: 260px
- Header height: 56px
- Content max-width: 3xl (768px) for chat, 5xl for features, 6xl for header

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=https://qcjuosldesbgqkregztn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Apothecare
```

**Note:** `OPENAI_API_KEY` is required for AI Scribe (Whisper audio transcription). Get it from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

⚠️ **Supabase Key Format Note:** When copying keys from Supabase dashboard, strip the `sb_publishable_` prefix from anon keys and the `sb_secret_` prefix from service role keys. The actual keys are the JWT strings that follow these prefixes.

---

## Database Migrations

23 migrations must be applied in order in Supabase SQL Editor:

1. `001_initial_schema.sql` — 12 core tables with RLS, audit logging, pgvector
2. `002_visits_status.sql` — visit_type, status, ai_protocol columns on visits
3. `003_patient_documents.sql` — patient_documents table for document management
4. `004_visit_template_content.sql` — template_content JSONB column for block editor persistence
5. `005_rate_limits.sql` — rate_limits table + RPC for per-action, tier-aware limiting
6. `006_supplements.sql` — 3 enums + 3 tables (supplement_reviews, interaction_checks, practitioner_brand_preferences) + RLS
7. `007_lab_enhancements.sql` — lab search, archival (is_archived), AI-generated smart titles
8. `008_chat_attachments.sql` — chat_attachments storage bucket
9. `009_timeline_events.sql` — timeline_events table, enum, RLS, auto-insert triggers, backfill
10. `010_patient_supplements.sql` — patient_supplements table, enums, RLS, indexes
11. `011_patient_ifm_matrix.sql` — patients.ifm_matrix JSONB column (persistent IFM Matrix)
12. `012_supplement_review_pushed_at.sql` — supplement_reviews.pushed_at timestamp for idempotency
13. `013_protocol_push.sql` — patient_supplement_source 'protocol' enum value, patient_supplements.visit_id, visits.protocol_pushed_at
14. `014_freeform_reviews.sql` — supplement_reviews.patient_id nullable (freeform reviews without a patient)
15. `015_vitals.sql` — patient_vitals table for vital signs and pillars of health tracking
16. `016_timeline_enhancements.sql` — additional timeline event types and trigger improvements
17. `017_visit_notes_search.sql` — visit notes full-text search and patient linking
18. `018_fm_timeline.sql` — patients.fm_timeline_data JSONB column for FM Health Timeline (ATM framework)
19. `019_timeline_event_producers.sql` — 4 producer tables (symptom_logs, protocol_milestones, patient_reports, ai_insights) + auto-insert triggers
20. `020_supplement_evidence.sql` — Curated supplement evidence table with pg_trgm fuzzy search, 17 seed citations, RLS read-only for authenticated users
21. `021_vitals_pushed_at.sql` — `visits.vitals_pushed_at TIMESTAMPTZ` for tracking when vitals were pushed to patient chart
22. `022_lab_source_document.sql` — `lab_reports.source_document_id UUID` FK to `patient_documents(id)` for parse-as-lab linking
23. `023_patient_recommendations.sql` — `dietary_recommendations`, `lifestyle_recommendations`, `follow_up_labs` JSONB columns on patients
24. `024_partnership_rag.sql` — `partnerships` table, `practitioner_partnerships` join table, extended `evidence_documents` for partnership content, `search_evidence_v2()` RPC with partnership filtering, Apex Energetics seed

## Partnership RAG System (In Progress)

The RAG infrastructure enables partnership content (e.g., Apex Energetics masterclass PDFs) to be ingested, embedded, and retrieved during AI interactions.

### Architecture
- **Ingestion**: PDF → `pdf-parse` text extraction → section-aware chunking (800 tokens, 200 overlap) → OpenAI `text-embedding-3-small` embeddings → stored in `evidence_documents` + `evidence_chunks` (pgvector 1536-dim)
- **Retrieval**: Query embedded → `search_evidence_v2()` cosine similarity search → top-k chunks formatted as system prompt addendum → injected before LLM call
- **Access Control**: `practitioner_partnerships` join table gates which practitioners see which partnership content (with expiration support)

### Key Files
- `src/lib/rag/` — Core RAG module (types, chunk, embed, retrieve, format-context, ingest)
- `src/app/api/admin/rag/ingest/route.ts` — Admin ingestion endpoint
- `supabase/migrations/024_partnership_rag.sql` — Schema migration
- `docs/partnerships/apex-energetics/` — Test PDFs (gitignored)

### Status (as of Mar 11, 2026)
- Phase 1 code complete — migration, ingestion pipeline, retrieval layer, admin API all built
- **PENDING**: Apply migration 024 in Supabase Dashboard SQL Editor, then run ingestion
- **NEXT**: Wire retrieval into chat/supplement/visit endpoints (Phase 2-3)

## Known Issues / Gotchas

1. **Supabase uses `vector` not `pgvector`** for the extension name
2. **Service role key is new-format** (`sb_secret_...`) not JWT — use `createClient` from `@supabase/supabase-js`, not `createServerClient` from `@supabase/ssr`
3. **Anthropic model IDs** — Always use `claude-sonnet-4-6` / `claude-opus-4-6`. Dated IDs like `claude-sonnet-4-5-20250929` cause silent 500 errors (Anthropic returns 500 not 400 for unrecognized models).
4. **AI Scribe requires OpenAI API key** — Whisper transcription uses `OPENAI_API_KEY`. Without it, the Record/AI Scribe feature will fail with "OPENAI_API_KEY is not configured".
5. **Block editor backward compatibility** — Visits with `template_content: null` (created before the editor) fall back to the legacy textarea. New visits always use the block editor.
6. **Web Speech API** (live dictation) only works in Chrome/Edge. Safari and Firefox have limited support.
7. **Evidence badges only appear on DOI-resolved citations** — if CrossRef lookup fails, citations render as plain Scholar links (no badge). This is intentional — no badge degradation on unresolved citations.
8. **Chat citations use relevance filtering** — both CrossRef and PubMed results pass through clinical relevance checks. If all results fail relevance, the citation falls back to a Google Scholar link with no badge rather than showing an irrelevant paper.

---

## How To Resume Development

```bash
cd ~/Development/Apothecare
git pull
npm install
npm run dev
```

Then tell Claude: "Continue Apothecare development from the project summary. Next up: [specific task from TODO.md]"

# Changelog

All notable changes to Apothecare will be documented in this file.

## [0.35.0] - 2026-03-27

### Added — HIPAA Compliance Complete (H6-H9, M3)
- **H7: Patient amendment requests** — Full HIPAA §164.526 workflow: patients submit correction requests via `/portal/amendments` (field selector, current/requested values, reason). Practitioners review and approve/deny via `GET/POST /api/patients/[id]/amendments`. Approved amendments auto-apply to patient record. Migration 039: `amendment_requests` table with patient + practitioner RLS policies.
- **H8: Patient disclosure log** — `/portal/disclosures` page shows patients an accounting of all PHI access events (HIPAA §164.528). API: `GET /api/patient-portal/me/disclosures` queries audit logs scoped to patient's resource_id with cursor pagination.
- **H6: Audit log archival script** — `scripts/archive-audit-logs.ts` exports logs older than N months to JSON, with optional `--delete` flag. Supports `--months` parameter. Output to `archives/` directory for S3 Glacier upload.
- **M3: Breach detection** — `src/lib/api/breach-detection.ts` with threshold-based anomaly detection: excessive exports (>5/hour), excessive patient views (>100/hour). Alerts logged to audit_logs. Wired into account export route.
- **Patient dashboard "Your Rights" section** — Links to disclosure log and amendment request pages.

### Changed
- **H9: BAA documentation** — Updated `docs/COMPLIANCE.md` with specific action items for Supabase Pro BAA, OpenAI Whisper BAA, and AWS Artifact BAA. Marked each as "Action Required" with instructions.

## [0.34.1] - 2026-03-27

### Fixed — HIPAA Compliance (H10-H11, M1-M6)
- **H10/H11**: Verified already resolved — RLS deny policies on `citation_corrections` and Zod validation for replacement citation data were already implemented.
- **M1**: Verified already resolved — site-access cookie in `/api/gate` already sets HttpOnly, Secure, SameSite flags.
- **M2**: `requireAdmin()` and `isAdminEmail()` now log `console.warn` when `ADMIN_EMAILS` env var is empty/unconfigured.
- **M4**: Added AI processing consent checkbox to practitioner onboarding step 2. Records `ai_consent_at` timestamp (migration 038). Button disabled until consent is checked.
- **M5**: Added "AI-Generated Responses as PHI" section to `docs/COMPLIANCE.md` documenting classification, protections (RLS, encryption, audit, zero-retention BAA), and residual risk.
- **M6**: Patient permanent delete now explicitly deletes SET NULL tables (visits, lab_reports, biomarker_results, conversations + messages, clinical_reviews, interaction_checks) before patient row deletion — ensures no orphaned PHI.

### Fixed
- **Patient portal 429 rate limit**: Invite accept flow now uses `verifyOtp()` client-side instead of redirecting to Supabase's `/auth/v1/verify` GET endpoint (which has strict rate limits). Falls back to redirect if verifyOtp fails.

## [0.34.0] - 2026-03-26

### Added — Partnership RAG Overhaul & Chat Intelligence

- **Apex Energetics PDF restructure**: Renamed and split 3 combined PDFs (268 pages total) into 17 focused documents organized by clinical topic — each document now has its own precise metadata for accurate RAG retrieval. Documents: Mastering Functional Blood Chemistry, Metabolic Assessment Form, Functional Laboratory Evaluation, MAF Assessment Guide, GI & Digestive Protocols, Hepatobiliary & Metabolic Protocols, Endocrine & Hormonal Protocols, Pharmaceutical Interactions, Product Dosing Protocols, Neurotransmitter Assessment (NTAP), Neurotransmitter Nutritional Protocols, Thyroid Physiology & Biochemistry, Thyroid Autoimmunity & Gut Connection, Thyroid Clinical Assessment & Lab Interpretation, Thyroid & Neurochemistry, Thyroid Evaluation & 24 Patterns, Thyroid References & Case Studies.
- **Patient biomarkers in chat context**: Chat stream now queries the patient's `biomarker_results` (latest 50) and includes them in the system prompt as a formatted lab results section — enables evidence-grounded responses without requiring PDF attachment.
- **Stress pillar color inversion**: Vitals panel and snapshot now correctly show stress as red at 10/10 (extreme stress = bad). Added `inverted` flag to pillar config; color/slider calculations apply `11 - value` for effective score.
- **Post-hoc patient assignment on visits**: Visit workspace shows "Assign to patient…" dropdown for any visit missing a `patient_id` — not limited to fresh visits. Practitioner can link an unassigned encounter after the fact.
- **Supplement dropdown fields**: Form, Frequency, and Timing fields in the supplement editor converted from free-text inputs to structured dropdowns (16 form types, 11 frequency options, 10 timing options) in both SupplementRow and AddSupplementForm.

### Fixed
- **Evidence badge crash on unknown evidence level**: `LEVEL_CONFIG[citation.level]` returning `undefined` for `"other"` caused a crash. Added fallback to `LEVEL_CONFIG["case-study"]` config.
- **Source filter not controlling clinical perspective**: `buildSourceFilterAddendum` now detects whether selected sources are purely functional vs. conventional and injects corresponding perspective guidance. Functional-only selection no longer gets "conventional vs. functional" framing.
- **Partnership RAG threshold too high for OCR content**: Lowered from 0.65 → 0.45 (OCR-scanned PDFs have lower cosine similarity). Increased max chunks from 5/8 → 6/10.
- **Weight input decimal restriction**: Weight field now uses `step="1"` — whole integers only. Display rounds via `Math.round()`.
- **Per-file metadata mismatch**: `ingest-apex.ts` and `ingest-apex-ocr.ts` now use a keyed `FILE_METADATA` dictionary with per-document `topics`, `conditions`, and `interventions` arrays matching actual PDF content — replacing the previous thyroid-only defaults applied to all files.

### Changed
- Partnership context prompt strengthened: 3 explicit instructions — MUST cite with `[REF-N]`, MUST use specific Apex brand-name products, MUST include dosing details when available.
- Anthropic system prompt updated: "Dual-range awareness" now defaults to functional ranges with conventional noted when relevant (not both always).

## [0.33.0] - 2026-03-26

### Added — Sprint 28: AI Pre-Chart, Visit Undo, Lab UX
- **AI-synthesized pre-chart**: Manual re-synthesis sends all documents + up to 10 completed visits to Claude, producing a deduplicated clinical narrative organized by system. Fast aggregation fallback for auto-rebuild.
- **Undo AI generation**: Visit workspace snapshots SOAP state before AI fill; 10-second toast with "Undo" button restores previous content and persists to server.
- **Lab parsing progress**: Real-time step indicator during parsing ("Downloading PDF…", "Extracting biomarkers…", "Normalizing N biomarkers…") via polling.
- **Medication auto-populate**: Document extraction auto-inserts extracted medications into `patient_medications` table with deduplication (`source: "document_extracted"`).
- **Upload date on labs**: Lab list cards and detail view show "Uploaded [date]" alongside collection date.
- **Partnership RAG source filter**: Chat stream skips PubMed retrieval when only partnership sources (e.g., Apex Energetics) are selected; passes filter to `search_evidence_v2`.
- **Portal dynamic layout**: Added `force-dynamic` layout for portal routes to fix Vercel prerender failures.

### Changed
- Lab parsing text path reduced from 16384 to 8192 max_tokens with compact output instruction.
- Pre-chart view shows visit count alongside document count.

## [0.32.1] - 2026-03-26

### Fixed — Patient Portal Auth
- **Patient invite link broken**: Middleware redirected `/api/patient-portal/*` API calls to practitioner login (`/auth/login`) because these paths weren't recognized as portal routes. The patient's browser received HTML instead of JSON, causing "Something went wrong" error on invite acceptance.
- **New patient auth user creation**: `admin.generateLink({ type: "magiclink" })` failed when the patient had no Supabase Auth user (Quick Invite only creates a DB record). Added `type: "signup"` fallback to auto-create the auth user on first invite click.
- **Resend invite button non-functional**: Component state flow bug — `alreadyInvited` check always matched before `showForm` on re-render, making the email form unreachable. Reordered render branches and added direct resend (skips form when email is known).
- **Missing patient email on resend**: `InviteToPortalButton` wasn't receiving `patientEmail` prop from patient profile, so resend form was always empty.

## [0.32.0] - 2026-03-25

### Added — Document & Lab Pipeline Overhaul
- **Lab parsing**: Text extraction + Sonnet path (5x faster for text-based PDFs), JSON repair for truncated responses, batch biomarker inserts, synchronous parsing (no more `after()`)
- **Auto lab parsing**: Uploading document as "Lab Report" type automatically triggers biomarker extraction
- **Auto-populate**: Extracted document data (chief complaints, allergies, medical history) automatically merges into patient record
- **Structured medications**: New `patient_medications` table + CRUD API + list component (name, dosage, form, frequency, route, prescriber, indication)
- **Outside Encounter Note**: New document type for external provider notes
- **Re-Synthesize button**: Pre-chart tab shows "Re-Synthesize (N new)" when documents were added after last synthesis
- **Pre-chart markdown**: Clinical summary now renders with ReactMarkdown instead of plain text
- **Demographics card**: Patient Overview shows email, phone, address, ethnicity, referral source
- **Audio auto-save**: Recordings auto-upload to Supabase Storage after recording stops (survives page refresh)
- **Audio transcription via storage**: Bypasses Vercel 4.5MB body limit by uploading to storage first

### Fixed — Infrastructure
- **Vercel `after()` unreliable**: All AI processing (lab parsing, document extraction, transcription) now runs synchronously before response
- **Lab parsing timeout**: Increased to 300s, added error recovery (marks "error" instead of stuck "processing")
- **Document extraction timeout**: Added `maxDuration: 300` + `runtime: "nodejs"` (was using default 10s)
- **Weight input**: Widened from w-20 to w-24 (can now enter "200 lbs")
- **URL-encoded filenames**: Decoded in document list display
- **Direct Anthropic client for labs**: Always uses ANTHROPIC_API_KEY directly, never MiniMax proxy

## [0.31.0] - 2026-03-25

### Fixed — HIPAA Compliance (Full Codebase Audit)

**Critical (C1-C4) — All Resolved:**
- **C1**: Storage file cleanup on account/patient deletion — `deleteStoragePrefix()` prevents orphaned PHI in Supabase Storage
- **C2**: Audit logging on 5 patient portal GET routes (me, labs, notes, consents, intake) per HIPAA §164.312(b)
- **C3**: Cache-Control headers on account export ZIP response (prevents proxy caching of PHI)
- **C4**: 25 instances of database error messages leaking to clients replaced with generic "Internal server error"

**High (H1-H5) — Resolved:**
- **H1**: Replaced `select("*")` with explicit field lists in 9 non-export API routes (HIPAA minimum necessary standard)
- **H2**: Removed patient/practitioner identifiers from `console.error()` logs
- **H3-H5**: Verified chat history, invite revoke, and admin flagged-citations already have audit logging

## [0.30.0] - 2026-03-24

### Added — Grounded Citation System
- **Anti-hallucination**: AI now cites only `[REF-N]` from RAG evidence chunks; fabricated `[Author, Year]` citations are stripped
- **Relevance gate**: Each citation verified against surrounding claim context via keyword overlap; misattributed references stripped
- **New module**: `src/lib/citations/ground.ts` replaces CrossRef/PubMed for chat citations

### Added — Patient Portal Overhaul
- **Shared PortalShell**: Extracted from 4 duplicated files; consistent header/footer across all portal pages
- **Consent page redesign**: Custom legal markdown renderer, serif signature input, segmented progress, E-SIGN Act disclosure
- **6-section FM intake form**: 80+ fields — demographics, medical history (22-condition checklist), family history, symptoms (0-10 sliders), lifestyle, supplements
- **Signed Documents**: Patients can review signed consents from dashboard
- **Extended patient table** (Migration 036): 20 new columns for intake data mapping

### Added — Quick Invite Flow
- **Quick Invite button** on patients list: 3-field modal (first name, last name, email) creates patient + sends portal invite atomically
- **`POST /api/patients/invite`**: Combined endpoint with rollback on failure
- **Portal status badges**: "Invited" (amber) / "Portal" (green) on patient list cards

### Added — Partnership Admin & Access Control
- **Admin partnerships dashboard** (`/admin/partnerships`): Manage partners, view ingested documents, re-ingest, create new
- **Practitioner settings**: "Evidence Partnerships" section showing access status per partnership
- **Tier gating**: Partnership RAG access restricted to Pro tier
- **Per-patient source preferences**: Saved per patient, auto-loaded in chat context

### Added — Testing
- **Playwright e2e tests**: 12 tests covering auth, chat, dashboard, portal flows
- **npm scripts**: `test:e2e` (headless), `test:e2e:ui` (interactive)

### Changed
- **Dosing display**: Rendered as styled `Dose | value` pill on own line in chat responses
- **Source filter popover**: Dynamic direction (opens up/down based on viewport position)
- **Landing page CTA**: "Start" → "Start Free"
- **Source attribution footer**: Shows "Knowledge base: Apex Energetics" when partnership RAG informs response

### Fixed
- **Citation hallucinations**: Eliminated via grounded `[REF-N]` system
- **Citation misattribution**: Relevance gate catches wrong-reference citations
- **Dark backdrop overlays**: Removed `bg-black/*` from all modals/dialogs/drawers site-wide
- **Stale test expectations**: CSRF fallback (apothecare.ai not localhost), biomarker flag (borderline_low)
- **Vitest config**: Excluded e2e/ and sibling project tests

## [0.27.1] - 2026-03-20

### Fixed — Build-Time Env Validation Crash
- **Lazy env validation**: `src/lib/env.ts` previously ran `validateEnv()` eagerly at import time, crashing `next build` when environment variables weren't set. Replaced with a Proxy that defers validation to first property access at runtime. Build now succeeds without env vars; validation still fires on first request.
- **Lazy provider detection**: `src/lib/ai/provider.ts` called `getProvider()` at module level (accessing `env.*`), triggering the same build crash. Made provider and model resolution lazy via the same Proxy pattern.

### Added — HIPAA Audit Documentation
- **HIPAA audit findings** in `docs/COMPLIANCE.md`: Documented critical and high findings from security audit of v0.27.0 citation quality feedback loop (missing audit logs on admin GET endpoints, missing RLS deny policies on `citation_corrections`, insufficient input validation on replacement citation data).
- **Remediation tasks** in `TODO.md`: Added "HIPAA Audit Remediation" section with prioritized fix list (critical: audit logging on GET endpoints; high: explicit RLS deny policies, input validation, defensive admin config warning).

## [0.27.0] - 2026-03-19

### Added — Citation Quality Feedback Loop
- **Admin page** (`/admin/flagged-citations`): Full review page for citations flagged by practitioners. Shows DOI, title, evidence level, flag reason, who flagged it, total flag count across practitioners, and original Q&A context (user question + AI answer) when available. Three resolution actions: **Dismiss** (restore citation), **Replace** (search CrossRef for correct citation, store correction mapping), or **Remove** (delete entirely).
- **Citation corrections table** (`citation_corrections`): Maps `flagged_doi → replacement_doi` so future citation resolution auto-substitutes corrected citations. Admin-only writes via service client.
- **Community consensus auto-exclusion**: DOIs flagged by 3+ practitioners are automatically excluded from citation results without admin intervention. These don't appear in the admin review queue.
- **Q&A context capture**: When flagging a citation in chat, the conversation ID and message ID are stored. Admin review shows the original user question and AI answer that contained the flagged citation.
- **Replacement citation search** (`GET /api/admin/flagged-citations/search`): Admin can search CrossRef for replacement citations and select the correct one with a single click.
- **Citation resolution pipeline integration**: `resolveCitationsMulti()` now checks `citation_corrections` after resolving DOIs — any flagged DOI with an admin-verified replacement is auto-substituted.
- **DB migration** (`028_citation_corrections.sql`): Adds `conversation_id`, `message_id`, `flag_count` columns to `verified_citations`; creates `citation_corrections` table with unique `flagged_doi` constraint.
- **Admin sidebar**: Added "Flagged Citations" nav item with flag icon.
- **Admin dashboard**: Added Flagged Citations card (amber theme).

### Changed — Evidence Partnerships Display
- **Dashboard**: Replaced OpenEvidence-style top banner with subtle "Powered by evidence from" footer badge below quick action cards, using grayscale partner logos (A4M, IFM, Cleveland Clinic).
- **Chat**: Removed evidence partnerships banner entirely from chat interface for a cleaner UX.

### Fixed — Sidebar Color
- **CSS variable**: Changed `--color-surface-secondary` from `#f5f5f4` to `#fbfcfc` to match the original semi-transparent value's visual appearance when rendered over white, while keeping full opacity.

## [0.26.0] - 2026-03-18

### Added — Security & Compliance Page
- **Security page** (`/security`): Public-facing security and compliance page covering regulatory alignment (HIPAA, FTC), infrastructure security, AI data handling (zero-retention policy), data protection, encryption (TLS 1.3, AES-256), audit logging, secure development practices, security governance, incident response, independent assessments, and responsible disclosure.
- **AI Data Handling section**: Documents zero-retention AI provider policy, prompt injection detection, and clinical content disclaimers.
- **Footer links**: Security page linked from landing page footer.
- **Favicon**: Apothecare "A" logomark SVG favicon for browser tabs.

### Added — Sprint Plans
- **Sprint 24**: Universal Citation Verification — DOI-keyed `verified_citations` table, general-purpose verify API, chat citation verification UI, citation quality feedback loop.
- **Sprint 25**: Subscription Tier Feature Gating — free vs pro enforcement for sources, patients (5 max free), labs, visits, exports, brand preferences.
- **Legal & Compliance Pages**: Terms of Use, Telehealth Compliance, Advertising & Partnerships pages planned.

## [0.25.0] - 2026-03-18

### Added — Citation Verification
- **Verify citation API** (`POST /api/supplements/citations/verify`): Authenticated endpoint allowing practitioners to confirm individual citations as accurate. Verified citations are upserted into the curated `supplement_evidence` table with `is_verified: true`, growing the Tier 3 citation database organically from real clinical usage. Evidence level classification and ranking applied server-side.
- **Verify citation UI** in `EvidenceBadge` component: When `supplementName` prop is provided, unverified citations show a "Verify Citation" button in the hover popover. Clicking verifies the citation and flips the badge to a green "Verified" state. Citations with `origin: "curated"` start as already verified.
- **New UI components**: `Badge` (`src/components/ui/badge.tsx`) and `Tooltip` (`src/components/ui/tooltip.tsx`).

### Fixed — Vercel Build & Deployment
- **Next.js upgrade**: Updated from 15.1.0 to 15.5.13 to fix Vercel build hang on the auto-generated security patch branch (`vercel/react-server-components-cve-vu-uq4jqn`). Also updated `ai` SDK to 6.0.116.
- **CSP fix**: Added `'unsafe-inline'` to production `script-src` CSP directive. Next.js 15.5 injects inline scripts for hydration that were blocked by the strict `script-src 'self'` policy, causing a blank white page in production.
- **Stale build cache**: Cleared `.next` directory containing old Pages Router artifacts (`_document.js`, `_app.js`) that conflicted with App Router builds.

### Fixed — Pricing
- **Pro plan pricing**: Updated from $89/mo to $99/mo on landing page (`pricing.tsx`) and mockup page.

### Planned — Sprint 23: Branded PDF Export System
- **Practice branding**: Logo upload, practice address/phone/website in Settings. Clean white background with logo letterhead (no custom colors — medical documents must look authoritative).
- **Shared export templates**: `src/lib/export/` module with reusable letterhead, patient bar, footer, and print CSS across all export types.
- **Lab report export** (new): Biomarker tables grouped by panel with H/L/C flags, trend indicators, and flagged summary section.
- **Supplement protocol export** (new): Grouped by action (keep/modify/add/discontinue) with evidence citations, interaction warnings, and numbered references.
- **Export security hardening**: Cache-Control headers on PHI responses, audit log watermarking, export session tracking, filename PHI sanitization, HIPAA compliance documentation.

## [0.24.0] - 2026-03-11

### Added — Partnership RAG Infrastructure (Phase 1)
- **Partnership tables** (Migration 024): `partnerships` registry, `practitioner_partnerships` join table with expiration support. Extended `evidence_documents` with `partnership_id`, `document_type`, `version`, `file_hash`, `storage_path`, `status`. New `search_evidence_v2()` RPC with partnership and document type filtering. Seeded Apex Energetics as first partnership.
- **RAG library** (`src/lib/rag/`): Complete ingestion and retrieval pipeline:
  - `types.ts` — Shared types (`RetrievedChunk`, `IngestionResult`, `DocumentChunk`)
  - `chunk.ts` — Section-aware text chunking (800 tokens, 200 overlap)
  - `embed.ts` — OpenAI `text-embedding-3-small` embeddings with batch support
  - `retrieve.ts` — Semantic search via `search_evidence_v2` pgvector RPC
  - `format-context.ts` — Formats retrieved chunks as system prompt addendum with `[Source: Org — Title]` citation format
  - `ingest.ts` — Full pipeline: PDF read → `pdf-parse` text extraction → chunk → embed → store in `evidence_documents` + `evidence_chunks`
- **Admin ingestion API** (`POST/GET /api/admin/rag/ingest`): Admin-only endpoint to ingest all PDFs from a partnership's local docs directory. Supports hash-based deduplication and batch embedding.
- **Dependency**: Added `pdf-parse` for PDF text extraction.

### Fixed — Visit Editor TipTap Import
- **TipTap v3.20 compatibility**: Fixed `@tiptap/extension-table` import — changed from default import to named imports (`Table`, `TableRow`, `TableCell`, `TableHeader`). Package no longer has a default export in v3.20.1. Also updated `TaskList`, `TaskItem`, `TextAlign` to named imports.

### Fixed — Visit Type Dropdown
- **Visit type change reloads template**: Switching encounter type (SOAP ↔ Follow-up ↔ H&P ↔ Consult) on fresh visits now swaps the editor sections to match the selected template. Previously the dropdown saved to DB but didn't update the editor content.

## [0.23.0] - 2026-03-04

### Added — Visit AI Synthesis Assistant
- **Visit assistant component** (`src/components/visits/visit-assistant.tsx`): Right-edge vertical tab (vertically centered, `writingMode: vertical-lr`) that opens a 340px sliding drawer from the right edge of the viewport. Self-contained component with streaming chat, suggested prompts, conversation history, abort/reset controls, and light backdrop.
- **Visit assistant API** (`POST /api/visits/[id]/assistant`): Streaming chat endpoint that builds rich visit context (patient demographics, SOAP sections, IFM Matrix, protocol, vitals) and responds via `streamCompletion()` SSE. Full security stack: CSRF, auth, rate limit, prompt injection validation. System prompt positions AI as a clinical synthesis assistant for the current visit.
- **Rate limit**: Added `visit_scribe` action coverage for assistant endpoint.

### Added — Data Export (Settings > Account & Security)
- **Export API** (`POST /api/account/export`): Generates a ZIP file containing JSON exports of all practitioner data — patients, visits, lab reports, biomarker results, conversations, messages, patient supplements, supplement reviews, timeline events, and practitioner profile. Optional PDF inclusion (`includePdfs` flag) downloads original lab report files from Supabase Storage into `pdfs/` folder. Includes `manifest.json` with table counts and export metadata. Uses JSZip for in-memory ZIP generation.
- **Export UI** in `account-section.tsx`: "Export Your Data" card with description, "Include original lab PDFs" checkbox (default unchecked), "Export All Data" button with loading spinner, and blob URL download trigger.
- **Rate limit**: Added `data_export` action (1/day free, 3/day pro).
- **Dependency**: Added `jszip` for ZIP file generation.

### Changed — Lab Report Action Bar
- **Overflow menu** on lab report detail page: Reduced visible action buttons from 8 to 3 primary actions (Assign Patient, Push to Record, Copy). Secondary actions (View Original PDF, Download PDF, Add to Visit, Re-parse Report, Archive/Unarchive) grouped into a `...` overflow dropdown menu with click-outside dismiss.

## [0.22.0] - 2026-03-02

### Added — Conversation History Page
- **Conversations page** (`src/app/(app)/conversations/page.tsx`): Dedicated page to browse and search all past conversations. Server-side initial fetch of 20 most recent conversations with patient name joins.
- **Conversation list client** (`src/components/conversations/conversation-list-client.tsx`): Client component with debounced search (300ms), Active/Archived/Favorites filter tabs, conversation cards (title, relative time, linked patient name, favorite star), inline actions (rename, favorite, archive/unarchive, delete with confirmation), and cursor-based "Load More" pagination.
- **Conversations API** (`GET /api/conversations`): List conversations with search (title ilike), filter (active/archived/favorites), cursor-based pagination (keyset on `updated_at`), and audit logging. Includes patient name join via Supabase foreign key.
- **Conversation validation schema** (`src/lib/validations/conversation.ts`): `conversationListQuerySchema` — Zod schema for query params (search, filter, cursor, limit).

### Changed
- **Sidebar "View all →"**: Conversations link updated from `/chat` to `/conversations` so practitioners can browse past conversations instead of landing on a new chat.

## [0.21.0] - 2026-03-02

### Added — Document Management UX
- **Document detail drawer** (`src/components/patients/document-detail-sheet.tsx`): 500px right-side drawer showing extraction summary, structured data (key-value pairs), full extracted text (scrollable monospace), and metadata. Matches `LabDetailSheet` pattern — backdrop click, Escape key, body scroll lock.
- **Document retry extraction**: `POST /api/patients/[id]/documents/[docId]/retry` — re-fires `extractDocumentContent()` for failed documents. CSRF + auth + audit logged (`retry_extraction` action). Guards against missing `storage_path` (400) and concurrent extraction (409).
- **Pending file upload UX**: When no document type is selected, file is stored in state as `pendingFile` and auto-uploads via `useEffect` once a type is chosen. Amber banner shows "ready — select a type above to upload". Type selector border pulses red when file is pending.
- **Document type change after upload**: `PATCH /api/patients/[id]/documents/[docId]` now accepts `document_type` field with validation against `VALID_DOC_TYPES` array.
- **Document type clickability**: ChevronDown icon + dashed border on hover makes document type look like an interactive dropdown.
- **Processing feedback banner**: Shown at top of document list when any items are in uploading/extracting/queued/parsing states. Displays count and "You can leave this page and check back in a few minutes".
- **Clickable document rows**: Click any document row to open detail drawer. Eye icon button for preview. `stopPropagation` on nested interactive elements (rename form, type selector, action buttons).

### Added — Sidebar Improvements
- **"View all →" links**: Conversations section links to `/chat`, Favorites links to `/chat?filter=favorites` (shown when >5 favorites), Visits links to `/visits`.
- **Sidebar visits bumped from 3 to 5** displayed items (updated `getSidebarData()` query limit).

### Fixed — Sidebar & Visit Deletion
- **Sidebar refreshes after visit deletion**: Added `revalidatePath("/(app)", "layout")` in `DELETE /api/visits/[id]` handler. Client-side: `router.refresh()` now fires before `router.push("/visits")` to avoid stale layout cache.
- **Parse-as-lab duplicate prevention**: Source document is now removed from the document list after successfully creating a lab report, preventing duplicate entries.

### Changed
- **`src/lib/api/audit.ts`**: Added `"retry_extraction"` to `AuditAction` union type.
- **`src/lib/supabase/cached-queries.ts`**: Sidebar visits query limit changed from 3 to 5.

## [0.20.0] - 2026-03-02

### Added — Settings Page (5 Sections)
- **Settings page** (`src/app/(app)/settings/page.tsx`): Server component fetching full practitioner data + brand preferences for the settings interface.
- **Settings layout** (`src/components/settings/settings-page.tsx`): Client component with left nav (desktop) / horizontal scroll tabs (mobile) for 5 sections.
- **Profile section** (`profile-section.tsx`): Avatar (initial circle, read-only), full name (editable), email (read-only). Save → `PATCH /api/practitioners/profile`.
- **Credentials section** (within settings-page): License type button grid, license number/state inputs, NPI with Luhn validation, practice name, specialty tags, years in practice. Reuses shared constants from onboarding.
- **Preferences section** (`preferences-section.tsx`): Evidence source checkboxes with category grouping + preset pills (via existing `PUT /api/practitioners/evidence-sources`). Brand preferences with add/remove + strict mode toggle (via existing `PUT /api/supplements/brands`). Default note template dropdown.
- **Subscription section** (`subscription-section.tsx`): Plan badge (Free outline / Pro gold), daily query count, monthly lab count, member since date. Free users see "Upgrade to Pro" gold button (toast). Pro users see "Manage Billing" outline button (toast).
- **Account section** (`account-section.tsx`): Change password form (hidden for OAuth users). Danger zone: red-bordered card with delete account button → type "DELETE MY ACCOUNT" confirmation dialog.

### Added — Settings API Routes
- **`PATCH /api/practitioners/profile`**: Update practitioner fields (full_name, license_type, license_number, license_state, npi_number, practice_name, specialty_focus, years_in_practice). CSRF + Zod validation + audit logging.
- **`POST /api/auth/change-password`**: Supabase password update for email auth users. Validates new password (min 8 chars, match confirmation). CSRF + audit logging.
- **`POST /api/auth/delete-account`**: Cascade delete of all practitioner data (brand_preferences → supplements → timeline tables → documents → visits → patients → conversations → messages → audit_logs → practitioner row) + `auth.admin.deleteUser()`. Requires "DELETE MY ACCOUNT" confirmation string. CSRF + audit logging.

### Added — Shared Constants & Validation
- **`src/lib/constants/practitioner.ts`** (NEW): Extracted `LICENSE_OPTIONS` (8 types with NPI requirements), `LICENSE_TYPES`, `validateNpi()` (Luhn mod 10), `US_STATES` (51 options), `SPECIALTY_OPTIONS` (12 types), `NOTE_TEMPLATE_OPTIONS` (4 types) from onboarding into shared module.
- **`src/lib/validations/settings.ts`** (NEW): Zod schemas — `updateProfileSchema`, `changePasswordSchema`, `deleteAccountSchema`.
- **`getFullPractitioner()`** added to `src/lib/supabase/cached-queries.ts` — `select("*")` with React `cache()` for settings page.

### Changed — Sidebar
- **Settings gear icon** now links to `/settings` via `<Link>` (was showing "Settings coming soon" toast).
- **Onboarding page** updated to import constants from shared `src/lib/constants/practitioner.ts`.

## [0.19.0] - 2026-02-27

### Added — Document Management Enhancements
- **Document rename**: `PATCH /api/patients/[id]/documents/[docId]` supports renaming documents via `title` field update.
- **Document delete**: `DELETE /api/patients/[id]/documents/[docId]` removes document record and storage file.
- **Parse as Lab**: `POST /api/patients/[id]/documents/[docId]/parse-as-lab` — creates a `lab_report` from an uploaded document, reusing the existing storage file instead of re-uploading. Links via `source_document_id` FK.
- **Migration 022** (`022_lab_source_document.sql`): Adds `source_document_id UUID` FK on `lab_reports` pointing to `patient_documents(id)` with `ON DELETE SET NULL`.

### Added — AI Populate from Documents
- **`POST /api/patients/[id]/populate-from-docs`** — Hybrid endpoint that populates patient overview fields from extracted documents. Direct aggregation for structured fields (chief complaints, allergies, medications); AI synthesis via `createCompletion()` for narrative fields (medical history, clinical notes, IFM matrix).
- **`src/lib/ai/populate-prompts.ts`** (NEW): 3 AI system prompts — `MEDICAL_HISTORY_PROMPT` (narrative synthesis), `CLINICAL_NOTES_PROMPT` (symptoms/lifestyle/goals), `IFM_MATRIX_FROM_DOCS_PROMPT` (map findings to 7 IFM nodes as JSON).
- **`src/components/patients/populate-from-docs.tsx`** (NEW): `PopulateFromDocsBanner` CTA shown when extracted docs exist and fields are empty. `PopulateFromDocsDialog` modal with per-section checkboxes, empty fields pre-checked, "has content" warnings on populated fields.
- **Rate limit**: Added `doc_populate` action to `RateLimitAction` (10/day free, 100/day pro).

### Added — Visit Workspace UX Improvements
- **Compact recorder card**: When SOAP note already exists (`visit.subjective` truthy), recorder shows slim "Re-record encounter to regenerate note" bar instead of full "Record Encounter" CTA. Fresh visits unchanged.
- **Expandable SOAP summaries on Visits tab**: Patient profile Visits tab now fetches `subjective` and `assessment` fields. Visits with SOAP content show expand chevron revealing truncated Subjective + Assessment summaries and "Open full note" link. Visits without SOAP remain simple links.
- **Create visit button**: `src/components/visits/create-visit-button.tsx` — reusable visit creation button component.

### Added — Vitals & Health Ratings
- **Vitals push endpoint**: `POST /api/visits/[id]/push-vitals` — pushes visit vitals and health ratings to the patient vitals timeline.
- **Migration 021** (`021_vitals_pushed_at.sql`): Adds `vitals_pushed_at TIMESTAMPTZ` on `visits` table.
- **Enhanced vitals panel**: `src/components/visits/vitals-panel.tsx` with chart support for tracking vitals over time.

### Changed — Lab Detail Sheet UX
- **Removed shadow** from lab detail drawer panel (`shadow-2xl` removed from `lab-detail-sheet.tsx`).
- **Prominent "Full report" link**: Replaced tiny ExternalLink icon with visible pill button (`target="_blank"`) in header and footer for opening full lab page in new tab.

### Changed — UI Components
- **`src/components/ui/editable-sections.tsx`** (NEW): Reusable editable section components for patient overview.
- **`src/components/ui/confirm-dialog.tsx`**: z-index fix for proper layering with sidebar.
- **`src/components/patients/patient-profile.tsx`**: Major refactor — integrated PopulateFromDocsBanner, expandable visit cards with SOAP summaries, updated VisitItem interface.

### Changed — Dashboard & Layout
- **Dashboard page**: Enhanced layout with improved card grid and navigation.
- **Sidebar**: Fixed conversation list edge cases.
- **FM Timeline**: Improved event rendering and interaction.

## [0.18.0] - 2026-02-26

### Fixed — Chat Citation Relevance & Evidence Level Accuracy
- **`src/lib/citations/resolve.ts`**: CrossRef results now pass through `isClinicallyRelevant()` two-layer gate (domain blocker + keyword overlap) on all 3 matching passes. Prevents irrelevant papers (e.g., finance/economics articles) from appearing as evidence badges.
  - Added `subject` and `abstract` to CrossRef API `select` fields for richer relevance checking.
  - Added `NON_MEDICAL_DOMAINS` blocklist (30+ non-medical academic fields) and `isNonMedicalDomain()` check.
  - Added `extractClinicalKeywords()` for context-aware keyword extraction.
  - Increased CrossRef `rows` from 3 to 5 for more matching candidates.
- **PubMed relevance filtering**: `searchPubMedForCitation()` now checks each PubMed result title/journal against clinical keywords before accepting. Prevents off-topic papers (e.g., "Hypertrophic Scars and Keloids" for stress management context).
- **PubMed publication types**: Added `pubtype` to `PubMedSummaryResult` interface. PubMed publication type labels (e.g., "Randomized Controlled Trial", "Meta-Analysis") are now passed to `classifyEvidenceLevel()` as the primary classifier, fixing the issue where all badges showed "COHORT".
- **Improved PubMed search query**: Changed from generic `contextTerms supplementation OR treatment` to `(contextTerms) AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt] OR clinical trial[pt] OR review[pt])`. Falls back to generic query when filtered query returns too few results.
- **Over-fetching with filtering**: PubMed now fetches `limit * 3` results (minimum 8) to ensure enough remain after relevance filtering.

### Added — Multi-Citation Support in Chat (Up to 3 Badges per Citation)
- **`src/lib/citations/resolve.ts`**: Added `resolveSingleCitationMulti()` — collects up to 3 relevant matches from CrossRef + PubMed per citation. Added `resolveCitationsMulti()` public API returning `Map<string, CitationResolvedData[]>`.
- **`src/app/api/chat/stream/route.ts`**: Uses `resolveCitationsMulti()` and sends new `citation_metadata_multi` SSE event with `citationsByKey` record.
- **`src/lib/chat/citation-meta-context.ts`**: Changed from `Map<string, CitationMeta>` to `Map<string, CitationMeta[]>` for multi-citation support.
- **`src/hooks/use-chat.ts`**: Added `ChatMessageCitation` interface. Added `citationsByKey?: Record<string, ChatMessageCitation[]>` to `ChatMessage`. Handles `citation_metadata_multi` event.
- **`src/components/chat/message-bubble.tsx`**: Builds `Map<string, CitationMeta[]>` from `citationsByKey` (preferred) or falls back to legacy `citations` array.
- **`src/components/chat/markdown-config.tsx`**: Renders `EvidenceBadgeList` for multiple citations or single `EvidenceBadge` for one.

### Changed — Evidence Level Classifier
- **`src/lib/chat/classify-evidence.ts`**: `classifyEvidenceLevel()` now accepts optional `pubTypes?: string[]` parameter. PubMed publication type matching is the primary classification method (more reliable than title keywords). Expanded title keyword patterns: added "double-blind", "placebo-controlled", "pilot study", "cross-sectional", "longitudinal", "population-based", "position statement", "expert consensus", "umbrella review", "open-label", "pilot trial".

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

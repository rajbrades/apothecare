# Architecture

## Overview

Apotheca is a Next.js 15 application using the App Router with React Server Components. It follows a hybrid architecture: Supabase Cloud handles auth, database, and file storage (all under one HIPAA BAA), while the Next.js application is deployed to Vercel (dev) or AWS Amplify (production, HIPAA-eligible). AI inference is handled by Anthropic's Claude API (separate HIPAA BAA with zero data retention). Audio transcription uses OpenAI's Whisper API for the AI Scribe feature.

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
└──────────┬───────────────┘   │  │  13 tables + audit logs          ││
           │                   │  │  17 seeded biomarkers             ││
     ┌─────┼──────────┐       │  └─────────────────────────────────┘│
     ▼     ▼          ▼       │  HIPAA: Supabase Pro BAA             │
┌─────────┐ ┌────────┐       └─────────────────────────────────────┘
│Anthropic│ │ OpenAI │
│ Claude  │ │Whisper │   ┌──────────────────────────────────┐
│ API     │ │ API    │   │           Stripe                  │
│         │ │        │   │   $89/mo Pro subscription         │
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
1. POST /api/chat/stream { message, conversation_id?, patient_id?, is_deep_consult? }
2. CSRF: Validate Origin header against NEXT_PUBLIC_APP_URL
3. Zod: Validate input schema (message 1-10k chars, UUIDs, boolean)
4. Auth: Verify Supabase JWT → extract auth_user_id
5. Fetch practitioner record (subscription_tier, query count)
6. RPC: check_and_increment_query() → returns false if over limit
7. If conversation_id is null → create new conversation record
8. If patient_id → load patient context (medications, allergies, history)
9. Fetch conversation history (last 20 messages)
10. Build prompt: system prompt + patient context + conversation history
11. Call Anthropic Claude API via SSE streaming (Sonnet or Opus)
12. Save user message + assistant response to messages table
13. Insert audit_log entry (action: 'query', ip_address, user_agent)
14. Stream response tokens to client via Server-Sent Events
```

### Visit Generation Flow (Current Implementation)

```
1. User writes/dictates notes in block editor (Tiptap with templateSection nodes)
2. User clicks "Generate" → editorContentToText(json) flattens to labeled text
3. Save template_content (JSON) + raw_notes (text) via PATCH /api/visits/[id]
4. POST /api/visits/[id]/generate { raw_notes, sections: ["soap","ifm_matrix","protocol"] }
5. CSRF + Zod validation → Auth → fetch visit + patient context
6. Phase 1 (SOAP): Claude Sonnet streams SOAP note → parsed into S/O/A/P sections → saved
7. Phase 2 (IFM): Claude maps SOAP findings to IFM Matrix nodes → saved as JSONB
8. Phase 3 (Protocol): Claude generates evidence-based protocol → saved
9. Each phase streams SSE events: { section, status, text/data }
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
8. Lab detail page polls status, displays dual-range bars when ready
9. If patient_id linked, lab appears in patient's Documents tab automatically
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
| Lab PDF parsing | Anthropic (always) | Claude Sonnet 4.5 | 4,096 |
| Document extraction | Anthropic (always) | Claude Sonnet 4.5 | 4,096 |
| SOAP note generation | OpenAI (primary) | gpt-4o | 4,096 |
| IFM Matrix mapping | OpenAI (primary) | gpt-4o | 3,000 |
| Protocol generation | OpenAI (primary) | gpt-4o | 4,096 |
| AI Scribe (section assignment) | OpenAI (primary) | gpt-4o | 4,096 |
| Audio transcription | OpenAI Whisper | whisper-1 | N/A |

## Security Architecture

### Defense in Depth

```
Layer 1: Network     → TLS 1.3 everywhere
Layer 2: Auth        → Supabase JWT, MFA available, session refresh middleware
Layer 3: CSRF        → Origin header validation on all mutating endpoints (shared validateCsrf())
Layer 4: Validation  → Zod schemas on all API inputs
Layer 5: Database    → Row-Level Security, practitioners see only their own data
Layer 6: XSS         → rehype-sanitize on all markdown rendering
Layer 7: AI          → Zero-retention BAA, PHI stripped where possible
Layer 8: Audit       → Every PHI access logged with IP, user agent, resource ID
Layer 9: Service     → Service role client is standalone (no cookie inheritance)
```

### Service Client Isolation

The Supabase service role client (`createServiceClient()`) uses `@supabase/supabase-js` directly — NOT `@supabase/ssr`. This prevents cookie data from being passed alongside the service role key, which bypasses RLS. The service client is a singleton, created once and reused.

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
│   │   ├── labs/
│   │   │   ├── [id]/page.tsx       # Lab report detail (biomarkers, PDF viewer)
│   │   │   ├── loading.tsx         # Lab list loading skeleton
│   │   │   └── page.tsx            # Lab list + upload
│   │   ├── patients/
│   │   │   ├── [id]/page.tsx       # Patient detail + documents + lab reports
│   │   │   ├── new/page.tsx        # New patient form
│   │   │   └── page.tsx            # Patient list
│   │   ├── visits/
│   │   │   ├── [id]/page.tsx       # Visit workspace (editor + AI generation)
│   │   │   ├── new/page.tsx        # New visit (patient + encounter type)
│   │   │   └── page.tsx            # Visit list
│   │   └── layout.tsx              # Shared app layout (sidebar + React cache)
│   ├── api/
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
│   │   │   │   │   │   └── route.ts          # GET/DELETE document
│   │   │   │   │   └── route.ts              # GET list / POST upload
│   │   │   │   └── route.ts        # GET/PATCH/DELETE patient
│   │   │   └── route.ts            # GET list / POST create
│   │   └── visits/
│   │       ├── [id]/
│   │       │   ├── export/route.ts     # POST export visit
│   │       │   ├── generate/route.ts   # POST SSE SOAP/IFM/Protocol generation
│   │       │   ├── scribe/route.ts     # POST AI Scribe (transcript → sections)
│   │       │   ├── transcribe/route.ts # POST audio → Whisper transcription
│   │       │   └── route.ts            # GET/PATCH visit
│   │       └── route.ts                # GET list / POST create
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth/email callback
│   │   ├── login/page.tsx          # Login with forgot password
│   │   ├── onboarding/page.tsx     # 2-step practitioner onboarding
│   │   └── register/page.tsx       # Registration
│   ├── globals.css                 # Design system + CSS variables
│   ├── layout.tsx                  # Root layout (fonts via <link>)
│   └── page.tsx                    # Landing page (public)
├── components/
│   ├── chat/
│   │   ├── biomarker-range-bar.tsx # Dual-range biomarker visualization
│   │   ├── chat-input.tsx          # Input + Deep Consult tooltip + shortcuts
│   │   ├── chat-interface.tsx      # Main chat container
│   │   ├── evidence-badge.tsx      # Color-coded evidence level badges
│   │   └── message-bubble.tsx      # Markdown rendering + actions + rehype-sanitize
│   ├── dashboard/
│   │   └── dashboard-search.tsx    # Unified search across patients, visits, labs
│   ├── labs/
│   │   ├── lab-list-client.tsx     # Searchable/filterable lab list
│   │   ├── lab-report-card.tsx     # Lab report card for list view
│   │   ├── lab-report-detail.tsx   # Lab detail with biomarkers + PDF viewer
│   │   ├── lab-status-badge.tsx    # Lab status indicator
│   │   └── lab-upload.tsx          # Lab upload form with drag-and-drop
│   ├── landing/                    # 12 landing page components
│   ├── layout/
│   │   ├── sidebar.tsx             # Nav + gold accents + upgrade banner
│   │   └── sidebar-conversation.tsx # Conversation list management
│   ├── patients/
│   │   ├── document-list.tsx       # Unified document + lab report list
│   │   ├── document-upload.tsx     # Document upload form
│   │   ├── extraction-status-badge.tsx  # AI extraction status indicator
│   │   ├── patient-form.tsx        # Full patient create/edit form
│   │   ├── patient-list-client.tsx # Searchable patient list
│   │   ├── patient-profile.tsx     # Patient detail view
│   │   ├── patient-quick-create.tsx # Inline patient creation modal
│   │   └── pre-chart-view.tsx      # Pre-encounter patient summary
│   ├── ui/
│   │   ├── button.tsx              # Reusable button component (variants)
│   │   ├── dropdown-menu.tsx       # Radix UI dropdown menu
│   │   ├── input.tsx               # Reusable input component
│   │   ├── label.tsx               # Reusable label component
│   │   ├── logomark.tsx            # SVG logomark
│   │   ├── reset-countdown.tsx     # Query reset timer
│   │   └── sonner.tsx              # Toast notifications
│   └── visits/
│       ├── audio-recorder.tsx      # Audio recording component
│       ├── editor/
│       │   ├── dictation-bar.tsx       # Dictation + AI Scribe controls
│       │   ├── editor-toolbar.tsx      # Bold, italic, lists toolbar
│       │   ├── template-section-node.tsx # Collapsible section NodeView
│       │   └── visit-editor.tsx        # Main Tiptap editor wrapper
│       ├── ifm-node-modal.tsx      # IFM Matrix node editing modal
│       ├── visit-workspace.tsx     # Editor + generate + SOAP/IFM/Protocol tabs
│       ├── new-visit-form.tsx      # Patient + encounter type selector
│       ├── voice-input.tsx         # Voice input component
│       ├── soap-sections.tsx       # SOAP note display tabs
│       ├── ifm-matrix-view.tsx     # IFM Matrix visualization + inline editing + DnD
│       ├── protocol-panel.tsx      # Protocol recommendations panel
│       └── export-menu.tsx         # Visit export options
├── hooks/
│   ├── use-chat.ts                 # SSE streaming hook (chat)
│   ├── use-editor-dictation.ts     # Dictation + AI Scribe → editor bridge
│   ├── use-audio-recorder.ts       # MediaRecorder wrapper
│   ├── use-speech-recognition.ts   # Web Speech API wrapper
│   └── use-visit-stream.ts         # Visit generation SSE hook
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts            # Claude client + ANTHROPIC_MODELS constant
│   │   ├── provider.ts             # Multi-provider abstraction (OpenAI/Anthropic/MiniMax)
│   │   ├── scribe-prompts.ts       # AI Scribe section assignment prompt
│   │   ├── visit-prompts.ts        # SOAP/IFM/Protocol generation prompts
│   │   ├── transcription.ts        # OpenAI Whisper integration
│   │   ├── clinical-summary.ts     # Patient clinical summary generation
│   │   ├── document-extraction.ts  # Document content extraction
│   │   ├── document-extraction-prompts.ts  # Extraction prompt templates
│   │   ├── lab-parsing.ts          # Lab PDF parsing via Claude Vision
│   │   └── lab-parsing-prompts.ts  # Lab parsing prompt templates
│   ├── api/
│   │   └── csrf.ts                 # Shared CSRF validation utility
│   ├── editor/
│   │   └── template-section-extension.ts  # Custom Tiptap templateSection node
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
│   ├── utils.ts                    # cn() — Tailwind class merging utility
│   └── validations/
│       ├── chat.ts                 # Chat API schemas
│       ├── visit.ts                # Visit create/update/generate schemas
│       ├── patient.ts              # Patient create/update schemas
│       ├── document.ts             # Document upload/extraction schemas
│       └── lab.ts                  # Lab upload/list schemas
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase type definitions

supabase/migrations/
├── 001_initial_schema.sql          # 12 core tables + RLS + audit logging
├── 002_visits_status.sql           # visit_type, status, ai_protocol columns
├── 003_patient_documents.sql       # patient_documents table
└── 004_visit_template_content.sql  # template_content JSONB column
```

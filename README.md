# Apothecare

<p align="center">
  <strong>AI Clinical Decision Support for Functional & Integrative Medicine</strong>
</p>

<p align="center">
  Evidence-based clinical intelligence powered by AI — built for physicians, nurse practitioners, physician assistants, chiropractors, and naturopathic doctors who think differently about health.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#database-schema">Database</a> •
  <a href="#api-reference">API</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## The Problem

Functional medicine practitioners spend **30–60 minutes per complex patient case** cobbling together evidence from ChatGPT, PubMed, UpToDate, IFM toolkits, and supplement databases. There's no dedicated AI clinical decision support tool for this $90B (and growing) market.

**OpenEvidence** serves conventional medicine with a $3.5B valuation and 40% of US physicians. Apothecare is the functional medicine equivalent — purpose-built for practitioners who work with the IFM Matrix, interpret GI-MAPs alongside blood panels, and think in terms of root causes rather than symptom suppression.

## Features

### Evidence-Cited Clinical Chat
Ask clinical questions and get streaming responses grounded in functional medicine evidence from IFM, A4M, Cleveland Clinic Center for Functional Medicine, and peer-reviewed literature. Every citation is resolved to a real DOI via CrossRef and rendered with an inline **evidence quality badge** — `[META]`, `[RCT]`, `[GUIDELINE]`, `[COHORT]`, or `[CASE]` — color-coded by evidence level. Hovering any badge reveals a popover with paper title, authors, year, journal, and a direct "View source" DOI link.

### Multi-Modal Lab Interpretation
Upload blood panels, GI-MAPs, DUTCH tests, and OAT panels. Claude Vision parses lab PDFs, extracts biomarkers, and normalizes results against both **conventional and functional/optimal reference ranges** displayed side-by-side. Drag-and-drop upload with auto-detected vendor and test type. Lab reports linked to patients appear automatically in their Documents tab.

### Protocol Generation
AI-generated treatment protocols with supplement dosing, dietary interventions, lifestyle recommendations, and drug-supplement interaction checking — all backed by evidence citations. One-click branded PDF export for patients.

### Clinical Visits & AI Scribe
Full visit lifecycle with block-based editor. Four encounter templates (SOAP, H&P, Consultation, Follow-up) pre-populate collapsible sections. **AI Scribe** records provider-patient encounters, transcribes via OpenAI Whisper, then uses Claude to assign content to the appropriate template sections. Live dictation via Web Speech API inserts text at cursor. AI-generated SOAP notes, IFM Matrix mapping, and evidence-based protocols — all streamed via SSE.

### Supplement Intelligence
AI-powered supplement review evaluates each supplement in a patient's regimen with evidence-based recommendations — keep, modify, or discontinue — plus suggested additions. Supports **patient-linked** and **freeform** (no patient required) review modes. Practitioners can override AI action recommendations via clickable badge dropdowns before pushing results to the patient file. "Push to Patient File" maps review items to a structured `patient_supplements` record with full provenance tracking. Protocol tab on visit workspace can push AI-recommended protocol supplements with a single click. Built-in interaction checker flags drug-supplement and supplement-supplement interactions with severity-coded results (critical, caution, safe, unknown). Brand formulary lets practitioners set preferred brands that the AI prioritizes in recommendations. Fullscript integration coming soon.

### Patient Management
Create and manage patient profiles with comprehensive clinical data — demographics, medical history, medications, supplements, allergies, and chief complaints. Upload and extract clinical documents (lab reports, intake forms, referrals). Pre-chart view provides an AI-generated clinical summary before encounters. **8 tabs** per patient: Overview, Documents, Trends, Pre-Chart, IFM Matrix, Visits, Timeline, and FM Timeline.

### FM Health Timeline (ATM Framework)
Visual vertical timeline mapping Antecedents, Triggers, and Mediators across life stages (prenatal → adulthood) — the functional medicine root-cause analysis framework. Inline add/edit/delete with debounced auto-save. **AI Synthesize** button runs Claude analysis to identify patterns, root cause hypotheses, and recommended focus areas. Events from the regular patient Timeline can be pushed directly to the FM Timeline with one click.

### Patient Timeline & AI Synthesis
Chronological feed of all patient events — lab results, visits, supplement changes, document uploads — with cursor-based pagination, type filtering, and AI-powered timeline synthesis that identifies clinical patterns across the patient's history.

### Vitals & Pillars of Health Tracking
Track vital signs (weight, blood pressure, heart rate, temperature, SpO2) and lifestyle pillars (sleep, stress, exercise, diet quality) over time with Recharts visualizations. Trends tab provides both biomarker and vitals/pillars views.

### Evidence Knowledge Base & RAG Pipeline
PubMed-sourced evidence database with 39 curated seed queries across 11 functional medicine categories. Multi-query retrieval generates variant queries from different clinical angles (pathophysiology, diagnosis, treatment, FM perspective), searches independently, and merges results with relevance scoring. Analyze-then-synthesize pipeline reduces context window usage by scoring chunks before expensive synthesis. Admin UI at `/admin/evidence` provides stats dashboard, one-click seed button, and custom PubMed query ingestion.

### Deep Consult Mode
Toggle to use Claude Opus for complex multi-system cases, differential diagnoses, and cross-lab correlations. Extended 4096-token responses with advanced clinical reasoning.

### HIPAA Compliant from Day One
End-to-end encryption, Business Associate Agreements with all vendors, Row-Level Security on every table, comprehensive audit logging (IP + user agent), CSRF protection, and SOC 2 certification in progress.

### Dual-Range Biomarker Display
Every biomarker displayed with both conventional and functional/optimal ranges. Catch subclinical thyroid dysfunction, early insulin resistance, and methylation issues that conventional ranges miss. Pre-seeded with 17+ biomarker references from IFM and A4M guidelines.

## Target Practitioners

| Practitioner Type | NPI Eligible | Priority |
|---|---|---|
| MD / DO (functional/integrative) | Yes | Primary — highest LTV, credibility anchor |
| Nurse Practitioners (NP/APRN) | Yes | Primary — fast-growing, high usage |
| Physician Assistants (PA-C) | Yes | Secondary — high usage in group practices |
| Doctors of Chiropractic (DC) | Yes (Type 1) | Secondary — strong IFM/A4M presence |
| Naturopathic Doctors (ND) | Varies by state | Secondary — natural fit, high engagement |

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS v4 | App Router, RSC, streaming support |
| **Database** | Supabase Cloud (PostgreSQL + pgvector) | RLS, vector search for RAG, JSONB for flexible schemas |
| **Auth** | Supabase Auth | HIPAA BAA on Pro plan, RLS integration, MFA support |
| **AI** | Multi-provider (OpenAI + Anthropic + MiniMax) | OpenAI primary, Anthropic for vision/fallback, MiniMax fallback. HIPAA BAA with zero-retention |
| **Transcription** | OpenAI Whisper API | Audio transcription for AI Scribe and voice recording |
| **Lab Parsing** | Anthropic Claude Vision | PDF → biomarker extraction via vision API |
| **Editor** | Tiptap (ProseMirror) | Block-based editor with custom node extensions for template sections |
| **Validation** | Zod | Input validation on all API routes |
| **Icons** | Lucide React | Consistent icon system across all pages |
| **Fonts** | Newsreader + DM Sans + JetBrains Mono | Loaded via `<link>` preconnect (non-blocking) |
| **Hosting (prod)** | Vercel (dev) / AWS Amplify (prod) | Auto-deploy from main; Amplify for HIPAA BAA |

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- **Supabase project** — [supabase.com](https://supabase.com)

### Installation

```bash
git clone https://github.com/rajbrades/apothecare.git
cd apothecare
npm install
cp .env.example .env.local
# Edit .env.local with your values
```

### Database Setup

Run these in the Supabase SQL Editor:

```sql
-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Full schema (minus extension lines)
-- Copy contents of supabase/migrations/001_initial_schema.sql
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL (used for CSRF validation) | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application display name | Yes |
| `OPENAI_API_KEY` | OpenAI API key (Whisper transcription) | For AI Scribe |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For payments |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                    Next.js 15 + React 19                     │
│              Tailwind CSS v4 + Tiptap Block Editor           │
│              SSE streaming + keyboard shortcuts               │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐       ┌──────────────────────────────┐
│   Next.js API Routes │       │     Supabase Auth (JWT)      │
│                      │       │   Session management + MFA    │
│   /api/chat/stream   │       │   Row-Level Security tokens   │
│   /api/visits/       │       └──────────────────────────────┘
│   /api/patients/     │
│   (Zod validated)    │
│   (CSRF protected)   │
└──────────┬───────────┘
           │
     ┌─────┼──────────┐
     ▼     ▼          ▼
┌────────┐ ┌────────┐ ┌───────────────────────────────────────┐
│Anthropic│ │ OpenAI │ │            Supabase Cloud              │
│ Claude  │ │Whisper │ │  ┌───────────┐ ┌──────────┐ ┌──────┐ │
│ API     │ │ API    │ │  │PostgreSQL │ │ Storage  │ │ Auth │ │
│         │ │        │ │  │+ pgvector │ │(Docs/PDFs│ │      │ │
│ Sonnet  │ │ Audio  │ │  │+ RLS      │ │encrypted)│ │      │ │
│ Opus    │ │ → Text │ │  └───────────┘ └──────────┘ └──────┘ │
└─────────┘ └────────┘ └───────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full deep dive.

## Project Structure

```
src/
├── app/
│   ├── (app)/                       # Route group — shared authenticated layout
│   │   ├── chat/page.tsx            # Clinical chat
│   │   ├── dashboard/page.tsx       # Dashboard home
│   │   ├── supplements/
│   │   │   ├── page.tsx            # Supplements hub (reviews, interactions, brands)
│   │   │   └── review/[id]/page.tsx # Review detail
│   │   ├── labs/
│   │   │   ├── [id]/page.tsx       # Lab report detail (biomarkers, PDF)
│   │   │   └── page.tsx            # Lab list + upload
│   │   ├── patients/
│   │   │   ├── [id]/page.tsx       # Patient detail + documents + lab reports
│   │   │   ├── new/page.tsx        # New patient form
│   │   │   └── page.tsx            # Patient list
│   │   ├── visits/
│   │   │   ├── [id]/page.tsx       # Visit workspace (editor + AI)
│   │   │   ├── new/page.tsx        # New visit (patient + encounter type)
│   │   │   └── page.tsx            # Visit list
│   │   └── layout.tsx              # Shared app layout (sidebar + React cache)
│   ├── (admin)/admin/                 # Admin console (protected)
│   │   ├── evidence/               # Evidence DB management (seed, ingest, stats)
│   │   ├── partnerships/           # Partnership PDF management
│   │   ├── audits/                 # Audit log viewer
│   │   ├── users/                  # User management
│   │   └── jobs/                   # Job queue monitor
│   ├── api/
│   │   ├── admin/evidence/          # seed, ingest, stats endpoints
│   │   ├── chat/                    # stream, history, deprecated route
│   │   ├── supplements/             # review (SSE), reviews list, interactions (SSE), brands
│   │   ├── labs/                    # GET/POST list, GET detail, POST review (stub)
│   │   ├── patients/               # CRUD + documents + extraction
│   │   └── visits/                  # CRUD + generate + scribe + transcribe + export
│   ├── auth/                        # Login, register, onboarding, callback
│   └── page.tsx                     # Public landing page
├── components/
│   ├── chat/                        # Chat UI, biomarker bar, evidence badge
│   ├── dashboard/                   # Dashboard search
│   ├── supplements/                 # Review detail, interaction checker, brand formulary
│   ├── labs/                        # Lab list, card, detail, upload, status badge
│   ├── landing/                     # 12 landing page components
│   ├── layout/                      # Sidebar + conversation list
│   ├── patients/                    # Patient list, form, profile, documents, pre-chart, timeline, FM timeline, vitals
│   ├── ui/                          # Button, dropdown, input, label, logomark, sonner
│   └── visits/                      # Workspace, editor, IFM matrix, protocol, SOAP
├── hooks/                           # Chat, dictation, audio, speech, visit stream, supplements
├── lib/
│   ├── ai/                          # Provider abstraction, Claude, prompts, parsing
│   ├── api/                         # Shared CSRF, audit, rate-limit utilities
│   ├── evidence/                    # PubMed ingestion, multi-query retrieval, seed, analyze
│   ├── editor/                      # Tiptap template section extension
│   ├── labs/                        # Biomarker normalization, flag mapping
│   ├── templates/                   # 4 encounter templates + conversion
│   ├── storage/                     # Patient documents + lab reports storage
│   ├── supabase/                    # Client, server, middleware, cached queries
│   └── validations/                 # Zod schemas (chat, visit, patient, document, lab, supplement, fm-timeline, timeline)
├── middleware.ts                     # Root middleware
└── types/database.ts                # Supabase types
```

## Database Schema

20+ tables across 18 migrations with RLS on every table. See [`docs/DATABASE.md`](docs/DATABASE.md) for full documentation.

**Core:** practitioners, patients, conversations, messages
**Clinical:** visits, lab_results, biomarker_results, biomarker_references (17 seeded), patient_documents
**Supplements:** supplement_reviews, interaction_checks, practitioner_brand_preferences, patient_supplements
**Timeline:** timeline_events (polymorphic via source_table/source_id, auto-triggers for labs, visits, documents, supplements)
**FM Timeline:** patients.fm_timeline_data (JSONB — ATM events across life stages)
**Evidence:** evidence_documents, evidence_chunks (pgvector), supplement_evidence (curated citations)
**Partnerships:** partnerships, practitioner_partnerships
**System:** audit_logs, usage_tracking, practitioner_biomarker_ranges

## API Reference

See [`docs/API.md`](docs/API.md) for the complete reference.

### Key Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat/stream` | POST | SSE-streamed clinical chat with Claude |
| `/api/labs` | GET/POST | List labs / upload lab report PDF |
| `/api/labs/[id]` | GET | Lab report detail with biomarkers |
| `/api/patients` | GET/POST | List patients / create patient |
| `/api/patients/[id]` | GET/PATCH/DELETE | Get / update / archive patient |
| `/api/patients/[id]/documents` | GET/POST | List / upload patient documents |
| `/api/patients/[id]/documents/[docId]` | GET/DELETE | Get / delete document |
| `/api/patients/[id]/documents/[docId]/extract` | POST | AI document extraction |
| `/api/visits` | GET/POST | List visits / create visit |
| `/api/visits/[id]` | GET/PATCH | Get / update visit |
| `/api/visits/[id]/generate` | POST | SSE SOAP/IFM/Protocol generation |
| `/api/visits/[id]/transcribe` | POST | Audio → Whisper transcription |
| `/api/visits/[id]/scribe` | POST | AI Scribe (transcript → sections) |
| `/api/supplements/review` | POST | SSE supplement review generation (patient or freeform mode) |
| `/api/supplements/review/[id]` | GET | Supplement review detail |
| `/api/supplements/reviews` | GET | List supplement reviews |
| `/api/supplements/interactions` | POST | SSE interaction safety check |
| `/api/supplements/brands` | GET/PUT | Get / save brand preferences |
| `/api/patients/[id]/supplements` | GET/POST | List / add structured supplements |
| `/api/patients/[id]/supplements/[supId]` | PATCH/DELETE | Update / discontinue supplement |
| `/api/patients/[id]/supplements/push-review` | POST | Push supplement review → patient_supplements |
| `/api/patients/[id]/timeline` | GET | Patient timeline events (cursor-paginated) |
| `/api/patients/[id]/biomarkers/timeline` | GET | Biomarker history for Lab Trends chart |
| `/api/patients/[id]/ifm-matrix/merge` | POST | Merge visit IFM findings into patient matrix |
| `/api/patients/[id]/fm-timeline/events` | POST | Push event to FM Timeline (ATM framework) |
| `/api/patients/[id]/fm-timeline/analyze` | POST | AI root cause analysis of FM Timeline |
| `/api/patients/[id]/vitals` | GET/POST | List / record vital signs |
| `/api/visits/[id]/export` | POST | Export visit document |
| `/api/admin/evidence/seed` | POST | Run 39 curated PubMed seed queries |
| `/api/admin/evidence/ingest` | POST | Custom PubMed query ingestion |
| `/api/admin/evidence/stats` | GET | Evidence DB stats (docs, chunks, sources) |

All POST endpoints are Zod-validated, CSRF-protected, and audit-logged with IP + user agent.

## Design System

| Element | Value |
|---|---|
| **Primary** | Deep teal (`#0d9479`) |
| **Accent** | Warm gold (`#f59e0b`) |
| **Display font** | Newsreader (serif) |
| **Body font** | DM Sans (sans-serif) |
| **Mono font** | JetBrains Mono |
| **Sidebar** | 260px |

### Evidence Badge Colors
`meta-analysis` (amber/gold) · `rct` (blue) · `guideline` (green) · `cohort` (purple) · `case-study` (gray)

Badges appear inline next to each DOI-resolved citation. Scholar-fallback citations (unresolved) render as plain styled links — no badge degradation.

### Biomarker Traffic Light
Optimal (green) · Normal (blue) · Borderline (amber) · Out of Range (red) · Critical (dark red)

## Deployment

**Development:** Vercel auto-deploy from main branch.
**Production:** AWS Amplify (HIPAA-eligible under standard AWS BAA, $20–100/mo vs Vercel Enterprise $3K+/mo).

## Pricing

| | Free | Pro |
|---|---|---|
| **Price** | $0 | $89/month |
| Clinical queries | 2/day | Unlimited |
| Supplement reviews | 5/day | 50/day |
| Interaction checks | 10/day | 100/day |
| Evidence sources | PubMed only | All (A4M, IFM, premium) |
| Deep Consult | — | ✓ |
| Lab interpretation | — | ✓ |
| Visit documentation | — | ✓ |
| Protocol generation | — | ✓ |
| HIPAA BAA | — | ✓ |

## Roadmap

See [`TODO.md`](TODO.md) for the prioritized task list.

## License

Proprietary — All rights reserved.

---

<p align="center">
  <strong>Apothecare</strong> — The storehouse of remedies, reimagined for modern functional medicine.
</p>

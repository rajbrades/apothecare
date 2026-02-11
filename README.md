# Apotheca

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

**OpenEvidence** serves conventional medicine with a $3.5B valuation and 40% of US physicians. Apotheca is the functional medicine equivalent — purpose-built for practitioners who work with the IFM Matrix, interpret GI-MAPs alongside blood panels, and think in terms of root causes rather than symptom suppression.

## Features

### Evidence-Cited Clinical Chat
Ask clinical questions and get streaming responses grounded in functional medicine evidence from IFM, A4M, Cleveland Clinic Center for Functional Medicine, and peer-reviewed literature. Every claim is cited with evidence strength indicators (meta-analysis, RCT, clinical guideline, case study).

### Multi-Modal Lab Interpretation
Upload blood panels, GI-MAPs, DUTCH tests, and OAT panels. The AI parses, interprets, and correlates findings across all your labs — with both **conventional and functional/optimal reference ranges** displayed side-by-side. No other tool does this.

### Protocol Generation
AI-generated treatment protocols with supplement dosing, dietary interventions, lifestyle recommendations, and drug-supplement interaction checking — all backed by evidence citations. One-click branded PDF export for patients.

### Clinical Visits
Document visits with real-time evidence surfacing. Transcribe appointments, generate SOAP notes, and query the evidence base — all in one workflow. Built around the **IFM Matrix** as a navigable clinical framework.

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
| **AI** | Anthropic Claude API | Sonnet 4.5 (standard) + Opus 4.5 (deep consult). HIPAA BAA with zero-retention |
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
git clone https://github.com/rajbrades/apotheca.git
cd apotheca
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
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For payments |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                    Next.js 15 + React 19                     │
│              Tailwind CSS v4 + DM Sans + Newsreader          │
│              SSE streaming + keyboard shortcuts               │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐       ┌──────────────────────────────┐
│   Next.js API Routes │       │     Supabase Auth (JWT)      │
│   /api/chat/stream   │       │   Session management + MFA    │
│   /api/chat/history  │       │   Row-Level Security tokens   │
│   (Zod validated)    │       └──────────────────────────────┘
│   (CSRF protected)   │
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐  ┌────────────────────────────────────────────────┐
│ Anthropic│  │              Supabase Cloud                     │
│ Claude   │  │  ┌────────────┐  ┌───────────┐  ┌───────────┐ │
│ API      │  │  │ PostgreSQL │  │  Storage   │  │  Auth      │ │
│          │  │  │ + pgvector │  │ (Lab PDFs) │  │           │ │
│ Sonnet   │  │  │ + RLS      │  │ encrypted  │  │           │ │
│ Opus     │  │  └────────────┘  └───────────┘  └───────────┘ │
└──────────┘  └────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full deep dive.

## Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   ├── history/route.ts        # GET conversation messages
│   │   ├── route.ts                # DEPRECATED (410) — use /stream
│   │   └── stream/route.ts         # SSE streaming + Zod + CSRF
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth/email callback
│   │   ├── login/page.tsx          # Login + forgot password
│   │   ├── onboarding/page.tsx     # 2-step practitioner onboarding
│   │   └── register/page.tsx       # Registration
│   ├── chat/
│   │   ├── layout.tsx              # Chat layout (sidebar)
│   │   ├── loading.tsx             # Loading skeleton
│   │   └── page.tsx                # Chat page
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout (sidebar + trust banner)
│   │   ├── loading.tsx             # Loading skeleton
│   │   └── page.tsx                # Dashboard home
│   ├── globals.css                 # Design system variables
│   ├── layout.tsx                  # Root layout (fonts)
│   └── page.tsx                    # Public landing page
├── components/
│   ├── chat/
│   │   ├── chat-input.tsx          # Input + Deep Consult tooltip + shortcuts
│   │   ├── chat-interface.tsx      # Main chat container
│   │   └── message-bubble.tsx      # Markdown + rehype-sanitize + actions
│   └── layout/
│       └── sidebar.tsx             # Nav + gold accents + upgrade banner
├── hooks/
│   └── use-chat.ts                 # SSE streaming hook
├── lib/
│   ├── ai/anthropic.ts             # Claude client + system prompts
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Auth middleware
│   │   └── server.ts              # Server client + standalone service client
│   └── validations/
│       └── chat.ts                 # Zod schemas
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase types
```

## Database Schema

12 tables with RLS. See [`docs/DATABASE.md`](docs/DATABASE.md) for full documentation.

**Core:** practitioners, patients, conversations, messages
**Clinical:** visits, lab_results, biomarker_results, biomarker_references (17 seeded)
**Evidence:** evidence_sources, evidence_embeddings
**System:** audit_logs, usage_tracking

## API Reference

See [`docs/API.md`](docs/API.md) for the complete reference.

### Primary Endpoint

**`POST /api/chat/stream`** — Send a clinical query and receive SSE-streamed response.

Validated with Zod. Protected by CSRF origin checking. Audit-logged with IP + user agent.

```json
{
  "message": "Evidence-based interventions for elevated zonulin?",
  "conversation_id": "uuid (optional)",
  "patient_id": "uuid (optional)",
  "is_deep_consult": false
}
```

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
Meta-analysis (gold) · RCT (blue) · Clinical Guideline (green) · Cohort Study (purple) · Case Study (gray)

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
  <strong>Apotheca</strong> — The storehouse of remedies, reimagined for modern functional medicine.
</p>

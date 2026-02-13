# Architecture

## Overview

Apotheca is a Next.js 15 application using the App Router with React Server Components. It follows a hybrid architecture: Supabase Cloud handles auth, database, and file storage (all under one HIPAA BAA), while the Next.js application is deployed to Vercel (dev) or AWS Amplify (production, HIPAA-eligible). AI inference is handled by Anthropic's Claude API (separate HIPAA BAA with zero data retention).

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (Browser / Mobile)                    │
│                                                                  │
│  Next.js 15 App Router + React 19 Server Components             │
│  Tailwind CSS v4 (DM Sans + Newsreader + JetBrains Mono)       │
│  SSE streaming for chat · Keyboard shortcuts (⌘K, ⌘↵, Esc)    │
└────────────┬────────────────────────────────┬────────────────────┘
             │ HTTPS                          │ HTTPS
             ▼                                ▼
┌────────────────────────┐     ┌──────────────────────────────────┐
│  Next.js API Routes    │     │       Supabase Cloud (Pro)       │
│                        │     │                                   │
│  POST /api/chat/stream │     │  ┌─────────────┐ ┌────────────┐ │
│  GET  /api/chat/history│◄────┤  │  Auth (JWT) │ │  Storage   │ │
│                        │     │  │  + MFA      │ │  (Lab PDFs)│ │
│  Zod validated         │     │  │  + RLS      │ │  encrypted │ │
│  CSRF protected        │     │  └─────────────┘ └────────────┘ │
│  Audit logged (IP+UA)  │     │  ┌─────────────────────────────┐ │
│                        │     │  │    PostgreSQL 17 + pgvector  │ │
│                        │     │  │    Row-Level Security        │ │
└────────────┬───────────┘     │  │    12 tables + audit logs    │ │
             │                 │  │    17 seeded biomarkers       │ │
             ▼                 │  └─────────────────────────────┘ │
┌────────────────────────┐     │  HIPAA: Supabase Pro BAA         │
│   Anthropic Claude API │     └──────────────────────────────────┘
│                        │
│  Sonnet 4.5: standard  │     ┌──────────────────────────────────┐
│  Opus 4.5: deep consult│     │           Stripe                  │
│                        │     │   $89/mo Pro subscription         │
│  HIPAA: Zero-retention │     │   Webhook → /api/webhooks/stripe │
│  BAA available         │     └──────────────────────────────────┘
└────────────────────────┘
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

### Lab Interpretation Pipeline (Planned)

```
Stage 1: UPLOAD → Files encrypted in Supabase Storage
Stage 2: CLASSIFY → Claude Vision identifies lab vendor + test type
Stage 3: PARSE → Claude Vision + OCR extract biomarker values
Stage 4: NORMALIZE → Match to biomarker_references, apply dual ranges
Stage 5: INTERPRET → Per-biomarker clinical interpretation
Stage 6: CORRELATE → Cross-lab pattern analysis (multi-lab only)
Stage 7: VISUALIZE → Dual-range bars, traffic lights, trend charts
```

## Model Routing Strategy

| Query Type | Model | Max Tokens | Estimated Cost |
|---|---|---|---|
| Standard clinical question | Claude Sonnet 4.5 | 2,048 | $0.02–0.06 |
| Deep Consult (complex reasoning) | Claude Opus 4.5 | 4,096 | $0.08–0.15 |
| Lab interpretation (single) | Claude Sonnet 4.5 | 4,096 | $0.15–0.40 |
| Multi-lab correlation | Claude Opus 4.5 | 8,192 | $0.30–0.80 |
| SOAP note generation | Claude Sonnet 4.5 | 2,048 | $0.05–0.10 |

## Security Architecture

### Defense in Depth

```
Layer 1: Network     → TLS 1.3 everywhere
Layer 2: Auth        → Supabase JWT, MFA available, session refresh middleware
Layer 3: CSRF        → Origin header validation on all POST routes
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
│   │   ├── chat/
│   │   │   └── page.tsx            # Chat page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (trust banner)
│   │   │   └── page.tsx            # Dashboard home
│   │   ├── labs/
│   │   │   └── page.tsx            # Labs page (empty state)
│   │   ├── patients/
│   │   │   └── page.tsx            # Patients page (empty state)
│   │   ├── visits/
│   │   │   └── page.tsx            # Visits page (empty state)
│   │   └── layout.tsx              # Shared app layout (sidebar + React cache)
│   ├── api/chat/
│   │   ├── history/route.ts        # GET conversation messages + pagination
│   │   ├── route.ts                # DEPRECATED — returns 410
│   │   └── stream/route.ts         # SSE streaming chat endpoint
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
│   │   ├── chat-input.tsx          # Input bar + Deep Consult tooltip + keyboard shortcuts
│   │   ├── chat-interface.tsx      # Main chat container
│   │   └── message-bubble.tsx      # Markdown rendering + actions + rehype-sanitize
│   ├── clinical/
│   │   ├── biomarker-bar.tsx       # Dual-range bar visualization
│   │   └── evidence-badge.tsx      # Color-coded evidence level badges
│   ├── layout/
│   │   ├── logomark.tsx            # SVG logomark component
│   │   └── sidebar.tsx             # Elevated New Conversation + gold accents
│   └── ui/
│       └── empty-state.tsx         # Empty state pattern for labs/patients/visits
├── hooks/
│   └── use-chat.ts                 # SSE streaming hook
├── lib/
│   ├── ai/anthropic.ts             # Claude client + system prompt + models
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Auth middleware + route protection
│   │   └── server.ts              # Server client + standalone service client
│   ├── utils/
│   │   └── npi-validation.ts       # Luhn algorithm for NPI validation
│   └── validations/
│       ├── chat.ts                 # Zod schemas for chat API
│       └── env.ts                  # Environment variable validation
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase type definitions
```

# Apotheca — Project Summary & Handoff Document

**Last updated:** February 13, 2026
**Purpose:** Pick up development exactly where we left off.

---

## What Is Apotheca

Apotheca is an AI-powered clinical decision support platform for functional and integrative medicine practitioners. It provides evidence-cited chat (Claude-powered), multi-modal lab interpretation, protocol generation, and visit documentation — all grounded in functional medicine research from IFM, A4M, and peer-reviewed literature.

**Target users:** MDs, DOs, NPs, PAs, DCs, NDs practicing functional medicine.
**Business model:** Freemium — Free (2 queries/day) → Pro ($89/mo, unlimited).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15, TypeScript, App Router |
| Styling | Tailwind CSS 4, CSS custom properties |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Anthropic Claude API (Sonnet 4 standard, Opus for Deep Consult) |
| Deployment | Vercel (auto-deploy from main branch) |
| Fonts | Newsreader (display), DM Sans (body), JetBrains Mono (data) |
| Icons | Lucide React |

**Supabase Project:** https://qcjuosldesbgqkregztn.supabase.co
**Current Branch:** main-02-13-26
**Local dev:** `npm run dev` → http://localhost:3000

---

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
│   └── layout/
│       └── sidebar.tsx             # Elevated New Conversation + gold accents
├── hooks/
│   └── use-chat.ts                 # SSE streaming hook
├── lib/
│   ├── ai/anthropic.ts             # Claude client + system prompt + models
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── middleware.ts           # Auth middleware + route protection
│   │   └── server.ts              # Server client + standalone service client
│   └── validations/
│       └── chat.ts                 # Zod schemas for chat API
├── middleware.ts                    # Root middleware
└── types/database.ts               # Supabase type definitions
```

---

## Database Schema (12 tables, all with RLS)

**Core:** practitioners, patients, conversations, messages
**Clinical:** visits, lab_results, biomarker_results, biomarker_references (17 seeded)
**Evidence:** evidence_sources, evidence_embeddings
**System:** audit_logs, usage_tracking

**Key functions:** `check_and_increment_query()`, `reset_daily_queries()`, `search_evidence()`, `update_updated_at()`

**Migration:** Already executed in Supabase SQL Editor (001_initial_schema.sql).

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

---

## What Needs To Be Done Next

### P3 — Performance & Polish
- [ ] **ReactMarkdown streaming debounce** — Currently rebuilds full AST on every stream delta. Use simpler renderer during streaming, switch to ReactMarkdown on completion.
- [ ] **Page transition animations** — Framer Motion for route transitions
- [ ] **Dark mode** — Full theme toggle with system preference detection
- [ ] **Image optimization** — Next.js Image component for all landing page assets
- [ ] **Conversation pinning** — Allow pinning important conversations to sidebar top

### Lab Interpretation Pipeline (Sprint 3)
- [ ] **Lab upload endpoint** — Multipart form handling + Supabase Storage encryption
- [ ] **Claude Vision integration** — PDF parsing and vendor detection
- [ ] **Biomarker extraction** — OCR + normalization pipeline
- [ ] **Dual-range visualization** — Interactive charts with conventional + functional ranges
- [ ] **Multi-lab correlation** — Cross-lab pattern analysis with Opus

### Backlog
- OAuth providers (Google, Apple)
- Mobile responsive pass
- PWA support
- Analytics (PostHog)
- Accessibility audit (WCAG 2.1 AA)
- SEO + Open Graph images
- Rate limiting middleware
- Prompt injection detection

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Apotheca
```

⚠️ **Supabase Key Format Note:** When copying keys from Supabase dashboard, strip the `sb_publishable_` prefix from anon keys and the `sb_secret_` prefix from service role keys. The actual keys are the JWT strings that follow these prefixes.

---

## Known Issues / Gotchas

1. **Supabase uses `vector` not `pgvector`** for the extension name
2. **Service role key is new-format** (`sb_secret_...`) not JWT — use `createClient` from `@supabase/supabase-js`, not `createServerClient` from `@supabase/ssr`
3. **Evidence badge and biomarker components exist** but are not yet wired to Claude API responses. The next step is to update the system prompt to return structured citations and render them using the `<EvidenceBadge>` component.
4. **ReactMarkdown streaming performance** — Full AST rebuild on every token. Consider simpler renderer during streaming phase.
5. **Conversation management UI** is functional but could use optimistic updates for better UX.

---

## How To Resume Development

```bash
cd ~/Development/Apotheca
git pull
npm install
npm run dev
```

Then tell Claude: "Continue Apotheca development from the project summary. Next up: [specific task from TODO.md]"

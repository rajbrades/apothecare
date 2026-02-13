# Changelog

All notable changes to Apotheca will be documented in this file.

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

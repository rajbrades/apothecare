# Apotheca Codebase Review -- Consolidated Report

**Date**: 2026-02-14
**Reviewers**: 6 automated agents (Security, Performance, Test Coverage, Usability, UI Design, Graphic Design)

---

## Finding Counts by Review

| Review | Critical | High | Medium | Low | Good/Strengths |
|--------|----------|------|--------|-----|----------------|
| Security | 2 | 4 | 5 | 3 | 12 |
| Performance | 3 | 4 | 7 | 7 | -- |
| Test Coverage | -- | -- | -- | -- | 0% coverage |
| Usability | 2 | 14 | 19 | 8 | 10 |
| UI Design | 5 issues | 5 inconsistencies | 7 polish | -- | -- |
| Graphic Design | -- | -- | -- | -- | Detailed analysis |

---

## TOP 10 CROSS-CUTTING ISSUES (Action Priority)

### 1. No Mobile Sidebar (Usability CRITICAL + UI Design POLISH)
The 260px fixed sidebar has no hamburger/drawer. The entire authenticated app is unusable on mobile.
- Files: `src/app/(app)/layout.tsx`, `src/components/layout/sidebar.tsx`

### 2. ~~CSRF Protection Missing~~ (Security CRITICAL) — FIXED
~~Origin validation exists only on `/api/chat/stream`. All other 11+ mutating POST/PATCH/DELETE endpoints are unprotected.~~
- **Fixed:** Created shared `src/lib/api/csrf.ts` utility (`validateCsrf()`) and applied to all 13 mutating handlers across 11 route files.

### 3. No Rate Limiting on AI Endpoints (Security CRITICAL)
Only chat has a daily query limit. Visit generate (3 AI calls), scribe, transcribe, lab parsing, and document extraction have zero rate limits -- unbounded API cost exposure.

### 4. Full PDFs Loaded Into Memory as Base64 (Performance CRITICAL)
10MB PDFs become ~23MB in Node.js heap (buffer + base64). Under concurrent usage, this can OOM serverless functions.
- Files: `src/lib/ai/lab-parsing.ts`, `src/lib/ai/document-extraction.ts`

### 5. Zero Test Coverage (Test Coverage)
No test files, no test runner, no test infrastructure. 0% coverage across ~60 source files. The `calculateBiomarkerFlag()` function -- which determines clinical flags shown to practitioners -- is completely untested.
- Recommended: Install Vitest, write P0 tests for normalize-biomarkers, flag-mapping, validations, and sanitizeRedirectPath

### 6. Sequential AI Calls in Visit Generation (Performance CRITICAL)
3 sequential Anthropic calls (SOAP + IFM Matrix + Protocol) with 120s timeout. IFM Matrix and Protocol could be parallelized since both depend only on SOAP.
- File: `src/app/api/visits/[id]/generate/route.ts`

### 7. `select("*")` Over-Fetching (Performance HIGH)
10 instances of `select("*")` across API routes, including on the chat stream hot path. The `parsed_data` JSONB is fetched in the lab list endpoint unnecessarily.

### 8. 10 Hardcoded `bg-white` Instances (UI Design ISSUE)
Blocks dark mode readiness. Should be `bg-[var(--color-surface)]`.
- Files: biomarker-range-bar.tsx, evidence-badge.tsx, sidebar-conversation.tsx, input.tsx, dropdown-menu.tsx, sonner.tsx, chat/loading.tsx

### 9. Accessibility Gaps (Usability HIGH)
- No focus trapping in modals (patient-quick-create, deep consult popover)
- No `role="alert"` on error messages
- No ARIA tab roles on tab bars
- No skip-nav link
- Chat action bar invisible to keyboard users (`opacity-0 group-hover:opacity-100` with no focus trigger)
- `<label>` elements missing `htmlFor` in patient-form, lab-upload, document-upload

### 10. Fire-and-Forget AI Without Backpressure (Performance HIGH + Security)
Lab parsing and document extraction are fire-and-forget promises. On Vercel, these can be silently abandoned after HTTP response, leaving reports permanently stuck in "parsing" status.
- Fix: Use `waitUntil()`, a cron poller, or a job queue (Inngest/QStash)

---

## SECURITY

**Solid foundation** with consistent auth, ownership checks, Zod validation, audit logging, CSP headers, and XSS prevention.

### Findings

| # | Severity | Finding | File(s) |
|---|----------|---------|---------|
| S1 | ~~CRITICAL~~ FIXED | ~~CSRF protection only on chat stream; missing on 11+ mutating endpoints~~ Shared `validateCsrf()` applied to all 13 handlers | `src/lib/api/csrf.ts` + all POST/PATCH/DELETE routes |
| S2 | CRITICAL | No rate limiting on AI/file endpoints (unbounded API cost exposure) | generate, scribe, transcribe, labs POST, documents POST, extract POST |
| S3 | HIGH | SQL filter injection via unsanitized search params in ilike/or filters | `patients/route.ts:39`, `visits/route.ts:41`, `patients/page.tsx:31` |
| S4 | HIGH | No filename sanitization on file storage paths (path traversal risk) | `storage/lab-reports.ts:17`, `storage/patient-documents.ts:15` |
| S5 | HIGH | Error messages leak internal details to clients | `scribe/route.ts:174`, `transcribe/route.ts:125`, `visits/route.ts:95` |
| S6 | HIGH | Visit export endpoint (full PHI) has no audit log | `visits/[id]/export/route.ts` |
| S7 | MEDIUM | Scribe endpoint lacks Zod schema validation (no max length on transcript) | `visits/[id]/scribe/route.ts:58-61` |
| S8 | MEDIUM | READ operations on individual PHI records not audit logged | 6 GET endpoints |
| S9 | MEDIUM | Supabase error message leaked to client on visit creation | `visits/route.ts:95` |
| S10 | MEDIUM | Console.error may log PHI in cloud environments | 12 instances across API routes |
| S11 | MEDIUM | Service client singleton pattern (design awareness note) | `supabase/server.ts:41-51` |
| S12 | LOW | Chat history missing conversation ownership check | `chat/history/route.ts:34-38` |
| S13 | LOW | Stub review route missing auth check | `labs/[id]/review/route.ts:4` |
| S14 | LOW | Untyped Supabase clients reduce compile-time safety | `supabase/server.ts:6-7` |

### What's Working Well

- Consistent auth + ownership checks on all 17 API routes
- Comprehensive Zod validation schemas (5 files)
- File type + size limits on all uploads
- No hardcoded secrets; `.env` properly gitignored
- Env validation at boot time via instrumentation hook
- Comprehensive audit logging on all mutations
- CSP + HSTS + X-Frame-Options + full security headers
- Open redirect prevention in auth callback
- XSS prevention (rehype-sanitize, escapeHtml, no innerHTML/eval)
- Service client scoped to audit/storage/background ops
- Chat query rate limiting (daily quota)
- Soft-delete pattern for patients and visits

---

## PERFORMANCE

### Findings

| # | Severity | Finding | File(s) |
|---|----------|---------|---------|
| P1 | CRITICAL | PDF memory: buffer + base64 = 2.3x memory blow-up | `lab-parsing.ts:31-33`, `document-extraction.ts:28-29` |
| P2 | CRITICAL | 3 sequential AI calls in visit generate (120s timeout) | `visits/[id]/generate/route.ts:97-238` |
| P3 | CRITICAL | `select("*")` on chat stream (hottest path) | `chat/stream/route.ts:47` |
| P4 | HIGH | 10 `select("*")` instances across routes | Multiple API routes and cached-queries.ts |
| P5 | HIGH | Redundant auth + practitioner lookup on every API call (N+1) | All API route handlers |
| P6 | HIGH | Fire-and-forget AI without job queue or backpressure | `labs/route.ts:177`, `documents/route.ts:171` |
| P7 | HIGH | `parsed_data` JSONB included in lab list query | `labs/route.ts:38` |
| P8 | MEDIUM | 3s polling without backoff, max attempts, or visibility check | `lab-report-detail.tsx:133-149` |
| P9 | MEDIUM | Unbounded biomarker references fetch with `select("*")` | `normalize-biomarkers.ts:180-182` |
| P10 | MEDIUM | Chat history fetches up to 50 messages in one request | `use-chat.ts:5`, `chat/history/route.ts:39` |
| P11 | MEDIUM | Large system prompts on every chat message (no prompt caching) | `anthropic.ts`, `visit-prompts.ts`, `lab-parsing-prompts.ts` |
| P12 | MEDIUM | TipTap editor loaded eagerly (~150KB+) even on read-only visits | `visit-editor.tsx`, `visit-workspace.tsx:11` |
| P13 | MEDIUM | react-markdown + rehype-sanitize in client bundle (~40-60KB) | `message-bubble.tsx` |
| P14 | MEDIUM | Dashboard fetches ALL patients (no `.limit()`) | `dashboard/page.tsx:33-38` |
| P15 | LOW | Audit log writes are blocking (not fire-and-forget) | ~15 locations across API routes |
| P16 | LOW | No `Cache-Control` headers on list API responses | All GET list endpoints |
| P17 | LOW | No `unstable_cache` for cross-request sidebar caching | `cached-queries.ts` |
| P18 | LOW | Chat page is pure client component with no server prefetching | `chat/page.tsx` |
| P19 | LOW | ScrollReveal creates one IntersectionObserver per element | `scroll-reveal.tsx:36-43` |
| P20 | LOW | Unused `ai` package dependency | `package.json:24` |
| P21 | LOW | `stripe` package installed but potentially unused | `package.json:34` |

### Static vs. Dynamic Page Opportunities

| Page | Current | Recommendation |
|------|---------|---------------|
| `/` (landing) | Dynamic | Should be **static** -- purely marketing content |
| `/auth/login` | Dynamic | Could be **static** |
| `/auth/register` | Dynamic | Could be **static** |
| `/dashboard` | Dynamic | Must remain dynamic (user-specific) |

---

## TEST COVERAGE

### Current Status: ZERO

| Category | Status |
|---|---|
| Unit tests (*.test.ts, *.test.tsx) | **None** |
| Test runner (Jest/Vitest) | **Not installed** |
| E2E framework (Playwright/Cypress) | **Not installed** |
| `package.json` "test" script | **Missing** |
| CI test pipeline | **None** |

### Prioritized Test Plan

#### P0 -- MUST HAVE (Patient Safety & Security) -- 9 test files

| # | Test File | Target |
|---|-----------|--------|
| P0-1 | `tests/lib/labs/normalize-biomarkers.test.ts` | `calculateBiomarkerFlag()`, `calculateFlags()`, `matchBiomarkerReference()`, `normalizeCode()` |
| P0-2 | `tests/lib/labs/flag-mapping.test.ts` | `mapDbFlagToComponentFlag()`, `flagLabel()` |
| P0-3 | `tests/lib/validations/lab.test.ts` | `uploadLabSchema`, `labListQuerySchema` |
| P0-4 | `tests/lib/validations/patient.test.ts` | `createPatientSchema`, `updatePatientSchema` |
| P0-5 | `tests/lib/validations/visit.test.ts` | `createVisitSchema`, `updateVisitSchema`, `generateVisitSchema` |
| P0-6 | `tests/lib/validations/chat.test.ts` | `chatMessageSchema`, `chatHistoryQuerySchema` |
| P0-7 | `tests/lib/validations/document.test.ts` | `uploadDocumentSchema` |
| P0-8 | `tests/auth/sanitize-redirect.test.ts` | `sanitizeRedirectPath()` |
| P0-9 | `tests/middleware/update-session.test.ts` | Public/protected path routing |

#### P1 -- SHOULD HAVE (Core Business Logic) -- 10 test files

| # | Test File | Target |
|---|-----------|--------|
| P1-1 | `tests/lib/ai/lab-parsing.test.ts` | JSON extraction, status transitions, audit log |
| P1-2 | `tests/lib/ai/clinical-summary.test.ts` | Summary rebuild, deduplication |
| P1-3 | `tests/lib/templates/to-editor-content.test.ts` | Template conversion |
| P1-4 | `tests/lib/storage/paths.test.ts` | `buildLabStoragePath()`, `buildStoragePath()` |
| P1-5 | `tests/lib/env.test.ts` | Environment validation |
| P1-6 | `tests/api/labs/route.test.ts` | GET list, POST upload |
| P1-7 | `tests/api/visits/route.test.ts` | GET list, POST create |
| P1-8 | `tests/api/visits/[id]/route.test.ts` | Ownership, edit lock, soft delete |
| P1-9 | `tests/api/chat/stream/route.test.ts` | CSRF, auth, rate limit |
| P1-10 | `tests/api/chat/history/route.test.ts` | Auth, pagination, **authz gap proof** |

#### P2 -- NICE TO HAVE -- 10 test files

Covers remaining API routes and E2E flows (Playwright).

### AuthZ Gap Found

`src/app/api/chat/history/route.ts` (line 37): Messages query filters by `conversation_id` but does NOT verify that the conversation belongs to the authenticated practitioner. A user who knows another conversation ID could read those messages.

---

## USABILITY

### Severity Breakdown: 2 CRITICAL, 14 HIGH, 19 MEDIUM, 8 LOW

### Critical User Flow Issues

| # | Severity | Issue | File |
|---|----------|-------|------|
| U1 | CRITICAL | No mobile sidebar -- 260px fixed, no hamburger/drawer | `(app)/layout.tsx`, `sidebar.tsx` |
| U2 | CRITICAL | No `<nav>` landmark with `aria-label` wrapping sidebar navigation | `sidebar.tsx` |
| U3 | HIGH | No success toast/confirmation after lab upload -- form resets silently | `lab-upload.tsx:95-108` |
| U4 | HIGH | Upload section defaults to collapsed on empty labs page | `lab-upload.tsx:50` |
| U5 | HIGH | No retry button on chat errors -- user must retype | `chat-interface.tsx:186-202` |
| U6 | HIGH | Failed conversation history load shows no retry option | `use-chat.ts:221-222` |
| U7 | HIGH | No breadcrumbs anywhere -- back navigation loses context | `visit-workspace.tsx:206-212` |
| U8 | HIGH | Patient form has NO required field indicators -- empty records can be created | `patient-form.tsx:102-228` |
| U9 | HIGH | No focus trapping in modals (patient-quick-create, deep consult popover) | `patient-quick-create.tsx:85-238` |
| U10 | HIGH | Error messages lack `role="alert"` -- screen readers won't announce | All form pages |
| U11 | HIGH | Tab bars missing `role="tab"`, `aria-selected`, `role="tablist"` | `visit-workspace.tsx:338-353` |
| U12 | HIGH | Chat suggested questions grid `grid-cols-2` with no mobile fallback | `chat-interface.tsx:138` |
| U13 | HIGH | "Chat" tab in visit workspace is a dead end ("Coming in next update") | `visit-workspace.tsx:381-389` |
| U14 | HIGH | Dead links: `/settings` and `/pricing` routes don't exist | `sidebar.tsx:316-321, 286-288` |
| U15 | HIGH | Hover state bug on register/onboarding CTAs (hover = base color) | `register/page.tsx`, `onboarding/page.tsx` |
| U16 | HIGH | No inline validation on any form (server-side only) | Multiple files |
| U17 | MEDIUM | No regeneration confirmation -- overwrites edited SOAP notes | `visit-workspace.tsx:309-316` |
| U18 | MEDIUM | Auto-save has no error handling -- fails silently | `visit-workspace.tsx:153-166` |
| U19 | MEDIUM | "Dashboard" not in sidebar nav -- only accessible via logo click | `sidebar.tsx:36-40` |
| U20 | MEDIUM | Chat action bar invisible to keyboard users | `message-bubble.tsx:176-204` |
| U21 | MEDIUM | Biomarker status communicated by color alone (no icon/pattern alternative) | `globals.css:43-49` |
| U22 | MEDIUM | No loading.tsx for patients page | `src/app/(app)/patients/` |
| U23 | MEDIUM | Lab retry button just re-fetches state, doesn't re-trigger parsing | `lab-report-detail.tsx:152-165` |
| U24 | MEDIUM | Lab filter empty state has no "Clear filters" button | `lab-list-client.tsx:152-156` |
| U25 | MEDIUM | `<label>` elements missing `htmlFor` in patient-form, lab-upload | Multiple files |
| U26 | MEDIUM | State field on onboarding accepts free text (no US state validation) | `onboarding/page.tsx:213-220` |

### What's Working Well

- NPI validation with Luhn check and clear inline errors
- Lab status pipeline visualization with animated badges
- Chat streaming UX (thinking dots, streaming cursor, stop button, Esc shortcut)
- SOAP section streaming with per-section status indicators
- Skeleton loading screens on labs, visits, dashboard, chat
- `prefers-reduced-motion` support across all animations
- Optimistic UI updates on sidebar conversation rename/archive/delete
- Evidence partnerships banner and clinical disclaimer
- Functional medicine domain language throughout

---

## UI DESIGN

### Issues (needs attention)

| # | Finding | File(s) |
|---|---------|---------|
| D1 | 10 `bg-white` instances blocking dark mode readiness | biomarker-range-bar.tsx:250, evidence-badge.tsx:199/267, lab-report-detail.tsx:249, sidebar-conversation.tsx:133, input.tsx:13, dropdown-menu.tsx:48/66, sonner.tsx:14, chat/loading.tsx:4 |
| D2 | `border-white` on biomarker markers (2 instances) | biomarker-range-bar.tsx:178, 312 |
| D3 | WCAG contrast failure for 9-10px text with `--color-text-muted` (~2.5:1 ratio) | biomarker-range-bar.tsx, lab-status-badge.tsx, sidebar.tsx, chat-input.tsx |
| D4 | Invalid `border-l-3` class in message-bubble.tsx | message-bubble.tsx:146 |
| D5 | Stray `dark:` prefix in button.tsx (wrong dark mode approach) | button.tsx:13 |

### Inconsistencies (should fix)

| # | Finding |
|---|---------|
| D6 | ~40 instances of raw Tailwind status colors instead of design tokens (`text-red-700 bg-red-50`, etc.) |
| D7 | Border radius mixing CSS tokens (`rounded-[var(--radius-md)]`) and Tailwind defaults (`rounded-lg`) |
| D8 | Icon sizing split across 3 patterns: CSS classes, Tailwind w/h, Lucide `size` prop |
| D9 | Max-width values inconsistent across page shells (2xl, 3xl, 4xl, 5xl, custom 720px) |
| D10 | `strokeWidth` inconsistency -- Plus icon at 2 while other feature icons at 1.5 |

### Polish (nice to have)

| # | Finding |
|---|---------|
| D11 | Markdown heading scale too flat -- h3 at `text-sm` (14px) smaller than body at `text-[15px]` |
| D12 | No responsive sidebar -- fixed 260px width, no mobile collapse |
| D13 | Loading skeleton to content transition -- no crossfade |
| D14 | Redundant ternary in biomarker-range-bar.tsx lines 159-160 |
| D15 | Gold color semantic ambiguity -- premium, deep consult, and follow-up all use gold |
| D16 | Content width tokens -- `max-w-[720px]` diverges from Tailwind scale |
| D17 | `VENDOR_LABELS` duplicated between lab-report-detail.tsx and lab-report-card.tsx |

### Strengths

- Comprehensive animation system with consistent easing (`cubic-bezier(0.16, 1, 0.3, 1)`)
- `prefers-reduced-motion` properly handled across all animations
- Shadow progression (`card` -> `elevated` -> `modal`) creates clear depth hierarchy
- Chat input glow animation and Deep Consult toggle are polished
- Good card hover patterns consistent across lab and visit cards

---

## GRAPHIC DESIGN

### Brand Identity

**Logomark**: Well-engineered component with 5 size presets and `withText` variant. However, the SVG is a plain circle with "A" -- reads as a placeholder, not a finished identity. The file header describes a "mortar/pestle bowl with leaf motif" that doesn't exist in the SVG.

**Trust Logos**: Partner names (PubMed, IFM, A4M, Cleveland Clinic, Cochrane) rendered as styled text at 60% opacity with a TODO comment acknowledging they need real SVGs.

### Color Palette

**Primary (Deep Teal)**: Excellent healthcare choice. 11-stop scale from `#f0fdf9` to `#042f28`. Sits at the intersection of blue (trust) and green (wellness). Avoids the overused blue-and-white healthcare cliche.

**Accent (Warm Gold)**: Premium pairing with teal. Reserved for Deep Consult mode and upgrade CTAs, creating clear semantic hierarchy.

**Biomarker Traffic Light**: 5-level severity scale (optimal/normal/borderline/out-of-range/critical) maps directly to practitioner mental models. The "normal" vs "optimal" distinction is a smart functional-medicine-specific choice.

**Evidence Levels**: 5-color/5-icon taxonomy (meta-analysis amber, RCT blue, guideline green, cohort purple, case study gray) is product-defining visual vocabulary.

**Neutral Surfaces**: Teal-undertoned grays (`#f8fafb`, `#f1f5f4`) create warmth and cohesion, preventing the "cold hospital" feeling.

### Typography

**Newsreader** (serif display): Superb choice for medical authority. Large optical size range (6-72pt) gives crisp legibility at all sizes.

**DM Sans** (sans body): Clean, geometric, variable optical sizing. Good contrast with Newsreader without clash.

**JetBrains Mono** (data): Used for lab values, dosing, pricing, query counters. Gives numerical data a "data readout" quality.

### Data Visualization

**Biomarker Range Bar**: The dual-range overlay (conventional vs. functional) is the product's visual signature. Rich micro-interactions with staggered entrance, pop-in markers, and trend indicators.

Weakness: Range calculation produces disproportionate bars for extreme outliers (e.g., TPO Ab 85 on a 0-34 scale). A logarithmic or adaptive scale would better serve these cases.

### What Needs Work

1. Commission custom logomark SVG incorporating the mortar-and-leaf concept
2. Replace text trust logos with actual partner SVG logos
3. Reconcile evidence badge colors (hardcoded in component vs. CSS variables)
4. Define formal type scale tokens in CSS custom properties
5. Add pattern fills or shape variations to biomarker bars for colorblind accessibility

---

## RECOMMENDED PRIORITY ORDER

### Sprint 1 (Immediate)
1. ~~CSRF protection~~ — DONE (shared `validateCsrf()` on all mutating endpoints)
2. Rate limiting on AI endpoints
3. Fix `select("*")` on hot paths
4. Remove `parsed_data` from lab list query
5. Install Vitest + write P0 biomarker/validation tests

### Sprint 2
6. Parallelize visit generation AI calls
7. Mobile sidebar drawer
8. Job queue for AI processing (replace fire-and-forget)
9. Success toast on uploads + retry buttons on errors
10. Replace `bg-white` with `bg-[var(--color-surface)]`

### Sprint 3
11. Filename sanitization on storage paths
12. Search parameter escaping for PostgREST
13. Accessibility pass (ARIA roles, focus trapping, label associations)
14. Lazy-load TipTap editor
15. Add audit logging for PHI reads + export

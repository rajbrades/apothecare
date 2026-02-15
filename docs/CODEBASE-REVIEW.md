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

### 1. ~~No Mobile Sidebar~~ (Usability CRITICAL + UI Design POLISH) — ALREADY IMPLEMENTED
~~The 260px fixed sidebar has no hamburger/drawer. The entire authenticated app is unusable on mobile.~~
- **Status:** Sidebar already has full mobile drawer support: hamburger menu, slide-in with `-translate-x-full` → `translate-x-0`, backdrop overlay, close button, auto-close on route change via `usePathname()`.
- Files: `src/components/layout/sidebar.tsx`, `src/app/(app)/layout.tsx`

### 2. ~~CSRF Protection Missing~~ (Security CRITICAL) — FIXED
~~Origin validation exists only on `/api/chat/stream`. All other 11+ mutating POST/PATCH/DELETE endpoints are unprotected.~~
- **Fixed:** Created shared `src/lib/api/csrf.ts` utility (`validateCsrf()`) and applied to all 13 mutating handlers across 11 route files.

### 3. ~~No Rate Limiting on AI Endpoints~~ (Security CRITICAL) — FIXED
~~Only chat has a daily query limit. Visit generate, scribe, transcribe, lab parsing, and document extraction have zero rate limits.~~
- **Fixed:** Created dedicated `rate_limits` table + generic `check_rate_limit` RPC with atomic `SELECT FOR UPDATE` locking. Shared `checkRateLimit()` utility (`src/lib/api/rate-limit.ts`) applied to all 5 AI endpoints with per-action, tier-aware daily limits (e.g., visit_generate: 5/day free, 100/day pro). Chat retains its own `check_and_increment_query` system.

### 4. Full PDFs Loaded Into Memory as Base64 (Performance CRITICAL)
10MB PDFs become ~23MB in Node.js heap (buffer + base64). Under concurrent usage, this can OOM serverless functions.
- Files: `src/lib/ai/lab-parsing.ts`, `src/lib/ai/document-extraction.ts`

### 5. ~~Zero Test Coverage~~ (Test Coverage) — FIXED
~~No test files, no test runner, no test infrastructure. 0% coverage across ~60 source files.~~
- **Fixed:** Installed Vitest + 8 test files with 96 tests covering: `calculateBiomarkerFlag`, `calculateFlags`, `matchBiomarkerReference` (P0 clinical logic), all 5 validation schemas (chat, patient, visit, lab, document), `validateCsrf`, and `sanitizeRedirectPath`.

### 6. ~~Sequential AI Calls in Visit Generation~~ (Performance CRITICAL) — FIXED
~~3 sequential Anthropic calls (SOAP + IFM Matrix + Protocol) with 120s timeout. IFM Matrix and Protocol could be parallelized since both depend only on SOAP.~~
- **Fixed:** IFM Matrix and Protocol now run in parallel via `Promise.all` after SOAP completes. File: `src/app/api/visits/[id]/generate/route.ts`

### 7. ~~`select("*")` Over-Fetching~~ (Performance HIGH) — FIXED
~~10 instances of `select("*")` across API routes, including on the chat stream hot path.~~
- **Fixed:** Replaced all 10 `select("*")` with explicit column lists: practitioner cache (excluded stripe/license fields), chat stream patient (7 clinical fields only), patient detail pages, lab report detail (excluded `parsed_data` JSONB), biomarker results, biomarker references (slim Pick type), and document detail.

### 8. ~~10 Hardcoded `bg-white` Instances~~ (UI Design ISSUE) — FIXED
~~Blocks dark mode readiness. Should be `bg-[var(--color-surface)]`.~~
- **Fixed:** Replaced all 16 `bg-white` instances with `bg-[var(--color-surface)]` across 10 files. One intentional instance in `final-cta.tsx` (white button on dark background) left as-is.

### 9. ~~Accessibility Gaps~~ (Usability HIGH) — FIXED
~~- No focus trapping in modals (patient-quick-create, deep consult popover)~~
~~- No `role="alert"` on error messages~~
~~- No ARIA tab roles on tab bars~~
~~- No skip-nav link~~
~~- Chat action bar invisible to keyboard users (`opacity-0 group-hover:opacity-100` with no focus trigger)~~
~~- `<label>` elements missing `htmlFor` in patient-form, lab-upload, document-upload~~
- **Fixed:** `useFocusTrap` hook applied to modals; `role="alert"` on 5 error divs; `role="tablist"`/`role="tab"`/`aria-selected` on visit tabs; `htmlFor`/`id` on ~22 fields; skip-nav link; `focus-within:opacity-100` on chat action bar

### 10. ~~Fire-and-Forget AI Without Backpressure~~ (Performance HIGH + Security) — MITIGATED
~~Lab parsing and document extraction are fire-and-forget promises. On Vercel, these can be silently abandoned after HTTP response, leaving reports permanently stuck in "parsing" status.~~
- **Mitigated:** Added lab re-parse endpoint (`POST /api/labs/[id]/reparse`), fixed lab retry button to call it (was just refetching), and added stuck job cleanup endpoint (`GET /api/admin/cleanup-stuck-jobs`) that marks jobs stuck >15min as error with retry messaging. Full job queue (Inngest/QStash) deferred to Sprint 3+.

---

## SECURITY

**Solid foundation** with consistent auth, ownership checks, Zod validation, audit logging, CSP headers, and XSS prevention.

### Findings

| # | Severity | Finding | File(s) |
|---|----------|---------|---------|
| S1 | ~~CRITICAL~~ FIXED | ~~CSRF protection only on chat stream; missing on 11+ mutating endpoints~~ Shared `validateCsrf()` applied to all 13 handlers | `src/lib/api/csrf.ts` + all POST/PATCH/DELETE routes |
| S2 | ~~CRITICAL~~ FIXED | ~~No rate limiting on AI/file endpoints (unbounded API cost exposure)~~ Dedicated `rate_limits` table + `checkRateLimit()` on all 5 AI endpoints | `src/lib/api/rate-limit.ts` + generate, scribe, transcribe, labs POST, extract POST |
| S3 | ~~HIGH~~ FIXED | ~~SQL filter injection via unsanitized search params in ilike/or filters~~ `escapePostgrestPattern()` applied to all search inputs | `src/lib/search.ts` + `patients/route.ts`, `visits/route.ts`, `patients/page.tsx` |
| S4 | ~~HIGH~~ FIXED | ~~No filename sanitization on file storage paths (path traversal risk)~~ `sanitizeFilename()` applied to all storage paths and DB inserts | `src/lib/sanitize.ts` + `storage/lab-reports.ts`, `storage/patient-documents.ts`, upload routes |
| S5 | ~~HIGH~~ FIXED | ~~Error messages leak internal details to clients~~ Replaced `error.message` passthrough with static error strings | `scribe/route.ts`, `transcribe/route.ts`, `visits/route.ts` |
| S6 | ~~HIGH~~ FIXED | ~~Visit export endpoint (full PHI) has no audit log~~ Added `action: "export"` audit log | `visits/[id]/export/route.ts` |
| S7 | ~~MEDIUM~~ FIXED | ~~Scribe endpoint lacks Zod schema validation (no max length on transcript)~~ Added `scribeSchema` with 100K char max | `validations/visit.ts`, `visits/[id]/scribe/route.ts` |
| S8 | ~~MEDIUM~~ FIXED | ~~READ operations on individual PHI records not audit logged~~ Fire-and-forget `auditLog()` on all 10 GET endpoints | `src/lib/api/audit.ts` + all GET routes |
| S9 | ~~MEDIUM~~ FIXED | ~~Supabase error message leaked to client on visit creation~~ Replaced with static "Failed to create visit" | `visits/route.ts` |
| S10 | MEDIUM | Console.error may log PHI in cloud environments | 12 instances across API routes |
| S11 | MEDIUM | Service client singleton pattern (design awareness note) | `supabase/server.ts:41-51` |
| S12 | ~~LOW~~ FIXED | ~~Chat history missing conversation ownership check~~ Added `practitioner_id` verification on conversations table | `chat/history/route.ts` |
| S13 | ~~LOW~~ FIXED | ~~Stub review route missing auth check~~ Added CSRF validation + auth check | `labs/[id]/review/route.ts` |
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
| P2 | ~~CRITICAL~~ FIXED | ~~3 sequential AI calls in visit generate (120s timeout)~~ IFM Matrix + Protocol parallelized via `Promise.all` | `visits/[id]/generate/route.ts` |
| P3 | CRITICAL | `select("*")` on chat stream (hottest path) | `chat/stream/route.ts:47` |
| P4 | HIGH | 10 `select("*")` instances across routes | Multiple API routes and cached-queries.ts |
| P5 | HIGH | Redundant auth + practitioner lookup on every API call (N+1) | All API route handlers |
| P6 | ~~HIGH~~ MITIGATED | ~~Fire-and-forget AI without job queue~~ Added reparse endpoint, fixed retry button, added stuck job cleanup cron | `labs/[id]/reparse/route.ts`, `admin/cleanup-stuck-jobs/route.ts` |
| P7 | ~~HIGH~~ FIXED | ~~`parsed_data` JSONB included in lab list query~~ Removed from select | `labs/route.ts` |
| P8 | ~~MEDIUM~~ FIXED | ~~3s polling without backoff, max attempts, or visibility check~~ setTimeout-based with exponential backoff (3s→15s max) + `document.hidden` skip | `lab-report-detail.tsx` |
| P9 | MEDIUM | Unbounded biomarker references fetch with `select("*")` | `normalize-biomarkers.ts:180-182` |
| P10 | MEDIUM | Chat history fetches up to 50 messages in one request | `use-chat.ts:5`, `chat/history/route.ts:39` |
| P11 | MEDIUM | Large system prompts on every chat message (no prompt caching) | `anthropic.ts`, `visit-prompts.ts`, `lab-parsing-prompts.ts` |
| P12 | ~~MEDIUM~~ FIXED | ~~TipTap editor loaded eagerly (~150KB+) even on read-only visits~~ Lazy-loaded via `next/dynamic` with `ssr: false` | `visit-workspace.tsx` |
| P13 | MEDIUM | react-markdown + rehype-sanitize in client bundle (~40-60KB) | `message-bubble.tsx` |
| P14 | ~~MEDIUM~~ FIXED | ~~Dashboard fetches ALL patients (no `.limit()`)~~ Added `.limit(500)` to all 3 patient dropdown queries | `dashboard/page.tsx`, `labs/page.tsx`, `visits/new/page.tsx` |
| P15 | ~~LOW~~ FIXED | ~~Audit log writes are blocking (not fire-and-forget)~~ Converted 13 route files to shared `auditLog()` helper; 2 lib files use `.then().catch()` pattern | All mutating API routes + `document-extraction.ts`, `lab-parsing.ts` |
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

### Current Status: 113 Tests Passing (Vitest)

| Category | Status |
|---|---|
| Unit tests (*.test.ts) | **10 files, 113 tests** |
| Test runner | **Vitest v4.0** |
| E2E framework (Playwright/Cypress) | Not installed |
| `package.json` "test" script | `vitest run` |
| CI test pipeline | None |

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
| U1 | ~~CRITICAL~~ DONE | ~~No mobile sidebar~~ Already implemented: hamburger, slide-in drawer, backdrop, auto-close on route change | `sidebar.tsx` |
| U2 | ~~CRITICAL~~ DONE | ~~No `<nav>` landmark with `aria-label` wrapping sidebar navigation~~ Already present in sidebar.tsx (line 190) | `sidebar.tsx` |
| U3 | ~~HIGH~~ FIXED | ~~No success toast after lab upload~~ Added sonner toasts to lab upload, document upload, and re-extract | `lab-upload.tsx`, `document-upload.tsx`, `document-list.tsx` |
| U4 | HIGH | Upload section defaults to collapsed on empty labs page | `lab-upload.tsx:50` |
| U5 | ~~HIGH~~ FIXED | ~~No retry button on chat errors -- user must retype~~ Added retry button with `RotateCcw` icon + `lastFailedContentRef` tracking | `chat-interface.tsx`, `use-chat.ts` |
| U6 | ~~HIGH~~ FIXED | ~~Failed conversation history load shows no retry option~~ Added `retryLoadHistory()` + `failedConvIdRef` tracking | `use-chat.ts`, `chat-interface.tsx` |
| U7 | HIGH | No breadcrumbs anywhere -- back navigation loses context | `visit-workspace.tsx:206-212` |
| U8 | ~~HIGH~~ FIXED | ~~Patient form has NO required field indicators -- empty records can be created~~ Added red asterisk to First/Last Name labels + `required` attribute on inputs | `patient-form.tsx` |
| U9 | ~~HIGH~~ FIXED | ~~No focus trapping in modals~~ `useFocusTrap` hook applied to patient-quick-create + ifm-node-modal | `patient-quick-create.tsx`, `ifm-node-modal.tsx` |
| U10 | ~~HIGH~~ FIXED | ~~Error messages lack `role="alert"`~~ Added to 5 error divs | All form pages |
| U11 | ~~HIGH~~ FIXED | ~~Tab bars missing `role="tab"`, `aria-selected`, `role="tablist"`~~ Full ARIA tab pattern | `visit-workspace.tsx` |
| U12 | HIGH | Chat suggested questions grid `grid-cols-2` with no mobile fallback | `chat-interface.tsx:138` |
| U13 | HIGH | "Chat" tab in visit workspace is a dead end ("Coming in next update") | `visit-workspace.tsx:381-389` |
| U14 | ~~HIGH~~ FIXED | ~~Dead links: `/settings` and `/pricing` routes don't exist~~ Replaced with buttons + toast notifications | `sidebar.tsx` |
| U15 | ~~HIGH~~ FIXED | ~~Hover state bug on register/onboarding CTAs (hover = base color)~~ Changed `hover:bg-[var(--color-brand-700)]` to `hover:bg-[var(--color-brand-800)]` | `register/page.tsx`, `onboarding/page.tsx` |
| U16 | HIGH | No inline validation on any form (server-side only) | Multiple files |
| U17 | MEDIUM | No regeneration confirmation -- overwrites edited SOAP notes | `visit-workspace.tsx:309-316` |
| U18 | MEDIUM | Auto-save has no error handling -- fails silently | `visit-workspace.tsx:153-166` |
| U19 | ~~MEDIUM~~ FIXED | ~~"Dashboard" not in sidebar nav -- only accessible via logo click~~ Added as first item in `navItems` array | `sidebar.tsx` |
| U20 | ~~MEDIUM~~ FIXED | ~~Chat action bar invisible to keyboard users~~ Added `focus-within:opacity-100` | `message-bubble.tsx` |
| U21 | MEDIUM | Biomarker status communicated by color alone (no icon/pattern alternative) | `globals.css:43-49` |
| U22 | ~~MEDIUM~~ FIXED | ~~No loading.tsx for patients page~~ Added loading skeleton with shimmer cards | `src/app/(app)/patients/loading.tsx` |
| U23 | ~~MEDIUM~~ FIXED | ~~Lab retry button just re-fetches state~~ Now calls `POST /api/labs/[id]/reparse` + shows toast + polls | `lab-report-detail.tsx` |
| U24 | MEDIUM | Lab filter empty state has no "Clear filters" button | `lab-list-client.tsx:152-156` |
| U25 | ~~MEDIUM~~ FIXED | ~~`<label>` elements missing `htmlFor`~~ Added `htmlFor`/`id` to ~22 fields across 4 components | `patient-form.tsx`, `patient-quick-create.tsx`, `lab-upload.tsx`, `document-upload.tsx` |
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
| D1 | ~~10 `bg-white` instances~~ FIXED — All 16 replaced with `bg-[var(--color-surface)]` (1 intentional instance in final-cta.tsx kept) | 10 files |
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
| D12 | ~~No responsive sidebar~~ Already implemented (mobile hamburger + slide-in drawer) |
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
2. ~~Rate limiting on AI endpoints~~ — DONE (dedicated `rate_limits` table + `checkRateLimit()` on all 5 AI endpoints)
3. ~~Fix `select("*")` on hot paths~~ — DONE (all 10 instances replaced with explicit columns)
4. ~~Remove `parsed_data` from lab list query~~ — DONE
5. ~~Install Vitest + write P0 biomarker/validation tests~~ — DONE (8 test files, 96 tests)

### Sprint 2
6. ~~Parallelize visit generation AI calls~~ — DONE (IFM Matrix + Protocol via `Promise.all`)
7. ~~Mobile sidebar drawer~~ — ALREADY IMPLEMENTED (hamburger, slide-in, backdrop, auto-close)
8. ~~Job queue for AI processing~~ — MITIGATED (reparse endpoint, fixed retry button, stuck job cleanup cron)
9. ~~Success toast on uploads + retry buttons on errors~~ — DONE (sonner toasts on document upload, lab upload, re-extract, lab retry)
10. ~~Replace `bg-white` with `bg-[var(--color-surface)]`~~ — DONE (16 instances across 10 files)

### Sprint 3
11. ~~Filename sanitization on storage paths~~ — DONE (shared `sanitizeFilename()` in `src/lib/sanitize.ts` applied to `buildStoragePath()`, `buildLabStoragePath()`, and DB inserts; 11 tests)
12. ~~Search parameter escaping for PostgREST~~ — DONE (shared `escapePostgrestPattern()` in `src/lib/search.ts` escaping `%`, `_`, `\`; applied to patients list, visits list, patients page; 6 tests)
13. ~~Accessibility pass (ARIA roles, focus trapping, label associations)~~ — DONE (focus trapping via `useFocusTrap` hook in patient-quick-create + ifm-node-modal; `role="alert"` on 5 error divs; `role="tablist"`/`role="tab"`/`aria-selected` on visit tabs; `htmlFor`/`id` on ~22 form fields; skip-nav link in layout; `focus-within:opacity-100` on chat action bar)
14. ~~Lazy-load TipTap editor~~ — DONE (`next/dynamic` with `ssr: false` + loading skeleton in visit-workspace.tsx)
15. ~~Add audit logging for PHI reads + export~~ — DONE (shared `auditLog()` fire-and-forget helper in `src/lib/api/audit.ts`; read audit logs on all 10 GET endpoints; `action: "export"` on visit export route)

### Sprint 4
16. ~~Chat retry on errors (U5+U6)~~ — DONE (`retry()` + `retryLoadHistory()` in `use-chat.ts`; retry button with error-type routing in `chat-interface.tsx`)
17. ~~Scrub leaked error messages (S5+S9)~~ — DONE (replaced `error.message` passthrough with static strings in scribe, transcribe, visits POST)
18. ~~Scribe Zod schema (S7)~~ — DONE (`scribeSchema` with 100K char max in `validations/visit.ts`; applied in scribe route)
19. ~~Chat history ownership check (S12)~~ — DONE (verify `conversation.practitioner_id` before returning messages)
20. ~~Stub review auth (S13)~~ — DONE (added CSRF + auth check to `labs/[id]/review/route.ts`)
21. ~~Convert blocking audit writes to fire-and-forget (P15)~~ — DONE (13 route files converted to shared `auditLog()` helper; 2 lib files use `.then().catch()` pattern)
22. ~~Add `.limit(500)` to unbounded patient dropdown queries (P14)~~ — DONE (dashboard, labs, visits/new)
23. ~~Lab polling backoff + visibility check (P8)~~ — DONE (setTimeout-based with exponential backoff 3s→15s max + `document.hidden` skip)
24. ~~Sidebar `<nav>` landmark (U2)~~ — ALREADY PRESENT (sidebar.tsx line 190)
25. ~~Dashboard in sidebar nav (U19)~~ — DONE (added as first navItem)
26. ~~Remove dead sidebar links (U14)~~ — DONE (replaced `/settings` and `/pricing` links with buttons + toast notifications)
27. ~~Required field indicators on patient form (U8)~~ — DONE (red asterisk on First/Last Name labels + `required` attribute on inputs)
28. ~~Hover state bug on register/onboarding CTAs (U15)~~ — DONE (changed `hover:bg-[var(--color-brand-700)]` to `hover:bg-[var(--color-brand-800)]`)
29. ~~Add loading.tsx for patients page (U22)~~ — DONE (shimmer skeleton matching visits/labs pattern)

### Sprint 5
30. ~~Breadcrumbs~~ — DONE
31. ~~Inline validation~~ — DONE
32. ~~UX polish~~ — DONE

### Sprint 6 — Supplement Intelligence Module
33. ~~Database migration (006_supplements.sql)~~ — DONE (3 enums: supplement_review_status, interaction_severity, supplement_action; 3 tables: supplement_reviews, interaction_checks, practitioner_brand_preferences; all with RLS)
34. ~~TypeScript types~~ — DONE (8 new types/interfaces in database.ts: SupplementReviewStatus, InteractionSeverity, SupplementAction, InteractionWarning, SupplementReviewItem, SupplementReviewData, InteractionResult, InteractionCheckData, PractitionerBrandPreference)
35. ~~Validation schemas + AI prompts~~ — DONE (supplement.ts with 6 schemas + SUPPORTED_BRANDS; supplement-prompts.ts with review + interaction system prompts)
36. ~~Rate limit config~~ — DONE (supplement_review: 5/50 per day free/pro; interaction_check: 10/100 per day free/pro)
37. ~~5 API routes~~ — DONE (POST /api/supplements/review SSE, GET /api/supplements/review/[id], GET /api/supplements/reviews, POST /api/supplements/interactions SSE, GET+PUT /api/supplements/brands)
38. ~~2 React hooks~~ — DONE (useSupplementReview, useInteractionCheck — both follow use-visit-stream.ts SSE pattern)
39. ~~Sidebar nav~~ — DONE (Pill icon + "Supplements" between Labs and Patients)
40. ~~3 page routes~~ — DONE (/supplements server page, /supplements/loading.tsx skeleton, /supplements/review/[id] detail page with breadcrumb)
41. ~~9 client components~~ — DONE (supplements-page-client, review-tab, supplement-review-detail, supplement-review-stream, review-status-badge, interaction-checker, interaction-result-card, brand-formulary, fullscript-stub-button)
42. ~~Visit workspace UX~~ — DONE (renamed "Mark Complete" → "Sign & Lock Note", "Reopen" → "Unlock & Edit"; added sign/unlock audit actions)

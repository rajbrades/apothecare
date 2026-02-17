# Codebase Review — Multi-Angle Audit (Feb 17, 2026)

**Reviewers:** 6 specialized agents (Security, Performance, Test Coverage, Usability, UI Design, Graphic Design)
**Scope:** Full codebase audit across all dimensions
**Note:** Graphic design review incomplete (agent blocked on permission). 5 of 6 reviews completed.

---

## Executive Summary

| Dimension | Critical/High | Medium | Low/Info | Overall |
|---|---|---|---|---|
| **Security** | 0 | 3 | 7 | Strong |
| **Performance** | 8 | 7 | 4 | Needs Work |
| **Test Coverage** | — | — | — | Critical Gap (0% API/component coverage) |
| **Usability** | 12 | 11 | 6 | Moderate Issues |
| **UI Design** | 3 | 4 | 9 | Foundation Strong, Gaps in Consistency |

**Top-Level Takeaways:**
1. Security is solid — no critical issues, consistent auth/CSRF/validation patterns
2. Performance has real issues — patient prefetch bloat, stream blocking, re-render storms
3. Test coverage is the biggest risk — 10 test files total, 0% API route coverage for a HIPAA app
4. UX has several silent-failure patterns that could cause data loss
5. Design system foundation is strong but has inconsistencies (hardcoded colors, undefined tokens)

---

## 1. Security Audit

### Overall: STRONG (0 Critical, 0 High, 3 Medium, 4 Low, 3 Info)

The codebase demonstrates consistent security practices across all 26 API routes.

### Medium Findings

**S-M1: Unescaped Search Input in Lab Reports List Query**
- **File:** `src/app/api/labs/route.ts:54-57`
- Lab search doesn't call `escapePostgrestPattern()` unlike patients/visits routes
- Not SQL injection (Supabase parameterizes), but breaks search semantics (`%` matches all)
- **Fix:** Add `escapePostgrestPattern` to lab search term

**S-M2: Internal Error Messages Leaked to Client in SSE Streams**
- **Files:** `src/app/api/visits/[id]/generate/route.ts:281`, `src/app/api/supplements/review/route.ts:220`, `src/app/api/supplements/interactions/route.ts:190`
- Error catch blocks send `err.message` directly to client — may expose API URLs, model names, table names
- `chat/stream/route.ts` correctly uses generic "Stream interrupted"
- **Fix:** Replace `err.message` with generic error in all 3 files

**S-M3: Supplement Review Fetches All Data Before Ownership Check**
- **File:** `src/app/api/supplements/review/[id]/route.ts:35-46`
- Fetches record first, checks `practitioner_id` after (unlike every other endpoint which filters in query)
- RLS provides defense-in-depth, but pattern should be consistent
- **Fix:** Add `.eq("practitioner_id", practitioner.id)` to the query

### Low Findings

- **S-L1:** Labs PATCH missing Zod validation (manual `typeof` check) — `src/app/api/labs/[id]/route.ts:167`
- **S-L2:** Missing audit logs on lab reparse and document re-extraction (HIPAA gap)
- **S-L3:** Chat history GET missing CSRF (acceptable — GET endpoints don't need CSRF)
- **S-L4:** Visit export HTML includes external Google Fonts import (minor data leakage)

### Positive Findings
- Every API route checks auth via `supabase.auth.getUser()`
- All mutation endpoints have CSRF protection
- All 26 routes use Zod schemas for input validation
- File uploads: type whitelist, size limits, `sanitizeFilename()`, UUID-based storage paths
- CSP headers, HSTS, X-Frame-Options all properly configured
- Prompt injection detection on all AI input endpoints
- No hardcoded secrets, `.env` in `.gitignore`, env validation at startup

---

## 2. Performance Audit

### Overall: NEEDS WORK (3 Critical, 5 High, 7 Medium, 4 Low)

### Critical

**P-C1: Unbounded Patient List Fetched on Every Dashboard Load**
- **Files:** `src/app/(app)/dashboard/page.tsx:33-39`, `src/app/(app)/labs/page.tsx:25-31`, `src/app/(app)/supplements/page.tsx:26-32`
- Fetches up to 500 patients for dropdown on every page visit
- **Fix:** Lazy-load patient list with search-as-you-type (debounced API call)

**P-C2: Citation Resolution Blocks Stream Completion**
- **File:** `src/app/api/chat/stream/route.ts:203-220`
- Sequential CrossRef API calls (up to N citations x 5s timeout) block `[DONE]` event
- Could add 50+ seconds to stream completion
- **Fix:** Send `[DONE]` first, resolve citations async

**P-C3: `useChat` Creates New Options Object Every Render**
- **File:** `src/hooks/use-chat.ts:227`
- `sendMessage` useCallback depends on `options` which changes identity every render
- Defeats memoization, causes re-renders of entire message list
- **Fix:** Destructure individual values or memoize options object

### High

**P-H1: Middleware Double-Auth** — `src/middleware.ts` + `src/lib/supabase/middleware.ts:30`
- `auth.getUser()` runs on every request including API routes that do their own auth check
- ~50-100ms added latency per request, doubled for API routes
- **Fix:** Exclude `/api/*` from middleware or use `getSession()` (local JWT check)

**P-H2: Repeated Practitioner Table Lookup** — Every API route
- Every handler does `auth.getUser()` then separate `practitioners` table query
- 2 sequential DB queries before any business logic
- **Fix:** Create shared `getAuthPractitioner()` or store `practitioner_id` in JWT claims

**P-H3: `raw_notes` Included in Visits List** — `src/app/api/visits/route.ts:34`
- Large clinical notes fetched for every visit in list view but never displayed
- **Fix:** Remove `raw_notes` from visits list `.select()`

**P-H4: Auto-scroll Triggers on Every Streaming Token** — `src/components/chat/chat-interface.tsx:119-121`
- `useEffect` fires on every `messages` state update during streaming
- Causes janky scrolling and layout thrashing
- **Fix:** Only auto-scroll on new message added, not content updates

**P-H5: `setMessages` Creates New Array on Every Token** — `src/hooks/use-chat.ts:139-149`
- Full copy of messages array for every `text_delta` event
- **Fix:** Use ref for streaming content, throttle `setMessages` via `requestAnimationFrame`

### Medium
- **P-M1:** recharts imported eagerly (~450KB) — `src/components/labs/biomarker-timeline.tsx:8-16`
- **P-M2:** react-markdown not dynamically imported (~80-100KB) — `src/components/chat/message-bubble.tsx:4`
- **P-M3:** `insert().select()` returns all columns on POST — multiple API routes
- **P-M4:** `console.log` on module load — `src/lib/ai/provider.ts:36`
- **P-M5:** New OpenAI/Anthropic client created on every API call — `src/lib/ai/provider.ts:40-56`
- **P-M6:** Biomarker timeline makes two sequential API calls — `src/components/labs/biomarker-timeline.tsx:157-191`
- **P-M7:** `activeConvId` parsed from `window.location.search` instead of `useSearchParams()` — `src/components/layout/sidebar.tsx:75-77`

### Positive Findings
- Column-specific `.select()` on read queries (no `SELECT *`)
- `React.cache()` used properly in `cached-queries.ts`
- Cursor-based pagination across all list endpoints
- `Promise.all()` for parallel queries in patient detail
- `dynamic()` import for TipTap editor and BiomarkerTimeline
- `memo()` on `MessageBubble` component
- Proper abort controller cleanup in streaming hooks

---

## 3. Test Coverage Audit

### Overall: CRITICAL GAP

**10 test files exist** covering only validation schemas, a few utilities, and CSRF protection. Zero tests for API routes, components, streaming, file upload, or E2E flows.

### Current Coverage

| Category | Files | Tested | Coverage |
|---|---|---|---|
| Validation schemas | 7 | 5 | 71% |
| API routes | 26 | 0 | 0% |
| Lib/utilities | ~20 | 4 | ~20% |
| Security modules | 3 | 1 (CSRF) | 33% |
| AI integrations | 6 | 0 | 0% |
| Components | ~50+ | 0 | 0% |
| E2E journeys | N/A | 0 | 0% |

### Existing Tests (All Pass)
1. `tests/lib/validations/chat.test.ts` — 9 assertions
2. `tests/lib/validations/patient.test.ts` — 8 assertions
3. `tests/lib/validations/visit.test.ts` — 13 assertions
4. `tests/lib/validations/lab.test.ts` — 10 assertions
5. `tests/lib/validations/document.test.ts` — 6 assertions
6. `tests/lib/api/csrf.test.ts` — 5 assertions
7. `tests/auth/sanitize-redirect.test.ts` — 10 assertions (tests re-implemented copy, not actual code)
8. `tests/lib/labs/normalize-biomarkers.test.ts` — 18 assertions
9. `tests/lib/search.test.ts` — 6 assertions
10. `tests/lib/sanitize.test.ts` — 12 assertions

### Recommended Test Plan (Priority Order)

**Phase 1: Security-Critical (Immediate)**
1. Prompt injection detection (`prompt-guard.ts`, `validate-input.ts`) — pure function tests
2. Rate limiting (`rate-limit.ts`) — mock Supabase RPC
3. Auth middleware (`middleware.ts`) — mock Supabase auth
4. Audit logging (`audit.ts`) — verify insert calls

**Phase 2: Pure Function Quick Wins**
5. Citation extraction/application (`citations/resolve.ts`)
6. Source filter (`source-filter.ts`)
7. Flag mapping (`flag-mapping.ts`)
8. Remaining validation schemas (`supplement.ts`, `biomarker-timeline.ts`)
9. Extract `sanitizeRedirectPath` from auth callback and test the real function

**Phase 3: API Route Integration Tests**
10. Patients CRUD — auth/CSRF/validation/ownership
11. Visits CRUD — status transition logic
12. Labs CRUD — file upload, storage mock
13. Chat stream — SSE format, conversation creation
14. Visit generate/scribe — mock AI streaming

**Phase 4: E2E Infrastructure**
15. Set up Playwright with auth state management
16. Critical flows: login, patient CRUD, lab upload, chat

### Infrastructure Needed
- Coverage reporting in vitest config
- Shared test utilities: Supabase client mock, auth request helper, SSE reader
- Test setup file with common mocks
- `npm run test:coverage` script

---

## 4. Usability Audit

### Overall: MODERATE ISSUES (4 Critical, 8 Major, 11 Minor, 6 Nice-to-have)

### Critical UX Issues

**U-C1: Silent Save Failures on Visit SOAP/Matrix Edits**
- **Files:** `src/components/visits/visit-workspace.tsx:148-155` (`handleFieldUpdate`), `:157-163` (`handleMatrixUpdate`)
- Optimistic update with no error handling — user thinks edits saved when they may not have
- **Fix:** Add `.catch()` with `toast.error("Failed to save")`

**U-C2: Visit Deletion Has No Confirmation from List View**
- **File:** `src/components/visits/visit-list-client.tsx:30-34`
- One-click destructive delete with no confirm dialog (contrast: workspace has `window.confirm`)
- **Fix:** Add confirmation dialog

**U-C3: Patient Search Requires Enter Key with No Indication**
- **File:** `src/components/patients/patient-list-client.tsx:47-53`
- No debounce-on-type, no search button, no hint — users type and wait
- **Fix:** Add debounced search-on-type (like lab list does)

**U-C4: Dashboard "Refresh" Button Does Nothing**
- **File:** `src/app/(app)/dashboard/page.tsx:87-93`
- Rendered button with no `onClick` handler
- **Fix:** Implement rotation or remove button

### Major Friction

- **U-M1:** No loading/disabled state on visit status toggle — `visit-workspace.tsx:165-175`
- **U-M2:** Error alerts on auth pages missing `role="alert"` — `login/page.tsx:78-80`, `register/page.tsx:68-70`
- **U-M3:** No `autoFocus` on patient form first field — `patient-form.tsx:86`
- **U-M4:** Missing error boundaries for detail pages (`visits/[id]/`, `labs/[id]/`, `patients/[id]/`)
- **U-M5:** No loading.tsx for detail pages (visits, patients, labs, supplement review `[id]` routes)
- **U-M6:** Patient profile tabs not keyboard-navigable (missing `role="tablist"`, arrow keys)
- **U-M7:** No unsaved changes warning when navigating away from visit workspace
- **U-M8:** Chat source filter popover has no click-outside-to-close handler

### Minor Polish
- **U-P1:** Inconsistent breadcrumb separators (`>` instead of chevron icon)
- **U-P2:** "Archive" button actually calls DELETE endpoint — misleading terminology
- **U-P3:** No "Clear search" button on patient search empty state
- **U-P4:** Onboarding form labels missing `htmlFor`
- **U-P5:** Select dropdowns missing accessible labels in lab list and dashboard
- **U-P6:** Login/register buttons lack loading spinners (text changes but no spinner icon)
- **U-P7:** Document delete uses browser `confirm()` instead of designed dialog
- **U-P8:** No keyboard shortcut hints for mobile users
- **U-P9:** Brand formulary has no unsaved changes indicator
- **U-P10:** Visit filter state not preserved in URL
- **U-P11:** Chat input placeholder text inconsistency (dashboard vs chat)

### Nice-to-have
- Page metadata/titles for tab differentiation
- Optimistic UI for patient creation
- "View all conversations" link in sidebar (hardcoded to 5)
- Global keyboard shortcuts for New Visit / New Patient
- Password strength indicator on registration
- Rotating suggested questions on dashboard

### Positive Findings
- Good skeleton loading screens for list pages
- Proper `role="alert"` in most error displays
- ARIA labels on visit workspace tabs
- Skip-to-content link in app layout
- Focus trap in quick-create modal
- Good empty state CTAs on main list pages

---

## 5. UI Design Audit

### Overall: FOUNDATION STRONG, GAPS IN CONSISTENCY

### P0 — Fix Now (Broken Functionality)

**D-P0-1: Button Focus Ring Tokens Undefined**
- **File:** `src/components/ui/button.tsx:7`
- Uses `ring-offset-background` and `ring-ring` — shadcn/ui tokens NOT defined in CSS variables
- Focus states may be invisible
- **Fix:** Define these tokens or replace with CSS variable equivalents

**D-P0-2: Sonner Toast Tokens Undefined**
- **File:** `src/components/ui/sonner.tsx:14,17,19`
- Uses `border-border`, `text-primary-foreground`, `bg-muted` — undefined tokens
- **Fix:** Map to CSS variable system

**D-P0-3: Button Size Variants Use `rounded-md` Instead of Token**
- **File:** `src/components/ui/button.tsx:24-25`
- `sm` and `lg` sizes use `rounded-md` while default uses `rounded-[var(--radius-md)]`

### P1 — Fix Soon

**D-P1-1: Admin Section Entirely Off-System**
- **File:** `src/app/(admin)/admin/page.tsx`, `src/components/admin/sidebar.tsx`
- Uses raw `slate-*`, `bg-white` instead of CSS variables (~10 instances)
- No dark mode support, no brand consistency

**D-P1-2: Semantic Color Badges Use Raw Tailwind**
- ~8 component files, ~30+ hardcoded color references
- Files: `ifm-node-modal.tsx`, `interaction-result-card.tsx`, `review-status-badge.tsx`, `supplement-review-detail.tsx`, `lab-report-card.tsx`, `protocol-panel.tsx`, `lab-status-badge.tsx`
- Won't adapt to dark mode

**D-P1-3: Missing Semantic Tokens**
- No `--color-danger`, `--color-warning`, `--color-success`, `--color-info`
- Status/severity colors inconsistent across components

**D-P1-4: Button `destructive` Variant Has Dead `dark:` Code**
- `button.tsx:13` — `dark:bg-red-900` etc. but dark mode is disabled

### P2 — Component Library Improvements

**D-P2-1: Missing Reusable Primitives**
- **Badge/StatusBadge** — duplicated in 5+ places (lab-status-badge, review-status-badge, extraction-status-badge, visit-list-card inline, supplement-review-detail)
- **Modal/Dialog** — hand-rolled in ifm-node-modal, patient-quick-create
- **Card** — repeated card patterns with identical border/shadow/radius
- **Textarea** — hand-rolled in chat-input, ifm-node-modal, raw-notes-input, patient-form
- **Avatar** — repeated in sidebar, message-bubble with inconsistent sizing

**D-P2-2: Icon Sizing — 3 Competing Patterns**
1. CSS classes (`icon-inline`, `icon-nav`, `icon-feature`) — ~20 usages
2. `size={N}` prop — ~30 usages
3. Tailwind classes (`w-4 h-4`) — ~70+ usages (dominant)
- **Recommendation:** Standardize on one approach

### P3 — Polish
- Standardize page padding and card padding with tokens
- Font documentation mismatch: MEMORY.md says "Inter" but actual is "DM Sans"
- `data-value` CSS class defined but never used (everything uses inline `font-[var(--font-mono)]`)
- `hover-lift` / `hover-press` classes defined but rarely used
- No `lg:` or `xl:` breakpoints — content caps at ~1152px on large screens

### Positive Findings
- Comprehensive CSS variable system (colors, typography, radius, shadows, icons)
- Container utility classes (`container-card`, `container-elevated`, `container-modal`)
- `prefers-reduced-motion` respected
- Good animation system with consistent easing
- Clean sidebar layout with proper mobile slide-in
- Skip-to-content link

---

## 6. Cross-Cutting Priority Recommendations

### Immediate (Before Next Demo)
1. **Fix silent save failures** on visit workspace (U-C1)
2. **Add visit deletion confirmation** from list view (U-C2)
3. **Fix button focus ring tokens** (D-P0-1)
4. **Fix Sonner toast tokens** (D-P0-2)
5. **Escape lab search input** (S-M1)
6. **Generic error messages** in SSE streams (S-M2)

### High Priority (This Sprint)
7. **Lazy-load patient selector** on dashboard/labs/supplements (P-C1)
8. **Fix citation resolution blocking stream** (P-C2)
9. **Stabilize useChat options** to prevent re-render storm (P-C3)
10. **Remove raw_notes from visits list** query (P-H3)
11. **Add loading.tsx** for all `[id]` detail routes (U-M5)
12. **Add error boundaries** for detail pages (U-M4)
13. **Debounced patient search** (U-C3)
14. **Fix/remove dashboard Refresh button** (U-C4)

### Medium Priority (Next Sprint)
15. **Middleware double-auth** optimization (P-H1)
16. **Throttle streaming message updates** (P-H4, P-H5)
17. **Semantic color tokens** (`--color-danger`, etc.) (D-P1-3)
18. **Admin section** use CSS variables (D-P1-1)
19. **Add audit logs** to lab reparse and doc extraction (S-L2)
20. **Badge/StatusBadge** reusable component (D-P2-1)

### Test Coverage (Parallel Track)
21. **Phase 1:** Prompt injection, rate limit, auth middleware, audit tests
22. **Phase 2:** Citation, source filter, flag mapping pure function tests
23. **Phase 3:** API route integration tests (patients, visits, labs, chat)
24. **Phase 4:** Playwright E2E setup

---

## Appendix: Design & Interaction Refinements (from TODO.md)

These items from the existing TODO were also validated by the audits:

- [ ] **Increase contrast** for "Evidence partnerships" badge text on landing page
- [ ] **Admin Dashboard visual continuity** with marketing site (confirmed by D-P1-1: admin entirely off-system)
- [ ] **Clarify "Start Free" button** action on landing page (icon vs button ambiguity)
- [ ] **Seamless landing → app transition** (persist question after signup/login)

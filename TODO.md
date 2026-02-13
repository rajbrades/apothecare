# Apotheca — TODO

Generated from multi-angle codebase audit (Feb 11, 2026). Updated after P0 + P1 completion.

---

## P0 — Fix Before Any Demo ✅ COMPLETE

- [x] **Security:** Fix `createServiceClient()` — standalone client, no cookie passthrough
- [x] **Usability:** Fix query count display for new users
- [x] **UI:** Remove duplicate trust banner
- [x] **Security:** Add IP + user agent to audit logs (HIPAA)
- [x] **Performance:** Move Google Fonts to `<link>` preconnect
- [x] **Usability:** Add loading skeletons for dashboard + chat
- [x] **UI:** Replace emoji icons with Lucide

---

## P1 — Ship Quality ✅ COMPLETE

- [x] **Security:** Zod input validation on chat stream route
- [x] **Security:** CSRF origin checking on chat stream route
- [x] **Usability:** Deep Consult explanation tooltip/modal
- [x] **UI:** Elevate "New Conversation" as primary sidebar action
- [x] **Performance:** Parallelize dashboard + chat layout DB queries
- [x] **Usability:** Keyboard shortcuts (⌘K, ⌘↵, Esc)
- [x] **Performance:** Deprecate non-streaming /api/chat route
- [x] **Security:** rehype-sanitize on ReactMarkdown
- [x] **Usability:** Forgot password wired to Supabase
- [x] **UI:** Gold accent activated (sidebar upgrade banner, Pro badge, Deep Consult)

### Remaining P1 (design-heavy)
- [x] **UI:** Redesign landing page — product mockups, scroll animations, social proof, trust partner logos
- [x] **Performance:** Debounce ReactMarkdown during streaming — simpler renderer while streaming, full ReactMarkdown on completion

---

## P2 — Award-Worthy Polish (Month 1) ✅ MOSTLY COMPLETE

- [x] **Design:** Build evidence badge component — inline citations with color-coded evidence levels. Expand on hover with full source details.
- [x] **Design:** Build biomarker dual-range bar visualization — range bar CSS exists but no component renders it. Signature visual feature.
- [x] **UI:** Page transition animations (CSS-based)
- [x] **UI:** Scroll-triggered animations on landing page
- [ ] **Design:** Create illustration/photography style guide + hero visual
- [ ] **Usability:** NPI validation — Luhn mod 10 check digit algorithm
- [x] **UI:** Dark mode support
- [x] **Security:** Content-Security-Policy + Strict-Transport-Security headers
- [ ] **Usability:** Query reset countdown timer ("Resets in X hours")
- [ ] **Usability:** Empty state pages for /labs, /patients, /visits (currently 404)
- [ ] **Usability:** Conversation management — rename, delete, archive from sidebar
- [x] **UI:** Consistent container styling — standardize border-radius, shadow levels, border usage
- [x] **UI:** Leverage typography system — Newsreader for ALL headings, JetBrains Mono for ALL data values
- [ ] **Performance:** Paginate conversation history API
- [ ] **Performance:** Cache sidebar data or lift to shared layout
- [x] **Design:** Micro-animations — hover states, entrance animations, chat input glow
- [x] **UI:** Consistent icon sizing (16px inline, 18px nav, 20px feature)
- [x] **Security:** Environment variable validation at startup
- [x] **Design:** Landing → App visual continuity
- [x] **Design:** Proper logomark to replace "A" circle placeholder

---

## Supplement Intelligence (Core Feature)

- [ ] **Feature:** Supplement review module — Input patient's current supplements and evaluate against medical history, clinical goals, and lab results. Flag redundancies, gaps, and contraindications.
- [ ] **Feature:** Interaction safety checker — Quick-check product recommendations against labs and medical history for contraindications and adverse effects (e.g., RYR citrinin risk in kidney disease, high-dose Vitamin D with hypercalcemia, iron supplementation with hemochromatosis).
- [ ] **Feature:** Brand-specific supplement formulary — Allow practitioners to configure preferred supplement brands (e.g., Apex Energetics, Orthomolecular Products, Designs for Health, Pure Encapsulations, Metagenics) so protocol generation recommends specific branded products with correct SKUs and dosing.
- [ ] **Integration:** Fullscript.com integration — Connect practitioner Fullscript dispensary for direct ordering, patient auto-ship, and protocol-to-cart workflow. Use Fullscript API for product catalog, pricing, and order management.

---

## Backlog

- [ ] OAuth providers (Google, Apple) for registration
- [ ] Mobile responsive pass on all pages
- [ ] PWA support for mobile practitioners
- [ ] Error boundary components for graceful failures
- [ ] Analytics integration (PostHog or Mixpanel)
- [ ] A/B testing framework for landing page conversion
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] SEO optimization — meta tags, Open Graph images, structured data
- [ ] Rate limiting middleware (beyond daily query count)
- [ ] Prompt injection detection layer before Claude API calls

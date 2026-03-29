# PRD: Protocol Generator Pro (Pro+ Tier)

**Product:** Apothecare
**Module:** Treatment Protocols — Multi-Phase AI-Generated Clinical Plans
**Status:** Concept — Not Yet Built
**Tier:** Pro+ ($199/mo)
**Last Updated:** 2026-03-29

---

## 1. Executive Summary

Protocol Generator Pro replaces single-visit supplement recommendations with longitudinal, multi-phase treatment protocols that synthesize a patient's entire clinical history. It generates 3-6 month phased plans with conditional branching, specific product recommendations (via partnership RAG), built-in reassessment points, and branded PDF export. This is the flagship feature of the Pro+ tier and the primary differentiator from every competitor in the functional medicine software market.

**Strategic value:** This feature replaces a $500/hour functional medicine mentor. New FM practitioners struggle most with protocol sequencing, timing, and conditional branching. This is where clinical experience matters most, and it's exactly what an AI trained on IFM frameworks + partnership knowledge bases can deliver. It also creates massive switching costs: once a practice has 50 patients on active protocols tracked in Apothecare, migration is impractical.

---

## 2. Problem Statement

### What exists today (Pro tier)
The current protocol generation happens during a single visit. After the practitioner records a SOAP note, the AI generates:
- Supplement recommendations (with evidence badges)
- Dietary recommendations
- Lifestyle recommendations
- Follow-up labs

These are based only on that visit's context — the SOAP sections, chief complaints, and whatever the practitioner typed. There is no temporal dimension, no phasing, no conditional logic, and no awareness of previous visits or lab trends.

### What practitioners need
1. **Longitudinal awareness** — Treatment plans that account for the full clinical picture, not just today's visit
2. **Phased protocols** — Foundation/restore/optimize sequencing with appropriate timing (4-8 week phases)
3. **Conditional branching** — "If zonulin normalizes, proceed to Phase 2; if still elevated, extend Phase 1 by 4 weeks"
4. **Lab-linked reassessment** — Specific biomarkers to re-test at each phase transition, with decision criteria
5. **Product specificity** — Brand-name product recommendations with exact dosing from partnership knowledge bases (Apex Energetics, etc.)
6. **Progress tracking** — Ability to see where a patient is in their protocol and whether milestones are being met
7. **Patient-facing export** — Branded PDF protocols patients can follow at home

### Why this matters commercially
- **Moat:** No competitor has practitioner-specific RAG + longitudinal protocol generation
- **Lock-in:** Active protocols for 50+ patients create enormous switching costs
- **Pricing power:** This is a $199/mo feature, not a $99/mo feature — it's the difference between a documentation tool and a clinical decision engine
- **Partnership revenue:** Protocols recommend specific partner products (Apex, etc.), creating affiliate/revenue-share opportunities

---

## 3. User Stories

### Practitioner
1. **As a practitioner**, I want to generate a multi-phase treatment protocol from a patient's full clinical history, so I don't have to manually synthesize months of visit notes, labs, and intake data.
2. **As a practitioner**, I want to select focus areas (gut, thyroid, detox, neuro, etc.) before generation, so the protocol is targeted to the patient's primary concerns.
3. **As a practitioner**, I want to review and edit each phase before activating, so I maintain clinical oversight.
4. **As a practitioner**, I want the protocol to reference specific partner products with dosing (not just generic nutrients), so I can give actionable recommendations.
5. **As a practitioner**, I want built-in reassessment points with specific lab markers, so I know exactly what to re-test at each phase transition.
6. **As a practitioner**, I want conditional branching ("if X improves, proceed; if not, extend"), so the protocol adapts to real outcomes.
7. **As a practitioner**, I want to export the protocol as a branded PDF for the patient, so they have a clear take-home plan.
8. **As a practitioner**, I want to see which phase a patient is currently in during follow-up visits, so the AI can reference the active protocol in its recommendations.

### Patient (Portal)
9. **As a patient**, I want to see my active treatment protocol in the portal, so I know what phase I'm in and what's expected of me.
10. **As a patient**, I want to see my progress through each phase, so I feel motivated and informed.

---

## 4. Architecture Overview

### Data Model

#### Table: `treatment_protocols`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | No | |
| `patient_id` | UUID FK -> patients | No | |
| `practitioner_id` | UUID FK -> practitioners | No | |
| `title` | TEXT | No | e.g., "Gut Restoration + Thyroid Optimization Protocol" |
| `status` | TEXT | No | `draft`, `active`, `completed`, `archived` |
| `focus_areas` | TEXT[] | Yes | e.g., `["gut", "thyroid", "methylation"]` |
| `total_duration_weeks` | INTEGER | Yes | Estimated total protocol duration |
| `started_at` | TIMESTAMPTZ | Yes | When the protocol was activated |
| `completed_at` | TIMESTAMPTZ | Yes | When all phases were completed |
| `generation_context` | JSONB | Yes | Snapshot of inputs used for generation (for audit/reproducibility) |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

#### Table: `protocol_phases`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | No | |
| `protocol_id` | UUID FK -> treatment_protocols | No | |
| `phase_number` | INTEGER | No | 1, 2, 3, ... |
| `title` | TEXT | No | e.g., "Foundation — Gut Repair" |
| `goal` | TEXT | No | Clinical goal for this phase |
| `duration_weeks` | INTEGER | No | Expected duration |
| `status` | TEXT | No | `pending`, `active`, `completed`, `extended`, `skipped` |
| `started_at` | TIMESTAMPTZ | Yes | |
| `completed_at` | TIMESTAMPTZ | Yes | |
| `supplements` | JSONB | No | Array of supplement recommendations with product, dosage, timing, rationale, RAG citations |
| `diet` | JSONB | Yes | Dietary recommendations |
| `lifestyle` | JSONB | Yes | Lifestyle recommendations |
| `labs_to_order` | JSONB | Yes | Labs to order at phase end, with target ranges and decision criteria |
| `conditional_logic` | JSONB | Yes | Branching rules: if biomarker X > Y, extend phase; if normalized, proceed |
| `practitioner_notes` | TEXT | Yes | Practitioner's manual notes/overrides |
| `sort_order` | INTEGER | No | Display ordering |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

#### Table: `protocol_phase_supplements`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | No | |
| `phase_id` | UUID FK -> protocol_phases | No | |
| `name` | TEXT | No | Product name (e.g., "Apex Energetics RepairVite") |
| `dosage` | TEXT | No | e.g., "1 scoop" |
| `frequency` | TEXT | No | e.g., "2x daily" |
| `timing` | TEXT | Yes | e.g., "with meals", "empty stomach AM" |
| `rationale` | TEXT | Yes | Why this supplement in this phase |
| `rag_source` | TEXT | Yes | Partnership source (e.g., "apex_energetics") |
| `rag_citations` | JSONB | Yes | Citation references from RAG |
| `action` | TEXT | No | `start`, `continue`, `increase`, `decrease`, `discontinue` |
| `sort_order` | INTEGER | No | |

#### Table: `protocol_progress`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | No | |
| `protocol_id` | UUID FK -> treatment_protocols | No | |
| `phase_id` | UUID FK -> protocol_phases | No | |
| `event_type` | TEXT | No | `phase_started`, `phase_completed`, `phase_extended`, `lab_result`, `symptom_checkin`, `practitioner_note` |
| `event_date` | TIMESTAMPTZ | No | |
| `detail` | JSONB | Yes | Event-specific data |
| `created_at` | TIMESTAMPTZ | No | |

### Indexes & RLS
- All tables: `(practitioner_id)` for RLS, `(patient_id)` for lookups
- `protocol_phases`: `(protocol_id, phase_number)` for ordered retrieval
- `protocol_progress`: `(protocol_id, event_date DESC)` for timeline
- RLS: practitioner full CRUD on own patients, patient SELECT on own protocols (portal)

---

## 5. AI Generation Pipeline

### Input Assembly

The generation endpoint assembles a comprehensive clinical context from:

```
1. Patient demographics + intake data (patients table)
2. All visit SOAP notes (visits table, ordered by date)
3. Lab results with trends (biomarker_results + trend calculations)
4. Current supplements + medications (patient_supplements, patient_medications)
5. Symptom score trends (symptom_score_snapshots)
6. IFM Matrix findings (patients.ifm_matrix)
7. Pre-chart clinical summary (patients.clinical_summary)
8. Partnership RAG context (evidence_chunks via retrieveContext())
9. Focus areas selected by practitioner
```

### Prompt Architecture

**System prompt:** Functional medicine protocol expert. Trained on IFM frameworks (5R gut protocol, ATM model, methylation pathways). Generates evidence-based, phased treatment plans with conditional logic.

**Key prompt instructions:**
- Generate 2-4 phases, each 4-8 weeks
- Each phase must have: goal, supplements (with specific products + dosing), diet, lifestyle, labs to re-order
- Include conditional branching between phases (biomarker thresholds, symptom score changes)
- Reference partnership products by name when available (Apex Energetics, etc.)
- Cite evidence for each recommendation using [REF-N] tags (mapped to RAG chunks + standard evidence)
- Consider drug-supplement and supplement-supplement interactions
- Account for patient's genetic data (MTHFR, APOE) in methylation/detox protocols
- Sequence interventions appropriately (gut repair before detox, inflammation before optimization)

**Output format:** Structured JSON matching the `protocol_phases` schema, parsed and validated server-side.

### Model Selection
- Primary: Claude Opus (complex multi-source synthesis, conditional logic)
- Fallback: Claude Sonnet (if Opus unavailable)
- Token budget: ~8K input context, ~4K output per phase
- Total generation: 30-60 seconds for 3-phase protocol

### RAG Integration
- Query each focus area against partnership knowledge base
- Top 5 chunks per focus area, filtered by relevance threshold
- Products mentioned in RAG chunks are prioritized in supplement recommendations
- Citations flow through the standard grounding pipeline (ground.ts)

---

## 6. User Flow

### Generation Flow

```
Patient Profile → "Generate Protocol" button (Pro+ only)
    ↓
Focus Area Selection Modal
  [ ] Gut Health & Permeability
  [ ] Thyroid & Metabolic
  [ ] Methylation & Detox
  [ ] Adrenal & Stress
  [ ] Neurological & Cognitive
  [ ] Cardiovascular
  [ ] Hormonal Balance
  [ ] Autoimmune Management
    ↓
AI Generation (30-60 sec, SSE streaming)
  - Phase 1 streams first, then Phase 2, etc.
  - Real-time preview as phases arrive
    ↓
Protocol Editor (full-page view)
  - Review each phase: supplements, diet, lifestyle, labs
  - Edit any field inline
  - Drag to reorder phases
  - Add/remove phases manually
  - Adjust supplement dosing/products
  - Modify conditional logic
    ↓
"Activate Protocol" → status: active, started_at: now
    ↓
Protocol visible on:
  - Patient Overview tab (active protocol card)
  - Visit AI context ("Patient is in Phase 2, week 3")
  - Patient Portal (read-only phases + progress)
  - Export as branded PDF
```

### Follow-Up Visit Integration

When a practitioner starts a new visit for a patient with an active protocol:

1. The visit AI system prompt includes protocol context: current phase, week number, phase goals, supplements in play
2. If new labs are available, AI automatically checks them against phase transition criteria
3. AI suggests: "Zonulin has normalized (was 85, now 42). Phase 1 goal achieved. Recommend transitioning to Phase 2."
4. Practitioner can advance the phase with one click from the visit workspace

### Patient Portal View

```
/portal/protocol — Active Treatment Protocol page
  - Current phase highlighted
  - Progress timeline (Phase 1 ✓ → Phase 2 [active, week 3] → Phase 3 [pending])
  - Current phase details: supplements list, dietary guidelines, lifestyle notes
  - Upcoming: "At week 6, your provider will order follow-up labs"
  - Past phases collapsed but expandable
```

---

## 7. API Endpoints

### Protocol CRUD

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/patients/[id]/protocols/generate` | Generate a new protocol (SSE streaming) |
| GET | `/api/patients/[id]/protocols` | List all protocols for a patient |
| GET | `/api/patients/[id]/protocols/[protocolId]` | Get full protocol with phases |
| PATCH | `/api/patients/[id]/protocols/[protocolId]` | Update protocol metadata (title, status) |
| PATCH | `/api/patients/[id]/protocols/[protocolId]/phases/[phaseId]` | Update a phase |
| POST | `/api/patients/[id]/protocols/[protocolId]/phases/[phaseId]/advance` | Advance to next phase |
| POST | `/api/patients/[id]/protocols/[protocolId]/phases/[phaseId]/extend` | Extend current phase |
| GET | `/api/patients/[id]/protocols/[protocolId]/export` | Export as branded PDF |

### Patient Portal

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patient-portal/me/protocol` | Get active protocol (patient-facing) |

### Visit Integration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients/[id]/protocols/active-context` | Get active protocol context for visit AI |

---

## 8. Export & PDF

Protocol exports follow the existing browser print-to-PDF pattern (`src/lib/export/`):

- Branded letterhead (practice logo + provider credentials)
- Phase-by-phase layout with clear visual hierarchy
- Supplement tables with product, dosage, frequency, timing
- Dietary and lifestyle sections
- Lab ordering checklist per phase
- Conditional logic displayed as decision trees
- "Patient copy" watermark
- HIPAA-compliant cache headers

---

## 9. Tier Gating

| Feature | Free | Pro ($99/mo) | Pro+ ($199/mo) |
|---------|------|-------------|-----------------|
| Single-visit recommendations | - | Yes | Yes |
| Protocol Generator (multi-phase) | - | - | Yes |
| Custom RAG (upload own knowledge base) | - | - | Yes |
| Protocol progress tracking | - | - | Yes |
| Patient portal protocol view | - | - | Yes |
| Branded protocol PDF export | - | - | Yes |
| Visit AI protocol context | - | - | Yes |
| Active protocol limit | - | - | Unlimited |

### Implementation
- Gate check: `isFeatureAvailable(practitionerId, "protocol_generator")` in `src/lib/tier/gates.ts`
- Middleware route protection for `/api/patients/[id]/protocols/*`
- UI: "Generate Protocol" button shows `ProPlusBadge` lock icon for non-Pro+ users
- Upgrade CTA: "Upgrade to Pro+ to generate multi-phase treatment protocols"

---

## 10. Custom RAG (Pro+ Add-On)

### What It Is
Pro+ practitioners can upload their own knowledge base PDFs — certification materials, proprietary protocols, course notes — and have them searched alongside public evidence during protocol generation.

### How It Works
1. **Upload:** Settings > Knowledge Base > Upload PDF
2. **Processing:** Same RAG pipeline as partnerships (OCR -> chunk -> embed -> pgvector)
3. **Storage:** `evidence_documents` + `evidence_chunks` tables with `source = 'practitioner_upload'` and `practitioner_id` for scoping
4. **Search:** `retrieveContext()` includes practitioner's private chunks when `sourceFilter = 'my_knowledge_base'`
5. **Citations:** Protocols cite the practitioner's own materials: `[REF-3] A4M Advanced Metabolic Endocrinology, Module 4, p.23`

### Data Model Addition

```sql
ALTER TABLE evidence_documents
  ADD COLUMN practitioner_id UUID REFERENCES practitioners(id),
  ADD COLUMN visibility TEXT DEFAULT 'partnership' CHECK (visibility IN ('partnership', 'practitioner'));

-- RLS policy for practitioner-uploaded docs
CREATE POLICY "evidence_docs_practitioner_own" ON evidence_documents
  FOR ALL USING (
    visibility = 'practitioner' AND
    practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
  );
```

### Why This Is a Moat
- No competitor has practitioner-specific RAG
- Practitioners invest time curating their knowledge base -> switching cost
- Their protocols become uniquely personalized -> can't replicate elsewhere
- Creates network effect: practitioners share anonymized protocol patterns

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Protocol generation adoption | 60% of Pro+ users generate 1+ protocol/month | `treatment_protocols` table count per practitioner |
| Protocol completion rate | 40% of activated protocols reach final phase | `status = 'completed'` / `status = 'active'` |
| Phase advancement | Average 2.5 phases per protocol | `protocol_phases` count per protocol |
| Visit protocol reference | 70% of follow-up visits reference active protocol | Visit AI context inclusion rate |
| Patient portal engagement | 30% of patients with active protocols view them | Portal page view analytics |
| Pro -> Pro+ conversion | 15% of Pro users upgrade within 3 months of launch | Subscription tier changes |
| Churn reduction | Pro+ churn < 5%/month (vs ~8% for Pro) | Stripe subscription analytics |
| Export usage | 50% of completed protocols exported as PDF | Export endpoint usage |

---

## 12. Implementation Phases

### Phase 1: Core Protocol Generation (Sprint 30-31)
- Migration: `treatment_protocols`, `protocol_phases`, `protocol_phase_supplements`, `protocol_progress` tables
- Generation API endpoint with SSE streaming
- Protocol editor UI (review + edit phases)
- Activate/complete lifecycle
- Basic PDF export

### Phase 2: Visit Integration (Sprint 32)
- Active protocol context in visit AI system prompt
- Phase advancement from visit workspace
- Lab result auto-check against phase criteria
- Protocol status card on patient Overview tab

### Phase 3: Patient Portal (Sprint 33)
- `/portal/protocol` page with active protocol view
- Phase progress timeline
- Current phase supplement/diet/lifestyle display

### Phase 4: Custom RAG (Sprint 34)
- Practitioner knowledge base upload UI
- Private RAG ingestion pipeline
- Source filtering in protocol generation
- Citation display for practitioner-uploaded sources

### Phase 5: Advanced Features (Sprint 35+)
- Protocol templates (save + reuse across patients)
- Protocol comparison (side-by-side for similar patients)
- Outcome analytics (which protocols have best symptom improvement)
- AI protocol refinement suggestions based on outcomes

---

## 13. Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucinating products/dosing | High (clinical safety) | RAG-grounded generation; practitioner review required before activation; no auto-activation |
| Long generation time (>60s) | Medium (UX) | SSE streaming shows phases as they arrive; background generation with notification |
| Context window limits | Medium (accuracy) | Summarize older visits; prioritize recent labs and current medications; use clinical summary as compressed context |
| Conditional logic complexity | Medium (maintenance) | Start with simple if/else branching; avoid multi-level nesting; practitioner can always override |
| HIPAA compliance for protocol export | High (legal) | Same export security as existing PDFs; Cache-Control headers; audit logging; no patient data in URLs |

---

## 14. Competitive Analysis

| Competitor | Multi-phase protocols | Partnership RAG | Custom RAG | Conditional logic | Symptom tracking integration |
|------------|----------------------|----------------|------------|-------------------|------------------------------|
| **Apothecare Pro+** | Yes | Yes | Yes | Yes | Yes |
| Practice Better | No (single plans) | No | No | No | Limited |
| Fullscript | No (dispensary only) | No | No | No | No |
| Heads Up Health | No (data dashboard) | No | No | No | Wearable only |
| EHR systems (Jane, Cerbo) | No (templates) | No | No | No | No |

**Key insight:** No existing tool combines longitudinal protocol generation with RAG-grounded product recommendations and conditional branching. This is a category-defining feature.

---

## 15. Open Questions

1. **Protocol versioning** — Should editing an active protocol create a new version, or modify in place? Recommendation: modify in place with audit log, version only on major restructuring.
2. **Multi-practitioner protocols** — If a patient sees multiple practitioners, how do protocols interact? V1: one active protocol per patient. V2: protocol collaboration.
3. **Insurance/billing codes** — Should protocols link to CPT codes for billing? Deferred to post-launch.
4. **Interaction checking** — Should protocol generation auto-check drug-supplement interactions? Yes, using the existing interaction checker in supplement review.
5. **Protocol sharing** — Should practitioners be able to share protocol templates? Deferred to Phase 5.

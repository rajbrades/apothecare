# Apothecare — Platform Execution Strategy

**Version:** 1.0
**Date:** March 2026
**Question answered:** Do we start from scratch, and what do we build next?

---

## Do We Start From Scratch?

**No. Unambiguously no.**

The existing codebase represents 18+ months of equivalent engineering work:
- Full visit workspace with SOAP generation, IFM Matrix auto-mapping, AI Scribe
- Multi-vendor lab parsing (LabCorp, DUTCH, GI-MAP, OmegaCheck) with functional range overlays, trend tracking, and practitioner range overrides
- Supplement intelligence: regimen review, interaction checking, brand formulary, push-to-patient
- RAG pipeline: PubMed ingestion, vector search, citation grounding
- Clinical chat with 15+ source filters, Clinical Lens, evidence badges, conversation history
- Full patient chart management: 8-tab view, FM Timeline, symptom scoring, document management
- Supabase schema with row-level security and HIPAA-compliant data handling
- Multi-AI provider setup with OpenAI primary, Claude vision, Whisper transcription

The tech stack (Next.js 15, Supabase, Claude, Whisper) is correct for the platform vision.

**What changes:** The infrastructure *underneath* the app (provenance, audit, versioning) and the platform layer *on top* (marketplace, API, patient network). This is additive architecture, not a rewrite.

**One meaningful refactor to make now:** Standardize on Claude (Anthropic) as the primary AI model. The current setup uses OpenAI as primary with Claude as fallback. For the outcomes graph and provenance layer to be consistent, the reasoning model needs to be stable. Claude's extended thinking and citation capabilities are better suited to the clinical reasoning chain. This is a config change + prompt rewrite, not a rewrite.

---

## The One Non-Negotiable: Clinical Provenance

Before anything else in this roadmap, the provenance layer must exist.

An audit log tells you *what happened*. Clinical provenance tells you *why* — and that distinction is everything in medicine.

For every Apothecare output, a provider must be able to see:
- **Data inputs used** — which labs, meds, symptoms, diagnoses, history items were included
- **Patterns matched** — which clinical patterns fired, at what confidence, against which criteria
- **Safety checks run** — which interaction, contraindication, and red flag screens passed or failed, and why each one passed or failed
- **Evidence cited** — specific sources, study types, evidence quality grades (RCT vs. observational vs. expert opinion)
- **Protocol version** — the exact version hash of any protocol applied, so outcomes can be traced back to the specific logic that generated them

This is not just compliance infrastructure. It is the core trust mechanism that makes Apothecare usable in clinical settings where black-box AI is unacceptable. It is also what makes the Clinical Intelligence Graph auditable and licensable. And it directly addresses FDA expectations for clinical decision support software under the 21st Century Cures Act.

**Implementation:** Every AI response stored with a `provenance` JSONB object. Every tool call in the MCP layer records inputs and outputs. Every pattern match records which criteria fired. Every safety check records pass/fail and reason.

---

## Execution Roadmap

### Phase 0 — Foundation Hardening
**Timeline:** 4 weeks
**Goal:** Make the existing app platform-ready. Nothing else before this.

#### 0.1 — Clinical Provenance Layer
New Supabase table: `ai_outputs`
```
id, created_at, practitioner_id, patient_id (nullable),
tool_name, tool_version,
inputs JSONB,           -- all data that fed the reasoning
patterns_matched JSONB, -- which clinical patterns fired
safety_checks JSONB,    -- each check: name, result, reason
evidence_sources JSONB, -- citations used, study types, quality
protocol_version TEXT,  -- hash of protocol definition applied
output JSONB,           -- the actual recommendation
provider_reviewed_at,   -- when practitioner viewed/approved
provider_action TEXT    -- accepted / modified / rejected
```

Every AI call wraps into this schema. The provider sees a "Reasoning Trail" button on every output that expands the full provenance view in the UI.

#### 0.2 — Protocol Versioning
New table: `protocol_versions`
```
id, protocol_name, version_hash,
definition JSONB,       -- the full protocol logic/content
created_at, deprecated_at,
authored_by             -- system, practitioner_id, or institute
```

Every recommendation references a `protocol_version_id`. When outcomes come back, you know exactly which logic produced them.

#### 0.3 — Immutable Audit Log
New table: `audit_log`
```
id, timestamp, actor_id, actor_type (practitioner/system),
patient_id (nullable, hashed for de-id layer),
action, resource_type, resource_id,
ip_address, session_id,
before_state JSONB, after_state JSONB
```

Append-only. No updates or deletes permitted via RLS. This is your compliance backbone and the raw feed for the outcomes graph.

#### 0.4 — AI Model Standardization
Migrate primary AI calls from OpenAI to Claude (claude-opus-4-6 for reasoning, claude-haiku-4-5 for fast tasks). Keep Whisper for transcription (no better alternative). Update system prompts to take advantage of Claude's extended thinking for pattern matching and protocol generation.

---

### Phase 1 — MCP Layer Formalization
**Timeline:** Months 1–3
**Goal:** Convert existing API routes into a proper five-server MCP architecture. Ship the MVP 10 tools.

The existing API routes are essentially MCP tools without the formal protocol. This phase adds the orchestration layer and makes them composable.

#### Five MCP Servers

**Server 1: Patient Context**
Maps to existing routes under `/api/patients/[id]/`
- `get_patient_summary` ← patient route + demographics
- `get_lab_trends` ← `/labs/[id]` + trend aggregation
- `get_medications_and_supplements` ← supplements route
- `get_patient_timeline` ← timeline route
- `get_symptom_scores` ← symptom-logs route

**Server 2: Clinical Logic**
New service layer, builds on existing AI generation logic in visit routes
- `match_clinical_patterns` ← extends IFM matrix generation
- `recommend_foundational_protocols` ← extends protocol generation
- `recommend_targeted_protocols` ← extends AI plan generation
- `generate_retesting_cadence` ← new, references protocol version

**Server 3: Safety Engine**
Extends existing interaction logic in supplement review
- `check_interactions` ← extends supplement interaction check
- `screen_contraindications` ← new, references patient context
- `detect_red_flags` ← new, references lab trends + symptom scores
- `validate_plan_safety` ← orchestrates all three above

**Server 4: Documentation & Workflow**
Maps to existing visit generation and export routes
- `draft_soap_note` ← `/visits/[id]/generate`
- `generate_after_visit_summary` ← extends visit export
- `create_followup_tasks` ← extends protocol milestones
- `generate_lab_reorder_plan` ← new

**Server 5: Evidence & Research**
Maps to existing RAG retrieval in `/lib/rag/`
- `search_pubmed_and_summarize` ← extends RAG retrieve + PubMed ingest
- Run async / pre-fetch on visit open, not in critical path

#### Orchestration Layer
New service: `src/lib/mcp/orchestrator.ts`
- Maintains session-scoped context object that accumulates state across tool calls
- Passes accumulated context explicitly between servers (stateless servers, stateful session)
- Every tool call writes to `ai_outputs` with full provenance before returning

#### MVP 10 Tools (Priority Order)
1. `get_patient_summary`
2. `get_lab_trends`
3. `get_medications_and_supplements`
4. `match_clinical_patterns`
5. `recommend_foundational_protocols`
6. `recommend_targeted_protocols`
7. `check_interactions`
8. `screen_contraindications`
9. `draft_soap_note`
10. `generate_after_visit_summary`

This covers the highest-value loop: pre-visit synthesis → pattern recognition → safety screening → provider draft output.

---

### Phase 2 — Outcomes Graph Infrastructure
**Timeline:** Months 3–6
**Goal:** Start building the data asset that makes Apothecare defensible.

#### Outcomes Schema
New tables that link protocols to results:
```
protocol_outcomes:
  id, protocol_version_id, patient_id (hashed),
  practitioner_id, recommended_at,
  followup_lab_report_id, followup_at,
  biomarker_deltas JSONB,   -- { marker: { before, after, delta_pct } }
  symptom_score_delta JSONB,
  provider_rating INT,       -- 1-5, optional practitioner feedback
  outcome_status TEXT        -- improved / stable / regressed / unknown

pattern_effectiveness:
  pattern_name, protocol_version_id,
  sample_count, improvement_rate,
  avg_biomarker_delta JSONB,
  last_computed_at
```

#### Wiring Existing Data
The app already has `protocol-milestones`, `symptom-logs`, and lab reports. This phase wires them:
- When a followup lab is uploaded and linked to a patient, query all `ai_outputs` from the prior 90 days for that patient, compute deltas, and write to `protocol_outcomes`
- Background job (Supabase Edge Function or cron) re-aggregates `pattern_effectiveness` weekly

#### De-identification Layer
Required before any data leaves Apothecare:
- Patient IDs hashed with practice-level salt
- All free-text fields stripped or redacted
- Minimum k-anonymity threshold before any aggregate is surfaced

---

### Phase 3 — Protocol Marketplace
**Timeline:** Months 6–9
**Goal:** Turn Apothecare from a tool into a platform. First revenue stream beyond SaaS.

#### Protocol Publishing
- Practitioners can publish versioned protocols to the Marketplace
- Each protocol references the `protocol_versions` table (already exists by Phase 0)
- Published protocols include: name, indication, pattern targets, biomarker targets, evidence citations, practitioner author, aggregate outcomes data (if available)

#### Browse & Adopt
- Marketplace browse UI: filter by clinical pattern, biomarker, specialty, institute affiliation
- "Adopt" a protocol: creates a local fork in the practitioner's account, versioned separately
- Community ratings and outcome signals visible on each protocol card

#### Institute Mode
- IFM-certified and A4M-member protocol collections, curated and branded
- Practitioners toggle "Institute Mode" in settings — AI strictly follows that institute's guidelines
- Revenue share: institute earns royalty on subscriptions attributed to their alumni

#### Supplement Brand Sponsored Pathways
- Brands pay to have their products surfaced when their ingredients are clinically appropriate
- Clearly labeled "Sponsored" — never in competition with the clinical recommendation, always supplemental to it
- Apothecare maintains editorial independence: sponsored pathways only appear when the base recommendation already includes that ingredient category

---

### Phase 4 — Patient Network
**Timeline:** Months 9–12
**Goal:** Direct-to-patient acquisition channel. Accelerate the outcomes graph.

#### Patient Portal
- Separate route group: `/patient/` — different auth, simplified UI
- Patients view: their protocol, lab trends, timeline, supplement schedule
- Self-enrollment: practitioner sends referral link → patient creates account → linked to chart

#### Patient-Contributed Data
- Apple Health, Oura, Garmin integration: HRV, sleep, steps, glucose (CGM)
- Patient-reported symptoms: weekly check-in linked to `symptom_logs`
- All data feeds the outcomes graph (with explicit patient consent)

#### Growth Loop
```
Practitioner sends AVS with Apothecare-branded patient summary
→ Patient enrolls in portal
→ Patient shares protocol with their network
→ Network asks "who is your doctor?"
→ New practitioner discovers Apothecare
→ Practitioner subscribes
→ More protocols → richer outcomes graph
```

---

### Phase 5 — API Economy + Regulatory
**Timeline:** Year 2
**Goal:** Become infrastructure. Open the platform. Pursue regulatory clearance.

#### Public API
- REST + webhook API for lab vendors, supplement brands, EHR connectors
- Labs push results directly to Apothecare via API (vs. PDF upload)
- Supplement brands query aggregate outcomes data (de-identified, licensed)
- Third-party tools build on top of Apothecare MCP servers

#### FDA Regulatory Strategy
- Target: 510(k) or De Novo clearance for the Safety Engine (interaction checker + contraindication screening + red flag detection)
- Pre-submission meeting with FDA in Year 1 to scope the pathway
- The provenance layer (Phase 0) and audit log are the evidentiary foundation for the submission
- Clearance timeline: 2–4 years. Begin Year 1. Clear Year 3–4.
- Once cleared: health systems can deploy, enterprise contracts become available, payor conversations start

#### SOC 2 Type II
- Begin audit preparation in Year 1
- Complete Type II by end of Year 2
- Required for enterprise sales and health system contracts

#### FHIR Integration
- HL7 FHIR R4 integration with one EHR (target: Cerbo or Practice Better first — functional medicine-adjacent)
- Bidirectional: pull existing patient data in, push Apothecare-generated notes out
- This is the bridge to conventional health systems without building a full EHR

---

## What We Are NOT Building

These are intentional exclusions to maintain focus:

- **A full EHR** — Apothecare is the intelligence layer, not the record of record. We integrate with EHRs, we don't replace them.
- **A direct-to-consumer app** — the patient portal serves practitioners' patients. We are not competing with Function Health or Levels for direct consumer relationships.
- **A general-purpose AI** — every feature decision is filtered through "does this serve functional medicine practitioners specifically?" Generic capability is a distraction.
- **A supplement store** — we are the decision layer, not the dispensary. We integrate with Fullscript and others. We do not hold inventory or fulfill orders.

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Primary AI model | Claude (Anthropic) | Extended thinking, citation reliability, Agent SDK, consistent outputs for outcomes graph |
| Transcription | OpenAI Whisper | Best-in-class, no superior alternative |
| Database | Supabase (PostgreSQL) | Already in use, RLS for HIPAA, pgvector for RAG |
| MCP framework | Official MCP SDK | Standard, supported, works with Claude natively |
| Auth | Supabase Auth | Already in use, handles practitioner + patient roles |
| Deployment | Vercel | Already in use, edge functions for async jobs |
| RAG vector store | pgvector (Supabase) | Already set up, co-located with patient data |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Acquisition offer before moat is built | Medium | High | Set explicit acquisition floor ($500M+). Build fast. |
| FDA clearance takes longer than expected | High | Medium | Clearance is parallel to product development, not a blocker |
| Institute partnership falls through | Medium | Medium | Institute channel is primary but not exclusive. Direct + PLG continues regardless |
| Outcomes graph data quality is poor | Medium | High | Require structured output format from all AI tools. Validate on ingest. |
| Competitor builds similar platform | Low (Year 1), Medium (Year 3) | High | Speed + outcomes graph + regulatory clearance. Move fast in Year 1–2. |
| HIPAA breach | Low | Very High | Supabase RLS + SOC 2 + penetration testing + legal counsel from Day 1 |

---

## The One-Page Summary

**What Apothecare is:** The infrastructure layer for functional medicine — the Bloomberg Terminal for this specialty.

**What we are building toward:** A four-layer platform where Layer 3 (the Clinical Intelligence Graph) is the durable moat and Layer 4 (the Network) is the billion-dollar business.

**Why we don't start from scratch:** The product works. The stack is right. The missing pieces are infrastructure (provenance, audit, versioning) and platform (marketplace, API, patient network). Both are additive.

**The single most important thing to build next:** The clinical provenance layer. Everything else compounds on top of it.

**The three compounding moats:** Clinical Intelligence Graph (data), Protocol Network Effects (lock-in), FDA Regulatory Clearance (barriers to entry).

**The revenue trajectory:** SaaS → Marketplace → Data Licensing → Enterprise → Payor Integration.

**The goal:** Become the platform that functional medicine cannot operate without.

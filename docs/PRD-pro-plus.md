# PRD: Pro+ Tier Features

**Last updated:** March 31, 2026
**Status:** Planning
**Target price:** $199/month

---

## Overview

Pro+ is a premium subscription tier for Apothecare targeting high-volume functional medicine practitioners who need advanced AI capabilities beyond standard clinical chat. Three flagship features differentiate Pro+ from Pro ($99/mo):

1. **Deep Research** — Autonomous multi-step literature review agent
2. **Protocol Generator Pro** — Longitudinal, phased treatment protocols
3. **Custom RAG** — Practitioner-uploaded private knowledge bases

All three features leverage Claude Opus 4.6 (the most capable model) and are designed to replace workflows that currently require hours of manual work or expensive specialist consultations.

**Key design principle:** Every recommendation must be transparent about its source. Peer-reviewed evidence, manufacturer literature, and practitioner-uploaded materials are distinct categories with distinct trust levels. The platform must never present biased content as independent evidence.

---

## Feature 1: Deep Research

### Problem
Practitioners spend 2-4 hours per complex case manually searching PubMed, reading papers, and synthesizing findings. They need comprehensive literature reviews but don't have time to do them properly.

### Solution
An autonomous AI agent that runs for 5-10 minutes, performing multi-step research across PubMed, Cochrane, and partnership knowledge bases. Returns a formatted research brief with verified citations.

### User Flow
1. Practitioner opens chat or patient context
2. Clicks **"Deep Research"** button (or types `/research`)
3. Enters a research question: *"What is the current evidence for berberine vs. metformin in insulin resistance with concurrent NAFLD?"*
4. Agent starts — shows real-time progress:
   - "Searching PubMed for berberine insulin resistance meta-analyses..."
   - "Found 23 relevant papers. Analyzing top 12..."
   - "Cross-referencing with Cochrane systematic reviews..."
   - "Searching Apex Energetics knowledge base for berberine protocols..."
   - "Synthesizing findings..."
5. Returns a structured research brief (2,000-4,000 words):

```
DEEP RESEARCH BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question: Berberine vs. Metformin for Insulin Resistance with NAFLD

EXECUTIVE SUMMARY
Berberine demonstrates comparable efficacy to metformin for insulin
resistance (HbA1c reduction: -0.9% vs -1.1%) with superior hepatic
outcomes in NAFLD patients...

EVIDENCE ANALYSIS

1. Metabolic Efficacy (6 RCTs, 2 meta-analyses)
   • Wei et al. (2023) [META] — 14 RCTs, n=1,682...
   • Zhang et al. (2021) [RCT] — 12-week crossover...
   [REF-1] [REF-2] [REF-3]

2. Hepatic Outcomes (4 RCTs)
   • Berberine reduced ALT by 17.4 U/L vs 9.2 U/L for metformin...
   [REF-4] [REF-5]

3. Gut Microbiome Considerations
   • Both agents alter gut microbiome composition...
   [REF-6] [REF-7]

4. Safety & Interactions
   • GI side effects: berberine 12% vs metformin 25%...
   • CYP2D6 interaction risk with berberine...

FUNCTIONAL MEDICINE PERSPECTIVE
From IFM framework: berberine addresses multiple nodes on the
metabolic web (gut permeability, bile acid metabolism, AMPK activation)...

PARTNERSHIP INSIGHTS (Apex Energetics)
Apex Energetics offers BerbaMax — standardized berberine HCl with
enhanced bioavailability via phospholipid complex. Recommended dosing:
500mg 2-3x daily with meals. [REF-8]

CLINICAL RECOMMENDATION
For this patient profile (insulin resistance + NAFLD), berberine
may be preferred first-line given superior hepatic outcomes...

CITATIONS (12 verified)
[REF-1] Wei X, et al. "Berberine vs metformin..." Diabetes Care. 2023.
        DOI: 10.2337/dc23-0445 [META-ANALYSIS]
[REF-2] ...
```

### Technical Architecture
- **Agent loop**: Claude Opus with tool use (PubMed search, Cochrane search, partnership RAG, citation resolution)
- **Max iterations**: 10-15 tool calls per research session
- **Citations**: All grounded via existing `ground.ts` pipeline — no hallucinated references
- **Storage**: Research briefs saved as `research_briefs` table, linked to patient and/or conversation
- **Export**: PDF export with practice branding (reuse existing export template system)
- **Cost per query**: ~$0.50-1.50 (Opus + multiple tool calls). At unlimited usage on $199/mo, profitable at <200 queries/month per practitioner

### Database Schema
```sql
CREATE TABLE research_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id),
    patient_id UUID REFERENCES patients(id),
    conversation_id UUID REFERENCES conversations(id),
    question TEXT NOT NULL,
    brief_markdown TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    sources_used TEXT[] DEFAULT '{}',
    agent_steps JSONB DEFAULT '[]',
    model_used TEXT NOT NULL,
    total_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Feature 2: Protocol Generator Pro

### Problem
Building multi-phase treatment protocols is the highest-skill activity in functional medicine. New practitioners struggle with sequencing (what to address first), conditional branching (what to do if Phase 1 doesn't work), and dosing schedules across 3-6 months. Currently, this knowledge lives in expensive mentorship programs and years of clinical experience.

### Solution
AI-generated longitudinal treatment protocols that synthesize the patient's entire clinical picture into a phased, actionable plan with conditional logic, specific product recommendations, and built-in reassessment points.

### User Flow
1. Open patient profile → click **"Generate Treatment Protocol"**
2. Optional: select focus areas (gut, thyroid, detox, neuro, adrenal, metabolic)
3. Optional: select preferred supplement brands (Apex Energetics, etc.)
4. AI synthesizes all patient data (30-60 seconds):
   - All past visits (SOAP notes, assessments, plans)
   - All lab results with trends (improving, worsening, stalled)
   - Current supplements and medications
   - Intake form data (symptoms, lifestyle, family history, genetics)
   - IFM Matrix findings
   - Pre-chart clinical summary
   - Partnership knowledge base context
5. Returns a multi-phase protocol:

### Output Structure

```
TREATMENT PROTOCOL — [Patient Name]
Generated: March 31, 2026
Focus: Gut Restoration + Thyroid Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLINICAL RATIONALE
Based on elevated zonulin (48 ng/mL), suboptimal fT3 (2.4 pg/mL),
elevated TPO antibodies (234 IU/mL), and reported symptoms (fatigue
8/10, brain fog 7/10, bloating 6/10), this protocol prioritizes gut
barrier restoration before thyroid optimization. Rationale: intestinal
permeability drives immune dysregulation → thyroid autoimmunity.

PHASE 1: GUT BARRIER RESTORATION (Weeks 1-6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: Reduce zonulin, heal mucosal lining, reduce inflammation

Supplements:
  ┌─────────────────────────────────────────────────────────┐
  │ Product                    │ Dose        │ Timing       │
  ├────────────────────────────┼─────────────┼──────────────┤
  │ Apex RepairVite            │ 1 scoop 2x  │ AM/PM meals  │
  │ Apex Turmero-Active        │ 1 tsp       │ AM with food │
  │ Megasporebiotic            │ 2 caps      │ Breakfast    │
  │ Zinc Carnosine             │ 75mg        │ Before meals │
  └─────────────────────────────────────────────────────────┘

Diet:
  • 5R Protocol: Remove (gluten, dairy, soy, corn, eggs)
  • Replace: digestive enzymes with meals
  • Reinoculate: fermented vegetables, bone broth daily
  • Repair: L-glutamine 5g 2x daily (in RepairVite)
  • Rebalance: stress management (see lifestyle below)

Lifestyle:
  • Sleep: target 8 hours, blue light block after 8pm
  • Stress: 10 min morning breathwork (4-7-8 technique)
  • Exercise: walking only (30 min/day) — no HIIT until Phase 2

Labs to Order (end of Phase 1):
  • Zonulin, hs-CRP, fecal calprotectin, secretory IgA

DECISION POINT — END OF PHASE 1
  ├── IF zonulin < 30 AND hs-CRP < 1.0 → Proceed to Phase 2
  ├── IF zonulin 30-45 OR hs-CRP 1.0-3.0 → Extend Phase 1 by 4 weeks
  └── IF zonulin > 45 OR hs-CRP > 3.0 → Investigate SIBO/SIFO, consider
      GI-MAP stool test, add antimicrobials

PHASE 2: THYROID OPTIMIZATION (Weeks 7-14)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: Improve T4→T3 conversion, reduce TPO antibodies
Prerequisite: Phase 1 decision point passed

Supplements:
  ┌─────────────────────────────────────────────────────────┐
  │ Product                    │ Dose        │ Timing       │
  ├────────────────────────────┼─────────────┼──────────────┤
  │ Apex Thyro-CNV             │ 2 caps      │ AM empty     │
  │ Selenium (selenomethionine)│ 200 mcg     │ With lunch   │
  │ Apex RepairVite (maint.)   │ 1 scoop     │ AM           │
  │ Vitamin D3/K2              │ 5000 IU     │ With fat meal│
  │ Omega-3 (EPA/DHA)          │ 2g EPA      │ With meals   │
  └─────────────────────────────────────────────────────────┘

  Continue: Megasporebiotic, Zinc Carnosine (maintenance dose)
  Discontinue: Turmero-Active (reassess in Phase 3)

Labs to Order (end of Phase 2):
  • TSH, fT3, fT4, rT3, TPO Ab, Tg Ab
  • Vitamin D 25-OH, ferritin, iron panel

PHASE 3: OPTIMIZE & MAINTAIN (Weeks 15-24)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Goal: Long-term maintenance, symptom resolution, lifestyle anchoring
...

EXPECTED OUTCOMES (6 months)
  • Zonulin: 48 → <28 ng/mL
  • fT3: 2.4 → 3.0-3.5 pg/mL
  • TPO Ab: 234 → <100 IU/mL
  • Fatigue: 8/10 → 2-3/10
  • Brain fog: 7/10 → 1-2/10
```

### Technical Architecture
- **Model**: Claude Opus 4.6 with extended context
- **Context window**: Aggregates all patient data into a single prompt (visits, labs, supplements, intake, IFM matrix, pre-chart)
- **Partnership RAG**: Automatically queries partnership knowledge bases for product-specific recommendations
- **Storage**: `treatment_protocols` table with JSONB phases, linked to patient
- **Versioning**: Each regeneration creates a new version; practitioners can compare/revert
- **Active protocol**: One protocol can be marked "active" per patient — referenced by AI during visit generation
- **Export**: Branded PDF using existing export template system
- **Patient portal**: Optionally share simplified version with patient (supplements + diet + lifestyle, without clinical rationale)

### Database Schema
```sql
CREATE TABLE treatment_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID NOT NULL REFERENCES practitioners(id),
    title TEXT NOT NULL,
    focus_areas TEXT[] DEFAULT '{}',
    clinical_rationale TEXT,
    phases JSONB NOT NULL DEFAULT '[]',
    -- Each phase: { number, title, duration_weeks, goal, supplements[], diet[], lifestyle[], labs_to_order[], decision_points[] }
    expected_outcomes JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1,
    model_used TEXT NOT NULL,
    sources_used TEXT[] DEFAULT '{}',
    shared_with_patient BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active protocol per patient
CREATE UNIQUE INDEX idx_one_active_protocol
    ON treatment_protocols(patient_id)
    WHERE is_active = true;
```

### Integration with Existing Features
- **Visit generation**: When generating a SOAP note, if the patient has an active protocol, the AI references it: "Patient is in Phase 2, week 3. Zonulin has normalized (22 ng/mL). Thyroid optimization initiated per protocol."
- **Supplement list**: Protocol supplements can be pushed to `patient_supplements` with `source: 'protocol'`
- **Pre-chart**: Protocol summary included in pre-chart clinical narrative
- **Chat**: AI can answer questions in context of the active protocol

---

## Feature 3: Custom RAG (Private Knowledge Bases)

### Problem
Functional medicine practitioners accumulate specialized knowledge through certification programs (A4M, IFM, Kresser Institute, etc.), proprietary protocols, and clinical experience. This knowledge isn't in PubMed or any public database. Currently, practitioners can't leverage this knowledge through Apothecare's AI.

### Solution
Practitioners upload their own PDFs, documents, and protocols to a private knowledge base. These are OCR'd, chunked, embedded, and searchable — just like the Apex Energetics partnership content. The AI cites their private materials alongside public evidence.

### ⚠️ Critical: Custom RAG is NOT Evidence

Custom RAG documents are **reference materials**, not peer-reviewed evidence. They may be:
- **Manufacturer literature** — inherently biased toward their own products (e.g., Apex, Designs for Health, Metagenics)
- **Certification course materials** — reflect one organization's clinical philosophy, not consensus evidence (e.g., A4M modules, IFM coursework, Kresser Institute)
- **Conference presentations** — may contain preliminary findings not yet peer-reviewed
- **Proprietary protocols** — based on clinical experience, not controlled studies

**The platform must NEVER present Custom RAG content with the same trust level as PubMed citations.** This is both an ethical and legal requirement for a clinical decision support tool.

#### How the AI Handles Custom RAG

When Custom RAG chunks are included in context, the system prompt explicitly instructs the AI:

```
## Custom Knowledge Base Content (Practitioner-Uploaded)

IMPORTANT: The following excerpts are from the practitioner's private
knowledge base. These are NOT peer-reviewed evidence. They may reflect
manufacturer recommendations, certification course content, or personal
clinical protocols. Always note the source when citing this material
and distinguish it from peer-reviewed evidence in your response.

Source: [KB Name] — [Category: Certification Course]
---
[chunk text]
---
```

#### Three Scenarios the AI Must Handle

**1. Agreement (Custom RAG + peer-reviewed say the same thing):**
> "L-glutamine for gut repair is supported by peer-reviewed evidence [REF-1, RCT] and aligns with your A4M course materials [Custom · A4M GI Module]."

**2. Disagreement (Custom RAG contradicts peer-reviewed evidence):**
> "Your uploaded protocol recommends X [Custom · Protocol Name]. Note: current peer-reviewed evidence suggests Y may be more effective [REF-2, Meta-analysis]. Consider reviewing the latest evidence."

**3. Custom RAG only (no peer-reviewed evidence exists):**
> "Based on your A4M course materials [Custom · A4M GI Module], the recommended approach is X. *No peer-reviewed evidence was found for this specific recommendation.*"

This transparency is what makes Apothecare trustworthy in clinical practice.

### User Flow
1. Go to **Settings → Knowledge Bases** (new section)
2. Click **"Create Knowledge Base"**
3. Name it: *"A4M Advanced Metabolic Endocrinology"*
4. Upload PDFs (drag-and-drop, up to 50 documents per knowledge base)
5. System processes: OCR → chunk → embed → ready (progress shown)
6. Knowledge base appears as a toggle in the **Sources** filter (alongside PubMed, Cochrane, Apex, etc.)
7. When toggled on, AI searches private content and cites it:
   *"Based on your A4M curriculum, Module 4 recommends starting with adrenal support before thyroid optimization in patients with morning cortisol < 10 [REF-5: A4M Advanced Metabolic Endocrinology, Module 4, p.23]"*

### Technical Architecture
- **Reuse existing pipeline**: Same OCR (Claude vision), chunking (800 tokens, 200 overlap), embedding (text-embedding-3-small), and vector search (pgvector) as partnership RAG
- **Isolation**: Each knowledge base is scoped to a single practitioner via `practitioner_id` on all records
- **Storage**: Documents stored in Supabase Storage under `practitioner-knowledge/{practitioner_id}/{kb_id}/`
- **Ingestion**: Background job triggered on upload — same `ingest-apex-ocr.ts` pipeline adapted for generic documents
- **Search**: `search_evidence_v2` RPC extended with optional `practitioner_id` filter
- **Source filter**: New source type `custom:{kb_id}` appears in source filter UI

### Database Schema
```sql
CREATE TABLE practitioner_knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    document_count INTEGER NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'error', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend existing evidence_documents and evidence_chunks tables:
ALTER TABLE evidence_documents
    ADD COLUMN practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
    ADD COLUMN knowledge_base_id UUID REFERENCES practitioner_knowledge_bases(id) ON DELETE CASCADE;

ALTER TABLE evidence_chunks
    ADD COLUMN practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE;

-- RLS: practitioners only see their own + public (partnership) content
CREATE POLICY "Practitioners read own + public evidence"
    ON evidence_chunks FOR SELECT
    USING (practitioner_id IS NULL OR practitioner_id = (
        SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    ));
```

### Limits
- **Pro+ only**: Custom RAG requires Pro+ subscription
- **Storage**: Up to 500MB per practitioner (covers ~200-300 PDFs)
- **Knowledge bases**: Up to 10 per practitioner
- **Documents per KB**: Up to 50
- **Ingestion queue**: Processed in background, ~2-5 minutes per document

---

## Pricing Justification

| Feature | Value Replaced | Market Rate |
|---------|---------------|-------------|
| Deep Research | 2-4 hours of manual lit review per case | $200-500/case if outsourced |
| Protocol Generator Pro | FM mentorship / clinical experience | $500/hr mentor, $5,000+ certification programs |
| Custom RAG | No equivalent — unique to Apothecare | Priceless competitive moat |
| Deep Consult (unlimited) | Specialist second opinion | $300-500/consult |

**$199/mo is a fraction of a single specialist consultation.** A practitioner who uses Deep Research once and Protocol Generator once per month is already getting $700+ of value.

### Cost Structure (per practitioner/month)
- Deep Consult (Opus): ~$5-15 (avg 10 queries × $0.50-1.50)
- Deep Research (Opus + tools): ~$10-30 (avg 10 briefs × $1-3)
- Protocol Generator (Opus): ~$5-10 (avg 5 protocols × $1-2)
- Custom RAG (embeddings + storage): ~$2-5
- **Total marginal cost: $22-60/month per Pro+ practitioner**
- **Gross margin: 70-89% at $199/mo**

---

## Implementation Priority

1. **Stripe Integration** (prerequisite for all) — payment processing, tier management
2. **Deep Consult Credit System** — usage metering, 10/month for Pro, unlimited for Pro+
3. **Protocol Generator Pro** — highest perceived value, uses existing patient data
4. **Deep Research** — autonomous agent loop, highest technical complexity
5. **Custom RAG** — extends existing pipeline, moderate complexity

### Estimated Development Timeline
- Stripe + Credits: 1 sprint (1 week)
- Protocol Generator Pro: 2 sprints
- Deep Research: 2 sprints
- Custom RAG: 2 sprints
- Total: ~7 sprints (7-8 weeks)

---

## Evidence Source Hierarchy

This is how Apothecare ranks and displays different source types across all features (chat, Deep Research, Protocol Generator, Custom RAG):

| Tier | Source Type | Badge Style | Trust Level | Example |
|------|-----------|-------------|-------------|---------|
| 1 | Systematic Review / Meta-analysis | Gold **"META"** | Highest | Cochrane Review |
| 2 | Randomized Controlled Trial | Blue **"RCT"** | High | PubMed RCT |
| 3 | Clinical Practice Guideline | Green **"GUIDELINE"** | High | Endocrine Society, ACP |
| 4 | Cohort / Observational Study | Purple **"COHORT"** | Moderate | PubMed cohort study |
| 5 | Case Study / Series | Gray **"CASE"** | Lower | PubMed case report |
| 6 | Partnership Protocol | Purple **"Partner · [Name]"** | ⚠️ Reference only | Apex Energetics product literature |
| 7 | Custom RAG | Indigo **"Custom · [KB]"** | ⚠️ Reference only | A4M course, personal protocol |
| 8 | Expert Consensus / Textbook | Gray **"EXPERT"** | ⚠️ Reference only | Clinical experience |

**Tiers 1-5** are independently verifiable peer-reviewed sources.
**Tiers 6-8** are reference materials — useful for clinical practice but NOT independent evidence. They may carry inherent bias (manufacturer product recommendations, single organization's philosophy, or individual clinical opinion). The platform must always distinguish these visually and in AI prompt instructions.

### How This Applies to Each Feature

**Chat:** Evidence badges already distinguish tiers 1-5. Partnership content (tier 6) currently uses a fallback badge. Custom RAG (tier 7) needs a new distinct badge style.

**Deep Research:** Should ONLY use tiers 1-5 (peer-reviewed sources). Partnership and Custom RAG content should NOT appear in Deep Research results — this is a pure evidence feature. If partnership insights are relevant, they appear in a separate "Partnership Insights" section clearly labeled as manufacturer content.

**Protocol Generator Pro:** Uses ALL tiers, but each supplement/recommendation carries a `source_type` field:
- `"evidence"` — backed by PubMed/Cochrane citation → standard evidence badge
- `"partner_protocol"` — from partnership RAG → purple "Partner · [Name]" badge
- `"custom_rag"` — from practitioner's KB → indigo "Custom · [KB Name]" badge
- `"clinical_framework"` — from IFM/A4M framework → teal "Framework" badge
- `"practitioner_preference"` — from brand formulary → gray "Preferred" badge

The practitioner always sees where each recommendation originates and can make an informed clinical judgment.

**Custom RAG:** Always rendered with the indigo "Custom · [KB Name]" badge. Never promoted to a higher evidence tier regardless of the content. Even if a practitioner uploads a published RCT as a PDF, it should be cited from PubMed (tier 2), not from their custom KB — the Custom RAG version lacks the verification chain.

---

## You.com API Integration (Under Evaluation)

### Context
You.com offers a web search API with verified snippet extraction that could enhance two areas:

### Potential Use Case 1: Citation Verification Layer
After our existing `ground.ts` resolves citations from RAG chunks, use You.com's Deep Search API to verify that the cited paper actually supports the claim being made. This catches the "real paper, wrong claim" hallucination type.

- **Endpoint:** `GET https://api.ydc-index.io/v1/search`
- **Cost:** $5/1,000 calls ($0.005 per verification)
- **Value:** Prevents citing real papers that don't actually support the claim

### Potential Use Case 2: Deep Research Backend
You.com's Research API (`POST https://api.you.com/v1/research`) with `research_effort: "deep"` could serve as the retrieval engine for the Deep Research feature instead of building a custom PubMed agent.

- **Pros:** Multi-step search built-in, verified citations, fast to integrate
- **Cons:** Returns general web results (not PubMed-specific), cost per deep call TBD, no control over source quality filtering
- **Evaluate:** Test with $100 free credits, assess whether sources are journal-quality or generic health blogs

### Decision Criteria
- If You.com Research API returns ≥80% PubMed/journal-quality sources for clinical queries → integrate as Deep Research backend
- If sources are too generic → build custom PubMed agent (Option B)
- Citation verification layer (Use Case 1) is valuable regardless — low cost, high impact on hallucination reduction

---

## Open Questions

1. **You.com Research API pricing:** Need actual per-call costs for each `research_effort` tier before committing
2. **Stripe integration timeline:** Payment processing is a prerequisite for all tier differentiation
3. **Custom RAG storage costs:** At 500MB × N practitioners, what's the Supabase storage/pgvector cost at scale?
4. **Protocol liability disclaimer:** Should generated protocols include "AI-generated — practitioner review required before clinical use"?
5. **Deep Research source restriction:** Should we restrict to PubMed/medical journals only, or allow general web (with quality filtering)?
6. **Partnership RAG in protocols:** When Apex is selected as preferred brand, how prominently should Apex products appear vs. generic alternatives? Must always show both?
7. **Custom RAG content moderation:** What if a practitioner uploads pseudoscientific content? Do we validate or just badge it appropriately?

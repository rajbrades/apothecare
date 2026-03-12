# Apothecare — Business Plan & Platform Strategy

**Version:** 2.0
**Date:** March 2026
**Frame:** The Bloomberg Terminal for Functional Medicine

---

## 1. Executive Summary

Apothecare is an AI clinical intelligence platform purpose-built for functional and integrative medicine. It is not a scribe. It is not a chatbot. It is the infrastructure layer that functional medicine practitioners, labs, supplement brands, and eventually payors will depend on — because the clinical intelligence inside it does not exist anywhere else.

The immediate product is a practitioner-facing AI copilot that handles pre-visit synthesis, pattern recognition, safety screening, evidence retrieval, and documentation. The long-term business is the **Clinical Intelligence Graph**: a proprietary outcomes dataset that aggregates every protocol decision, biomarker pattern, and clinical result across thousands of practitioners and hundreds of thousands of patients — and becomes self-improving, defensible, and licensable.

**Raise:** $1.5M Seed
**Target:** 500 paying practitioners in 18 months, $1M ARR, Protocol Marketplace live, outcomes graph seeded

---

## 2. The Problem

Functional medicine encounters are structurally complex:
- A single new patient visit involves 50+ biomarkers, 30+ pages of intake history, and complex protocol matching across lifestyle, supplements, and targeted therapies
- Practitioners document for 2+ hours per hour of patient care
- There is no dominant software platform built for this specialty — only generic EHRs hostile to root-cause medicine

**The result:** Functional medicine is capped by cognitive load. The most knowledgeable practitioners in the fastest-growing segment of healthcare are running their practices on PDF exports, browser tabs, and institutional memory.

---

## 3. The Solution: Four-Layer Platform Architecture

The correct mental model for Apothecare is not "AI tool" — it is "platform with compounding layers." Each layer is harder to replicate than the last.

### Layer 1: Data (Foundation)
HIPAA-compliant, federated, PHI-safe storage built for regulatory review from day one. Immutable audit trail. Full clinical provenance on every output. SOC 2 Type II target by Year 2.

### Layer 2: Platform (The Working Product)
Multi-tenant SaaS running on five MCP (Model Context Protocol) servers:
- **Patient Context Server** — demographics, labs, meds, timeline, symptom scores
- **Clinical Logic Server** — pattern libraries, protocol matching, IFM Matrix, retesting logic
- **Safety Engine Server** — interaction checks, contraindications, red flags, scope guardrails
- **Documentation & Workflow Server** — SOAP drafts, AVS generation, follow-up tasks
- **Evidence & Research Server** — PubMed retrieval, monographs, citation grounding

This is what is live today. It is the wedge.

### Layer 3: Intelligence (The Moat)
Every tool call, pattern match, protocol recommendation, and clinical outcome is logged with full provenance and version tagging. Over time, this becomes the **Clinical Intelligence Graph**: a proprietary map of which patterns correlate with which protocols correlate with which outcomes — at a population level across thousands of practitioners.

This graph does not exist anywhere in the world today. It cannot be purchased. It can only be built through consistent clinical use over time. It is the reason Apothecare becomes defensible at scale.

### Layer 4: Network (The Business)
The Protocol Marketplace, Patient Portal, and API Economy that run on top of Layer 3. Third parties build on Apothecare. Revenue flows through it. The network becomes more valuable with every new practitioner, patient, and protocol.

---

## 4. The Three Compounding Moats

### Moat 1 — Clinical Intelligence Graph
Aggregated, de-identified outcomes data that no competitor can replicate. Becomes a licensing asset to pharma and supplement brands, the foundation for clinical trial recruitment, and eventually evidence for insurance reimbursement.

### Moat 2 — Protocol Network Effects
Practitioners who build protocols inside Apothecare leave their practice history here. Leaving means losing their own outcomes data. Data gravity creates retention that SaaS contracts cannot.

### Moat 3 — Regulatory Positioning
FDA 510(k) or De Novo clearance on safety-critical tools (interaction checker, contraindication screening, red flag detection). 3–5 year lead time creates a barrier competitors cannot quickly cross. Health systems and payors require cleared tools.

---

## 5. Clinical Provenance: The Trust Layer

This is not an audit log. It is a first-class clinical feature.

In clinical settings, black-box correctness is not enough. A practitioner cannot act on a recommendation they cannot explain. For every Apothecare output, the provider must be able to see:

- **Which data points were used** — which labs, meds, symptoms, history items fed the reasoning
- **Which patterns fired** — which clinical patterns were matched and at what confidence
- **Which safety checks ran** — which interaction, contraindication, and red flag screens passed or failed, and why
- **Which evidence supported the suggestion** — specific citations, study types, and evidence quality grades
- **Which protocol version was applied** — so that if outcomes differ from expected, the specific version can be investigated

This provenance layer is what separates Apothecare from every generic AI tool in medicine. It is also what makes the Clinical Intelligence Graph auditable, trustworthy, and ultimately licensable. And it is a direct response to FDA expectations for clinical decision support software under the 21st Century Cures Act.

Implementation: every AI output is stored with a `provenance` JSON object containing the full reasoning trace — data inputs, pattern matches, rules fired, safety check results, evidence sources, and protocol version hash.

---

## 6. Revenue Model

### Phase 1 (Now): Practitioner SaaS
- **Pro:** $199/mo — full platform access
- **Practice:** $499/mo — multi-provider, clinic analytics, white-label patient sharing
- **Enterprise:** Custom — health systems, integrative medicine groups

This is the wedge. Every subscriber feeds the graph.

### Phase 2 (Year 1–2): Protocol Marketplace
Practitioners publish protocols. Other practitioners browse, adopt, and rate them. Institute-branded protocol collections (IFM Mode, A4M Mode).
- Take rate on protocol licensing: 20–30%
- Supplement brand sponsored pathways: clearly labeled, clinically validated
- Fullscript / dispensary integration: 10–15% of supplement GMV generated through Apothecare protocols

### Phase 3 (Year 2–3): Data Licensing
De-identified, aggregated outcomes data licensed to:
- Supplement brands (which formulations correlate with biomarker improvement)
- Functional medicine-focused pharma (real-world evidence for pipeline compounds)
- Research institutions (retrospective studies, RCT recruitment)
- Insurance actuaries (outcomes modeling for alternative/integrative care coverage)

### Phase 4 (Year 3–5): Enterprise & Health Systems
As integrative medicine moves into hospital systems and ACOs:
- Enterprise SaaS contracts ($50k–500k/yr)
- FHIR integration with Epic, Cerner, athenahealth
- Requires FDA clearance and SOC 2 Type II — which we will have

### Phase 5 (Year 5+): Payor Integration
Outcomes-based billing. Apothecare-documented protocols linked to measurable biomarker outcomes. First mover on demonstrating ROI for functional medicine interventions to insurers.

### Unit Economics
| Metric | Value |
|---|---|
| Practitioner MRR (Pro) | $199/mo |
| Practitioner avg. active patients | 20 |
| Supplement GMV per patient/mo | $300 |
| Marketplace take rate | 10% |
| Marketplace MRR per practitioner | $600/mo |
| Combined MRR per practitioner | ~$800/mo |
| 36-month LTV | ~$28,800 |
| CAC target | <$500 (institute channel) |

---

## 7. Go-To-Market Strategy

### The Institute Channel (Primary)
Partner with IFM and A4M to become the **official clinical runtime for their curriculum**.

- **The Monday Morning Gap:** Graduates leave weekend seminars inspired and overwhelmed. They have zero tools to operationalize the Matrix in clinical practice. Apothecare closes that gap.
- **Institute Mode:** AI strictly follows one institute's protocols and evidence standards
- **Revenue share:** Institutes earn royalties on subscriptions attributed to their alumni
- **Distribution:** IFM has 10,000+ certified practitioners. A4M has 26,000 members. One partnership is worth 2 years of direct sales.

### Product-Led Growth (Secondary)
- Every protocol pushed to a patient includes Apothecare branding on the output
- Patients share protocols → their network asks "who is your doctor?" → practitioners onboard
- Patient portal as acquisition: patients self-enroll, bring their own labs and wearable data, invite their practitioner

### Direct Sales (Tertiary)
Bottom-up: individual practitioners discover through search, content, and referral
Top-down: enterprise conversations with integrative health groups and hospital systems

---

## 8. Competitive Advantage

| Feature | Generic Scribes (Heidi, Nabla) | Generic LLMs (ChatGPT) | EHRs (Cerbo, ChARM) | **Apothecare** |
|---|:---:|:---:|:---:|:---:|
| Ambient AI Scribe | ✅ | ❌ | ❌ | ✅ |
| IFM Matrix Mapping | ❌ | ❌ | ❌ | ✅ |
| Functional Lab Ranges | ❌ | ❌ | ❌ | ✅ |
| Cited Evidence (RAG) | ❌ | ⚠️ hallucinates | ❌ | ✅ |
| Supplement Intelligence | ❌ | ❌ | ❌ | ✅ |
| Clinical Provenance | ❌ | ❌ | ❌ | ✅ |
| Outcomes Graph | ❌ | ❌ | ❌ | ✅ (building) |
| Protocol Marketplace | ❌ | ❌ | ❌ | ✅ (roadmap) |
| FDA Safety Clearance | ❌ | ❌ | ❌ | 🔄 (in progress) |

---

## 9. Roadmap

### Phase 0 — Foundation Hardening (Now, 4 weeks)
Non-negotiable infrastructure that must exist before scale:
- Immutable audit logging table: every AI call logged with inputs, outputs, provider ID, timestamp
- Clinical provenance object on every AI output (data used, patterns fired, safety checks, citations, protocol version)
- Protocol versioning: every recommendation tagged with a version hash
- These are Supabase migrations + middleware wrapper — not a rewrite

### Phase 1 — MCP Layer + MVP 10 Tools (Months 1–3)
Formalize the five MCP servers on top of existing APIs. Ship the 10 highest-value tools:
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

### Phase 2 — Outcomes Graph Infrastructure (Months 3–6)
- Outcomes schema: protocol → followup labs → biomarker delta → provider rating
- Wire existing `protocol-milestones` and `symptom-logs` to outcomes pipeline
- Background job that computes protocol effectiveness signals
- De-identification layer for graph aggregation

### Phase 3 — Protocol Marketplace (Months 6–9)
- Protocol publishing: practitioners publish versioned protocols
- Browse and adopt: practitioners discover community protocols
- Institute Mode: A4M and IFM branded protocol collections
- Supplement brand pathways: sponsored, clearly labeled, clinically grounded

### Phase 4 — Patient Network (Months 9–12)
- Patient portal: view protocol, labs, timeline
- Self-enrollment via practitioner referral link
- Patient-contributed data (wearables, Apple Health, Oura)
- Grows the graph faster. Creates direct-to-patient acquisition channel.

### Phase 5 — API Economy + Regulatory (Year 2)
- Public API for third-party integrations (labs, supplement brands, other tools)
- FDA pre-submission meeting for safety tools (interaction checker, red flag detection)
- SOC 2 Type II audit completion
- FHIR integration pilot with one EHR

---

## 10. Financial Projections

| Year | Practitioners | ARR (SaaS) | Marketplace GMV | Total ARR |
|---|---|---|---|---|
| Year 1 | 200 | $480K | $200K | ~$680K |
| Year 2 | 800 | $1.9M | $1.2M | ~$3.1M |
| Year 3 | 2,500 | $6M | $5M | ~$11M |
| Year 5 | 10,000 | $24M | $25M | ~$49M |

Data licensing and enterprise contracts are additive to these figures starting Year 3.
Path to $100M ARR requires ~25,000 practitioners or enterprise/payor contracts. Both are achievable given market size.

---

## 11. The Team

**Ryan Brady — Founder/CEO**
Full-stack engineer, AI architect, clinical workflow designer. Built the entire working MVP.
ryan@apothecare.ai

**Advisory Board (Building)**
- Functional Medicine MD — clinical validation and practitioner credibility
- Health AI regulatory counsel — FDA 510(k) / De Novo strategy
- IFM or A4M insider — institute partnership pathway
- Health system executive — enterprise GTM

---

## 12. The Ask

**Raising:** $1.5M Seed

**Use of Funds:**
- 40% Engineering — MCP infrastructure, provenance layer, outcomes pipeline, marketplace
- 25% Clinical — advisory board, protocol curation, safety tool validation
- 20% Growth — institute partnership execution, practitioner onboarding, brand deals
- 15% Ops/Legal — HIPAA hardening, SOC 2, FDA pre-submission

**18-Month Milestones:**
1. 500 paying practitioners
2. Outcomes graph seeded: 10,000+ protocol-outcome data points
3. Protocol Marketplace live with 3 supplement brand partners
4. FDA pre-submission meeting completed
5. Institute pilot live (A4M or IFM)

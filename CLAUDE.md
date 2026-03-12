# Apothecare — Engineering North Star

Every line of code written in this project must serve the end goal:

> **Apothecare is the Bloomberg Terminal for functional medicine — the infrastructure layer that practitioners, labs, supplement brands, and payors cannot operate without, because the clinical intelligence inside it does not exist anywhere else.**

This is not a copilot. This is a platform. Copilots get acquired for $50–200M. Platforms become billion-dollar companies.

---

## The Four-Layer Architecture

Every feature, every schema, every API decision must be evaluated against which layer it serves and whether it strengthens the layers above and below it.

```
LAYER 4: NETWORK
  Protocol Marketplace · Patient Portal · API Economy
  Third parties build ON Apothecare. Revenue flows THROUGH it.

LAYER 3: INTELLIGENCE  ← The Moat
  Clinical Intelligence Graph · Outcomes Engine · Self-improving Model Layer
  Gets smarter with every interaction. Impossible to buy or replicate.

LAYER 2: PLATFORM  ← Where we are now
  Multi-tenant SaaS · Five MCP Servers · Integration Hub
  The working product. The wedge.

LAYER 1: DATA  ← The Foundation
  Federated PHI-safe storage · Immutable Audit Log · Clinical Provenance
  HIPAA-compliant. SOC 2 target. Built for FDA review from day one.
```

---

## The Three Compounding Moats

1. **Clinical Intelligence Graph** — Every protocol decision, pattern match, and outcome logged and aggregated into a proprietary dataset no competitor can replicate.
2. **Protocol Network Effects** — Practitioners who build inside Apothecare leave their practice history here. Data gravity creates retention SaaS contracts cannot.
3. **Regulatory Positioning** — FDA 510(k) clearance on safety-critical tools (interaction checker, contraindications, red flags). Begin now. Clear in 3–4 years.

---

## Non-Negotiable Engineering Principles

### 1. Clinical Provenance on Every AI Output
Every AI-generated recommendation must be stored with a full provenance object. This is not logging. This is the trust layer that makes Apothecare usable in clinical settings where black-box AI is unacceptable.

For every output, a provider must be able to see:
- **Which data points were used** — labs, meds, symptoms, history
- **Which patterns fired** — clinical patterns matched, at what confidence
- **Which safety checks ran** — each check by name, pass/fail, and reason
- **Which evidence supported it** — specific citations, study type, evidence grade
- **Which protocol version was applied** — so outcomes can be traced back to specific logic

Schema: every AI call writes to `ai_outputs` with `inputs`, `patterns_matched`, `safety_checks`, `evidence_sources`, `protocol_version`, and `provider_action` fields.

### 2. Protocol Versioning
Every recommendation references a versioned protocol definition. When outcomes come back 90 days later, we know exactly which logic produced them. Never write a protocol recommendation without tagging it to a version.

### 3. Immutable Audit Trail
Every state change, every AI call, every provider action is appended to `audit_log`. No updates. No deletes. This is the evidentiary backbone for SOC 2, HIPAA compliance, and FDA submission.

### 4. The Outcomes Graph Is Always Hungry
Every schema decision should ask: "does this make it easier or harder to compute protocol effectiveness?" Patient data, protocol decisions, and followup results must be linkable. If you're adding a new table, check whether it should have a foreign key into the outcomes pipeline.

### 5. Build for the API Economy
Every internal API we build today is a candidate for the public API in Year 2. Write routes as if a third-party lab vendor or supplement brand will be calling them. Clean contracts. Versioned endpoints. Explicit error responses.

### 6. Safety Is Non-Optional and Non-Delegatable
The Safety Engine is the only part of Apothecare that cannot fail gracefully. If interaction checking or contraindication screening fails, the answer is not "proceed anyway" — it is "block and surface the error." Every safety tool call must be logged with full provenance regardless of outcome.

### 7. Human Review Before Any Irreversible Action
Apothecare assists practitioners. It does not replace them. No code should ever take an irreversible clinical action (protocol push, patient communication, order generation) without an explicit provider confirmation step. This is a product principle and a regulatory one.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15, TypeScript, App Router |
| Styling | Tailwind CSS 4, CSS custom properties |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Primary AI | Anthropic Claude (claude-opus-4-6 for reasoning, claude-haiku-4-5 for fast tasks) |
| Vision / Lab Parsing | Anthropic Claude Vision |
| Transcription | OpenAI Whisper |
| RAG Vector Store | pgvector via Supabase |
| Editor | Tiptap (ProseMirror) |
| Deployment | Vercel |

**AI model note:** Claude is the primary model for all reasoning tasks. Consistency in the reasoning model is required for the outcomes graph to be meaningful. Do not introduce new AI providers without explicit consideration of how it affects provenance and outcomes consistency.

---

## Execution Phases (Current Priorities)

| Phase | Focus | Status |
|---|---|---|
| **Phase 0** | Clinical provenance layer, protocol versioning, audit log, AI standardization | 🔴 Must do first |
| **Phase 1** | Five MCP servers, MVP 10 tools | 🟡 Next |
| **Phase 2** | Outcomes graph infrastructure | 🟡 After Phase 1 |
| **Phase 3** | Protocol Marketplace + Institute Mode | 🔵 Roadmap |
| **Phase 4** | Patient Portal + growth loop | 🔵 Roadmap |
| **Phase 5** | Public API + FDA clearance + SOC 2 | 🔵 Year 2 |

See `PLATFORM_STRATEGY.md` for full execution detail.
See `BUSINESS_PLAN.md` for strategic context.
See `PITCH_DECK_INVESTORS.md` for investor narrative.

---

## What We Are Not Building

- A full EHR — we are the intelligence layer, not the record of record
- A direct-to-consumer app — the patient portal serves practitioners' patients
- A general-purpose AI — every feature must serve functional medicine practitioners specifically
- A supplement store — we are the decision layer, not the dispensary

---

## The Question to Ask Before Every Commit

> "Does this code make the Clinical Intelligence Graph richer, the provenance layer more complete, the platform more open, or the safety layer more trustworthy?"

If the answer is no to all four — reconsider whether it should be built at all.

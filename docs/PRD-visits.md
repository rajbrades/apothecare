# PRD: Clinical Visits Module

**Product:** Apotheca
**Module:** Visits
**Status:** v1.0 — Implemented
**Last Updated:** 2026-02-13

---

## 1. Overview

The Visits module is the core clinical documentation system in Apotheca. It provides functional medicine practitioners with a structured workflow for creating, documenting, and generating AI-assisted clinical notes for patient encounters. The module supports four encounter types, a block-based editor with collapsible template sections, voice input (live dictation + AI Scribe), multi-phase AI generation (SOAP → IFM Matrix → Protocol), and export to clipboard/PDF.

---

## 2. Target Users

| Persona | Description |
|---|---|
| **Functional Medicine Practitioner** | Primary user. Documents patient encounters, generates SOAP notes, maps findings to IFM Matrix, creates evidence-based protocols. |
| **Integrative Health Provider** | Uses consult and follow-up templates. Relies on AI Scribe for hands-free documentation during encounters. |

---

## 3. User Problems Addressed

1. **Documentation burden** — Clinical note-taking is time-consuming and pulls practitioners away from patient interaction.
2. **Functional medicine complexity** — IFM Matrix mapping and protocol creation require cross-referencing multiple domains; AI assistance reduces cognitive load.
3. **Unstructured notes** — Raw notes lack the organization needed for billing, compliance, and continuity of care.
4. **Voice-to-documentation gap** — Practitioners need to speak naturally during encounters and have notes structured automatically.

---

## 4. Encounter Types

| Type | Key | Section Count | Use Case |
|---|---|---|---|
| **SOAP Note** | `soap` | 9 | Standard clinical encounter documentation |
| **History & Physical** | `history_physical` | 12 | New patient intake, comprehensive evaluation |
| **Consultation** | `consult` | 6 | Specialist referral or second opinion |
| **Follow-Up** | `follow_up` | 6 | Progress tracking, protocol adjustments |

### 4.1 SOAP Template Sections

| Section | Badge | Default Collapsed |
|---|---|---|
| Chief Complaint | CC | No |
| History of Present Illness | HPI | No |
| Review of Systems | ROS | Yes |
| Vitals | V | Yes |
| Physical Examination | PE | Yes |
| Lab Results & Diagnostics | Lab | Yes |
| Current Medications & Supplements | Meds | Yes |
| Assessment | A | No |
| Plan | P | No |

### 4.2 History & Physical Template Sections

Chief Complaint, HPI, Past Medical History, Family History, Social History, Review of Systems, Medications & Allergies, Vitals, Physical Examination, Laboratory & Diagnostics, Assessment, Plan

### 4.3 Consultation Template Sections

Reason for Consultation, Relevant History, Focused Examination, Records Reviewed, Clinical Impression, Recommendations

### 4.4 Follow-Up Template Sections

Progress Since Last Visit, Current Symptoms, Protocol Adherence, New Labs & Findings, Updated Assessment, Plan Modifications

---

## 5. User Flows

### 5.1 Create a New Visit

```
/visits → "New Visit" button → /visits/new
  1. Select encounter type (SOAP, H&P, Consult, Follow-up)
  2. (Optional) Select existing patient OR click "+ New" to create inline
  3. Choose entry mode:
     a. "AI Scribe" → creates visit, redirects to /visits/{id}?mode=transcribe
     b. "Type Notes" → creates visit, redirects to /visits/{id}
```

**API:** `POST /api/visits` with `{ visit_type, patient_id?, chief_complaint? }`
**Result:** Visit created with status `draft`, editor loads with template sections.

### 5.2 Document in the Block Editor

```
/visits/{id}
  1. Editor loads encounter template (collapsible sections)
  2. Click into any section → type clinical notes
  3. Use toolbar for formatting (bold, italic, lists)
  4. Collapse/expand sections as needed
  5. Content auto-saves (debounced 2s) to template_content (JSON) and raw_notes (text)
```

**Storage:** `template_content` stores Tiptap JSON (source of truth for editor state); `raw_notes` stores flattened text (used for AI input).

### 5.3 AI Scribe (Voice-to-Sections)

```
/visits/{id}?mode=transcribe
  1. Recording auto-starts on page load
  2. Practitioner speaks the encounter naturally
  3. Click "Stop Recording"
  4. Click "Process with AI Scribe"
  5. Pipeline:
     a. Audio → Whisper API → transcript text
     b. Transcript → Claude → section assignment
  6. Editor sections auto-populate with assigned content
  7. Practitioner reviews/edits populated sections
```

**APIs:**
- `POST /api/visits/{id}/transcribe` — audio blob → transcript
- `POST /api/visits/{id}/scribe` — transcript → section map

**Audio constraints:** Max 25MB. Formats: webm, mp4, mpeg, ogg, wav, flac. Max duration: 30 minutes.

### 5.4 Live Dictation

```
  1. Click "Dictate" button in dictation bar
  2. Speak → text inserts at cursor position in real-time (Web Speech API)
  3. Click into different sections to direct dictation to specific areas
  4. Click "Complete Note" when done
```

**Key behavior:** Text inserts wherever the cursor is focused. If the user clicks into "Assessment" and starts dictating, text appears in the Assessment section.

### 5.5 Generate Clinical Note (AI Pipeline)

```
  1. Click "Generate Clinical Note" button
  2. Editor content flattened to text (## Section Heading format)
  3. SSE stream begins with up to 3 phases:

  Phase 1 — SOAP Note
    → Claude generates structured JSON: { subjective, objective, assessment, plan }
    → Streams incrementally with live preview
    → Saved to visit record on completion

  Phase 2 — IFM Matrix
    → Claude maps SOAP findings to 7 IFM nodes
    → Each node: findings[], severity (none/low/moderate/high), notes
    → Rendered as color-coded grid

  Phase 3 — Protocol
    → Claude generates evidence-based recommendations
    → Four categories: supplements, dietary, lifestyle, follow_up_labs
    → Each item: name, dosage, form, timing, duration, rationale, evidence_level, interactions
    → Drug interaction warnings highlighted
```

**API:** `POST /api/visits/{id}/generate` with `{ raw_notes, sections: ["soap", "ifm_matrix", "protocol"] }`

**Models:**
- SOAP/IFM/Protocol: Claude Sonnet (standard model)
- Patient context injected into prompts when visit has linked patient

### 5.6 Review & Edit Generated Content

```
  SOAP Tab:
    - Four collapsible sections (S, O, A, P)
    - Click "Edit" on any section to modify in textarea
    - Click "Done" to save edits

  IFM Matrix Tab:
    - 7-node grid with color-coded severity
    - Expandable findings lists
    - Read-only (regenerate to update)

  Protocol Tab:
    - Four recommendation categories
    - Expandable items with evidence levels
    - Drug interaction warnings
    - Read-only (regenerate to update)
```

### 5.7 Mark Visit Complete

```
  1. Click "Mark Complete" button in workspace header
  2. Visit status changes to "completed"
  3. Editor becomes read-only
  4. "Reopen" button appears to reverse
```

**Constraint:** Completed visits cannot be modified (transcribe, scribe, generate all return 409).

### 5.8 Export Visit

```
  Export menu (dropdown):
    a. "Copy to Clipboard" → formatted SOAP text copied
    b. "Download PDF" → opens print-ready HTML in new tab → browser Print dialog
```

**API:** `GET /api/visits/{id}/export` returns styled HTML document.

### 5.9 Patient Quick-Create (Inline)

```
  On /visits/new:
    1. Click "+ New" next to patient selector
    2. Modal opens with fields: first name, last name, DOB, sex, chief complaints
    3. Submit → patient created → auto-selected in dropdown
    4. Continue with visit creation
```

**API:** `POST /api/patients`

---

## 6. Data Model

### 6.1 Visit Record

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `practitioner_id` | UUID | Owner (FK → practitioners) |
| `patient_id` | UUID | Linked patient (nullable) |
| `visit_date` | timestamp | Encounter date |
| `visit_type` | enum | soap, follow_up, history_physical, consult |
| `status` | enum | draft, completed |
| `note_template` | string | Template variant used |
| `chief_complaint` | text | Primary complaint (max 500 chars) |
| `raw_notes` | text | Flattened text for AI input |
| `template_content` | JSONB | Tiptap editor JSON (structured source of truth) |
| `subjective` | text | SOAP S field |
| `objective` | text | SOAP O field |
| `assessment` | text | SOAP A field |
| `plan` | text | SOAP P field |
| `ai_soap_note` | text | Full AI-generated SOAP JSON |
| `ai_assessment` | text | AI assessment text |
| `ai_plan` | text | AI plan text |
| `ifm_matrix` | JSONB | IFM Matrix mapping (7 nodes) |
| `ai_protocol` | JSONB | Evidence-based protocol recommendations |
| `conversation_id` | UUID | Linked chat conversation (nullable) |
| `is_archived` | boolean | Soft delete flag |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last modification |

### 6.2 Related Types

**IFMMatrix** — 7 nodes (assimilation, defense_repair, energy, biotransformation, transport, communication, structural_integrity). Each node has `findings: string[]`, `severity: "none" | "low" | "moderate" | "high"`, `notes: string`.

**VisitProtocol** — 4 categories (supplements, dietary, lifestyle, follow_up_labs). Each item has `name`, `detail`, `rationale`, `evidence_level`, `dosage`, `form`, `timing`, `duration`, `interactions`.

**EvidenceLevel** — meta_analysis, rct, guideline, cohort_study, case_series, expert_opinion, traditional_use

---

## 7. API Surface

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/visits` | List visits with cursor pagination, filter by status/patient/search |
| POST | `/api/visits` | Create new visit |
| GET | `/api/visits/:id` | Get single visit with patient data |
| PATCH | `/api/visits/:id` | Update visit fields |
| DELETE | `/api/visits/:id` | Soft-delete (archive) visit |
| POST | `/api/visits/:id/generate` | AI generation pipeline (SSE stream) |
| POST | `/api/visits/:id/transcribe` | Audio → Whisper transcription |
| POST | `/api/visits/:id/scribe` | Transcript → AI section assignment |
| GET | `/api/visits/:id/export` | Export as printable HTML |

See [API.md](./API.md) for full request/response schemas.

---

## 8. Editor Architecture

### 8.1 Block Editor (Tiptap)

- **Library:** Tiptap with `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`
- **Custom Extension:** `templateSection` node — defines collapsible section blocks
- **NodeView:** React component (`TemplateSectionNode`) renders each section with badge, heading, collapse toggle
- **Toolbar:** Bold, Italic, Bullet List, Ordered List
- **Content Round-Trip:** Template JSON → Tiptap JSON → flattened text → AI → structured output

### 8.2 Template System

```
TemplateSectionDef → templateToEditorContent() → Tiptap JSON
                                                       ↓
                                              editorContentToText() → "## Heading\nContent..." → AI input
```

- `templateToEditorContent(template)` — converts template definition to Tiptap document JSON
- `editorContentToText(json)` — flattens editor state to section-labeled text for AI processing
- `templateToPopulatedContent(template, sectionContent)` — merges AI Scribe output back into editor

### 8.3 Backward Compatibility

Visits created before the block editor (where `template_content` is null) fall back to a legacy raw textarea. Detection: if `template_content` is null AND `raw_notes` exists, use legacy mode.

---

## 9. AI Features

### 9.1 SOAP Generation

- **Model:** Claude Sonnet
- **Input:** Flattened editor text with section labels + patient context
- **Output:** Structured JSON with subjective, objective, assessment, plan
- **Prompt style:** Functional medicine perspective, root cause analysis, evidence-based
- **Visit-type variants:** SOAP, H&P, Consult, Follow-up each have dedicated system prompts

### 9.2 IFM Matrix Mapping

- **Model:** Claude Sonnet
- **Input:** Completed SOAP note + patient context
- **Output:** 7-node matrix with findings, severity scoring, clinical notes
- **Dependency:** Requires completed SOAP (Phase 2 depends on Phase 1)

### 9.3 Evidence-Based Protocol

- **Model:** Claude Sonnet
- **Input:** Completed SOAP note + patient context (meds, allergies, history)
- **Output:** Structured recommendations across 4 categories
- **Safety:** Drug interaction warnings generated for supplements
- **Evidence levels:** Meta-analysis, RCT, Guideline, Cohort Study, Case Series, Expert Opinion, Traditional Use

### 9.4 AI Scribe

- **Transcription:** OpenAI Whisper API (audio → text)
- **Section Assignment:** Claude Sonnet (transcript → section-keyed content)
- **Dynamic prompts:** Built from encounter template section definitions via `buildScribeSystemPrompt()`
- **Behavior:** Only populates sections with relevant content; empty sections omitted

### 9.5 Streaming

All AI generation uses Server-Sent Events (SSE):
- Server: `ReadableStream` with `TextEncoder`
- Client: `useVisitStream` hook with per-section status tracking
- Events: `{ section, status, text?, data? }` per line
- Abort: `AbortController` for user-initiated cancellation ("Stop Generation" button)

---

## 10. Security & Compliance

| Concern | Implementation |
|---|---|
| **Authentication** | Supabase JWT verification on every request |
| **Authorization** | RLS policies + `practitioner_id` ownership checks |
| **CSRF** | Origin header validation on POST endpoints |
| **Audit Trail** | Every PHI-touching operation logged to `audit_logs` with IP, user agent, and action details |
| **Completed Visit Protection** | 409 Conflict on attempts to modify completed visits |
| **Soft Delete** | Visits are archived, never hard-deleted |

---

## 11. File Structure

```
src/
├── app/
│   ├── (app)/visits/
│   │   ├── page.tsx                    # Visit list page
│   │   ├── new/page.tsx                # New visit page
│   │   └── [id]/page.tsx               # Visit workspace page
│   └── api/visits/
│       ├── route.ts                    # GET (list) + POST (create)
│       └── [id]/
│           ├── route.ts                # GET + PATCH + DELETE
│           ├── generate/route.ts       # AI generation pipeline (SSE)
│           ├── transcribe/route.ts     # Whisper transcription
│           ├── scribe/route.ts         # AI section assignment
│           └── export/route.ts         # HTML export
├── components/
│   ├── visits/
│   │   ├── visit-workspace.tsx         # Main workspace (editor + tabs)
│   │   ├── new-visit-form.tsx          # New visit creation form
│   │   ├── visit-list-client.tsx       # Client-side visit list
│   │   ├── soap-sections.tsx           # SOAP display/edit
│   │   ├── ifm-matrix-view.tsx         # IFM Matrix grid
│   │   ├── protocol-panel.tsx          # Protocol recommendations
│   │   ├── export-menu.tsx             # Export dropdown
│   │   └── editor/
│   │       ├── visit-editor.tsx        # Tiptap editor wrapper
│   │       ├── template-section-node.tsx # Collapsible section NodeView
│   │       ├── editor-toolbar.tsx      # Formatting toolbar
│   │       └── dictation-bar.tsx       # Voice input controls
│   └── patients/
│       └── patient-quick-create.tsx    # Inline patient creation modal
├── hooks/
│   ├── use-editor-dictation.ts         # Dictation + AI Scribe bridge
│   └── use-visit-stream.ts            # SSE streaming hook
├── lib/
│   ├── templates/
│   │   ├── types.ts                    # TemplateSectionDef, EncounterTemplate
│   │   ├── definitions.ts             # 4 encounter template definitions
│   │   └── to-editor-content.ts       # Template ↔ editor ↔ text conversion
│   ├── editor/
│   │   └── template-section-extension.ts # Custom Tiptap node
│   ├── ai/
│   │   ├── visit-prompts.ts           # SOAP/IFM/Protocol system prompts
│   │   └── scribe-prompts.ts          # AI Scribe prompt builder
│   └── validations/
│       └── visit.ts                   # Zod schemas
└── types/
    └── database.ts                    # Visit, IFMMatrix, VisitProtocol types
```

---

## 12. Current Limitations & Known Gaps

| # | Limitation | Impact |
|---|---|---|
| 1 | **No "in_progress" status** — visits are either `draft` or `completed`; no intermediate state for "encounter in progress" vs "note not started" | Can't distinguish between a blank draft and one being actively documented |
| 2 | **Single SOAP output structure** — H&P, Consult, and Follow-up visit types all generate into the same 4 SOAP fields (S/O/A/P) rather than their own section structure | Template-specific sections (e.g., "Past Medical History" for H&P) are flattened into generic SOAP buckets |
| 3 | **No real-time collaboration** — single-user editing only | Not a concern for solo practitioners; blocker for group practices |
| 4 | **PDF export is browser-dependent** — uses `window.print()` rather than server-side PDF generation | Formatting varies across browsers; no programmatic PDF attachment |
| 5 | **AI Scribe requires full re-recording** — no ability to append to or edit a previous recording | If the practitioner misses something, they must re-record the entire encounter |
| 6 | **No version history** — visit edits overwrite previous content with no diff tracking | Practitioners can't revert to a previous version of their notes |
| 7 | **Protocol items are read-only** — practitioners can't edit, reorder, or remove individual protocol recommendations | Must regenerate entire protocol to make changes |
| 8 | **IFM Matrix is read-only** — no ability to manually adjust severity or add findings | Must regenerate to update |
| 9 | **No visit-to-visit continuity** — each visit generates independently; no carry-forward of previous visit findings | Follow-up visits don't automatically reference prior SOAP notes or protocols |
| 10 | **Export limited to SOAP only** — IFM Matrix and Protocol are not included in the export output | Practitioners must manually capture these for sharing |
| 11 | **No template customization** — section definitions are hardcoded; practitioners can't add, remove, or reorder sections | One-size-fits-all templates per encounter type |
| 12 | **Auto-save has no conflict resolution** — if the same visit is open in two tabs, last write wins | Potential for data loss in edge cases |

---

## 13. Future Considerations

These are potential enhancements identified from the current architecture. They are **not committed work items** — included here for planning context only.

- **Visit-to-visit carry-forward** — auto-populate follow-up visits with prior findings, meds, and protocols
- **Editable Protocol/IFM** — allow inline editing of generated recommendations and matrix nodes
- **Comprehensive export** — include IFM Matrix and Protocol in PDF/clipboard export
- **Server-side PDF** — deterministic PDF generation (e.g., Puppeteer or react-pdf) for consistent output
- **Custom templates** — practitioner-defined section structures per encounter type
- **Visit status granularity** — add `in_progress` state between draft and completed
- **Append recording** — allow adding to an existing AI Scribe session without full re-record
- **Visit linking** — connect related visits for longitudinal tracking
- [ ] **Billing code suggestions** — ICD-10/CPT code recommendations based on SOAP content
- [ ] **Practice Analytics** — Dashboards for protocol efficacy and clinical trends across the patient population
- [ ] **Evidence Grading** — Tag AI citations with evidence levels (meta-analysis, RCT, guideline, cohort study, case report, expert opinion) so practitioners can assess recommendation strength at a glance
- [ ] **Knowledge Base Dashboard** — Show practitioners which sources the AI drew from (PubMed, IFM guidelines, practitioner protocols), when they were last updated, and coverage stats per clinical domain
- [ ] **Custom Knowledge Uploads** — Let practitioners upload their own trusted protocols, formularies, and clinical guidelines as private knowledge bases that the AI references alongside public evidence
- [ ] **Patient-Specific AI Memory** — Let the AI remember a patient's history, labs, and protocols across chat sessions so follow-up questions carry full clinical context without re-explaining
- [ ] **Lab-to-Chat Bridge** — Click an abnormal analyte in a parsed lab report to open a chat pre-loaded with that patient's context, asking for clinical guidance on the flagged result
- [ ] **Protocol Library** — Curated, reusable treatment protocols (e.g., "5R gut protocol", "adrenal recovery") that the AI can reference and customize per patient's profile
- [ ] **Multi-Source Citations** — Show which knowledge base each citation came from (PubMed, IFM guidelines, practitioner's own protocols) with source-level trust indicators
- [ ] **Comparative Analysis** — "Compare treatment A vs B for this patient's profile" — side-by-side evidence comparison leveraging patient context and evidence base

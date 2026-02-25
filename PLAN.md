# Visits Module — Implementation Plan

## Summary

Build the full Visits/Appointments module for Apothecare. The core workflow: practitioner enters raw clinical notes → AI streams a structured SOAP note, IFM Matrix mapping, and protocol recommendations → practitioner reviews/edits → marks complete → exports to clipboard or PDF. Includes inline chat panel for follow-up questions linked to the visit.

---

## Scope Decisions (from PRD refinement)

| Decision | Choice |
|----------|--------|
| Input method | Raw notes → AI-generated structured SOAP |
| Visit types | SOAP (initial) + Follow-up |
| AI depth | Full: SOAP + IFM Matrix + Protocol + Supplements |
| Status lifecycle | Draft → Completed (two-state) |
| AI output | SSE streaming into sections |
| Patient linking | Optional but prompted |
| Conversation | Inline chat panel linked to visit |
| Export | Copy to clipboard + PDF download |

---

## Database Changes

### Migration: `002_visits_status.sql`

Add `status` column to the existing `visits` table:

```sql
-- Add visit status
CREATE TYPE visit_status AS ENUM ('draft', 'completed');
ALTER TABLE visits ADD COLUMN status visit_status DEFAULT 'draft';

-- Add protocol recommendations (AI-generated)
ALTER TABLE visits ADD COLUMN ai_protocol JSONB DEFAULT '{}';
-- Format: { supplements: [...], dietary: [...], lifestyle: [...], follow_up_labs: [...] }

-- Add visit type for better filtering
ALTER TABLE visits ADD COLUMN visit_type TEXT DEFAULT 'soap';
-- Values: 'soap', 'follow_up'

-- Index for status filtering
CREATE INDEX idx_visits_status ON visits(status);
```

No other schema changes needed — the existing `visits` table already has all SOAP fields, `raw_notes`, `ai_soap_note`, `ai_assessment`, `ai_plan`, `ifm_matrix`, `patient_id`, `conversation_id`, and `note_template`.

---

## New Files to Create

### Pages (4 files)

1. **`src/app/(app)/visits/page.tsx`** — Visit list (replaces empty state)
   - Server component, fetches visits with pagination
   - Search by chief complaint, filter by status/date
   - Cards showing: date, patient name, chief complaint, status badge, template type
   - "New Visit" CTA button
   - Empty state when no visits exist

2. **`src/app/(app)/visits/new/page.tsx`** — Create new visit
   - Visit type selector (SOAP vs Follow-up)
   - Patient selector dropdown (optional, fetches practitioner's patients)
   - Chief complaint input field
   - Raw notes textarea (large, with placeholder guidance)
   - "Generate SOAP Note" button → triggers AI streaming
   - Creates the visit record on submit, redirects to `/visits/[id]`

3. **`src/app/(app)/visits/[id]/page.tsx`** — View/edit visit
   - Server component that fetches visit + patient data
   - Renders the full visit workspace (see components below)
   - If visit is draft → editable
   - If visit is completed → read-only with "Reopen" option

4. **`src/app/(app)/visits/loading.tsx`** — Loading skeleton for visit pages

### API Routes (5 files)

5. **`src/app/api/visits/route.ts`** — `GET` (list) + `POST` (create)
   - GET: paginated list with cursor, filter by status/patient
   - POST: create new visit (validates with Zod), returns visit ID

6. **`src/app/api/visits/[id]/route.ts`** — `GET` + `PATCH` + `DELETE`
   - GET: single visit with patient data join
   - PATCH: update any visit fields (only if status=draft)
   - DELETE: soft delete (set is_archived=true)

7. **`src/app/api/visits/[id]/generate/route.ts`** — `POST` (SSE streaming)
   - Accepts visit ID, reads raw_notes + patient context from DB
   - Calls Claude with visit-specific system prompt
   - Streams structured JSON sections: SOAP → IFM Matrix → Protocol
   - Saves AI output to visit record on completion
   - Uses the standard model for SOAP, Opus for follow-up protocol generation

8. **`src/app/api/visits/[id]/export/route.ts`** — `GET` (PDF generation)
   - Generates PDF from visit data using a simple HTML-to-PDF approach
   - Returns downloadable PDF with proper headers

### Components (8 files)

9. **`src/components/visits/visit-workspace.tsx`** — Main visit container
   - Client component managing the full visit editing experience
   - Tab or section layout: SOAP | IFM Matrix | Protocol | Chat
   - Header with visit metadata, status toggle, export menu
   - Orchestrates AI generation and section editing

10. **`src/components/visits/raw-notes-input.tsx`** — Raw notes entry
    - Large textarea with formatting hints
    - "Generate" button with loading/streaming state
    - Template-aware placeholders (SOAP vs Follow-up)
    - Character count

11. **`src/components/visits/soap-sections.tsx`** — SOAP section editor
    - Four editable sections (S, O, A, P) as contenteditable or textarea
    - Each section shows AI-generated content that streams in
    - Practitioner can edit inline after generation
    - Visual indicator for AI-generated vs manually edited content

12. **`src/components/visits/ifm-matrix-view.tsx`** — IFM Matrix visualization
    - 7-node grid layout (Assimilation, Defense & Repair, Energy, Biotransformation, Transport, Communication, Structural Integrity)
    - Each node shows AI-populated findings
    - Color-coded by severity/relevance
    - Expandable detail for each node

13. **`src/components/visits/protocol-panel.tsx`** — Protocol recommendations
    - Four sections: Supplements, Dietary, Lifestyle, Follow-up Labs
    - Each item shows: name, dosage/detail, rationale, evidence level
    - Practitioner can accept/reject/edit individual items
    - Uses EvidenceBadge component for citations

14. **`src/components/visits/visit-chat-panel.tsx`** — Inline chat for follow-up
    - Slide-out or expandable panel
    - Creates/links a conversation to the visit
    - Reuses existing chat streaming hook (`use-chat.ts`)
    - Context-aware: AI knows about the visit's SOAP note + patient data

15. **`src/components/visits/visit-list-card.tsx`** — Visit card for list page
    - Date, patient name, chief complaint, status badge
    - Click to navigate to `/visits/[id]`
    - Quick actions: archive, duplicate

16. **`src/components/visits/export-menu.tsx`** — Export actions
    - "Copy to Clipboard" (full formatted note)
    - "Download PDF" button
    - Section-level copy (copy just S, just A, etc.)

### Lib/Hooks (3 files)

17. **`src/lib/ai/visit-prompts.ts`** — Visit-specific AI prompts
    - SOAP generation system prompt (takes raw notes + patient context)
    - IFM Matrix mapping prompt
    - Protocol generation prompt
    - Follow-up visit prompt variant
    - Structured output format instructions (JSON sections)

18. **`src/hooks/use-visit-stream.ts`** — SSE hook for visit AI generation
    - Similar to `use-chat.ts` but for structured visit generation
    - Parses streaming sections (SOAP, IFM, Protocol) as they arrive
    - Provides per-section loading states
    - Handles abort/retry

19. **`src/lib/validations/visit.ts`** — Zod schemas for visit API
    - CreateVisitSchema, UpdateVisitSchema
    - GenerateVisitSchema (for the AI endpoint)
    - Visit status transitions

### Database Migration (1 file)

20. **`supabase/migrations/002_visits_status.sql`** — Schema additions

---

## Implementation Order

### Phase 1: Foundation (API + Schema)
1. Write migration `002_visits_status.sql`
2. Update `src/types/database.ts` with new fields
3. Create `src/lib/validations/visit.ts` (Zod schemas)
4. Create `src/app/api/visits/route.ts` (CRUD endpoints)
5. Create `src/app/api/visits/[id]/route.ts`

### Phase 2: Visit List + Creation
6. Replace `src/app/(app)/visits/page.tsx` (list view)
7. Create `src/components/visits/visit-list-card.tsx`
8. Create `src/app/(app)/visits/new/page.tsx`
9. Create `src/components/visits/raw-notes-input.tsx`
10. Create `src/app/(app)/visits/loading.tsx`

### Phase 3: AI Generation
11. Create `src/lib/ai/visit-prompts.ts`
12. Create `src/app/api/visits/[id]/generate/route.ts` (SSE)
13. Create `src/hooks/use-visit-stream.ts`

### Phase 4: Visit Workspace
14. Create `src/components/visits/soap-sections.tsx`
15. Create `src/components/visits/ifm-matrix-view.tsx`
16. Create `src/components/visits/protocol-panel.tsx`
17. Create `src/components/visits/visit-workspace.tsx` (orchestrator)
18. Create `src/app/(app)/visits/[id]/page.tsx`

### Phase 5: Chat + Export
19. Create `src/components/visits/visit-chat-panel.tsx`
20. Create `src/components/visits/export-menu.tsx`
21. Create `src/app/api/visits/[id]/export/route.ts` (PDF)

### Phase 6: Polish
22. Update sidebar nav to highlight active visit routes
23. Update `cached-queries.ts` to include visit counts if needed
24. Add visit creation to dashboard quick actions (already linked)
25. Test full flow end-to-end

---

## AI Streaming Format

The `/api/visits/[id]/generate` endpoint will stream structured JSON sections:

```
data: {"section":"subjective","content":"Patient reports...","done":false}
data: {"section":"subjective","content":" ongoing fatigue...","done":false}
data: {"section":"subjective","content":"","done":true}
data: {"section":"objective","content":"Vitals: ...","done":false}
...
data: {"section":"ifm_matrix","content":"{\"assimilation\":{...}}","done":true}
data: {"section":"protocol","content":"{\"supplements\":[...]}","done":true}
data: {"section":"complete","content":"","done":true}
```

The client hook (`use-visit-stream.ts`) parses each section and updates the corresponding UI component in real-time.

---

## Visit-Specific System Prompt Strategy

**For SOAP Generation:**
- Include patient demographics, medical history, current meds, supplements, allergies if patient is linked
- Include recent lab results if available
- Include raw notes as primary input
- Instruct Claude to output structured sections

**For IFM Matrix:**
- Take the generated SOAP content
- Map findings to the 7 IFM Matrix nodes
- Identify antecedents, triggers, and mediators

**For Protocol:**
- Use SOAP + IFM Matrix as context + consider other matrices such as A4M 
- Generate evidence-based recommendations across 4 categories
- Include specific dosing, form, timing, and duration
- Flag drug-supplement interactions
- Cite evidence sources
- Give user option to select specific brands (ie. Apex Energetics, Orthomolecular Products, Designs for Health, etc)
- Consider API plug-in to make direct recommendations via. fullscript.com


---

---
## Strategic Partnership Features (A4M/IFM)

### Phase 2.5: The Institute Moat
26. **RAG Update:** Add `source` filtering to `search_evidence` RAG pipeline.
27. **Institute Mode:** Add toggle to UI to strictly strictly filter RAG by institute (e.g., A4M, IFM).
28. **Attribution:** Update `EvidenceBadge` to display institute logos.
29. **Partnership Pilot:** Launch dedicated landing page for first institute pilot.

---

## Out of Scope (Future)

- Telehealth-specific documentation fields
- E/M coding assistance
- Visit templates library (custom practitioner templates)
- Multi-visit trend analysis
- Visit sharing / referral exports
- Visit sharing / referral exports
- FHIR/HL7 integration

---

## Future "WOW" Features (Visual & AI)

### 1. The Living Matrix (Dynamic Visualization)
- **Concept:** Interactive, animated IFM Matrix where nodes light up as AI detects findings.
- **Tech:** D3.js or React Flow visualization connected to the streaming AI parser.
- **Impact:** Turns a static PDF concept into a living clinical brain.

### 2. "Time Travel" Patient Timeline
- **Concept:** Horizontal scrollable timeline of patient's life history (antibiotics, trauma, symptoms).
- **Tech:** Vis.js timeline component populated from "History of Present Illness" parsing.
- **Impact:** Instant pattern recognition for root cause analysis.

### 3. Clinical Co-pilot (Second Opinion)
- **Concept:** Sidebar that proactively surfaces PubMed/Institute research based on current note context.
- **Tech:** RAG pipeline running in background, querying vector DB with current paragraph.
- **Impact:** "Super-researcher" capability without leaving the workflow.

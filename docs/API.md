# API Reference

## Overview

All API routes are located under `src/app/api/`. They are Next.js Route Handlers running server-side. Authentication is enforced via Supabase JWT verification on every request. All endpoints that touch PHI write to the `audit_logs` table with IP address and user agent.

**Base URL:** `http://localhost:3000/api` (dev) / `https://apotheca.health/api` (prod)

---

## Authentication

All endpoints require a valid Supabase session cookie. The middleware at `src/middleware.ts` handles session refresh and redirects unauthenticated users.

For API-level auth, each route handler calls:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

If no valid session exists, the endpoint returns `401 Unauthorized`.

### CSRF Protection

All mutating endpoints (POST/PATCH/DELETE) validate the `Origin` header against `NEXT_PUBLIC_APP_URL` via a shared utility (`src/lib/api/csrf.ts`). Requests from mismatched origins receive `403 Forbidden`.

---

## Endpoints

### `POST /api/chat/stream` ✅ Implemented

Send a clinical query and receive an SSE-streamed AI response.

**Input Validation:** Zod schema (`lib/validations/chat.ts`)

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `message` | string | Yes | 1–10,000 characters |
| `conversation_id` | UUID | No | Valid UUID or null. Creates new if omitted. |
| `patient_id` | UUID | No | Valid UUID or null. Injects patient context. |
| `is_deep_consult` | boolean | No | Default: false. Routes to Opus model. |

**Example Request:**
```json
{
  "message": "What are evidence-based interventions for elevated zonulin and intestinal permeability?",
  "patient_id": "a1b2c3d4-...",
  "is_deep_consult": false
}
```

**Response:** Server-Sent Events stream

```
data: {"type":"conversation_id","id":"conv_uuid"}

data: {"type":"delta","content":"Elevated "}

data: {"type":"delta","content":"zonulin indicates "}

data: {"type":"done","usage":{"input_tokens":1250,"output_tokens":890},"queries_remaining":1}
```

**Error Responses:**

| Code | Body | Cause |
|---|---|---|
| 400 | `{ "error": "Message is required" }` | Zod validation failure |
| 401 | `{ "error": "Unauthorized" }` | No valid session |
| 403 | `{ "error": "Forbidden" }` | CSRF origin mismatch |
| 404 | `{ "error": "Practitioner profile not found" }` | User hasn't completed onboarding |
| 429 | `{ "error": "Daily query limit reached" }` | Free tier limit hit |
| 500 | `{ "error": "Internal server error" }` | Unexpected failure |

**Notes:**
- `queries_remaining` is `null` for Pro subscribers (unlimited)
- Conversation title auto-generated from first message (first 100 chars)
- Deep Consult routes to Claude Opus with 4096 max tokens
- Standard queries route to Claude Sonnet with 2048 max tokens

---

### `POST /api/chat` ⛔ Deprecated

Returns `410 Gone`. All traffic should use `/api/chat/stream`.

---

### `GET /api/chat/history` ✅ Implemented

Load messages for an existing conversation with cursor-based pagination.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `conversation_id` | UUID | Yes | — | Conversation to load messages from |
| `cursor` | UUID | No | — | Message ID to start pagination from (exclusive) |
| `limit` | number | No | 50 | Number of messages to return (max: 100) |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg_uuid",
      "role": "user",
      "content": "What are...",
      "created_at": "2026-02-11T14:30:00Z"
    },
    {
      "id": "msg_uuid",
      "role": "assistant",
      "content": "Elevated zonulin...",
      "citations": [...],
      "created_at": "2026-02-11T14:30:05Z"
    }
  ],
  "next_cursor": "msg_uuid_or_null",
  "has_more": false
}
```

**Pagination Example:**
```javascript
// First page
GET /api/chat/history?conversation_id=conv_123&limit=20

// Next page
GET /api/chat/history?conversation_id=conv_123&limit=20&cursor=msg_last_id
```

**Security:** RLS-protected — only conversation owner can access.

---

### `GET /api/auth/callback` ✅ Implemented

Handles Supabase OAuth callback and session exchange.

**Flow:**
1. Receives `code` query parameter from Supabase Auth
2. Exchanges code for session
3. Checks if practitioner profile exists
4. If no profile → redirect to `/auth/onboarding`
5. If profile exists → redirect to `/dashboard`

---

### `GET /api/patients` ✅ Implemented

List patients with pagination and search.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | ISO timestamp | No | — | Pagination cursor (updated_at) |
| `limit` | number | No | 20 | Number of results (max: 100) |
| `search` | string | No | — | Search by first or last name |
| `archived` | boolean | No | false | Include archived patients |

**Response (200):**
```json
{
  "patients": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "date_of_birth": "1985-03-15",
      "sex": "female",
      "chief_complaints": ["fatigue", "brain fog"],
      "is_archived": false,
      "created_at": "2026-02-13T10:00:00Z",
      "updated_at": "2026-02-13T10:00:00Z"
    }
  ],
  "nextCursor": "2026-02-13T10:00:00Z"
}
```

---

### `POST /api/patients` ✅ Implemented

Create a new patient.

**Input Validation:** Zod schema (`lib/validations/patient.ts`)

**Request Body:**

| Field | Type | Required |
|---|---|---|
| `first_name` | string | Yes |
| `last_name` | string | Yes |
| `date_of_birth` | string (ISO date) | No |
| `sex` | string | No |
| `chief_complaints` | string[] | No |
| `medical_history` | string | No |
| `current_medications` | string | No |
| `supplements` | string | No |
| `allergies` | string | No |

**Response (201):**
```json
{
  "patient": { "id": "uuid", "first_name": "Jane", "last_name": "Smith", ... }
}
```

---

### `GET /api/patients/:id` ✅ Implemented

Get a single patient with full profile data.

**Security:** RLS-protected — only the practitioner who owns the patient can access.

---

### `PATCH /api/patients/:id` ✅ Implemented

Update patient fields. Accepts any subset of the POST body fields.

---

### `GET /api/patients/:id/documents` ✅ Implemented

List documents for a patient, ordered by upload date descending.

---

### `POST /api/patients/:id/documents` ✅ Implemented

Upload a patient document.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | Document file (PDF, image, etc.) |
| `document_type` | string | Yes | "lab_report", "intake_form", "referral_letter", "imaging_report", "prior_records" |
| `title` | string | No | Document title |

---

### `POST /api/patients/:id/documents/:docId/extract` ✅ Implemented

Trigger AI extraction on a patient document. Claude reads the document content and generates a structured clinical summary.

**Response (200):**
```json
{
  "extraction_summary": "Comprehensive metabolic panel results showing..."
}
```

---

### `GET /api/visits` ✅ Implemented

List visits with pagination, filtering by status and patient.

**Input Validation:** Zod schema (`lib/validations/visit.ts`)

**Query Parameters:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | ISO timestamp | No | — | Pagination cursor (visit_date) |
| `limit` | number | No | 20 | Number of results (max: 100) |
| `status` | string | No | — | Filter: "draft", "in_progress", "completed" |
| `patient_id` | UUID | No | — | Filter by patient |
| `search` | string | No | — | Search by chief complaint |

**Response (200):**
```json
{
  "visits": [
    {
      "id": "uuid",
      "visit_date": "2026-02-13T14:00:00Z",
      "visit_type": "soap",
      "status": "draft",
      "chief_complaint": "Fatigue and brain fog",
      "patient_id": "uuid",
      "patients": { "first_name": "Jane", "last_name": "Smith" }
    }
  ],
  "nextCursor": "2026-02-13T10:00:00Z"
}
```

---

### `POST /api/visits` ✅ Implemented

Create a new clinical visit.

**Input Validation:** Zod schema (`lib/validations/visit.ts`)

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `visit_type` | string | Yes | "soap", "history_physical", "consult", "follow_up" |
| `patient_id` | UUID | No | Valid patient UUID |
| `chief_complaint` | string | No | Max 500 chars |
| `visit_date` | string (ISO datetime) | No | Defaults to now |

**Response (201):**
```json
{
  "visit": { "id": "uuid", "visit_type": "soap", "status": "draft", ... }
}
```

---

### `GET /api/visits/:id` ✅ Implemented

Get a single visit with full data including SOAP fields, IFM matrix, protocol, template content, and linked patient context.

---

### `PATCH /api/visits/:id` ✅ Implemented

Update visit fields (raw_notes, template_content, status, chief_complaint, etc.).

---

### `POST /api/visits/:id/generate` ✅ Implemented

Generate AI clinical documentation from visit notes. Returns SSE stream with up to three phases: SOAP note, IFM Matrix mapping, and evidence-based protocol.

**Input Validation:** Zod schema (`lib/validations/visit.ts`)

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `raw_notes` | string | Yes | Clinical notes (from editor via `editorContentToText()`) |
| `sections` | string[] | Yes | Phases to generate: `["soap", "ifm_matrix", "protocol"]` |

**Response:** Server-Sent Events stream

```
data: {"section":"soap","status":"generating"}
data: {"section":"soap","status":"streaming","text":"Subjective: "}
data: {"section":"soap","status":"streaming","text":"Patient presents with..."}
data: {"section":"soap","status":"complete","data":{"subjective":"...","objective":"...","assessment":"...","plan":"..."}}
data: {"section":"ifm_matrix","status":"generating"}
data: {"section":"ifm_matrix","status":"complete","data":{...}}
data: {"section":"protocol","status":"generating"}
data: {"section":"protocol","status":"complete","data":{...}}
data: {"section":"complete","status":"done"}
data: [DONE]
```

**Notes:**
- SOAP phase is required — IFM and Protocol phases depend on SOAP output
- Each phase streams incrementally, then sends a complete event with parsed JSON
- Saves SOAP fields, IFM matrix, and protocol to the visit record
- Patient context (if visit has linked patient) is included in all prompts

---

### `POST /api/visits/:id/transcribe` ✅ Implemented

Transcribe an audio recording via OpenAI Whisper API.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `audio` | File | Yes | Audio file (webm, mp4, mpeg, ogg, wav, flac). Max 25MB. |

**Response (200):**
```json
{
  "transcript": "The patient reports ongoing fatigue for three weeks...",
  "duration": 45.2,
  "language": "en",
  "updated_raw_notes": "...existing notes...\n---\n[Transcribed from recording]\n..."
}
```

**Notes:**
- Requires `OPENAI_API_KEY` environment variable
- Transcript is appended to the visit's `raw_notes` field
- Supports audio formats: webm, mp4, mpeg, ogg, wav, flac

---

### `POST /api/visits/:id/scribe` ✅ Implemented

AI Scribe — takes a raw transcript and uses Claude to assign content to encounter template sections.

**Request Body:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `transcript` | string | Yes | Min 10 characters |

**Response (200):**
```json
{
  "sections": {
    "chief_complaint": "Patient presents with fatigue, brain fog, and intermittent joint pain.",
    "hpi": "45-year-old female reports 3-week history of progressive fatigue...",
    "review_of_systems": "Constitutional: Reports fatigue, weight stable. Neuro: Brain fog...",
    "assessment": "Suspected thyroid dysfunction with possible autoimmune component...",
    "plan": "Order comprehensive thyroid panel (TSH, free T3, free T4, TPO, TgAb)..."
  }
}
```

**Notes:**
- Section keys match the encounter template for the visit's `visit_type` (SOAP, H&P, Consult, Follow-up)
- Only sections with relevant transcript content are included
- Empty/irrelevant sections are omitted from the response
- The raw transcript is saved to `visit.raw_notes` for audit trail
- Dynamic prompt built via `buildScribeSystemPrompt()` from template section definitions

---

### `POST /api/visits/:id/export` ✅ Implemented

Export a visit as a formatted clinical document.

---

### `GET /api/labs` ✅ Implemented

List lab reports with cursor-based pagination and filters.

**Query Parameters:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | ISO timestamp | No | — | Pagination cursor (created_at) |
| `limit` | number | No | 20 | Number of results (max: 100) |
| `status` | string | No | — | Filter: "uploading", "parsing", "complete", "error" |
| `test_type` | string | No | — | Filter: "blood_panel", "stool_analysis", etc. |
| `lab_vendor` | string | No | — | Filter: "quest", "labcorp", etc. |
| `patient_id` | UUID | No | — | Filter by patient |

**Response (200):**
```json
{
  "labs": [
    {
      "id": "uuid",
      "test_name": "Comprehensive Metabolic Panel",
      "lab_vendor": "quest",
      "test_type": "blood_panel",
      "collection_date": "2026-01-15",
      "status": "complete",
      "raw_file_name": "lab-results.pdf",
      "raw_file_size": 524288,
      "created_at": "2026-02-13T10:00:00Z",
      "patients": { "first_name": "Jane", "last_name": "Smith" }
    }
  ],
  "nextCursor": "2026-02-13T10:00:00Z"
}
```

---

### `POST /api/labs` ✅ Implemented

Upload a lab report PDF for AI-powered biomarker extraction.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | Lab report PDF. Max 10MB. |
| `patient_id` | UUID | No | Link to a patient |
| `lab_vendor` | string | No | "quest", "labcorp", etc. Auto-detected if omitted. |
| `test_type` | string | No | "blood_panel", "stool_analysis", etc. Auto-detected if omitted. |
| `test_name` | string | No | Human-readable test name |
| `collection_date` | string (ISO date) | No | Date of sample collection |

**Response (201):**
```json
{
  "report": {
    "id": "uuid",
    "status": "uploading",
    "raw_file_url": "practitioner_id/labs/report_id/filename.pdf",
    ...
  }
}
```

**Notes:**
- Parsing begins immediately after upload (fire-and-forget)
- Status transitions: `uploading` → `parsing` → `complete` (or `error`)
- Claude Vision extracts biomarkers, normalizes against functional references
- Results available at `GET /api/labs/:id` once status is `complete`

---

### `GET /api/labs/:id` ✅ Implemented

Retrieve a single lab report with biomarker results and signed PDF URL.

**Response (200):**
```json
{
  "report": { "id": "uuid", "test_name": "CMP", "status": "complete", "patients": {...}, ... },
  "biomarkers": [
    {
      "id": "uuid",
      "biomarker_name": "TSH",
      "biomarker_code": "TSH",
      "category": "thyroid",
      "value": 2.5,
      "unit": "mIU/L",
      "conventional_low": 0.45,
      "conventional_high": 4.5,
      "conventional_flag": "normal",
      "functional_low": 1.0,
      "functional_high": 2.0,
      "functional_flag": "borderline_high"
    }
  ],
  "pdfUrl": "https://...signed-url..."
}
```

---

### `POST /api/labs/:id/review` 🔲 Planned (stub returns 501)

Generate AI clinical review for a lab report. Currently returns `501 Not Implemented`.

---

### `POST /api/protocols/generate` 🔲 Planned

Generate treatment protocol from lab reviews, visits, or chat context.

---

### `POST /api/webhooks/stripe` 🔲 Planned

Handle Stripe subscription events.

---

## Rate Limits

| Tier | Chat Queries | Lab Uploads | Protocols |
|---|---|---|---|
| Free | 2/day | 0 | 0 |
| Pro | Unlimited* | 100/month | 50/month |

*Soft rate limits on Pro prevent abuse (500 queries/day warning threshold).

## Audit Logging

Every endpoint that accesses PHI inserts a row into `audit_logs`:

```json
{
  "practitioner_id": "uuid",
  "action": "query",
  "resource_type": "conversation",
  "resource_id": "conv_uuid",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "detail": {
    "model": "claude-sonnet-4-5-20250929",
    "input_tokens": 1250,
    "output_tokens": 890,
    "is_deep_consult": false,
    "has_patient_context": true
  }
}
```

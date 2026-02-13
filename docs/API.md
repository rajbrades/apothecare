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

All POST endpoints validate the `Origin` header against `NEXT_PUBLIC_APP_URL`. Requests from mismatched origins receive `403 Forbidden`.

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

### `POST /api/labs/upload` 🔲 Planned (Sprint 3)

Upload one or more lab PDFs for AI interpretation.

**Request:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `files` | File[] | Yes (1–5 PDFs) |
| `patient_id` | UUID | No |
| `visit_id` | UUID | No |

---

### `GET /api/labs/:id` 🔲 Planned (Sprint 3)

Retrieve parsed lab report with dual-range biomarker results.

---

### `POST /api/labs/:id/review` 🔲 Planned (Sprint 3)

Generate AI clinical review for a lab report.

---

### `POST /api/visits` 🔲 Planned (Sprint 4)

Create a new clinical visit.

---

### `POST /api/visits/:id/soap` 🔲 Planned (Sprint 4)

Generate AI SOAP note from visit data.

---

### `POST /api/protocols/generate` 🔲 Planned (Sprint 5)

Generate treatment protocol from lab reviews, visits, or chat context.

---

### `POST /api/webhooks/stripe` 🔲 Planned (Sprint 5)

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

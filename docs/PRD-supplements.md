# PRD: Structured Supplement Management

**Product:** Apotheca
**Module:** Supplements → Patient Profile Integration
**Status:** Phase 2 Complete — Phase 3 (Patient Portal) Pending
**Last Updated:** 2026-02-22

---

## 1. Overview

Replace the freeform "Current Supplements" text field on the patient Overview tab with a structured supplement list. Each supplement is a discrete record with name, dosage, form, frequency, timing, status, and source provenance. This creates a single source of truth that connects AI supplement reviews, practitioner edits, and the future patient portal.

---

## 2. Problem Statement

1. **No structured data** — Supplements are a plain text field (`patients.supplements`). Can't query, filter, or reconcile individual items.
2. **Disconnected from reviews** — Supplement Intelligence generates detailed recommendations (keep/modify/discontinue/add with dosing) but results don't flow back to the patient record.
3. **No portal readiness** — The patient portal research (§5, §11) requires a structured supplement list with per-item status for reconciliation workflows. Freeform text can't support this.
4. **No change tracking** — Can't tell when a supplement was started, modified, or discontinued.

---

## 3. Architecture Decision

**Approach: Dedicated `patient_supplements` table** (not JSONB on patients)

Rationale:
- Enables per-supplement RLS, audit logging, and history tracking
- Supports future patient portal reconciliation (pending/approved states)
- Allows FK back to supplement reviews for provenance
- Queryable for analytics (most-prescribed supplements, discontinuation rates)
- Follows existing pattern of dedicated tables with RLS (like `timeline_events`)

---

## 4. Data Model

### Table: `patient_supplements`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | No | |
| `patient_id` | UUID FK → patients | No | |
| `practitioner_id` | UUID FK → practitioners | No | |
| `name` | TEXT | No | Supplement name |
| `dosage` | TEXT | Yes | e.g., "400mg", "5000 IU" |
| `form` | TEXT | Yes | e.g., "capsule", "liquid", "softgel" |
| `frequency` | TEXT | Yes | e.g., "1x daily", "2x daily", "as needed" |
| `timing` | TEXT | Yes | e.g., "with breakfast", "before bed" |
| `brand` | TEXT | Yes | Recommended brand |
| `status` | ENUM | No | `active`, `discontinued`, `pending_patient` |
| `source` | ENUM | No | `manual`, `review`, `patient_reported` |
| `review_id` | UUID FK → supplement_reviews | Yes | Which review generated this |
| `started_at` | TIMESTAMPTZ | Yes | When supplement was started |
| `discontinued_at` | TIMESTAMPTZ | Yes | When supplement was stopped |
| `notes` | TEXT | Yes | Practitioner notes |
| `sort_order` | INTEGER | No | Display order, default 0 |
| `created_at` | TIMESTAMPTZ | No | |
| `updated_at` | TIMESTAMPTZ | No | |

### Enums

```sql
CREATE TYPE patient_supplement_status AS ENUM ('active', 'discontinued', 'pending_patient');
CREATE TYPE patient_supplement_source AS ENUM ('manual', 'review', 'patient_reported');
```

### Indexes
- `(patient_id, status, sort_order)` — Primary query for active supplements
- `(practitioner_id, patient_id)` — RLS and ownership
- `(review_id)` — Provenance lookup

### RLS
Same pattern as all other tables: `practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())`

---

## 5. Phase 1 — Structured List ✅ COMPLETE

### 5.1 Patient Overview Tab
- Replace freeform text "Current Supplements" section with structured supplement table
- Each row: name, dosage, frequency/timing (combined display), status badge
- Inline add: button opens a row with fields for name, dosage, form, frequency, timing, brand
- Inline edit: pencil icon per row opens edit mode for that row
- Discontinue: marks status as `discontinued` with timestamp (soft delete, never hard delete)
- Reorder: optional, via sort_order
- Empty state: "+ Add supplement" button

### 5.2 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/patients/[id]/supplements` | List active (default) or all supplements |
| POST | `/api/patients/[id]/supplements` | Add single supplement |
| PATCH | `/api/patients/[id]/supplements/[supId]` | Update supplement fields |
| DELETE | `/api/patients/[id]/supplements/[supId]` | Discontinue (set status, not hard delete) |

### 5.3 Data Loading
- Server component fetches active supplements alongside other patient data
- Passed as prop to `PatientProfile`
- Client-side mutations via fetch + optimistic UI updates

---

## 6. Phase 2 — Review Integration ✅ COMPLETE

### 6.1 "Push to Patient File" Button ✅
- Added to `SupplementReviewDetail` component
- Maps each `SupplementReviewItem` → `patient_supplements` row:
  - `action: "keep"` → upsert existing (match by name), update dosage/timing if changed
  - `action: "modify"` → upsert existing, update fields
  - `action: "discontinue"` → set status to `discontinued`, set `discontinued_at`
  - `action: "add"` → insert new row with `source: "review"`, `review_id` set
- Deduplication: match by lowercased `name`; if match exists, update rather than insert
- Sets `review_id` on all touched rows for provenance
- `pushed_at` tracked on `supplement_reviews` for idempotency (Migration 012)
- Button becomes "Re-push" after first push; badges become read-only post-push

### 6.2 Clinician Action Overrides ✅
- Clickable `ActionBadge` dropdown on each supplement card (Keep/Modify/Discontinue/Add)
- Ring indicator + "(AI)" label shown when an override is active
- Items overridden to `discontinue` show red border + strikethrough name
- `action_overrides: Record<string, SupplementAction>` sent in push-review request body
- Original AI recommendations preserved in DB; overrides applied only at push time

### 6.3 Freeform Reviews (No Patient Required) ✅
- Reviews tab supports "For a patient" and "Freeform" modes via pill-style toggle
- Freeform inputs: supplement textarea, optional medications and medical context
- Structured item builder: expandable form appends formatted lines to textarea
- Freeform review inserted with `patient_id: null` (Migration 014)
- "Freeform Review" label in past reviews list; push button hidden (no patient to push to)

### 6.4 Push Protocol Supplements ✅
- Visit workspace Protocol tab: "Push Protocol Supplements" confirm dialog
- Sends all AI-recommended protocol supplements → `patient_supplements` with `source: "protocol"`, `visit_id` provenance
- `protocol_pushed_at` tracked on `visits` (Migration 013)
- "Pushed {date}" badge shown; "Re-push" available for subsequent updates

---

## 7. Phase 3 — Patient Portal Reconciliation (Future)

Follows the SMMRT pattern from portal research (§5):

### 7.1 Patient View
- Patient sees their active supplement list (read-only for provider-prescribed items)
- Can mark items as: "Still taking", "Stopped", "Changed dose"
- Can add supplements the provider doesn't know about
- All patient changes create rows with `status: "pending_patient"`, `source: "patient_reported"`

### 7.2 Provider Reconciliation Queue
- Dashboard widget showing pending patient-reported changes
- Approve/reject workflow → updates supplement status
- Auto-prompt reconciliation before visits

### 7.3 Timeline Integration
- Supplement start/stop/dose changes emit `timeline_events` (types: `supplement_start`, `supplement_stop`, `supplement_dose_change`)
- Completes the timeline event types that are currently placeholder

---

## 8. Migration from Freeform Text

- `patients.supplements` (TEXT) is kept for backward compatibility during transition
- Phase 1: structured list is the primary UI; freeform field hidden but not deleted
- Phase 2: one-time backfill script parses existing freeform text → structured rows (AI-assisted)
- Phase 3: drop freeform field after confirming all data migrated

---

## 9. Non-Goals (Explicitly Out of Scope)

- Fullscript dispensary integration (separate feature, stubbed)
- Supplement inventory tracking
- Automated refill reminders
- Insurance/formulary lookups

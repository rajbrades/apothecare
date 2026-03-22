# PRD: Patient Portal MVP

**Product:** Apothecare
**Module:** Patient Portal
**Status:** Draft v1.0
**Last Updated:** 2026-03-21

---

## 1. Overview

Build a secure, patient-facing portal where invited patients can:

1. Log in to their own account
2. Complete required onboarding (consents + intake)
3. View read-only clinical outputs that their provider has shared

MVP scope is intentionally narrow: patient access to lab report visuals and encounter notes, plus provider-led invite/onboarding workflows. This creates a safe, compliant foundation for future portal capabilities.

---

## 2. Problem Statement

Today, Apothecare is provider-only. Patients cannot self-serve access to their records, complete intake digitally in-system, or sign required documents in a structured, auditable flow.

This creates friction:

1. Providers manually distribute files and collect paperwork outside the platform.
2. Intake and consent data is harder to standardize and audit.
3. Patients have no persistent place to review their lab visuals and encounter notes.

---

## 3. Goals and Non-Goals

### 3.1 Goals (MVP)

1. Enable secure patient login tied to a provider and a specific patient record.
2. Let providers invite patients through a reliable invite workflow.
3. Let patients complete onboarding with required documents and intake.
4. Let patients view:
   - shared lab reports using the same visual system used by providers (read-only)
   - shared encounter notes (read-only)
5. Preserve HIPAA-ready auditability for access and signatures.

### 3.2 Non-Goals (MVP)

1. Patient-provider messaging
2. Appointment scheduling
3. Billing/payments
4. Patient-side lab upload/parsing
5. Editable treatment plans from patient side
6. Custom form builder UI for providers (future phase)

---

## 4. Personas

| Persona | Primary Jobs To Be Done |
|---|---|
| **Provider (Practitioner)** | Invite patients, track who has activated, require onboarding completion, share only the right notes/labs. |
| **Patient** | Accept invite, create account, sign required forms, complete intake, and review shared records in a clear interface. |
| **Practice Admin (optional in MVP)** | Monitor invite/onboarding completion and follow up with non-activated patients. |

---

## 5. Scope

### 5.1 In Scope (MVP)

1. Provider invite workflow with expiring secure token links
2. Provider-specific portal entry URL for branding/discovery (not security)
3. Patient account creation and login
4. Onboarding gate (must complete required docs before full dashboard)
5. Consent signing with timestamped evidence
6. Intake form submission mapped to patient record fields
7. Patient dashboard with read-only:
   - shared lab report details/graphics
   - shared encounter notes
8. Audit logs for sensitive actions

### 5.2 Out of Scope (MVP)

1. Dynamic intake form builder
2. Patient messaging/chat with provider
3. Mobile native app
4. Family/dependent account linking
5. Multi-provider patient switching

---

## 6. Product Decisions

1. **Provider-specific URL:** yes, use a unique `portal_slug` for each practitioner (example: `/p/dr-smith`).
2. **Security model:** invite links must use signed/hashed, expiring tokens; URL slug alone never grants access.
3. **Record visibility:** labs/notes are visible only when explicitly shared (or published) by provider.
4. **Onboarding gate:** patients cannot access dashboard until required consents and intake are complete.
5. **Same lab UI:** patient lab detail reuses provider lab visualization components in read-only mode.

---

## 7. User Stories and Acceptance Criteria

### 7.1 Invites and Account Activation

**US-1 (Provider):** I can invite a patient by email so they can create a portal account.

Acceptance Criteria:
1. Provider can send invite from patient context.
2. Invite stores status (`pending`, `accepted`, `revoked`, `expired`).
3. Invite token expires after configurable TTL (default 72 hours).
4. Resend creates a new token and invalidates prior active token.

**US-2 (Patient):** I can accept a valid invite and create my account.

Acceptance Criteria:
1. Invite link validates token and expiration.
2. Patient sets password (or magic-link auth if enabled later).
3. Accepted invite is marked `accepted` and linked to patient record.
4. Reusing accepted/revoked/expired token returns a safe error state.

### 7.2 Onboarding (Consents + Intake)

**US-3 (Patient):** I must sign required forms before using the dashboard.

Acceptance Criteria:
1. Required docs are shown in sequence before dashboard access.
2. Signature capture includes: typed full name, timestamp, IP, user-agent, document version.
3. Signed artifact is immutable and retrievable.
4. Completion status is visible to provider.

**US-4 (Patient):** I can complete intake once, and provider can review captured data.

Acceptance Criteria:
1. Intake form saves structured responses plus raw JSON payload.
2. Mapped fields update patient record in same transaction or guaranteed async job.
3. Validation errors are field-level and actionable.
4. Provider can view submitted timestamp and latest intake version.

### 7.3 Patient Read-Only Clinical View

**US-5 (Patient):** I can view lab reports in the same graphical format used by my provider.

Acceptance Criteria:
1. Patient lab detail uses shared visualization components.
2. Patient cannot edit or trigger re-parse/review actions.
3. Only provider-shared labs are returned.
4. Attempting direct URL access to non-shared or foreign labs returns 404/403.

**US-6 (Patient):** I can view encounter notes that my provider has shared.

Acceptance Criteria:
1. Patient sees only shared/completed encounter notes.
2. Notes are read-only.
3. Notes show visit date and provider attribution.

---

## 8. End-to-End Flows

### 8.1 Provider Invite Flow

1. Provider opens patient profile and clicks `Invite to Portal`.
2. Provider confirms email and sends invite.
3. System creates `patient_invites` row with hashed token + expiration.
4. Patient receives link (`/p/{portal_slug}/accept?token=...`).

### 8.2 Patient Activation and Onboarding Flow

1. Patient opens invite URL.
2. System validates token and creates/links auth account.
3. Patient logs in.
4. If onboarding incomplete:
   - Consent steps
   - Intake step
5. After completion, patient lands on dashboard.

### 8.3 Patient Data Access Flow

1. Dashboard shows shared labs and shared encounter notes.
2. Patient opens lab detail, sees read-only biomarker visuals.
3. Patient opens encounter note detail, sees provider-authored note.

---

## 9. Functional Requirements

### 9.1 Auth and Access

1. Patient and provider sessions must be role-aware.
2. Patient account must map to exactly one `patients.id` in MVP.
3. Access checks must enforce both identity and ownership on every request.

### 9.2 Provider Portal Identity

1. Add `portal_slug` (unique) to practitioner profile.
2. Provider URL route: `/p/[portalSlug]`.
3. Slug is for routing/branding only; no PHI in URL.

### 9.3 Invite Management

1. Provider can create, resend, revoke invites.
2. Invite list view per patient/provider with status + timestamps.
3. Maximum one active invite per patient at a time.

### 9.4 Onboarding

1. Consent requirements are configurable per practice at document level (MVP supports static required set).
2. Intake form starts as fixed schema with extension-friendly structure.
3. Onboarding completion flag gates dashboard access.

### 9.5 Patient Dashboard

1. Labs section (list + detail) for shared lab reports.
2. Encounter notes section (list + detail) for shared visits.
3. No create/update/delete actions from patient surface.

### 9.6 Auditing

Audit events must be written for:
1. Invite created/resend/revoke/accept
2. Consent signed
3. Intake submitted
4. Patient viewed lab report
5. Patient viewed encounter note

---

## 10. Data Model Requirements

### 10.1 New / Updated Columns

1. `practitioners.portal_slug TEXT UNIQUE`
2. `patients.auth_user_id UUID UNIQUE NULL` (links Supabase auth user to patient record)
3. `patients.portal_status TEXT DEFAULT 'invited'` (`invited`, `active`, `disabled`)
4. `lab_reports.is_shared_with_patient BOOLEAN DEFAULT false`
5. `visits.is_shared_with_patient BOOLEAN DEFAULT false`

### 10.2 New Tables

#### `patient_invites`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `practitioner_id` | UUID FK | owner practice |
| `patient_id` | UUID FK | invited patient record |
| `email` | TEXT | destination |
| `token_hash` | TEXT | never store raw token |
| `status` | TEXT | `pending`, `accepted`, `revoked`, `expired` |
| `expires_at` | TIMESTAMPTZ | invite TTL |
| `accepted_at` | TIMESTAMPTZ | nullable |
| `revoked_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

Indexes:
1. `(patient_id, status)`
2. `(practitioner_id, status, created_at DESC)`
3. `(token_hash)` unique

#### `intake_form_templates` (MVP static + future-ready)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `practitioner_id` | UUID FK nullable | null means global default |
| `version` | INTEGER | |
| `title` | TEXT | |
| `schema_json` | JSONB | field definitions |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `patient_intake_submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `practitioner_id` | UUID FK | |
| `patient_id` | UUID FK | |
| `template_id` | UUID FK | |
| `template_version` | INTEGER | immutable snapshot |
| `responses_json` | JSONB | submitted values |
| `mapped_fields_json` | JSONB | fields written to patient record |
| `submitted_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

#### `consent_templates`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `practitioner_id` | UUID FK nullable | null = platform default |
| `document_type` | TEXT | `hipaa_notice`, `treatment_consent`, etc. |
| `version` | INTEGER | |
| `title` | TEXT | |
| `content_markdown` | TEXT | rendered for signing |
| `is_required` | BOOLEAN | |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `patient_consent_signatures`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `practitioner_id` | UUID FK | |
| `patient_id` | UUID FK | |
| `consent_template_id` | UUID FK | |
| `template_version` | INTEGER | immutable |
| `signed_name` | TEXT | typed legal name |
| `signature_method` | TEXT | `typed_ack` in MVP |
| `signed_at` | TIMESTAMPTZ | |
| `ip_address` | INET | |
| `user_agent` | TEXT | |
| `artifact_storage_path` | TEXT | signed snapshot PDF/JSON |
| `created_at` | TIMESTAMPTZ | |

### 10.3 RLS Requirements

Add patient-safe policies in addition to existing practitioner policies:

1. Patient can `SELECT` their own `patients` row where `patients.auth_user_id = auth.uid()`.
2. Patient can `SELECT` own shared labs via `lab_reports.patient_id = patients.id` and `is_shared_with_patient = true`.
3. Patient can `SELECT` own shared visits via `visits.patient_id = patients.id` and `is_shared_with_patient = true`.
4. Patient can `INSERT` intake submissions only for own `patient_id`.
5. Patient can `INSERT` consent signatures only for own `patient_id`.

No patient write access to provider-authored clinical records.

---

## 11. API Requirements

### 11.1 Provider APIs

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/patient-portal/invites` | Create invite |
| `POST` | `/api/patient-portal/invites/[id]/resend` | Resend invite |
| `POST` | `/api/patient-portal/invites/[id]/revoke` | Revoke invite |
| `GET` | `/api/patient-portal/invites?patient_id=...` | List invites |
| `PATCH` | `/api/labs/[id]/share` | Set `is_shared_with_patient` |
| `PATCH` | `/api/visits/[id]/share` | Set `is_shared_with_patient` |

### 11.2 Patient APIs

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/patient-portal/accept-invite` | Token validation + account link |
| `GET` | `/api/patient-portal/me` | Current patient profile + onboarding status |
| `GET` | `/api/patient-portal/me/labs` | List shared labs |
| `GET` | `/api/patient-portal/me/labs/[id]` | Shared lab detail |
| `GET` | `/api/patient-portal/me/notes` | List shared encounter notes |
| `GET` | `/api/patient-portal/me/notes/[id]` | Note detail |
| `GET` | `/api/patient-portal/me/intake` | Active intake template |
| `POST` | `/api/patient-portal/me/intake` | Submit intake |
| `GET` | `/api/patient-portal/me/consents` | Required consent list + status |
| `POST` | `/api/patient-portal/me/consents/[id]/sign` | Sign consent |

### 11.3 API Rules

1. All mutating endpoints require CSRF protection.
2. All sensitive endpoints write audit events.
3. Error responses must not leak whether unrelated patient IDs exist.

---

## 12. UX and Routing Requirements

### 12.1 Patient Routes

1. `/p/[portalSlug]` - branded entry page
2. `/portal/accept` - invite acceptance
3. `/portal/login` - patient auth
4. `/portal/onboarding/consents`
5. `/portal/onboarding/intake`
6. `/portal/dashboard`
7. `/portal/labs/[id]`
8. `/portal/notes/[id]`

### 12.2 UX Constraints

1. Consistent visual language with provider product, simplified navigation.
2. Lab detail must reuse shared biomarker visualization components.
3. Clear read-only labels on all clinical outputs.
4. Empty states for no shared labs/notes.

---

## 13. Compliance and Security Requirements

1. PHI encrypted in transit (TLS 1.2+) and at rest.
2. Invite tokens stored hashed and never logged in plaintext.
3. Signed consent artifacts are immutable and version-linked.
4. Access logs retained per compliance policy.
5. Use least-privilege DB access and maintain BAA-backed processors.

---

## 14. Analytics and Success Metrics

### 14.1 Product KPIs

1. Invite acceptance rate
2. Onboarding completion rate within 7 days
3. Median time from invite to first login
4. Median time from first login to onboarding completion
5. % of active patients who viewed at least one shared lab or note

### 14.2 Operational Metrics

1. Invite failure rate (email delivery / token errors)
2. Consent signing error rate
3. Intake submission validation error rate
4. Unauthorized-access attempt rate

---

## 15. Rollout Plan

### Phase 1: Foundation

1. Schema changes and RLS
2. Portal route scaffolding
3. Invite create/accept flow

### Phase 2: Read-Only Clinical Views

1. Shared labs list/detail (reuse lab visualization)
2. Shared notes list/detail
3. Provider share toggles on labs and visits

### Phase 3: Onboarding

1. Consent templates + signature capture
2. Intake template + submission mapping
3. Onboarding gate + completion statuses

### Phase 4: Beta Hardening

1. QA, security checks, audit verification
2. Pilot with limited providers
3. Iterate before general release

---

## 16. Launch Readiness Checklist (Must Pass)

1. Patient can activate account only with valid invite token.
2. Expired/revoked tokens fail safely.
3. Patient cannot access any other patient's data.
4. Shared lab detail renders with same biomarker visual system as provider view.
5. Patient cannot edit lab or visit records.
6. Consent signing stores legal metadata (name, timestamp, version, IP, user-agent).
7. Intake submission maps required fields into patient record.
8. Provider can see onboarding completion status.
9. Audit logs are generated for all required actions.
10. Security test pass for IDOR and broken access control scenarios.

---

## 17. Risks and Mitigations

1. **Risk:** Sharing logic mistakes expose unshared records.
   **Mitigation:** enforce `is_shared_with_patient` checks in DB policies and API tests.
2. **Risk:** Invite links forwarded to wrong recipient.
   **Mitigation:** short token TTL, single-use token, ability to revoke instantly.
3. **Risk:** Legal ambiguity on consent artifacts.
   **Mitigation:** versioned templates + immutable signed snapshot + legal review before launch.
4. **Risk:** Reused provider components leak provider-only actions.
   **Mitigation:** explicit read-only wrappers and UI tests.

---

## 18. Open Questions

1. Should patient auth be password-first, magic-link-first, or both in MVP?
2. Which consents are globally required vs practice-configurable at launch?
3. Should providers be able to auto-share all completed labs/notes by default, or manual share only?
4. Do we require e-sign signature drawing in MVP, or typed acknowledgement is sufficient?
5. Is one patient account per email strict, or can one email map to multiple family members in future?

---

## 19. Future Extensions (Post-MVP)

1. Custom intake form builder
2. Patient messaging
3. Supplement/medication reconciliation workflows
4. Appointment scheduling and billing
5. Family account linking and delegate access
6. Mobile app and push notifications

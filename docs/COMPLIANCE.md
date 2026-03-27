# Apothecare — HIPAA & SOC 2 Compliance

**Last updated:** March 20, 2026

---

## Audit Log Retention Policy

### Retention Period
- **Minimum:** 6 years from creation date (HIPAA business associate requirement)
- **Target:** 7 years (additional 1-year buffer for legal review)

### Storage
- **Primary:** Supabase PostgreSQL `audit_logs` table (encrypted at rest)
- **Archival (planned):** Logs older than 1 year should be archived to cold storage (e.g., AWS S3 Glacier) as the dataset grows
- **Backups:** Covered by Supabase Pro plan automated daily backups

### Access
- Practitioners can request their audit log history
- Audit logs are immutable — no manual deletion permitted
- Admin access requires documented justification

### Audit Log Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| practitioner_id | UUID | FK to practitioners |
| action | ENUM | query, export, update, delete, etc. |
| resource_type | TEXT | visit, account, patient, lab, etc. |
| resource_id | UUID | Specific resource accessed |
| ip_address | INET | Client IP |
| user_agent | TEXT | Client browser/agent |
| detail | JSONB | Action-specific metadata (export_session_id, counts, etc.) |
| created_at | TIMESTAMPTZ | Timestamp of action |

---

## Export Access Policies

### Who Can Export
- Only authenticated practitioners with a valid session
- Practitioners can only export their own data (enforced by RLS)
- No delegation of export rights (no RBAC yet)

### Rate Limits
| Tier | Data Export Limit | Visit PDF Export |
|------|-------------------|------------------|
| Free | 1 per day | Unlimited |
| Pro | 3 per day | Unlimited |

### Export Security Controls

| Control | Status | Description |
|---------|--------|-------------|
| Authentication | Active | Supabase JWT verified before export |
| Authorization (RLS) | Active | Practitioner can only export own data |
| CSRF protection | Active | Origin header validated on account export |
| Rate limiting | Active | Per-tier daily limits |
| Audit logging | Active | All exports logged with IP, user-agent, session ID |
| Cache prevention | Active | `Cache-Control: no-store, no-cache, private` on all export responses |
| Content security | Active | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` |
| Referrer suppression | Active | `Referrer-Policy: no-referrer` on export responses |
| Watermarking | Active | Visit exports include export session ID, timestamp in footer |
| Session tracking | Active | `export_session_id` UUID links audit log to exported document |
| Filename sanitization | Active | Lab PDF filenames use report UUID, not original filename (may contain PHI) |
| Encryption in transit | Active | TLS 1.3, HSTS with max-age=31536000 |
| No server-side storage | Active | Exports generated in-memory, no temp files |

### Export Content

**Visit PDF Export:** Practice-branded HTML document with SOAP sections. Served as HTML for browser print-to-PDF. Contains full patient PHI (name, DOB, clinical notes).

**Account Data Export:** ZIP file containing JSON exports of all practitioner data plus optional lab PDFs. Contains comprehensive PHI across all patients.

---

## Encryption

### In Transit
- All connections use TLS 1.3
- HSTS header: `max-age=31536000; includeSubDomains`
- Supabase connections: `https://*.supabase.co`

### At Rest
- Database: Supabase PostgreSQL with encryption at rest (AES-256)
- File storage: Supabase Storage (AWS S3 backend, encrypted)
- Exported files: Not encrypted (delivered directly to practitioner browser)

---

## Business Associate Agreements (BAAs)

| Service | BAA Status | Notes |
|---------|-----------|-------|
| Supabase | **Action Required** | Covers database, auth, storage. Supabase Pro plan includes HIPAA BAA — must be explicitly requested via Supabase Dashboard > Settings > Compliance. Ensure the BAA addendum is signed before processing PHI in production. |
| Anthropic | Active | Zero data retention policy. PHI sent via API is never stored or used for training. BAA covers all Claude API usage. |
| OpenAI | **Action Required** | Used for Whisper transcription only. OpenAI offers a BAA for Enterprise and API customers — request via sales or account dashboard. Audio recordings may contain PHI (patient names, conditions discussed). Until BAA is signed, consider: (a) using Anthropic for transcription, or (b) stripping identifiers before sending audio. |
| Vercel | N/A (dev only) | Development environment only. Production on AWS Amplify. |
| AWS Amplify | **Action Required** | HIPAA-eligible under standard AWS BAA. Must sign AWS BAA via AWS Artifact console before deploying PHI workloads. |

### BAA Action Items
1. **Supabase**: Request HIPAA BAA addendum through Supabase Pro plan dashboard
2. **OpenAI**: Contact OpenAI sales to sign BAA for Whisper API usage, or migrate transcription to Anthropic
3. **AWS**: Sign AWS BAA via AWS Artifact if not already completed

---

## Incident Response (Planned)

### Breach Notification
- HIPAA requires notification within 60 days of discovering a breach
- Notification to affected individuals, HHS, and potentially media (if >500 individuals)
- Export watermarking (session ID) enables tracing leaked documents to specific export events

### Steps
1. Identify and contain the breach
2. Assess scope using audit logs (filter by `action: 'export'`, cross-reference session IDs)
3. Notify affected individuals within 60 days
4. Report to HHS via breach portal
5. Document corrective actions

---

## HIPAA Audit Findings — Citation Quality Feedback Loop (v0.27.0)

Audit performed March 20, 2026 against commits 586d225, 87832dc.

### Open Findings — All Resolved

| # | Severity | HIPAA Ref | Finding | Status |
|---|----------|-----------|---------|--------|
| 1 | Critical | §164.312(b) | GET endpoints missing `auditLog()` | ✅ Resolved — audit logging added to both GET routes |
| 2 | Critical | §164.312(b) | Q&A context fetch not audit logged | ✅ Resolved — conversation_messages access logged |
| 3 | High | §164.312(a)(1) | `citation_corrections` missing deny policies | ✅ Resolved — explicit INSERT/UPDATE/DELETE deny policies in migration 028 |
| 4 | Medium | — | Replacement citation data missing validation | ✅ Resolved — DOI regex, title max(1000), authors max(50) in Zod schema |

### Confirmed Good

| Control | Status | Evidence |
|---------|--------|---------|
| Admin auth guards | Pass | `requireAdminUser()` on all admin endpoints |
| CSRF on POST | Pass | `validateCsrf(request)` on all mutations |
| Audit log on POST | Pass | `auditLog()` called with action, resourceId, detail |
| RLS on `verified_citations` | Pass | Read-all, write-own policies in migration 027 |
| Input validation (Zod) | Pass | Schemas for flag, verify, resolve actions |
| Encryption in transit | Pass | TLS 1.3 via Vercel/Supabase |
| Encryption at rest | Pass | AES-256 via Supabase PostgreSQL |
| Anthropic BAA | Pass | Zero data retention policy active |
| Immutable audit logs | Pass | No delete operations permitted |

---

## AI-Generated Responses as PHI

### Classification
AI chat responses stored in the `messages` table are classified as **Protected Health Information (PHI)** when they reference patient context (name, DOB, medications, lab results, clinical history). This applies to:

- **Chat responses**: The `/api/chat/stream` route injects patient biomarker results and clinical context into the system prompt. Claude's responses may synthesize and reference this PHI.
- **Visit AI generation**: SOAP notes, IFM Matrix mappings, and protocol recommendations contain patient-specific clinical data.
- **Pre-chart synthesis**: AI-generated clinical summaries aggregate data from multiple documents and visits.
- **Visit assistant**: Streaming AI responses include patient demographics, vitals, and clinical notes.

### Protections in Place
| Control | Status | Description |
|---------|--------|-------------|
| RLS isolation | Active | Practitioners can only read their own conversations (`practitioner_id` match) |
| Encryption at rest | Active | AES-256 via Supabase PostgreSQL |
| Encryption in transit | Active | TLS 1.3 for all API calls |
| Audit logging | Active | All chat sessions and message reads are logged |
| Patient deletion cascade | Active | Conversations linked to a patient are explicitly deleted during permanent delete (not just SET NULL) |
| Anthropic zero-retention | Active | PHI sent to Claude API is never stored or used for training |
| OpenAI zero-retention | Active | Audio sent to Whisper API uses zero-retention endpoint |

### Residual Risk
AI responses may synthesize PHI that was not present in any single source document (e.g., combining lab results with medication history to produce a clinical narrative). This synthesized PHI is subject to the same protections as source PHI. RLS ensures practitioner-only access, and permanent patient deletion now explicitly removes associated conversations and messages.

---

## Future SOC 2 Type 2 Readiness

### Controls Needed
- [ ] Role-Based Access Control (RBAC) for multi-practitioner practices
- [ ] Export justification field (reason for export)
- [ ] Data Loss Prevention (DLP) rules (max patients per export, export alerts)
- [ ] Formal change management process documentation
- [ ] Automated security testing in CI/CD pipeline
- [ ] Export encryption option (passphrase-protected ZIP)
- [ ] Patient audit log visibility API
- [ ] Automated log archival to cold storage after 1 year

# Apothecare Patient Portal: Deep Research Document

> **Research Date:** February 20, 2026
> **Platform Context:** Next.js 15 App Router + React 19 + Supabase/PostgreSQL + AI Clinical Decision Support
> **Scope:** Patient-facing portal for functional medicine — lab review, visit notes, supplement/medication management

---

## Table of Contents

1. [Competitive Landscape: What the Best Portals Offer](#1-competitive-landscape)
2. [HIPAA Compliance for Patient-Facing Portals](#2-hipaa-compliance)
3. [Patient Identity Verification & Authentication](#3-authentication)
4. [Consent Management & Data Sharing Controls](#4-consent-management)
5. [Medication/Supplement Reconciliation Workflows](#5-medication-supplement-reconciliation)
6. [Patient-Reported Outcomes (PROs)](#6-patient-reported-outcomes)
7. [AI-Powered Patient Education](#7-ai-patient-education)
8. [Wearable Device Integration](#8-wearable-integration)
9. [Smart Supplement Adherence Tracking](#9-supplement-adherence)
10. [Patient-Initiated AI Chat](#10-patient-ai-chat)
11. [Bidirectional Supplement/Medication Updates](#11-bidirectional-updates)
12. [Digital Intake Forms with AI Pre-Population](#12-digital-intake)
13. [Symptom Tracking with AI Pattern Recognition](#13-symptom-tracking)
14. [Dispensary Integration (Fullscript)](#14-dispensary-integration)
15. [Patient Communities & Group Programs](#15-communities)
16. [Telehealth Integration](#16-telehealth)
17. [FHIR/HL7 Interoperability](#17-fhir-interoperability)
18. [Voice-First Interfaces & Accessibility](#18-accessibility)
19. [Predictive Health Insights](#19-predictive-insights)
20. [Technical Architecture for Apothecare](#20-technical-architecture)
21. [AI Patient Health Memory](#21-ai-patient-health-memory)
22. [Competitive Analysis: Superpower Health](#22-superpower-health)
23. [Prioritized Feature Investment Recommendations](#23-feature-prioritization)
24. [Unified Patient Health Timeline — Feature Specification](#24-unified-patient-health-timeline)

---

## 1. Competitive Landscape: What the Best Portals Offer {#1-competitive-landscape}

### Epic MyChart (Gold Standard for Health Systems)

**What they do well:**
- **MyChart Central** (2025 rollout): One unified account linking health data from multiple organizations nationwide. This is the "single pane of glass" that patients want.
- **Biometric login** (Face ID / fingerprint) eliminates password friction.
- **AI-powered conversational interfaces** for scheduling, billing questions, and navigating care instructions. Patients can ask questions that an AI agent answers based on their actual medical data.
- **Remote Patient Monitoring (RPM)** gives MyChart direct access to wearable data (blood pressure cuffs, pregnancy monitors, surgical recovery devices).
- **Care Companion** monitors at-home treatments and sends data back to providers.
- **E-check-in** lets patients complete pre-visit tasks from home.

**Apothecare takeaway:** MyChart's AI agent that answers questions from patient-specific data is the feature to emulate. Their biometric login and wearable integration set the bar for patient experience.

Sources: [MyChart](https://www.mychart.org/) | [Epic MyChart Central](https://www.techtarget.com/patientengagement/news/366629635/Epic-unveils-MyChart-Central-to-link-disparate-patient-portals) | [Epic MyChart 2025 Update](https://www.healthcareittoday.com/2025/09/04/an-update-on-epic-mychart-with-taylor-seale-during-epic-ugm/)

---

### Cerbo (Best-in-Class for Functional Medicine)

**What they do well:**
- **Editable Wellness Plan** shared through the patient portal — patients can follow complex treatment plans in an easy-to-understand format. This is the single most relevant feature for Apothecare.
- **50+ integrated labs** with structured data results and a historical lab result dashboard for tracking biomarker trends over time.
- **IV therapy and supplement protocol tracking** with custom protocol support shared via the patient portal.
- Patients can ask questions about lab results, view results, request refills, and manage appointments.
- Fully cloud-based with multi-location, remote care, and telehealth support.
- **Fullscript integration** for supplement dispensing.

**Apothecare takeaway:** Cerbo's Wellness Plan tracker is the closest analog to what Apothecare should build — a patient-facing view of their full protocol (supplements, lifestyle recommendations, lab monitoring schedule) that they can interact with. The historical lab dashboard with structured data is also directly relevant given Apothecare's biomarker timeline feature.

Sources: [Cerbo Patient Portal](https://www.cer.bo/patient-portal-for-functional-integrative-medicine-providers) | [Cerbo Functional Medicine](https://www.cer.bo/who-we-serve/functional-and-integrative-medicine) | [Cerbo Lab Integration](https://www.cer.bo/post/functional-medicine-labs)

---

### Practice Better (Best for Wellness/Nutrition Practitioners)

**What they do well:**
- **Food and lifestyle journals** in the client portal — real-time interactive accountability between appointments.
- **Client engagement measurement** built into the portal (practitioners can see who is engaged vs. disengaged).
- **Program and course creation** — practitioners can build wellness programs patients follow through the portal.
- **Lab ordering, receiving, viewing, and sharing** directly from the patient portal.
- **HIPAA-compliant telehealth** built into the platform.
- **Collaborative goal tracking** between practitioner and patient.
- **Self-scheduling** with booking, rescheduling, and cancellation.

**Apothecare takeaway:** The engagement measurement feature is brilliant — practitioners should see at a glance which patients are actively engaging with their protocols vs. going dark. The food/lifestyle journal creates ongoing touchpoints between visits, which is critical for functional medicine where lifestyle changes drive outcomes.

Sources: [Practice Better Portal](https://practicebetter.io/features/client-portal) | [Practice Better](https://practicebetter.io/)

---

### Healthie (Best API-First Platform for Digital Health)

**What they do well:**
- **Intelligence by Healthie** (launched 2025): Native, secure AI built into clinician workflows. AI Scribe turns telehealth conversations into structured, editable chart notes.
- **Healthie+** API platform for digital health startups — fully headless, so you can build your own patient experience on top of their infrastructure.
- **Goal setting, progress tracking, and educational resources** within the patient portal.
- **Journal entries, document sharing, and secure chat** in the portal.
- **45,000 clinicians serving 17 million patients** — meaningful scale validation.

**Apothecare takeaway:** Healthie's approach of making AI "native, secure, and deeply integrated" rather than bolted on is the right philosophy. Their API-first architecture validates building a custom patient experience rather than using an off-the-shelf portal.

Sources: [Healthie Patient Portal](https://www.gethealthie.com/patient-portal) | [Healthie 2025 Year in Review](https://www.gethealthie.com/blog/2025-year-end-company-update) | [Healthie Platform](https://www.gethealthie.com/platform-overview)

---

### Athenahealth (Best for Patient Engagement Measurement)

**What they do well:**
- **Patient Digital Engagement Index (PDEI):** A proprietary metric tracking three digital activity categories — access to care, financial activity, and healthcare information. This lets practices measure and improve portal adoption.
- **AI-native agentic features** for patient engagement, streamlining scheduling, check-in, and communication.
- **Biometric authentication** on the athenaPatient mobile app.
- **Multi-language portal support** with customizable instructions and how-to videos.
- **Pre-visit screeners and consent forms** captured digitally before appointments.

**Apothecare takeaway:** The PDEI concept is worth emulating — a dashboard that shows practitioners how engaged each patient is with their digital tools. Multi-language support matters for inclusive care.

Sources: [Athenahealth Patient Engagement](https://www.athenahealth.com/solutions/patient-engagement) | [Athenahealth PDEI Research](https://www.athenahealth.com/resources/blog/patient-digital-engagement-research-2025) | [Athenahealth Portal Benefits](https://www.athenahealth.com/resources/blog/patient-portals-provider-benefits)

---

### Jane App (Best for Simplicity and Wellness Clinics)

**What they do well:**
- **Document sharing** through portal — exercise programs, progress reports, treatment plans.
- **Bidirectional profile updates** — patient contact info changes in the portal automatically update the clinic's records.
- **Payment self-service** — patients view receipts, pay balances, manage credit cards.
- **Communication preference management** — patients choose how they want to receive reminders.
- **Pronoun and identity support** as a portal feature.

**Apothecare takeaway:** Jane's simplicity is instructive — they do fewer things but do them cleanly. The bidirectional profile sync is a pattern to follow for supplement list management.

Sources: [Jane App Patient Portal](https://jane.app/guide/my-account-your-patient-client-portal) | [Jane App Features](https://jane.app/features)

---

### Elation Health (Best for Primary Care)

**What they do well:**
- **Patient Passport** — patients access health history, test results, and provider messages through a unified "passport."
- **Family portal** for pediatric practices — parents/guardians manage children's health records.
- **Weight-based dosing calculator and AI-powered scribe** integrated into workflows.
- **Free implementation** with 24/7 premium support.

**Apothecare takeaway:** The "Passport" branding is clever — framing the portal as the patient's identity document for their health journey. The family portal concept is relevant for functional medicine practices serving families.

Sources: [Elation Patient Passport](https://www.elationhealth.com/solutions/ehr/patient-passport/) | [Elation Health](https://www.elationhealth.com/)

---

## 2. HIPAA Compliance for Patient-Facing Portals {#2-hipaa-compliance}

### 2025-2026 Regulatory Changes (Critical)

The HIPAA landscape is undergoing its **first major update in nearly 20 years**. Key changes affecting patient portals:

#### Mandatory Requirements (Effective 2026)

| Requirement | Detail | Apothecare Impact |
|---|---|---|
| **MFA required for all ePHI access** | No longer "addressable" — it is mandatory. Applies to internal and remote access. | Must implement MFA for all patient logins, not just practitioner logins. |
| **Encryption of ePHI at rest AND in transit** | AES-256 for data at rest, TLS 1.2+ for data in transit. No exceptions. | Supabase provides TLS in transit. Need to verify/enable encryption at rest for all PHI tables. |
| **Annual Security Risk Analysis** | Documented methodology and scope, performed every year. | Must document the patient portal's threat model and review annually. |
| **Annual compliance audits** | Covered entities must conduct and document annual compliance audits. | Build audit capability into the portal from day one. |
| **Faster breach reporting** | Business associates must report breaches more quickly. | Supabase's BAA terms must align with new timelines. |
| **All safeguards now mandatory** | The "required vs. addressable" distinction is eliminated. Every implementation specification is mandatory. | No shortcuts — every security control must be implemented. |

#### Patient Access API Requirement

HHS will consider it a **HIPAA violation** to deny patients access to their PHI via an app of their choosing, unless it can be demonstrated that systems would be endangered. This means:
- Apothecare must support patient data export.
- Consider FHIR-based API access for patient data portability.
- Document any legitimate security reasons for access restrictions.

#### Substance Use Disorder (SUD) Records

Patients can now provide a **single written consent** allowing SUD records to be shared for treatment, payment, and healthcare operations — replacing the old requirement for repeated, disclosure-specific consent. This simplifies consent management.

#### Audit Trail Requirements

- **Individual login credentials mandatory** — no shared accounts for systems containing ePHI.
- **Centralized logging** — connection logs sent to a central SIEM.
- **Role-Based Access Control (RBAC)** with documented policies.
- **Encryption key access** must follow least-privilege principles with audit logs.

**Apothecare already has:** `auditLog()` fire-and-forget pattern in `src/lib/api/audit.ts`. This foundation must be extended to cover all patient portal PHI access events.

Sources: [HIPAA Journal Updates 2026](https://www.hipaajournal.com/hipaa-updates-hipaa-changes/) | [HIPAA Security Rule Changes](https://www.rubinbrown.com/insights-events/insight-articles/hipaa-security-rule-changes-2025-2026-hipaa-updates/) | [HIPAA MFA Requirements](https://www.strongdm.com/blog/hipaa-mfa-requirements) | [HIPAA Encryption Requirements](https://www.hipaajournal.com/hipaa-encryption-requirements/) | [HIPAA Privacy Rule Update](https://www.accountablehq.com/post/hipaa-privacy-rule-update-2025-what-changed-and-how-to-comply)

---

## 3. Patient Identity Verification & Authentication {#3-authentication}

### Recommended Authentication Stack for Apothecare

#### Layer 1: Account Creation & Identity Verification

1. **Email + phone verification** (baseline)
2. **Government ID verification** for initial account activation (consider Prove or similar identity proofing service)
3. **Practitioner-initiated invitation flow** — the practitioner creates the patient record, and the patient receives a secure invitation link to claim their account. This is the safest approach for a medical platform.

#### Layer 2: Multi-Factor Authentication (Mandatory per 2026 HIPAA)

Recommended MFA methods in priority order:

| Method | Pros | Cons | Recommendation |
|---|---|---|---|
| **Authenticator app (TOTP)** | Most secure, no SMS interception risk | Requires app install | Primary MFA method |
| **Biometric (Face ID / fingerprint)** | Lowest friction, HIPAA-recognized | Device-dependent | Enabled by default on supported devices |
| **Push notification** | Good UX, moderate security | Requires mobile app | If PWA supports push |
| **SMS/voice code** | Universal, no app needed | SIM swap attacks | Fallback only |
| **FIDO2/WebAuthn** | Strongest, phishing-resistant | Hardware key required | Offer for security-conscious users |

#### Layer 3: Session Management

- **Session timeout:** 15-30 minutes of inactivity for PHI-containing screens.
- **Re-authentication:** Require MFA re-entry for sensitive actions (downloading records, changing medication lists, viewing lab results for the first time).
- **Concurrent session limits:** Alert patient if their account is accessed from a new device.
- **Session revocation:** Patient can view and terminate active sessions from their profile.

#### Supabase Implementation Notes

Supabase Auth supports:
- Email/password with email confirmation
- Phone auth (SMS OTP)
- OAuth providers (Google, Apple — useful for social login)
- Custom claims via Auth Hooks (essential for patient vs. practitioner role differentiation)

For biometric auth, this would be implemented at the PWA/app level using the Web Authentication API (WebAuthn), with Supabase storing the credential public key.

Sources: [Prove Healthcare Identity Verification](https://www.prove.com/blog/solving-healthcare-id-verification) | [HIPAA MFA Requirements](https://www.virtualsprout.com/hipaa-2025-the-new-mfa-requirement-what-it-means-for-your-healthcare-practice/) | [Biometric Auth in Healthcare](https://www.rxnt.com/why-healthcare-is-making-the-shift-to-biometric-authentication/) | [Supabase Custom Claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

---

## 4. Consent Management & Data Sharing Controls {#4-consent-management}

### What Patients Should Control

1. **Granular data sharing toggles:**
   - Share lab results with: [specific family member / caregiver / other provider]
   - Share visit notes: [all / summary only / none]
   - Share supplement/medication list: [yes / no]
   - Share with third-party apps: [per-app consent]

2. **Consent versioning:**
   - Every consent change is timestamped and stored immutably.
   - Patients can review their consent history.
   - Re-consent required when privacy policy changes.

3. **Data export and portability:**
   - Download all personal health data (HIPAA Right of Access).
   - Export in standardized formats (PDF, FHIR JSON, CSV).
   - Account deletion with data retention per legal requirements.

4. **Proxy access / caregiver delegation:**
   - Patient designates a caregiver who can view (but not modify) their data.
   - Time-limited access grants (e.g., "my spouse can see my labs for the next 30 days").
   - Audit trail of all proxy access.

### Implementation Pattern

```
consent_records table:
  - id (UUID)
  - patient_id (FK -> patients)
  - consent_type (enum: data_sharing, portal_terms, hipaa_notice, caregiver_access)
  - granted_to (nullable UUID — for caregiver/provider-specific consent)
  - scope (JSONB — granular permissions)
  - version (integer)
  - granted_at (timestamptz)
  - revoked_at (nullable timestamptz)
  - ip_address (inet)
  - user_agent (text)
```

Sources: [HIPAA Privacy Rule Update 2025](https://www.accountablehq.com/post/hipaa-privacy-rule-update-2025-what-changed-and-how-to-comply) | [HIPAA 2026 Rule Updates](https://www.chesshealthsolutions.com/2025/11/06/2026-hipaa-rule-updates-what-healthcare-providers-administrators-and-compliance-officers-need-to-know/)

---

## 5. Medication/Supplement Reconciliation Workflows {#5-medication-supplement-reconciliation}

### The Problem

Medication reconciliation is the single biggest source of errors in healthcare. In functional medicine, this is compounded by:
- Patients taking 10-30+ supplements that change frequently.
- OTC supplements not tracked in pharmacy systems.
- Patients starting/stopping supplements without telling their provider.
- Multiple providers recommending overlapping or conflicting supplements.

### Best Practice: Three-Step Reconciliation (AHRQ Standard)

1. **Verify** — Collect the complete list (medications, vitamins, supplements, OTC drugs, vaccines).
2. **Clarify** — Confirm that medications and dosages are appropriate.
3. **Reconcile** — Document any changes and resolve discrepancies.

### The SMMRT Pattern (VA Research)

The Veterans Affairs developed the **Secure Messaging for Medication Reconciliation Tool (SMMRT)**, which:
- Initiates within 72 hours of a visit/discharge.
- Sends the patient their current medication list via secure portal message.
- Patient reviews and edits the list at home (adds missed items, removes discontinued ones).
- Clinical pharmacist reviews patient changes and updates the EHR.
- Updated list is posted for all providers to see.

**This is the exact pattern Apothecare should implement for supplement reconciliation.**

### Apothecare-Specific Workflow Design

```
Patient View:
  "My Supplements & Medications"
  ┌─────────────────────────────────────────┐
  │  Active Supplements (from your provider) │
  │  ├── Vitamin D3 5000 IU — 1x daily AM   │  [Taking] [Stopped] [Changed dose]
  │  ├── Magnesium Glycinate 400mg — 1x PM   │  [Taking] [Stopped] [Changed dose]
  │  └── Fish Oil 2g — 1x daily with food    │  [Taking] [Stopped] [Changed dose]
  │                                           │
  │  + Add a supplement your provider         │
  │    doesn't know about                     │
  │                                           │
  │  Pending Changes (awaiting provider       │
  │  review):                                 │
  │  ├── "I stopped taking NAC last week"     │  Status: Pending
  │  └── "I started CoQ10 200mg on my own"   │  Status: Pending
  └─────────────────────────────────────────┘

Provider Dashboard:
  "Reconciliation Queue" (new items badge)
  ├── Patient: Jane Doe
  │   ├── Stopped: NAC 600mg (patient-reported 2/18)
  │   ├── Added: CoQ10 200mg (patient-reported 2/19)
  │   └── [Approve All] [Review Individually] [Message Patient]
```

### Key Design Decisions

- **Patients can report changes but not unilaterally modify the provider's prescribed list.** Patient-reported changes go into a "pending" state.
- **Providers get a reconciliation queue** — like a pull request review for medications.
- **Auto-prompt reconciliation** before each visit: "Has anything changed since your last appointment?"
- **Interaction checking** when patients add OTC supplements — flag potential conflicts with their prescribed protocol.

Sources: [AHRQ Medication Reconciliation](https://www.ahrq.gov/patient-safety/settings/hospital/match/chapter-3.html) | [SMMRT VA Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3957401/) | [Surescripts Medication History](https://surescripts.com/what-we-do/medication-history-for-reconciliation) | [Electronic Tools for MedRec](https://pmc.ncbi.nlm.nih.gov/articles/PMC7654089/)

---

## 6. Patient-Reported Outcomes (PROs) {#6-patient-reported-outcomes}

### Why PROs Matter for Functional Medicine

Functional medicine outcomes are often subjective — energy levels, brain fog, sleep quality, digestive comfort, mood. These cannot be measured by labs alone. PROs capture the patient's lived experience alongside biomarker data.

### Implementation Approach

**Validated Instruments to Consider:**
- **MSQ (Medical Symptoms Questionnaire)** — The standard functional medicine intake/outcomes tool. Measures 15 symptom categories with 0-4 severity scoring.
- **PROMIS-29** (NIH) — Covers physical function, anxiety, depression, fatigue, sleep, social participation, pain. Standardized and validated.
- **PHQ-9** / **GAD-7** — Depression and anxiety screens (commonly used, quick).
- **Bristol Stool Scale** — For GI-focused functional medicine.
- **Pittsburgh Sleep Quality Index (PSQI)** — For sleep-focused protocols.

**Collection Cadence:**
- **Pre-visit:** Full MSQ or PROMIS-29 administered digitally before each appointment.
- **Between visits:** Weekly or biweekly micro-surveys (3-5 questions) on key symptoms the practitioner is tracking.
- **Post-protocol:** Outcome measurement after completing a supplement/lifestyle protocol.

**AI Integration:**
- Overlay PRO trends with biomarker timelines to show correlation (e.g., "Your fatigue score improved 40% as your ferritin normalized").
- Alert providers when PRO scores worsen despite stable labs (suggesting the protocol isn't addressing the root cause).
- Generate patient-facing summaries: "Over the past 3 months, your sleep quality improved from 'poor' to 'good' based on your weekly check-ins."

Sources: [ePRO Tools 2025 Directory](https://ccrps.org/clinical-research-blog/directory-of-electronic-patient-reported-outcomes-epro-tools-2025-edition) | [AHRQ PRO Design Principles](https://digital.ahrq.gov/ahrq-funded-projects/developing-design-principles-integrate-patient-reported-outcomes-pros-clinical) | [AHRQ ePRO Guidelines](https://digital.ahrq.gov/program-overview/research-stories/guidelines-meaningful-and-effective-electronic-patient-reported)

---

## 7. AI-Powered Patient Education {#7-ai-patient-education}

### Industry Direction

This is moving fast. Two major implementations in 2025:

**Oracle Health (formerly Cerner):**
- Adding AI to their patient portal that provides "secure, clear, plain-language explanations of diagnoses, test results, and treatment options."
- Example: If a lab report shows "eGFR: 52," the AI explains what that measure represents and translates "hypertensive heart disease" into understandable language.
- The AI will NOT generate diagnoses, medications, or treatment recommendations (key guardrail).

**Stanford Health Care:**
- AI drafts interpretations of clinical test and lab results.
- Explains them in a message using plain language.
- A physician reviews and approves before sending to the patient.
- This physician-in-the-loop pattern is the gold standard for safety.

**RosettaMD:**
- Free, deterministic AI tool (not generative — no hallucinations).
- Translates real clinical documents into plain English.
- Trained on 550,000+ medical concepts and 264,000 plain-language definitions.
- Returns the same result every time (unlike ChatGPT).

### Apothecare Implementation Plan

```
Patient views lab result:
  ┌─────────────────────────────────────────────────────────┐
  │  Vitamin D, 25-Hydroxy                                  │
  │  Result: 22 ng/mL                                       │
  │  Reference Range: 30-100 ng/mL (conventional)           │
  │  Optimal Range: 50-80 ng/mL (functional)                │
  │                                                          │
  │  [AI explanation — pre-approved by provider]             │
  │  "Your vitamin D level is below both the standard and   │
  │  optimal ranges. Vitamin D is important for immune       │
  │  function, bone health, and mood regulation. Your        │
  │  provider has recommended supplementation to bring this  │
  │  into the optimal range. Most people see improvement     │
  │  within 8-12 weeks of consistent supplementation."       │
  │                                                          │
  │  [Provider note attached]                                │
  │  "We discussed starting D3 5000 IU daily with a fat-    │
  │  containing meal. We'll retest in 90 days."              │
  │                                                          │
  │  [Ask a question about this result]                      │
  └─────────────────────────────────────────────────────────┘
```

### Safety Architecture

1. **Provider-approved templates** for common biomarker explanations (curated library).
2. **AI-generated explanations** for less common results, always with the disclaimer: "This explanation is AI-generated and reviewed by your care team. It is not medical advice."
3. **Provider review queue** — AI drafts patient-facing explanations, provider approves/edits before release (Stanford model).
4. **Functional medicine lens** — explanations reference optimal ranges, not just conventional ranges, aligned with the Clinical Lens toggle already in Apothecare.
5. **Never generate diagnoses or treatment recommendations** — only explain what a result means in plain language (Oracle guardrail).

Sources: [Oracle AI Patient Portal](https://www.oracle.com/news/announcement/oracle-to-bring-new-ai-capabilities-to-its-patient-portal-2025-09-10/) | [Stanford AI Lab Results](https://med.stanford.edu/news/all-news/2025/01/ai-test-results) | [RosettaMD](https://www.archimedesmedical.com/insightscompanynews/insightsandcompanynews)

---

## 8. Wearable Device Integration {#8-wearable-integration}

### The Landscape in 2025

Wearable integration is one of the biggest differentiators for health platforms. The trend is clear: patients want their health data unified in one place, and functional medicine practitioners need longitudinal lifestyle data to complement lab results.

### Integration Strategy: Unified API Approach

**Do NOT build individual integrations.** Use a unified wearable API:

| Platform | Pricing | Devices | Notes |
|---|---|---|---|
| **Terra API** | $399/mo (annual) / $499/mo (monthly), 100K credits included | Apple Health, Garmin, Oura, Whoop, Fitbit, Freestyle Libre, Peloton, Withings, 400+ more | Most comprehensive. Requires mobile SDK for Apple Health (no web API). Standardizes data format without altering raw values. |
| **Open Wearables** | Open source | Apple Health, Garmin, Whoop, Polar, Suunto, Samsung Health | Free but less mature. Handles OAuth flows, data normalization, real-time syncing. |
| **Vital** | Tiered pricing | Similar coverage to Terra | Strong clinical focus, HIPAA-eligible. |

**Recommendation:** Start with **Terra API** for broadest device coverage and fastest time-to-market. Fall back to Open Wearables if cost is a concern during early stages.

### What Data to Collect and Why

| Data Type | Source Devices | Functional Medicine Relevance |
|---|---|---|
| **Sleep** (duration, stages, HRV) | Oura, Whoop, Apple Watch, Garmin | Correlate with cortisol levels, adrenal fatigue protocols |
| **Heart Rate Variability (HRV)** | Oura, Whoop, Apple Watch | Stress response, nervous system regulation, recovery |
| **Blood glucose (CGM)** | Dexcom, Freestyle Libre, Levels | Metabolic health, insulin resistance, dietary response |
| **Activity / Steps** | All wearables | Exercise prescription adherence |
| **Body temperature** | Oura | Thyroid function monitoring, menstrual cycle tracking |
| **SpO2** | Apple Watch, Garmin | Sleep apnea screening, respiratory health |
| **Weight / Body composition** | Withings, Renpho | Treatment progress tracking |

### Patient Portal Wearable Dashboard

```
My Health Data
  ┌─────────────────────────────────────────────────────────┐
  │  Connected Devices: Oura Ring (synced 2h ago)           │
  │                     Dexcom G7 (live)                    │
  │                                                          │
  │  Sleep Score Trend (30 days)    ████████░░ 78 avg        │
  │  HRV Trend (30 days)           ████████████ 52ms avg    │
  │  Avg Glucose (7 days)          ██████░░░░ 98 mg/dL      │
  │  Time in Range                 ████████████ 92%         │
  │                                                          │
  │  AI Insight: "Your HRV has improved 15% since starting  │
  │  magnesium glycinate 6 weeks ago. Your sleep deep sleep  │
  │  percentage has also increased from 12% to 18%."        │
  │                                                          │
  │  [Share with my provider]  [Detailed view]              │
  └─────────────────────────────────────────────────────────┘
```

**Important:** Apple Health has NO web API. To access Apple Health data, Apothecare would need either a native iOS app or a React Native wrapper. The Terra mobile SDK (available in Swift, React Native, and Flutter) handles this. This is a strong argument for eventually building a native mobile app or at minimum a React Native shell.

Sources: [Terra API](https://tryterra.co/) | [Terra Integrations](https://tryterra.co/integrations) | [Terra Pricing](https://tryterra.co/pricing) | [Open Wearables](https://www.themomentum.ai/blog/introducing-open-wearables-the-open-source-api-for-wearable-health-intelligence) | [Wearables + Bloodwork Integration](https://insider.fitt.co/wearables-integrate-bloodwork-oura-health-panels/)

---

## 9. Smart Supplement Adherence Tracking {#9-supplement-adherence}

### Industry Context

The medication adherence app market is projected to reach $12.44 billion by 2032 (11.84% CAGR). Key features from leading apps:

- **Medisafe:** Multi-medication management, personalized reminders, drug interaction warnings, adherence tracking, caregiver sync, smartwatch integration.
- **DoseMed:** Built-in AI health assistant offering personalized support and real-time scheduling adjustments.
- **Nudge:** Physical device with escalating reminders (green light -> beep -> push notification to caregiver after 1 hour).

### Apothecare Supplement Adherence Feature Design

#### Core Features (MVP)

1. **Daily check-in:**
   - Morning/evening check-in screen showing today's supplements with one-tap confirmation.
   - "Did you take your AM supplements?" -> [Yes] [Partial] [No]
   - Track which specific supplements were taken vs. skipped.

2. **Streak tracking:**
   - Visual streak counter ("You've been consistent for 14 days!").
   - Weekly adherence percentage shown on provider dashboard.

3. **Smart reminders:**
   - Push notifications at scheduled times.
   - Configurable by the patient (not the provider — patient autonomy).
   - Snooze and reschedule options.

4. **Refill predictions:**
   - Based on protocol dosages and start dates, predict when each supplement will run out.
   - "Your Vitamin D3 supply will run out around March 15. [Reorder from Fullscript]"
   - This directly ties into the Fullscript integration.

#### Advanced Features (Post-MVP)

5. **Interaction warnings:**
   - When patient adds an OTC supplement, check against their current protocol for known interactions.
   - Use a drug interaction database (Natural Medicines, DrugBank, or similar).

6. **Adherence analytics for providers:**
   - Provider sees which supplements the patient is actually taking vs. prescribed.
   - Pattern detection: "Patient consistently skips evening supplements — consider consolidating to AM."

7. **Photo logging:**
   - Patient can photograph their actual supplement bottles for the provider to verify brand/dosage.

Sources: [Top Medication Reminder Apps 2026](https://dosepacker.com/blog/top-medication-reminder-apps) | [Best Medication Apps 2025](https://dosemedapp.com/blog/best-medication-reminder-apps-2025) | [Medisafe](https://apps.apple.com/us/app/medisafe-medication-management/id573916946)

---

## 10. Patient-Initiated AI Chat {#10-patient-ai-chat}

### Regulatory Landscape

**California SB 243 and AB 489** (effective January 1, 2026) set the standard:
- **Continuous disclosure** that the patient is talking to AI, not a human.
- **Self-harm intervention protocols** must be built in.
- **Prohibition on misleading medical authority** — AI cannot present itself as a doctor.

### Industry Implementations and Guardrails

**Amazon One Medical:**
- AI chatbot with "multiple patient safety guardrails."
- Protocols that connect patients with a provider when clinical judgment is needed.
- Built for after-hours triage and routine questions.

**Oracle Health:**
- AI portal will NOT generate diagnoses, medications, or treatment recommendations.
- Focused on explaining existing results and answering informational questions.

**BastionGPT:**
- HIPAA-compliant ChatGPT wrapper for healthcare.
- Audit trails for all AI interactions.

### Apothecare Patient AI Chat Design

#### What the AI CAN do:

1. **Answer questions about their own lab results:**
   - "What does my homocysteine level mean?"
   - "Is my vitamin D improving?"
   - Context: AI has access to the patient's actual data.

2. **Explain their supplement protocol:**
   - "Why am I taking NAC?"
   - "When should I take my magnesium?"
   - Context: AI references the provider's notes and protocol rationale.

3. **Provide general wellness education:**
   - "What foods are high in magnesium?"
   - "How does sleep affect cortisol?"

4. **Summarize visit notes:**
   - "What did my practitioner recommend at my last visit?"

#### What the AI CANNOT do:

1. Diagnose conditions.
2. Recommend starting or stopping supplements/medications.
3. Interpret results in a way that contradicts the provider's assessment.
4. Provide emergency medical advice.

#### Safety Architecture:

```
Patient sends message
  │
  ├── Emergency detection layer (chest pain, suicidal ideation, etc.)
  │   └── Immediate: "If you're experiencing a medical emergency, call 911."
  │       + Notify provider
  │
  ├── Scope check: Is this within AI's allowed domain?
  │   ├── YES → Generate response with patient's data context
  │   │         + Add disclaimer: "This is AI-generated. Discuss with your provider."
  │   │         + Log interaction to audit trail
  │   │
  │   └── NO → "Great question! This is something your practitioner can best
  │             address. Would you like to send them a message?"
  │             + Offer to route to provider messaging
  │
  └── Provider visibility: All AI chat transcripts visible in provider dashboard
      with flags for any escalated conversations
```

#### Technical Note:
Apothecare already has SSE streaming (`streamCompletion()` in `src/lib/ai/provider.ts`). The patient AI chat can reuse this infrastructure with a different system prompt that enforces the guardrails above.

Sources: [California AI Guardrails SB 243](https://healthtechmagazine.net/article/2026/01/california-adds-guardrails-ai-powered-medical-chats) | [Oracle AI Patient Portal](https://www.healthcaredive.com/news/oracle-launch-ai-patient-portal/759894/) | [Amazon One Medical AI](https://www.healthcaredive.com/news/amazon-one-medical-health-ai-assistant-chatbot/810235/) | [AI Chatbot Healthcare Guide](https://hiverhq.com/healthcare-chatbots)

---

## 11. Bidirectional Supplement/Medication Updates {#11-bidirectional-updates}

### The Core Problem

In functional medicine, the medication/supplement list becomes stale the moment the patient leaves the office. Patients:
- Start supplements on their own (friend recommendations, internet research).
- Stop supplements due to side effects, cost, or inconvenience.
- Change dosages.
- Add OTC medications.
- See other providers who prescribe overlapping supplements.

The provider's EHR record quickly becomes fiction.

### The Solution: A "Pull Request" Model for Supplements

Borrow the software development concept of pull requests: **patients propose changes, providers review and merge.**

#### Workflow States

```
┌────────────┐     ┌──────────────┐     ┌────────────┐
│  PRESCRIBED │ ──> │ PATIENT      │ ──> │ PROVIDER   │
│  (Provider  │     │ REPORTED     │     │ CONFIRMED  │
│  set this)  │     │ CHANGE       │     │            │
└────────────┘     │ (Pending)    │     └────────────┘
                   └──────────────┘
                         │
                         v
                   ┌──────────────┐
                   │ PROVIDER     │
                   │ REJECTED     │
                   │ (with note)  │
                   └──────────────┘
```

#### Change Types

| Change | Patient Action | Provider Action |
|---|---|---|
| Stopped taking a prescribed supplement | Reports "I stopped" with optional reason | Reviews, acknowledges, adjusts protocol |
| Changed dose | Reports new dose | Reviews, approves or suggests correction |
| Added OTC supplement | Adds to list with details | Reviews for interactions, approves or flags concern |
| Added Rx from another provider | Reports medication + prescriber | Reviews for interactions, updates master list |
| Side effect report | Flags a supplement with symptoms | Reviews, may adjust or discontinue |

#### Notification Flow

- **Patient makes a change** -> Provider gets a notification (badge on reconciliation queue).
- **Provider reviews** -> Patient gets a notification ("Your provider reviewed your supplement update").
- **Interaction detected** -> Both patient AND provider get an alert.
- **Reconciliation overdue** -> Patient gets a periodic prompt ("It's been 30 days — is your supplement list still accurate?").

### Database Schema Concept

```sql
-- supplement_changes (the "pull request" table)
CREATE TABLE supplement_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  practitioner_id UUID REFERENCES practitioners(id),
  supplement_name TEXT NOT NULL,
  change_type TEXT CHECK (change_type IN ('added', 'stopped', 'dose_changed', 'side_effect')),
  previous_value JSONB,  -- {dose: '400mg', frequency: '1x daily'}
  new_value JSONB,       -- {dose: '200mg', frequency: '2x daily'}
  patient_note TEXT,
  provider_response TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'acknowledged')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES practitioners(id)
);
```

Sources: [AHRQ Medication Reconciliation](https://digital.ahrq.gov/medication-reconciliation) | [VA SMMRT Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3957401/) | [Bidirectional Exchange](https://www.consensus.com/blog/bidirectional-exchange-another-major-step-toward-healthcare-interoperability/)

---

## 12. Digital Intake Forms with AI Pre-Population {#12-digital-intake}

### Current Industry Standards

The patient intake software market is growing from $1.8B (2023) to $4B by 2031. Key innovations:

- **AI-powered smart forms** adapt in real time — ask follow-up questions based on answers, skip irrelevant sections.
- **ID/insurance card scanning** via OCR extracts information to pre-fill forms (CheckinAsyst).
- **Predictive autofill** for returning patients — no starting from scratch.
- **Real-time validation** flags errors and missing data instantly.
- **Historical data pre-population** — e.g., pulling a diabetic patient's last HbA1c into intake forms (DocResponse).

### Apothecare Intake Form Strategy

#### For New Patients:

1. **Practitioner sends invite** -> Patient receives onboarding link.
2. **Identity verification** (ID upload or manual entry).
3. **Smart intake form** with functional medicine focus:
   - Health history (conditions, surgeries, family history).
   - Current supplements and medications (with photo upload option).
   - Lifestyle assessment (sleep, exercise, stress, diet patterns).
   - MSQ (Medical Symptoms Questionnaire) as baseline PRO.
   - Goals and concerns (free text + structured options).
4. **AI pre-processing:**
   - Extract structured data from uploaded documents (prior lab reports, medication lists).
   - Flag potential concerns for provider pre-review.
   - Generate a "patient summary brief" the provider can scan before the first visit.

#### For Returning Patients (Pre-Visit):

1. **Auto-populated form** with data from last visit.
2. **"What's changed?" flow** — only ask about deltas.
3. **Supplement reconciliation check** (see Section 5).
4. **Updated PRO assessment** (see Section 6).
5. **New symptom or concern capture** with AI-guided follow-up questions.

Sources: [Digital Patient Intake 2025](https://www.promptlycheckin.com/article/digital-patient-intake-guide-2025-key-insights-for-healthcare-practices) | [AI Enhanced Intake Forms](https://mconsent.net/blog/role-ai-enhancing-digital-new-patient-intake-forms/) | [Best Patient Intake Software 2025](https://www.certifyhealth.com/blog/top-10-digital-patient-intake-software-for-practices-in-2025/)

---

## 13. Symptom Tracking with AI Pattern Recognition {#13-symptom-tracking}

### The Opportunity

Functional medicine is uniquely positioned to benefit from longitudinal symptom tracking because:
- Treatment timelines are long (months, not days).
- Symptom patterns often reveal root causes (e.g., cyclical fatigue correlating with menstrual cycle suggesting hormone imbalance).
- Lifestyle factors (sleep, stress, diet) have measurable impact on symptoms.
- Patients often don't notice gradual improvement without data.

### AI Pattern Recognition Capabilities

Current AI/ML approaches for symptom pattern detection:

1. **Time-series analysis (LSTM/RNN):** Analyze longitudinal symptom logs to identify periodicity, trends, and anomalies.
2. **Correlation detection:** "Your headache frequency increases when your sleep score drops below 70."
3. **Trigger identification:** "Your GI symptoms worsen 24-48 hours after high-stress days."
4. **Progress visualization:** Show patients their improvement trajectory vs. a flat view of daily symptoms.

### Apothecare Symptom Tracker Design

#### Daily Check-In (2 minutes max)

```
How are you feeling today?
  Energy:     ○ ○ ○ ● ○  (4/5)
  Sleep:      ○ ○ ● ○ ○  (3/5)
  Digestion:  ○ ○ ○ ○ ●  (5/5)
  Mood:       ○ ○ ○ ● ○  (4/5)
  Pain:       ○ ● ○ ○ ○  (2/5)

  Anything else to note? [free text]
  [Submit - takes 30 seconds]
```

#### Provider-Customizable Tracking

- Practitioners can add/remove symptom categories per patient.
- Example: For a thyroid patient, add "cold sensitivity" and "hair quality" as tracked symptoms.
- For a GI patient, add "bloating," "bowel quality," "food reactions."

#### AI Insights (Monthly Summary)

```
Monthly Health Trends (January 2026)
  ┌─────────────────────────────────────────────────────────┐
  │  Energy: ↑ 22% improvement (avg 3.2 → 3.9)            │
  │  Sleep:  → Stable (avg 3.5)                            │
  │  Digestion: ↑ 35% improvement (avg 2.8 → 3.8)         │
  │                                                          │
  │  Pattern detected: Your energy scores are highest       │
  │  on days when you log 7+ hours of sleep AND take your   │
  │  morning supplements on time.                           │
  │                                                          │
  │  Correlation: Your digestion improvement coincides      │
  │  with starting the probiotic protocol on Jan 5.         │
  │                                                          │
  │  [Share with my provider]                               │
  └─────────────────────────────────────────────────────────┘
```

Sources: [AI in Remote Patient Monitoring](https://www.delveinsight.com/blog/artificial-intelligence-in-remote-patient-monitoring) | [AI Turning Health Data Into Insights](https://www.mindbodygreen.com/articles/how-ai-is-turning-your-health-data-into-actionable-insights) | [AI Patient Progress Dashboard](https://guavahealth.com/article/ai-patient-progress-dashboard) | [Stanford Longitudinal EHR Datasets](https://hai.stanford.edu/news/advancing-responsible-healthcare-ai-longitudinal-ehr-datasets)

---

## 14. Dispensary Integration (Fullscript) {#14-dispensary-integration}

### Current State

- **Wellevate and Emerson Ecologics have been absorbed into Fullscript** (migration completed October 2023). Fullscript is now the dominant supplement dispensary platform.
- Fullscript connects to **30+ EHR platforms** and has a well-documented REST API.
- Fullscript offers an **iOS patient mobile app** for ordering and reviewing supplement plans.

### Fullscript API Capabilities

| Module | What It Does | Apothecare Use Case |
|---|---|---|
| **Professional Catalog** | Access the comprehensive nutraceutical database | Search and reference supplements in protocols |
| **Granular Search** | Filter by brand, product name, or ingredient | Patient searches within their portal |
| **Create Supplement Plans** | Create plans sent to patients via email/SMS | Provider creates plan -> appears in patient portal |
| **Patient Management** | Create/manage patient records with metadata | Sync Apothecare patient IDs with Fullscript patient records |
| **Treatment Plans** | Attach external identifiers, manage plans | Link Apothecare protocol to Fullscript treatment plan |
| **Allergens/Ingredients** | Query allergen and ingredient data | Flag supplements containing patient allergens |
| **Third-Party Certifications** | Access certification data (GMP, NSF, etc.) | Display quality certifications to patients |

### Integration Architecture

```
Apothecare Patient Portal
  │
  ├── Provider creates protocol with supplement recommendations
  │   └── Apothecare stores: supplement_name, dose, frequency, rationale
  │
  ├── Fullscript API sync
  │   ├── Match supplement_name to Fullscript catalog product
  │   ├── Create/update Fullscript treatment plan
  │   └── Patient receives Fullscript email with order link
  │
  └── Patient Portal view
      ├── "Your Supplement Protocol" (from Apothecare)
      ├── "Order / Reorder" button (links to Fullscript checkout)
      ├── "Estimated refill date" (calculated from dose/quantity)
      └── "Order history" (synced from Fullscript)
```

### Refill and Adherence Loop

1. Provider prescribes supplement protocol in Apothecare.
2. Fullscript treatment plan created via API.
3. Patient orders through Fullscript (within or linked from Apothecare portal).
4. Apothecare tracks adherence (daily check-ins).
5. When supply is predicted to run low, Apothecare notifies patient: "Time to reorder your Magnesium Glycinate. [Reorder on Fullscript]"
6. Fullscript order data syncs back to confirm refill.

**Note:** Apothecare already has `fullscript-stub-button.tsx` showing a toast. This stub should be replaced with real API integration.

Sources: [Fullscript API Documentation](https://support.fullscript.com/articles/api-documentation/) | [Fullscript API Changelog](https://us.fullscript.com/docs/api/changelog) | [Fullscript](https://fullscript.com)

---

## 15. Patient Communities & Group Programs {#15-communities}

### Why This Matters

Functional medicine thrives on community:
- **Group protocols** (e.g., 21-day elimination diet challenges, gut healing programs).
- **Accountability groups** where patients on similar protocols support each other.
- **Educational courses** (e.g., "Understanding Your Thyroid" 6-week course).
- **Reduced provider burden** — group visits and community support reduce individual appointment demand.

### Implementation Tiers

#### Tier 1 (MVP): Group Programs

- Provider creates a program (e.g., "30-Day GI Reset").
- Patients enroll through the portal.
- Program includes:
  - Daily supplement/lifestyle checklist.
  - Educational content delivered on a schedule (drip content).
  - Weekly check-in surveys.
  - Provider can see aggregate group progress.

#### Tier 2: Community Features

- **Discussion forums** within a program (moderated by provider or staff).
- **Anonymized peer support** (patients can share progress without identifying details).
- **Q&A sessions** — patients submit questions, provider answers in a group format.

#### Tier 3: Live Group Sessions

- **Group telehealth visits** (e.g., weekly cooking demos, supplement Q&A).
- **Webinar-style educational sessions** with recording for on-demand access.
- **Challenge leaderboards** (opt-in gamification for adherence).

### Privacy Considerations

- Patients in group programs should NOT see each other's lab results, supplement lists, or health data.
- Shared context is limited to: program content, anonymized aggregate progress, and voluntary forum posts.
- HIPAA applies to any health information shared in group settings — patients must consent to participation.

Sources: [Athenahealth Patient Engagement Research 2025](https://www.athenahealth.com/resources/blog/patient-digital-engagement-research-2025) | [WEF Digital Patient Engagement](https://www.weforum.org/stories/2025/03/digital-patient-engagement-improve-healthcare-systems/) | [Practice Better Programs](https://practicebetter.io/)

---

## 16. Telehealth Integration {#16-telehealth}

### Architecture Options

| Solution | Approach | Pros | Cons |
|---|---|---|---|
| **Daily.co** | Hosted WebRTC API | HIPAA-eligible, easy embed, good docs | Monthly cost |
| **LiveKit** | Open-source WebRTC SFU | Self-hostable, HIPAA-eligible, scalable, supports multi-participant | More setup |
| **Whereby** | Embedded video API | One-click join (no install), branded | Less customizable |
| **Twilio Video** | Programmable video API | Battle-tested, HIPAA BAA available | Complex pricing |
| **Custom WebRTC** | Build from scratch | Full control | Enormous effort, not recommended |

**Recommendation for Apothecare:** **Daily.co** or **LiveKit** for the telehealth video layer.

- Daily.co is faster to integrate (drop-in iframe or React component).
- LiveKit offers more control and can be self-hosted for maximum HIPAA compliance.
- Both support recording, screen sharing, and HIPAA-eligible deployment.

### Integration with Patient Portal

```
Patient Portal -> Upcoming Appointments
  │
  ├── "Join Video Visit" button (appears 10 min before appointment)
  │   └── Opens embedded video component (no download required)
  │
  ├── Pre-visit:
  │   ├── Digital intake form completed
  │   ├── Supplement reconciliation done
  │   └── PRO assessment submitted
  │
  ├── During visit:
  │   ├── Provider can share screen (lab results, supplement plans)
  │   ├── AI Scribe generates notes in real-time (optional)
  │   └── Visit recording (with patient consent)
  │
  └── Post-visit:
      ├── Visit summary posted to portal
      ├── Updated protocol reflected in supplement list
      ├── Follow-up tasks assigned
      └── Next appointment scheduled
```

### Security Requirements

- **DTLS + SRTP encryption** for audio/video in transit (standard WebRTC).
- **BAA with video provider** (Daily.co and LiveKit both offer this).
- **No recording without explicit patient consent** (configurable per visit).
- **Session recordings stored encrypted at rest** with access audit logging.

Sources: [Daily.co Telehealth](https://www.daily.co/use-cases/telehealth/) | [HIPAA Compliant WebRTC with LiveKit](https://trembit.com/blog/building-hipaa-compliant-video-consultations-with-webrtc-and-livekit/) | [Whereby Telehealth](https://whereby.com/blog/why-wherebys-api-is-the-trusted-solution-for-leading-telehealth-platforms/)

---

## 17. FHIR/HL7 Interoperability {#17-fhir-interoperability}

### Why It Matters

The **21st Century Cures Act** requires all EHR systems in the US to incorporate a universal API such as SMART on FHIR. Over 70% of countries report active FHIR use in at least some use cases (2025 HL7 survey).

For Apothecare's patient portal, FHIR interoperability enables:
1. **Importing patient records** from other EHR systems (Epic, Cerner, etc.).
2. **Exporting patient data** to other providers when patients transfer care.
3. **Connecting third-party apps** that patients already use.
4. **Meeting regulatory requirements** for patient data access.

### SMART on FHIR App Launch Framework

SMART on FHIR allows apps to launch from inside or outside an EHR system. For Apothecare:

- **EHR Launch:** A practitioner using Epic could launch Apothecare as a SMART app within their EHR to view functional medicine-specific data.
- **Standalone Launch:** Apothecare's patient portal could authenticate against a FHIR server to pull patient records from other systems.
- **Patient Access:** Patients could authorize Apothecare to read their records from their health system's FHIR endpoint.

### Key FHIR Resources for Apothecare

| FHIR Resource | Apothecare Use |
|---|---|
| `Patient` | Import/export patient demographics |
| `Observation` | Lab results (the core of Apothecare's value) |
| `DiagnosticReport` | Lab report metadata |
| `MedicationStatement` | Current medications |
| `MedicationRequest` | Prescribed medications |
| `NutritionOrder` | Supplement protocols (closest FHIR analog) |
| `Condition` | Problem list / diagnoses |
| `Encounter` | Visit records |
| `DocumentReference` | Visit notes, clinical documents |
| `QuestionnaireResponse` | PRO submissions |
| `Subscription` | Real-time notifications for data changes |

### Implementation Priority

**Phase 1:** FHIR R4 data export (patient can download their Apothecare data as FHIR JSON).
**Phase 2:** FHIR R4 data import (patient can connect their health system account and pull in lab results from other providers).
**Phase 3:** SMART on FHIR app launch (Apothecare can be launched from within other EHR systems).

Sources: [SMART on FHIR](https://docs.smarthealthit.org/) | [FHIR Guide](https://www.capminds.com/blog/the-complete-guide-to-fhir-in-healthcare-architecture-use-cases-and-implementation/) | [SMART on FHIR API](https://smarthealthit.org/smart-on-fhir-api/) | [HL7 FHIR Interoperability](https://ignitedata.com/hl7-hl7-fhir-smart-on-fhir-are-solving-the-interoperability-conundrum/)

---

## 18. Voice-First Interfaces & Accessibility {#18-accessibility}

### Regulatory Requirements (Mandatory)

**HHS Section 504 rule** requires healthcare websites and apps to meet **WCAG 2.1 Level AA by May 2026**. This is not optional — it applies to all healthcare organizations receiving federal funding.

Key findings from the 2025 Digital Accessibility Index:
- Healthcare sites had one of the **highest rates of inaccessible forms** (21.5 per page).
- Forms for scheduling, accessing test results, and filling out medical forms are the biggest barriers.

### WCAG 2.1 AA Compliance Checklist for Patient Portal

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements reachable and operable via keyboard |
| **Screen reader compatibility** | Proper ARIA labels, semantic HTML, role attributes |
| **Color contrast** | 4.5:1 minimum for text, 3:1 for large text (Apothecare already uses OKLCH — verify contrast ratios) |
| **Text resizing** | Content readable at 200% zoom without horizontal scrolling |
| **Focus indicators** | Visible focus outlines on all interactive elements |
| **Error identification** | Form errors clearly described in text (not just color) |
| **Input purpose** | Autocomplete attributes on form fields for autofill |
| **Orientation** | Content works in portrait and landscape |
| **Reflow** | Content reflows at 320px width without horizontal scrolling |
| **Text spacing** | Content readable with increased letter/word/line spacing |
| **Non-text contrast** | UI components and graphical objects meet 3:1 contrast |

### Voice Interface Considerations

- **Voice recognition software compatibility:** Ensure all form fields and buttons have accessible names that voice control software can target.
- **Voice-guided navigation:** For patients with low digital literacy or motor impairments.
- **Audio descriptions** for lab result charts and biomarker timelines.
- **Read-aloud capability** for visit notes and protocol instructions.

### Apothecare-Specific Accessibility Notes

- Lab result charts (biomarker timelines using Recharts) need data table alternatives for screen reader users.
- Evidence badges (RCT/META/COHORT) need accessible text, not just visual indicators.
- The Clinical Lens toggle needs clear ARIA state communication.
- Supplement check-in UI needs to work with switch access devices.

Sources: [WCAG 2.1 AA Healthcare 2026](https://pilotdigital.com/blog/what-wcag-2-1aa-means-for-healthcare-organizations-in-2026/) | [HHS Section 504 Digital Accessibility](https://www.siteimprove.com/blog/section-504-digital-accessibility-healthcare/) | [Healthcare Digital Accessibility Index](https://www.audioeye.com/digital-accessibility-index/2025/industry-reports/healthcare/) | [Healthcare Accessibility Guide](https://www.audioeye.com/post/guide-to-digital-accessibility-in-healthcare/)

---

## 19. Predictive Health Insights {#19-predictive-insights}

### The Vision

When patients arrive with organized longitudinal data and predictive insights, visits become more collaborative and genuinely preventive. This is the future of functional medicine.

### What's Possible with Apothecare's Existing Data

Given that Apothecare already tracks biomarker timelines and supplement protocols, the following predictions become feasible:

#### Biomarker Trajectory Predictions

```
"Based on your vitamin D supplementation rate and the trajectory of your last
3 measurements (18 → 28 → 35 ng/mL over 6 months), your levels are projected
to reach the optimal range (50-80 ng/mL) by approximately June 2026, assuming
consistent adherence to your current protocol."
```

#### Risk Pattern Detection

```
"Your fasting insulin has increased across your last 3 tests (5.2 → 7.1 → 8.4).
While still within conventional normal range, this trend may indicate early
insulin resistance. This has been flagged for your provider's review."
```

#### Supplement Efficacy Analysis

```
"After 12 weeks on your current protocol:
  - Ferritin: ↑ 45% (responding well to iron bisglycinate)
  - B12: ↑ 60% (methylcobalamin protocol effective)
  - Homocysteine: → Unchanged (methylfolate may need dose adjustment)

Your provider has been notified about the homocysteine plateau."
```

### Technical Approach

1. **Linear regression** for biomarker trajectory projection (simple, interpretable).
2. **Anomaly detection** for unexpected biomarker changes (z-score or IQR-based).
3. **Correlation analysis** between supplement adherence and biomarker movement.
4. **LLM-powered narrative generation** to turn statistical insights into patient-friendly language.

### Safety Guardrails

- All predictions labeled as "AI-generated projections" with uncertainty ranges.
- Never present predictions as diagnoses.
- Auto-flag and escalate to provider when predictions suggest clinical concern.
- Provider can disable specific predictions per patient if they cause anxiety.

Sources: [Biomarker Predictive Models](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2025.1633487/full) | [Explainable AI in Predictive Health](https://www.nature.com/articles/s41598-025-15867-z) | [AI Predictive Healthcare Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12525484/)

---

## 20. Technical Architecture for Apothecare {#20-technical-architecture}

### Multi-Tenant Auth: Patient vs. Practitioner

#### Supabase Custom Claims Approach

Use Supabase Auth Hooks (Custom Access Token Hook) to inject a `user_role` claim into the JWT:

```sql
-- Auth hook function
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
BEGIN
  -- Determine role based on user's record
  SELECT role INTO user_role
  FROM user_profiles
  WHERE auth_id = (event->>'user_id')::UUID;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  -- Also inject practitioner_id or patient_id as applicable

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql;
```

#### RLS Policies for Patient Data Isolation

```sql
-- Patients can only see their own lab results
CREATE POLICY patient_own_labs ON lab_results
  FOR SELECT
  USING (
    (auth.jwt()->>'user_role' = 'patient' AND patient_id = auth.uid())
    OR
    (auth.jwt()->>'user_role' = 'practitioner' AND practitioner_id = (auth.jwt()->>'practitioner_id')::UUID)
  );

-- Patients can only see their own messages
CREATE POLICY patient_own_messages ON messages
  FOR SELECT
  USING (
    (auth.jwt()->>'user_role' = 'patient' AND patient_id = auth.uid())
    OR
    (auth.jwt()->>'user_role' = 'practitioner')
  );

-- Patients can INSERT supplement changes (but not directly modify supplements)
CREATE POLICY patient_supplement_changes ON supplement_changes
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'user_role' = 'patient'
    AND patient_id = auth.uid()
  );
```

#### New Tables Required

```sql
-- Patient auth linking
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) UNIQUE,
  patient_id UUID REFERENCES patients(id) UNIQUE,
  display_name TEXT,
  phone TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Consent records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  consent_type TEXT NOT NULL,
  scope JSONB,
  version INTEGER DEFAULT 1,
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
);

-- Supplement changes (bidirectional updates)
CREATE TABLE supplement_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  practitioner_id UUID REFERENCES practitioners(id),
  supplement_name TEXT NOT NULL,
  change_type TEXT CHECK (change_type IN ('added', 'stopped', 'dose_changed', 'side_effect')),
  previous_value JSONB,
  new_value JSONB,
  patient_note TEXT,
  provider_response TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'acknowledged')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES practitioners(id)
);

-- Symptom tracking
CREATE TABLE symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  logged_at TIMESTAMPTZ DEFAULT now(),
  scores JSONB NOT NULL, -- {energy: 4, sleep: 3, digestion: 5, ...}
  note TEXT,
  supplements_taken JSONB -- {taken: [...], skipped: [...]}
);

-- Supplement adherence
CREATE TABLE supplement_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  supplement_id UUID, -- FK to whatever supplement table exists
  supplement_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  taken_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT
);

-- Patient AI chat (separate from provider chat)
CREATE TABLE patient_ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  messages JSONB NOT NULL DEFAULT '[]',
  context_type TEXT, -- 'lab_result', 'supplement', 'general'
  context_id UUID, -- optional reference to lab_result or supplement
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT
);

-- Wearable data
CREATE TABLE wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  source TEXT NOT NULL, -- 'oura', 'whoop', 'apple_health', 'dexcom', etc.
  data_type TEXT NOT NULL, -- 'sleep', 'hrv', 'glucose', 'activity', etc.
  data JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wearable_patient_type ON wearable_data(patient_id, data_type, recorded_at);

-- PRO assessments
CREATE TABLE pro_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  instrument TEXT NOT NULL, -- 'MSQ', 'PROMIS-29', 'PHQ-9', etc.
  responses JSONB NOT NULL,
  total_score NUMERIC,
  subscale_scores JSONB,
  completed_at TIMESTAMPTZ DEFAULT now(),
  visit_id UUID -- optional link to visit/encounter
);
```

### Real-Time Notifications with Supabase Realtime

Supabase Realtime provides three mechanisms:

1. **Postgres Changes:** Subscribe to INSERT/UPDATE/DELETE on specific tables. Use for:
   - Patient gets notified when provider posts lab results.
   - Provider gets notified when patient submits supplement change.
   - Patient gets notified when provider reviews their change.

2. **Broadcast:** Send ephemeral messages to connected clients. Use for:
   - "Your provider is reviewing your chart" presence indicator.
   - Real-time chat during telehealth sessions.

3. **Presence:** Track who is online. Use for:
   - Show patient when their provider is available for messaging.

```typescript
// Patient portal: Subscribe to their own data changes
const channel = supabase
  .channel('patient-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'lab_results',
      filter: `patient_id=eq.${patientId}`,
    },
    (payload) => {
      showNotification('New lab results are available!');
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'supplement_changes',
      filter: `patient_id=eq.${patientId}`,
    },
    (payload) => {
      if (payload.new.status !== 'pending') {
        showNotification('Your provider reviewed your supplement update.');
      }
    }
  )
  .subscribe();
```

**Important:** RLS policies are respected by Realtime subscriptions, so patients will only receive events for their own rows. This is critical for HIPAA compliance.

### PWA / Offline-First Architecture

Next.js 15 supports PWA through service workers:

**Recommended stack:** `@serwist/next` (successor to `next-pwa`)

**Offline-first priorities for patient portal:**

| Feature | Offline Behavior | Sync Strategy |
|---|---|---|
| **View lab results** | Cached after first view | Cache-first, revalidate on network |
| **Supplement list** | Cached, always available | Cache-first, sync on reconnect |
| **Daily symptom log** | Queue entries in IndexedDB | Sync to server when online |
| **Supplement check-in** | Queue in IndexedDB | Sync to server when online |
| **AI chat** | Show "requires internet" message | Network-only |
| **Telehealth** | Show "requires internet" message | Network-only |

**IndexedDB for offline data:**
Use the Origin Private File System (OPFS) API for secure client-side PHI storage, with encryption at rest. Clear cached PHI data after session timeout or logout.

```
Performance targets:
  - Repeat visit load time: < 1 second (95th percentile)
  - Offline data access: < 200ms
  - Background sync: < 30 seconds after reconnection
```

### Routing Architecture

```
/portal/                           -- Patient portal root (dashboard)
/portal/labs                       -- Lab results list
/portal/labs/[reportId]            -- Individual lab report with AI explanations
/portal/visits                     -- Visit/encounter history
/portal/visits/[visitId]           -- Individual visit notes
/portal/supplements                -- Active supplement protocol + adherence
/portal/supplements/reconcile      -- Supplement reconciliation flow
/portal/symptoms                   -- Symptom tracking + trends
/portal/chat                       -- AI chat (with guardrails)
/portal/messages                   -- Secure messaging with provider
/portal/wearables                  -- Connected devices + data
/portal/programs                   -- Enrolled group programs
/portal/profile                    -- Personal info, consent, security settings
/portal/settings                   -- Notification preferences, accessibility
```

### Middleware Strategy

```typescript
// middleware.ts additions
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/portal')) {
    // Verify patient role in JWT
    // Redirect to /portal/login if unauthenticated
    // Enforce MFA completion
    // Log PHI access to audit trail
  }

  if (pathname.startsWith('/dashboard')) {
    // Existing practitioner middleware
    // Verify practitioner role in JWT
  }
}
```

Sources: [Supabase Realtime](https://supabase.com/realtime) | [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | [Supabase Custom Claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) | [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) | [Serwist for Next.js](https://www.getfishtank.com/insights/building-native-like-offline-experience-in-nextjs-pwas) | [Next.js Offline-First Discussion](https://github.com/vercel/next.js/discussions/82498)

---

## Summary: Prioritized Build Roadmap

### Phase 1 — Foundation (Weeks 1-4)

| Feature | Priority | Effort |
|---|---|---|
| Patient auth (Supabase custom claims, MFA) | Critical | Medium |
| Patient profile + consent management | Critical | Medium |
| RLS policies for patient data isolation | Critical | Medium |
| View lab results (read-only, from existing data) | Critical | Low |
| View visit notes (read-only) | Critical | Low |
| Basic supplement list view | Critical | Low |
| Audit logging for all patient portal access | Critical | Low |
| WCAG 2.1 AA compliance from day one | Critical | Ongoing |

### Phase 2 — Core Engagement (Weeks 5-8)

| Feature | Priority | Effort |
|---|---|---|
| AI lab result explanations (provider-approved templates) | High | Medium |
| Supplement reconciliation workflow (bidirectional updates) | High | High |
| Secure messaging with provider | High | Medium |
| Daily symptom tracking | High | Medium |
| Supplement adherence tracking (daily check-ins) | High | Medium |
| Push notifications (Supabase Realtime) | High | Medium |
| Pre-visit digital intake forms | High | Medium |

### Phase 3 — Differentiation (Weeks 9-12)

| Feature | Priority | Effort |
|---|---|---|
| Patient AI chat (with guardrails) | High | High |
| Fullscript integration (ordering, refill predictions) | High | High |
| PRO assessments (MSQ, PROMIS-29) | Medium | Medium |
| PWA / offline support | Medium | Medium |
| Wearable integration (Terra API) | Medium | High |

### Phase 4 — Advanced (Weeks 13+)

| Feature | Priority | Effort |
|---|---|---|
| Predictive biomarker insights | Medium | High |
| Symptom pattern recognition (AI) | Medium | High |
| Group programs / patient communities | Medium | High |
| Telehealth integration | Medium | High |
| FHIR data import/export | Low | Very High |
| Caregiver/proxy access | Low | Medium |
| Voice-first interface | Low | High |

---

## Key Differentiators vs. Competitors

If Apothecare executes this patient portal well, it will have features that no current functional medicine EHR provides in a unified experience:

1. **AI-powered lab explanations with functional medicine context** (optimal ranges, not just conventional).
2. **Bidirectional supplement reconciliation** with provider approval workflow.
3. **Longitudinal symptom tracking correlated with biomarker trends and supplement adherence** — no competitor does this.
4. **Patient AI chat grounded in their own health data** with proper safety guardrails.
5. **Predictive biomarker trajectory projections** showing patients their health direction.
6. **Wearable data layered onto lab + supplement + symptom data** for a complete health picture.

The combination of these features positioned around functional medicine's unique needs (long treatment timelines, supplement-heavy protocols, lifestyle-driven outcomes) creates a product that is genuinely differentiated from both traditional patient portals (Epic, Athena) and functional medicine EHRs (Cerbo, Practice Better).

---

## 21. AI Patient Health Memory {#21-ai-patient-health-memory}

> **Research Date:** February 20, 2026
> **Concept:** A persistent, structured, always-updating AI "working memory" for each patient — a longitudinal knowledge graph incorporating labs, visits, supplements, medications, symptoms, wearable data, intake forms, provider notes, lifestyle factors, dietary patterns, family history, and genomic data. This memory becomes the AI's contextual foundation for every interaction about that patient.

---

### 21.1 Longitudinal Health Records & Knowledge Graphs

#### Industry Approaches to Longitudinal Patient Records

**Google Health / DeepMind — AMIE (Articulate Medical Intelligence Explorer):**

Google DeepMind's AMIE system (2025) represents the most advanced approach to longitudinal patient reasoning. AMIE has been extended beyond single-visit diagnosis to support **longitudinal disease management** — reasoning over the sequential progression of disease, response to therapy, and information on safe medication prescription and clinical guidelines across multiple visits.

AMIE uses a **two-agent architecture**:
- **Dialogue Agent:** Manages patient interactions, collects clinical information, and ensures consistent communication across visits.
- **Management Reasoning (Mx) Agent:** Processes clinical data, guidelines, and patient history to generate structured treatment and monitoring plans.

In randomized studies, AMIE matched or exceeded clinicians' management reasoning over multi-visit consultations, including planning investigations, treatments, prescriptions, and appropriately using clinical guidelines. This two-agent pattern — one for interaction, one for deep reasoning — is directly applicable to Apothecare's architecture.

**Google Cloud — MedLM Clinical Intelligence Engine:**

Google Cloud's approach builds a comprehensive clinical knowledge graph in Neo4j, augmented with MedLM. This solution can analyze a patient's medical records and generate insights on relevant medications, laboratory evaluations, medical procedures, and potential diagnoses for the clinician to review. The architecture combines graph-based structural reasoning with LLM-based natural language generation.

**Apple Health Records / CommonHealth / 1upHealth:**

These platforms focus on **data aggregation** rather than AI reasoning — pulling FHIR-formatted records from multiple health systems into a unified patient timeline. Apple Health Records consolidates data from participating health systems via SMART on FHIR, while 1upHealth provides a FHIR API layer for EHR data aggregation. The key lesson: data unification is a prerequisite for AI memory, not a substitute for it.

Sources: [Google DeepMind AMIE Longitudinal](https://research.google/blog/from-diagnosis-to-treatment-advancing-amie-for-longitudinal-disease-management/) | [Google DeepMind AMIE InfoQ](https://www.infoq.com/news/2025/03/google-deepmind-amie/) | [Med-Gemini](https://research.google/blog/advancing-medical-ai-with-med-gemini/) | [Google Cloud MedLM Clinical Intelligence Engine](https://cloud.google.com/blog/topics/healthcare-life-sciences/building-a-clinical-intelligence-engine-using-medlm/)

#### Health Knowledge Graph Architectures

**Core Ontologies for Health Knowledge Graphs:**

| Ontology | Domain | Role in Patient Health Memory |
|---|---|---|
| **SNOMED CT** | Clinical terms (diseases, symptoms, procedures, body structures) | Standardize symptom tracking, condition coding, body system categorization |
| **LOINC** | Laboratory and clinical observations | Standardize biomarker identifiers across different lab providers |
| **RxNorm** | Medications and supplements | Normalize drug/supplement names for interaction checking |
| **ICD-10/11** | Diagnoses and conditions | Map patient conditions for pattern recognition |
| **FHIR Resources** | Data exchange structures | Interoperability format for importing/exporting patient data |

**LOINC/SNOMED CT Integration (Version 2.0, September 2025):** The latest version includes more than 41,000 concepts covering 70% of the top 20,000 most used LOINC concepts. This integration creates SNOMED CT and LOINC codes for all shared concepts, enabling seamless mapping between lab observations and clinical terminology within a single knowledge graph.

**Patient-Centric Knowledge Graphs (PCKGs):**

PCKGs represent an important shift in healthcare that focuses on individualized patient care by mapping a patient's health information holistically and multi-dimensionally. Recent research (Frontiers in AI, 2024-2025) identifies three construction approaches:

1. **Rule-based extraction:** Extract entities and relationships from clinical notes using medical NLP pipelines and ontology mappings.
2. **LLM-based extraction:** Use multi-LLM consensus to extract clinical knowledge triples from free-text reports, mapping to SNOMED CT, LOINC, RxNorm, GO, and ICD, encoded in RDF/RDFS/OWL for semantic reasoning.
3. **Hybrid extraction:** Combine rule-based precision with LLM-based recall for comprehensive graph construction.

Sources: [Patient-Centric Knowledge Graphs Survey](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2024.1388479/full) | [Clinical KG Construction with Multi-LLMs](https://arxiv.org/html/2601.01844v1) | [LOINC/SNOMED CT](https://loincsnomed.org/) | [Personal Health Knowledge Graph](https://pmc.ncbi.nlm.nih.gov/articles/PMC8532078/) | [Ontologies as Semantic Bridge](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.1668385/full)

#### Temporal Health Knowledge Graphs

Temporal knowledge graphs add a time dimension to health data, enabling reasoning about how health states evolve. Key approaches:

**MedTKG (Medical Temporal Knowledge Graph):** Incorporates both dynamic information from patient clinical histories and static information from medical ontologies. The AdaCare model captures long and short-term variations of biomarkers as clinical features to depict health status across multiple time scales.

**GLT-Net (Graph-based Longitudinal Transformer):** Applies graph neural networks to learn hierarchical representations of diagnosis codes and reveal complex correlations between codes — critical for detecting comorbidity patterns like hypertension and heart disease co-occurrence.

**Temporal Knowledge Graph for Clinical Outcome Prediction:** Recent 2025 research represents patient care pathways as temporal knowledge graphs, predicting clinical outcomes from the sequence and timing of clinical events.

```
Temporal Health Knowledge Graph Structure (Apothecare):

Patient Node (central)
  │
  ├── [HAS_LAB_RESULT] ──> Lab Result Node
  │   ├── biomarker: "Vitamin D, 25-Hydroxy"
  │   ├── loinc_code: "1989-3"
  │   ├── value: 22
  │   ├── unit: "ng/mL"
  │   ├── timestamp: "2025-09-15"
  │   └── [PRECEDED_BY] ──> Previous Lab Result Node (timestamp: "2025-06-01")
  │
  ├── [TAKES_SUPPLEMENT] ──> Supplement Node
  │   ├── name: "Vitamin D3"
  │   ├── rxnorm_code: "..."
  │   ├── dose: "5000 IU"
  │   ├── started_at: "2025-09-20"
  │   └── [PRESCRIBED_FOR] ──> Condition Node ("Vitamin D Deficiency")
  │
  ├── [REPORTS_SYMPTOM] ──> Symptom Node
  │   ├── snomed_code: "84229001"
  │   ├── description: "Fatigue"
  │   ├── severity: 7
  │   ├── timestamp: "2025-09-15"
  │   └── [CORRELATES_WITH] ──> Lab Result Node (low Vitamin D)
  │
  └── [HAS_VISIT] ──> Visit Node
      ├── date: "2025-09-15"
      ├── type: "follow_up"
      └── [RESULTED_IN] ──> Protocol Change Node
          └── action: "Started Vitamin D3 5000 IU"
```

Sources: [Temporal KG Predicting Future Disorders](https://pubmed.ncbi.nlm.nih.gov/38635388/) | [Temporal KG Clinical Outcome Prediction](https://arxiv.org/html/2502.21138v2) | [GLT-Net Transformer](https://www.sciencedirect.com/science/article/abs/pii/S1532046425000553) | [Neo4j Framework for Clinical Data](https://www.medrxiv.org/content/10.1101/2025.07.20.25322556v1.full.pdf)

---

### 21.2 RAG + Vector Memory for Patient Data

#### Retrieval-Augmented Generation Over Patient Health Records

RAG is the foundational pattern for making patient health memory actionable — retrieving the most relevant pieces of a patient's history to include in the LLM's context window for each interaction.

**Why RAG for Patient Data:**
- Patient histories grow indefinitely (years of labs, visits, symptoms, wearables).
- LLM context windows, even at 128K-1M tokens, cannot hold a complete patient record.
- RAG enables selective retrieval of the most relevant data for each specific query.
- Privacy-sensitive EHR data stays in the database — only retrieved fragments reach the LLM.
- RAG lowers medical hallucination rates without compromising fluency (2025 Clinical Safety Assessment Framework).

**MedRAG (ACM WWW 2025):** A knowledge graph-elicited reasoning framework for healthcare copilots that enhances RAG with structured medical knowledge. MedRAG uses a knowledge graph to guide retrieval, improving diagnostic reasoning by providing contextually relevant medical information alongside patient-specific data.

**Performance benchmarks:** RAG achieved 99.25% accuracy in clinical summarization tasks, with a 6% improvement over non-RAG baselines. Clinical-specific RAG variants reduced hallucination rates significantly compared to vanilla LLM approaches.

Sources: [RAG in Healthcare Comprehensive Review](https://www.mdpi.com/2673-2688/6/9/226) | [MedRAG Healthcare Copilot](https://dl.acm.org/doi/10.1145/3696410.3714782) | [RAG Healthcare AI Initiatives](https://healthtechmagazine.net/article/2025/01/retrieval-augmented-generation-support-healthcare-ai-perfcon) | [Enhancing Medical AI with RAG](https://pmc.ncbi.nlm.nih.gov/articles/PMC12059965/)

#### Embedding and Indexing Heterogeneous Health Data in pgvector

**Schema Design for Patient Health Embeddings:**

```sql
-- Core patient health memory embeddings table
CREATE TABLE patient_health_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,

  -- Source identification
  source_type TEXT NOT NULL CHECK (source_type IN (
    'lab_result', 'visit_note', 'symptom_log', 'supplement_protocol',
    'medication', 'intake_form', 'wearable_summary', 'provider_note',
    'lifestyle_assessment', 'family_history', 'genomic_data',
    'ai_derived_insight', 'patient_reported'
  )),
  source_id UUID,              -- FK to the original record
  source_table TEXT,           -- Which table the source comes from

  -- Content
  content TEXT NOT NULL,        -- The text that was embedded
  content_summary TEXT,         -- Short summary for context loading

  -- Embedding vector (OpenAI text-embedding-3-small = 1536 dims)
  embedding VECTOR(1536) NOT NULL,

  -- Temporal metadata (critical for clinical relevance)
  recorded_at TIMESTAMPTZ NOT NULL,  -- When the clinical event occurred
  embedded_at TIMESTAMPTZ DEFAULT now(),

  -- Clinical metadata for hybrid filtering
  body_system TEXT,            -- 'endocrine', 'gi', 'immune', 'neuro', etc.
  biomarker_codes TEXT[],      -- LOINC codes for lab-related embeddings
  snomed_codes TEXT[],         -- SNOMED CT codes for conditions/symptoms
  clinical_significance SMALLINT DEFAULT 5 CHECK (
    clinical_significance BETWEEN 1 AND 10
  ),                           -- 1=routine, 10=critical finding

  -- Memory management
  is_consolidated BOOLEAN DEFAULT false,  -- Has been merged into a summary
  superseded_by UUID REFERENCES patient_health_embeddings(id),
  decay_weight REAL DEFAULT 1.0,  -- Decreases over time for older data

  -- Versioning
  version INTEGER DEFAULT 1,

  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_health_embeddings_hnsw
  ON patient_health_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 128);

-- Composite indexes for hybrid filtering
CREATE INDEX idx_health_embeddings_patient_source
  ON patient_health_embeddings(patient_id, source_type, recorded_at DESC);
CREATE INDEX idx_health_embeddings_patient_system
  ON patient_health_embeddings(patient_id, body_system, recorded_at DESC);
CREATE INDEX idx_health_embeddings_patient_time
  ON patient_health_embeddings(patient_id, recorded_at DESC);

-- GIN index for LOINC/SNOMED code array searches
CREATE INDEX idx_health_embeddings_biomarker_codes
  ON patient_health_embeddings USING GIN (biomarker_codes);
CREATE INDEX idx_health_embeddings_snomed_codes
  ON patient_health_embeddings USING GIN (snomed_codes);
```

**Real-World Benchmark:** A healthcare SaaS platform migrated from PostgreSQL + Pinecone to unified pgvector, achieving 8M patient records + 40M clinical note embeddings (768-dim) on a single RDS instance with HNSW index (m=32), 95% recall, p95 latency of 80ms, and 70% cost reduction.

Sources: [pgvector Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector) | [Supabase Vector AI Toolkit](https://supabase.com/modules/vector) | [pgvector GitHub](https://github.com/pgvector/pgvector) | [Mastering Supabase Vector Storage 2025](https://sparkco.ai/blog/mastering-supabase-vector-storage-a-2025-deep-dive) | [PostgreSQL pgvector Production](https://www.21medien.de/en/library/postgresql-pgvector)

#### Chunking Strategies for Clinical Data

Clinical data requires domain-specific chunking — generic fixed-length splitting destroys clinical context and can split critical findings across chunks. Research from 2025 evaluates three advanced strategies:

| Strategy | Accuracy | Relevance | Best For |
|---|---|---|---|
| **Fixed-length chunking** | 50% (baseline) | Low | Never use for clinical data |
| **Proposition chunking** | 73% | Medium | Simple clinical notes |
| **Semantic chunking** | 80% | High | Narrative clinical documents |
| **Adaptive chunking** | 87% | 93% | **Recommended for Apothecare** |

**Adaptive Chunking for Clinical Data:**

An agent dynamically selects chunking approaches based on document type:

```
Chunking Strategy by Data Type:

Lab Results:
  → Chunk per biomarker (one embedding per test result)
  → Include: biomarker name, value, unit, reference range, date
  → Metadata: LOINC code, body system, clinical significance
  → Example: "Vitamin D 25-Hydroxy: 22 ng/mL (ref 30-100, optimal 50-80)
              on 2025-09-15. Below conventional and functional range."

Visit Notes:
  → Hierarchical chunking by section (HPI, Assessment, Plan)
  → Global retrieval identifies relevant note types
  → Local retrieval extracts high-value content within notes
  → Preserve temporal ordering within each note

Symptom Logs:
  → Weekly summaries (aggregate daily scores into weekly trends)
  → Include trend direction and notable changes
  → Example: "Week of 2025-09-08: Energy avg 3.2 (↓ from 3.8),
              Sleep avg 3.5 (stable), Digestion avg 4.1 (↑ from 3.2)"

Supplement Protocols:
  → Chunk per protocol change event
  → Include: what changed, why, date, provider who ordered it
  → Link to triggering lab result or symptom

Wearable Data:
  → Daily summaries (not raw per-minute data)
  → Weekly trend aggregations for long-term context
  → Flag anomalies for individual embedding

Intake Forms:
  → Chunk by section (medical history, family history, lifestyle)
  → Version each section for change detection across intakes
```

**Embedding Model Recommendation:** BGE (BAAI General Embedding) significantly outperformed all other models tested for clinical text retrieval, despite scoring lower on general benchmarks. For Apothecare, consider `bge-large-en-v1.5` (1024 dims) or OpenAI `text-embedding-3-small` (1536 dims) as the embedding model.

Sources: [Advanced Chunking for Clinical RAG](https://pmc.ncbi.nlm.nih.gov/articles/PMC12649634/) | [CLI-RAG Clinical Framework](https://arxiv.org/html/2507.06715v1) | [Best Chunking Strategies 2025](https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025) | [Embedding Models for Clinical Retrieval](https://pmc.ncbi.nlm.nih.gov/articles/PMC11756698/) | [Hospital Chunking Evaluation](https://pubmed.ncbi.nlm.nih.gov/40899531/)

#### Hybrid Search (Semantic + Keyword + Temporal) for Clinical Retrieval

Pure semantic search misses exact clinical terms (lab codes, drug names). Pure keyword search misses conceptual relationships. Temporal filtering is essential — outdated clinical information can be harmful. The solution: **triple-hybrid search**.

```sql
-- Hybrid search function for patient health memory
CREATE OR REPLACE FUNCTION search_patient_health_memory(
  p_patient_id UUID,
  p_query_text TEXT,
  p_query_embedding VECTOR(1536),
  p_body_system TEXT DEFAULT NULL,
  p_source_types TEXT[] DEFAULT NULL,
  p_time_window_days INTEGER DEFAULT 365,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  content_summary TEXT,
  source_type TEXT,
  body_system TEXT,
  recorded_at TIMESTAMPTZ,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    -- Vector similarity search
    SELECT
      e.id,
      e.content,
      e.content_summary,
      e.source_type,
      e.body_system,
      e.recorded_at,
      1 - (e.embedding <=> p_query_embedding) AS cosine_similarity,
      e.decay_weight,
      e.clinical_significance
    FROM patient_health_embeddings e
    WHERE e.patient_id = p_patient_id
      AND e.recorded_at >= now() - (p_time_window_days || ' days')::INTERVAL
      AND (p_body_system IS NULL OR e.body_system = p_body_system)
      AND (p_source_types IS NULL OR e.source_type = ANY(p_source_types))
      AND e.superseded_by IS NULL
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  keyword_results AS (
    -- Full-text search with ts_rank
    SELECT
      e.id,
      ts_rank_cd(
        to_tsvector('english', e.content),
        plainto_tsquery('english', p_query_text)
      ) AS text_rank
    FROM patient_health_embeddings e
    WHERE e.patient_id = p_patient_id
      AND e.recorded_at >= now() - (p_time_window_days || ' days')::INTERVAL
      AND to_tsvector('english', e.content) @@ plainto_tsquery('english', p_query_text)
      AND e.superseded_by IS NULL
    LIMIT p_limit * 2
  ),
  combined AS (
    -- Reciprocal Rank Fusion (RRF) combining both result sets
    SELECT
      s.id,
      s.content,
      s.content_summary,
      s.source_type,
      s.body_system,
      s.recorded_at,
      (
        -- Semantic score (40% weight)
        0.4 * s.cosine_similarity +
        -- Keyword score (20% weight)
        0.2 * COALESCE(k.text_rank, 0) +
        -- Temporal recency score (25% weight)
        0.25 * (1.0 - EXTRACT(EPOCH FROM (now() - s.recorded_at))
                / EXTRACT(EPOCH FROM (p_time_window_days || ' days')::INTERVAL)) +
        -- Clinical significance score (15% weight)
        0.15 * (s.clinical_significance / 10.0)
      ) * s.decay_weight AS relevance_score
    FROM semantic_results s
    LEFT JOIN keyword_results k ON s.id = k.id
  )
  SELECT
    c.id, c.content, c.content_summary, c.source_type,
    c.body_system, c.recorded_at, c.relevance_score
  FROM combined c
  ORDER BY c.relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**Key design decisions:**
- **Temporal recency** gets 25% weight — recent data is more clinically relevant than old data.
- **Clinical significance** gets 15% weight — critical findings bubble up regardless of recency.
- **Decay weight** is multiplicative — allows batch-decaying old embeddings without re-embedding.
- **`superseded_by`** prevents returning outdated versions of consolidated memories.

Sources: [Hybrid Search PostgreSQL Missing Manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual) | [Hybrid Search TimescaleDB Vector Keyword Temporal](https://www.tigerdata.com/blog/hybrid-search-timescaledb-vector-keyword-temporal-filtering) | [pgvector Hybrid Search](https://jkatz05.com/post/postgres/hybrid-search-postgres-pgvector/) | [BM25 Ranking in Postgres](https://www.tigerdata.com/blog/introducing-pg_textsearch-true-bm25-ranking-hybrid-retrieval-postgres)

#### Context Window Management

A focused 300-token context often outperforms an unfocused 113,000-token context. The goal is not to stuff the context window but to curate it.

**Hierarchical Patient Context Loading Strategy:**

```
Context Assembly Pipeline (per AI interaction):

Step 1: Patient Snapshot (always loaded, ~500 tokens)
  ├── Demographics, age, sex
  ├── Active conditions (top 5)
  ├── Current supplement/medication list (names + doses)
  ├── Recent lab summary (last visit, key out-of-range values)
  └── Active treatment goals

Step 2: Query-Relevant Retrieval (RAG, ~2000-4000 tokens)
  ├── Hybrid search results from patient_health_embeddings
  ├── Ranked by relevance_score (semantic + keyword + temporal)
  └── Top 10-20 chunks based on query context

Step 3: Temporal Context (if query involves trends, ~1000 tokens)
  ├── Biomarker timeline for relevant markers (last 3-5 values)
  ├── Symptom score trends (weekly averages, last 3 months)
  └── Protocol change history (what was started/stopped when)

Step 4: System Prompt + Guardrails (~500 tokens)
  ├── Clinical lens setting (functional/conventional/both)
  ├── Source filter preferences
  ├── Safety guardrails and scope boundaries
  └── Response format instructions

Total: ~4000-6000 tokens of highly curated context
(vs. 50,000+ tokens of raw patient data)
```

**Compression Techniques:**
- **Hierarchical summarization:** Older conversation segments are progressively compressed into more compact summaries as information ages.
- **Automatic compression:** Removes filler words, redundant phrases, and non-essential clauses while preserving key information — achieving 40-60% token reduction.
- **Targeted summarization:** Compresses specific high-token components (like detailed lab reports) rather than the entire context.

Sources: [Context Compression Framework](https://arxiv.org/html/2509.09199v1) | [LLM Chat History Summarization](https://mem0.ai/blog/llm-chat-history-summarization-guide-2025) | [Context Engineering 2025](https://www.flowhunt.io/blog/context-engineering/) | [Efficient Context Management](https://blog.jetbrains.com/research/2025/12/efficient-context-management/) | [LLMs Long Context Medical QA](https://arxiv.org/html/2510.18691v1)

---

### 21.3 AI Memory Systems (Technical Architecture)

#### Persistent AI Memory Systems

**Mem0 (Production-Ready Memory Layer):**

Mem0 is the most mature production memory system for AI agents (April 2025 paper, deployed at scale). Its architecture is directly applicable to Apothecare's patient health memory.

**Core Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Mem0 Architecture                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────────┐                   │
│  │  Conversation │───>│ Memory Extractor  │                   │
│  │  (Messages)   │    │ (LLM-based)      │                   │
│  └──────────────┘    │ Extracts salient  │                   │
│                       │ facts from dialog │                   │
│                       └────────┬─────────┘                   │
│                                │                              │
│                                v                              │
│                       ┌──────────────────┐                   │
│                       │ Memory Updater    │                   │
│                       │ (Decision Engine) │                   │
│                       │                   │                   │
│                       │ For each fact:    │                   │
│                       │ - Retrieve top-K  │                   │
│                       │   similar memories│                   │
│                       │ - LLM decides:    │                   │
│                       │   ADD / UPDATE /  │                   │
│                       │   DELETE / NOOP   │                   │
│                       └───────┬──────────┘                   │
│                               │                               │
│              ┌────────────────┼────────────────┐             │
│              v                v                v             │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│     │ Vector Store  │ │ Graph Store   │ │ Key-Value    │     │
│     │ (pgvector)    │ │ (Neo4j/Kuzu)  │ │ Store        │     │
│     │               │ │               │ │              │     │
│     │ Semantic      │ │ Entity-       │ │ Fast lookup  │     │
│     │ similarity    │ │ relationship  │ │ for known    │     │
│     │ search        │ │ reasoning     │ │ facts        │     │
│     └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                              │
│     Retrieval: Combines all three stores                     │
│     - Entity-based retrieval (from graph)                    │
│     - Semantic similarity retrieval (from vectors)           │
│     - Reciprocal Rank Fusion for final ranking               │
└─────────────────────────────────────────────────────────────┘
```

**Mem0 Performance:** 26% relative accuracy gains over OpenAI's memory, 91% lower p95 latency, 90% fewer tokens consumed. The graph-enhanced variant (Mem0^g) achieves 68.4% accuracy with 0.48s p95 search latency.

**Mem0 Healthcare Use Case:** Mem0 explicitly supports healthcare agents with HIPAA-compliant memory, tracking medical history, treatment plans, and preferences across sessions.

**Letta (formerly MemGPT):**

Letta pioneered the concept of LLMs managing their own memory through function calling. Key recent developments (2026):
- **Context Repositories (February 2026):** Programmatic context management with git-based versioning — enabling version-controlled patient health memory.
- **Conversations API (January 2026):** Agents maintain shared memory across parallel experiences with users — applicable to multiple providers sharing a patient's health memory.

Sources: [Mem0 Paper](https://arxiv.org/abs/2504.19413) | [Mem0 Architecture Details](https://arxiv.org/html/2504.19413v1) | [Mem0 Healthcare Use Case](https://mem0.ai/usecase/healthcare) | [Mem0 Graph Memory](https://docs.mem0.ai/open-source/features/graph-memory) | [Letta](https://www.letta.com/) | [Letta Docs](https://docs.letta.com/concepts/memgpt/) | [AWS Mem0 Implementation](https://aws.amazon.com/blogs/database/build-persistent-memory-for-agentic-ai-applications-with-mem0-open-source-amazon-elasticache-for-valkey-and-amazon-neptune-analytics/)

#### Hierarchical Memory: Episodic, Semantic, and Procedural

Brain-inspired memory architectures distinguish between memory types, each serving a different function in clinical reasoning:

**BMAM (Brain-inspired Multi-Agent Memory Framework, 2026):**

Decomposes agent memory into interacting subsystems:
1. **Episodic Memory:** Timeline-indexed storage of specific events (individual visits, lab results, symptom reports). Retrievable by time and context.
2. **Semantic Memory:** Consolidated knowledge derived from episodes ("Patient has insulin resistance trending upward"). Detached from specific timestamps.
3. **Salience-Aware Selection:** Determines which memories are most relevant to the current interaction based on clinical importance and recency.
4. **Intent-Conditioned Control:** Filters memory retrieval based on the purpose of the query (diagnostic vs. treatment planning vs. patient education).

**Memory Types for Apothecare Patient Health Memory:**

```
┌─────────────────────────────────────────────────────────────┐
│                EPISODIC MEMORY (Raw Events)                  │
│  Individual data points with full temporal context           │
│                                                              │
│  "On 2025-09-15, TSH was 4.2 mIU/L (functional high)"     │
│  "On 2025-10-01, patient reported increased fatigue (7/10)" │
│  "On 2025-10-15, provider started selenium 200mcg daily"    │
│  "On 2025-12-15, TSH improved to 2.8 mIU/L"               │
│                                                              │
│  Storage: patient_health_embeddings table                    │
│  Retention: Indefinite (compressed over time)                │
└────────────────────────┬────────────────────────────────────┘
                         │ Consolidation (periodic)
                         v
┌─────────────────────────────────────────────────────────────┐
│              SEMANTIC MEMORY (Derived Insights)              │
│  Patterns and knowledge extracted from episodes              │
│                                                              │
│  "Patient has subclinical hypothyroid pattern (TSH 3.5-4.5  │
│   range over 12 months) that responded to selenium."        │
│  "GI symptoms correlate with high-stress periods."          │
│  "Patient is a slow COMT metabolizer — sensitive to         │
│   methylated B vitamins."                                    │
│                                                              │
│  Storage: patient_health_insights table                      │
│  Retention: Updated as new episodes arrive                   │
└────────────────────────┬────────────────────────────────────┘
                         │ Abstraction
                         v
┌─────────────────────────────────────────────────────────────┐
│             PROCEDURAL MEMORY (Treatment Patterns)           │
│  What has worked/not worked for this patient                 │
│                                                              │
│  "L-glutamine 5g/day reduced zonulin by 40% over 3 months" │
│  "Methylfolate caused anxiety — switched to folinic acid"   │
│  "Best supplement adherence on AM-only protocols"            │
│  "Responds well to elimination diet (symptoms resolve in    │
│   10-14 days)"                                               │
│                                                              │
│  Storage: patient_treatment_patterns table                   │
│  Retention: Persistent, high-value                           │
└─────────────────────────────────────────────────────────────┘
```

**Consolidation Pathway:** The primary mechanism of lifelong learning is the continuous consolidation of episodic experience into semantic assets. For patient health memory, this means periodically running an LLM-based consolidation process that:
1. Reviews recent episodic memories (new lab results, symptoms, protocol changes).
2. Identifies patterns and correlations across episodes.
3. Updates or creates semantic memories (derived insights).
4. Evaluates treatment responses and updates procedural memories.
5. Marks consolidated episodic memories as `is_consolidated = true`.

Sources: [Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564) | [BMAM Framework](https://arxiv.org/html/2601.20465) | [MemGPT Semantic Memory](https://informationmatters.org/2025/10/memgpt-engineering-semantic-memory-through-adaptive-retention-and-context-summarization/) | [ICLR 2026 MemAgents Workshop](https://openreview.net/pdf?id=U51WxL382H) | [Agent Procedural Memory](https://arxiv.org/html/2508.06433v2)

#### Embedding Strategies for Multi-Modal Health Data

Different data modalities require different embedding approaches:

```
Data Type           │ Embedding Strategy           │ Dimensions │ Update Frequency
────────────────────┼──────────────────────────────┼────────────┼──────────────────
Lab results         │ Text embed per biomarker     │ 1536       │ Per new result
Visit notes         │ Section-level text embed     │ 1536       │ Per visit
Symptom logs        │ Weekly summary text embed    │ 1536       │ Weekly batch
Supplement protocol │ Per-change event embed       │ 1536       │ On protocol change
Wearable data       │ Daily summary text embed     │ 1536       │ Daily batch
Intake forms        │ Per-section text embed       │ 1536       │ Per intake
Provider notes      │ Full note text embed         │ 1536       │ Per note
Family history      │ Per-condition text embed     │ 1536       │ On update
Genomic/SNP data    │ Per-gene/pathway text embed  │ 1536       │ Once (static)
AI-derived insights │ Full insight text embed      │ 1536       │ On consolidation
```

**Unified embedding model:** Use a single embedding model (e.g., `text-embedding-3-small`) across all modalities. Convert structured data (lab values, wearable metrics) into descriptive text before embedding: `"TSH: 4.2 mIU/L on 2025-09-15, above functional optimal range of 1.0-2.5, conventional range 0.4-4.0"` rather than embedding raw numbers.

---

### 21.4 Clinical Intelligence from Memory

#### Pattern Detection Across Time

With a comprehensive patient health memory, the AI can detect patterns that individual data points obscure:

**Biomarker Trajectory Analysis:**
```
"Zonulin has been trending up over your last 3 visits:
  2025-03-15: 48 ng/mL (borderline)
  2025-06-15: 62 ng/mL (elevated)
  2025-09-15: 78 ng/mL (significantly elevated)

 This 63% increase over 6 months suggests increasing intestinal
 permeability despite current protocol. Flagged for provider review."
```

**Cross-System Correlation Detection:**
```
"Correlation detected between GI symptoms and thyroid markers:
  - When your GI symptom scores worsen (weeks 12, 18, 24),
    your T3:T4 conversion ratio also declines
  - This pattern suggests gut inflammation may be impacting
    thyroid hormone conversion
  - Literature reference: [intestinal permeability and thyroid
    autoimmunity, PMID:xxxxx]"
```

**Treatment Response Tracking:**
```
"L-glutamine protocol assessment (started 2025-06-15):
  Zonulin:  78 → 52 ng/mL (↓ 33% in 3 months)
  GI symptoms: avg 3.2 → 4.1 (↑ 28% improvement)
  Bloating frequency: 5x/week → 2x/week (↓ 60%)

  Assessment: Protocol showing positive response.
  Recommendation: Continue current dose, retest in 3 months."
```

#### Predictive Flagging

**Biomarker Trajectory Projection:**
```
"Based on your fasting insulin trajectory:
  2025-01: 5.2 µIU/mL
  2025-06: 7.1 µIU/mL
  2025-12: 8.4 µIU/mL

  Linear projection: likely to exceed functional range (< 8.0)
  within 3-6 months if trend continues.

  Note: Still within conventional range (2.6-24.9), but the
  upward trajectory warrants attention.

  This has been flagged for your provider's review."
```

#### Drug/Supplement Interaction Detection

Knowledge graph-based interaction detection leverages the patient's complete medication/supplement history:

**AI-Powered Interaction Detection Architecture:**

Recent research (2025) demonstrates that graph neural networks combined with knowledge graph embeddings achieve the highest accuracy for drug-drug interaction prediction. Transformer-based models like DrugBERT and BioBERT enable advanced interaction detection through semantic understanding from medical literature.

For Apothecare, the practical approach:

```
Interaction Check Pipeline:

1. Patient adds new supplement (e.g., "St. John's Wort")
   │
2. Retrieve full medication/supplement list from patient health memory
   │
3. Check against interaction knowledge base:
   │  ├── DrugBank / Natural Medicines Database (structured)
   │  ├── Knowledge graph traversal (RxNorm relationships)
   │  └── LLM-augmented reasoning for novel combinations
   │
4. Flag interactions with severity:
   │  ├── CRITICAL: "St. John's Wort + [SSRI] = serotonin syndrome risk"
   │  ├── MODERATE: "St. John's Wort reduces effectiveness of oral contraceptives"
   │  └── MINOR: "May reduce absorption of iron supplements"
   │
5. Notify patient + provider with explanation and evidence level
```

#### Comorbidity Pattern Recognition

Temporal knowledge graphs excel at identifying comorbidity patterns from longitudinal data:

- **Co-occurrence patterns:** "Patients with your combination of subclinical hypothyroidism + elevated zonulin + low vitamin D frequently develop autoimmune thyroiditis. Monitoring TPO antibodies is recommended."
- **Progression patterns:** "Your lab trajectory matches patterns seen in early metabolic syndrome — insulin resistance + elevated hs-CRP + central adiposity."
- **Functional medicine root cause identification:** "Your symptom cluster (fatigue, brain fog, cold intolerance, constipation) combined with lab findings (elevated rT3, low free T3, high TPO antibodies) points to Hashimoto's thyroiditis with impaired T4-to-T3 conversion."

Sources: [Drug-Drug Interaction AI Prediction](https://pmc.ncbi.nlm.nih.gov/articles/PMC12380558/) | [Drug-Herb Interaction AI](https://pmc.ncbi.nlm.nih.gov/articles/PMC11944892/) | [Knowledge Graph DDI Prediction](https://www.nature.com/articles/s43856-024-00486-y) | [GNN Drug Interaction Prediction](https://www.nature.com/articles/s41598-025-12936-1) | [KG-Enhanced Medical Diagnosis](https://ai.jmir.org/2025/1/e58670)

---

### 21.5 Forward-Thinking / Bleeding Edge

#### Digital Twin Concepts for Health

A **medical digital twin** is a virtual representation of a patient, generated from multimodal patient data, population data, and real-time updates on patient and environmental variables. The concept has five pillars: patient, data connection, patient-in-silico, interface, and twin synchronization.

**LLMs Forecasting Patient Health Trajectories (Nature, 2025):**

A landmark 2025 paper in *npj Digital Medicine* demonstrated that large language models can forecast patient health trajectories, enabling digital twins. The system creates a computational model that evolves as new data arrives — labs, symptoms, wearable readings, medication changes — and can simulate "what if" scenarios:

- "What if we increase vitamin D to 10,000 IU daily?"
- "What if the patient adds berberine for blood sugar management?"
- "Based on current trajectory, when will ferritin reach optimal range?"

**Current Achievements (2025-2026):**
- Population-scale cardiac modeling with 3,461 patient cohorts
- Patient-specific cardiac models reducing atrial fibrillation recurrence
- Advanced liver regeneration modeling with real-time simulation
- Enhanced glucose management in diabetes through digital twin predictions

**Apothecare Opportunity:** A lightweight version of the digital twin concept — using the patient health memory to power trajectory projections and treatment simulations — is achievable with current technology. The full computational modeling requires significantly more data and infrastructure.

Sources: [Medical Digital Twins Lancet 2025](https://www.thelancet.com/journals/landig/article/PIIS2589-7500(25)00028-7/fulltext) | [LLMs Forecast Patient Trajectories](https://www.nature.com/articles/s41746-025-02004-3) | [Digital Twins Personalized Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC12653454/) | [Digital Twins Healthcare Review](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.1633539/full) | [Digital Twin JMIR](https://medinform.jmir.org/2025/1/e53542)

#### Autonomous Health Agents

Multi-agent AI systems for healthcare (MASH) are emerging as the next paradigm in medical AI. Instead of a single monolithic AI, specialized agents focus on different domains:

**Hypothetical Apothecare Multi-Agent Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                 Patient Health Memory Layer                   │
│              (Shared knowledge graph + embeddings)            │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│          │          │          │          │                   │
│  ┌───────┴───┐ ┌────┴────┐ ┌──┴───┐ ┌───┴────┐ ┌─────────┐│
│  │ Thyroid    │ │ GI      │ │ Metab│ │ Immune │ │ Nutrient ││
│  │ Agent     │ │ Agent   │ │ Agent│ │ Agent  │ │ Agent   ││
│  │           │ │         │ │      │ │        │ │         ││
│  │ Monitors: │ │ Tracks: │ │ Eval:│ │ Watch: │ │ Assess: ││
│  │ TSH, T3,  │ │ Zonulin │ │ Gluc │ │ WBC,   │ │ Vit D,  ││
│  │ T4, TPO,  │ │ Calprtn │ │ Insul│ │ CRP,   │ │ B12,    ││
│  │ rT3       │ │ Microb  │ │ HbA1c│ │ ESR,   │ │ Iron,   ││
│  │           │ │ GI sx   │ │ Lipid│ │ TPO    │ │ Mg, Zn  ││
│  └───────────┘ └─────────┘ └──────┘ └────────┘ └─────────┘│
│          │          │          │          │          │        │
│          └──────────┴──────────┴──────────┴──────────┘        │
│                              │                                │
│                    ┌─────────┴──────────┐                    │
│                    │ Orchestrator Agent  │                    │
│                    │ (Cross-system       │                    │
│                    │  correlation,       │                    │
│                    │  insight synthesis) │                    │
│                    └────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

Each specialist agent monitors its body system's data within the patient health memory and proactively surfaces insights. The orchestrator detects cross-system correlations that individual agents might miss — for example, the GI Agent and Thyroid Agent independently flagging issues, while the Orchestrator recognizes the gut-thyroid axis connection.

**Industry Status (2025-2026):**
- Hippocratic AI has completed over 115 million clinical patient interactions with patient-facing AI agents across 50+ health systems.
- Google DeepMind's AMIE uses a two-agent model for longitudinal disease management.
- A foundational architecture for AI agents in healthcare has been published (ScienceDirect, 2025).

Sources: [Multi-Agent AI Systems Healthcare](https://pmc.ncbi.nlm.nih.gov/articles/PMC12360800/) | [Agentic AI Healthcare](https://www.sciencedirect.com/science/article/pii/S2949953425000141) | [Coordinated AI Agents](https://www.nature.com/articles/s41551-025-01363-2) | [Foundational Architecture AI Agents Healthcare](https://www.sciencedirect.com/science/article/pii/S2666379125004471) | [Hippocratic AI](https://www.fiercehealthcare.com/ai-and-machine-learning/hippocratic-ai-lands-126m-series-c-expand-patient-facing-ai-agents-fuel-ma)

#### Federated Learning Across Patient Populations

Federated learning enables Apothecare to derive population-level insights without sharing individual patient data between practices:

**How it works for Apothecare:**
1. Multiple Apothecare practices train local models on their patient data (e.g., "which supplement protocols most effectively reduce zonulin?").
2. Only model parameters (gradients/weights) are shared — never raw patient data.
3. A central server aggregates parameters to improve the global model.
4. Each practice benefits from collective insights while maintaining HIPAA compliance.

**Practical Applications:**
- "Across 500 patients with elevated zonulin, L-glutamine 5g/day for 90 days resulted in a 35% mean reduction."
- "Patients with MTHFR C677T homozygous respond better to methylfolate than folic acid (82% vs. 45% homocysteine reduction)."
- "Berberine 500mg BID reduces fasting insulin by an average of 22% over 12 weeks in insulin-resistant patients."

**Technical Considerations:**
- Differential privacy and secure multiparty computation protect against model inversion attacks.
- Data heterogeneity across practices (different lab panels, supplement brands) requires standardization via LOINC/RxNorm.
- Shared low-level feature extraction layers enable knowledge transfer while maintaining privacy.

Sources: [Federated Learning Healthcare Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11728217/) | [Privacy-Preserving Federated EHR](https://pmc.ncbi.nlm.nih.gov/articles/PMC12031511/) | [Federated Learning Public Health](https://pmc.ncbi.nlm.nih.gov/articles/PMC12607528/) | [FED-EHR Framework](https://www.mdpi.com/2079-9292/14/16/3261)

#### Genomic/SNP Integration

For functional medicine, genomic SNP data is a critical input to the patient health memory. Key gene variants and their supplement implications:

| Gene | Variant | Impact | Supplement Implication |
|---|---|---|---|
| **MTHFR** | C677T, A1298C | Impaired folate metabolism | Use methylfolate, not folic acid |
| **COMT** | Val158Met (slow) | Slow catecholamine metabolism | Avoid high-dose methylated B vitamins; may need SAMe support cautiously |
| **COMT** | Val158Met (fast) | Rapid catecholamine clearance | May benefit from methylated B vitamins, SAMe |
| **VDR** | Taq1, Fok1 | Vitamin D receptor sensitivity | May need higher vitamin D doses |
| **FUT2** | G428A | Reduced B12 absorption | May need sublingual or injectable B12 |
| **APOE** | e4 allele | Increased cardiovascular/Alzheimer's risk | Omega-3 fatty acids, anti-inflammatory protocols |
| **CYP1A2** | *1F allele | Slow caffeine metabolism | Advise limiting caffeine |
| **SOD2** | Ala16Val | Altered antioxidant capacity | May benefit from targeted antioxidant supplementation |

**AI Integration:** Platforms like Opus23 and GenomicInsight enable practitioners to investigate genetic variants that shape how patients process B vitamins, manage stress, or respond to specific supplements. The patient health memory should store SNP data as static embeddings and cross-reference them when generating supplement recommendations.

**Implementation in Health Memory:**
```sql
-- Genomic data in patient health memory
INSERT INTO patient_health_embeddings (
  patient_id, source_type, content, embedding,
  recorded_at, body_system, clinical_significance
) VALUES (
  $1, 'genomic_data',
  'MTHFR C677T homozygous (TT genotype). This patient has significantly
   reduced MTHFR enzyme activity (~30% of normal). Requires methylfolate
   (5-MTHF) instead of folic acid. Monitor homocysteine levels. Avoid
   folic acid fortified foods. Consider methylcobalamin for B12.',
  $2,  -- embedding vector
  '2025-01-15',  -- date of genetic test
  'methylation',
  9  -- high clinical significance (affects all supplement decisions)
);
```

Sources: [MTHFR Gene Explained](https://www.geneticlifehacks.com/mthfr/) | [COMT Supplement Interactions](https://www.geneticlifehacks.com/comt-and-supplement-interactions/) | [Nutrigenomics for Practitioners](https://elitegenelabs.com/nutrigenomics-for-practitioners/) | [Personalized Nutrition COMT FUT2 MTHFR](https://www.sciencedirect.com/science/article/pii/S1807593224002266) | [NutrEval Genomic SNPs](https://support.rupahealth.com/en/articles/8552293-nutreval-add-on-genomic-snps)

#### Continuous Biomarker Monitoring with Real-Time Memory Updates

**CGM (Continuous Glucose Monitoring) + AI:**

Real-time blood glucose data from CGM devices, combined with AI's data analysis capabilities, allows deep insights into glucose fluctuations — intra-day variability and long-term trends. Machine learning models paired with CGM data show promise in glycemic monitoring, adaptive insulin management, and predicting diabetes-related events.

**Multi-Modal Wearable Integration:**

Emerging microfluidic devices allow continuous, non-invasive collection and analysis of biofluids (sweat, saliva, interstitial fluid) to detect biomarkers including glucose, lactate, cortisol, and electrolytes in real time.

**Digital Biomarkers from Smartwatches:**

Research demonstrates that non-invasive smartwatch data (HRV, skin temperature, accelerometry, electrodermal activity) can predict interstitial glucose levels — reducing the need for invasive CGM devices.

**Memory Update Pipeline for Real-Time Data:**

```
Wearable Data → Terra API → Apothecare Backend
  │
  ├── Raw data: Store in wearable_data table (high-frequency)
  │
  ├── Daily summary: Aggregate into text, embed into patient_health_embeddings
  │   "2025-09-15: Sleep 7.2h (deep 18%, REM 22%), HRV avg 48ms (↓ from
  │    52ms baseline), resting HR 62bpm, glucose avg 98 mg/dL (TIR 94%)"
  │
  ├── Weekly consolidation: Detect trends, create semantic memories
  │   "Week of 2025-09-08: HRV declining trend (52→48ms) correlates with
  │    reported work stress increase. Sleep quality stable. Glucose well
  │    controlled."
  │
  └── Anomaly detection: Flag significant changes for immediate embedding
      "ALERT: HRV dropped to 28ms overnight (2025-09-15), 46% below
       baseline. Possible illness onset or acute stress event."
```

Sources: [CGM + AI Prediabetes Management](https://pmc.ncbi.nlm.nih.gov/articles/PMC12146165/) | [AI Wearables Diabetes Management](https://www.nature.com/articles/s41746-025-02036-9) | [Digital Biomarkers Glucose Smartwatches](https://www.nature.com/articles/s41598-025-14172-z) | [AI Wearable Vital Signs](https://www.nature.com/articles/s41598-025-28772-2) | [Wearable Cardiovascular Health](https://www.nature.com/articles/s44325-025-00090-6)

#### Natural Language Patient Timeline Generation

LLMs can transform the structured patient health memory into readable narrative timelines:

```
Provider asks: "Tell me about this patient's gut health journey"

AI Response (generated from patient health memory):

"Sarah's GI concerns began in March 2025 when she presented with bloating,
irregular bowel movements (Bristol 1-2), and post-meal discomfort. Initial
labs showed elevated zonulin (78 ng/mL), low secretory IgA (42 mg/dL),
and calprotectin at 95 µg/g.

You started her on an elimination diet on March 20th, removing gluten,
dairy, and soy. Her symptom tracker shows GI scores improved from 2.1/5
to 3.4/5 over the first 4 weeks.

On April 15th, you added L-glutamine 5g/day and a multi-strain probiotic
(50B CFU). Her June follow-up labs showed zonulin had dropped to 52 ng/mL
(33% improvement) and calprotectin normalized at 38 µg/g.

By August, her GI symptom scores had stabilized at 4.2/5. She successfully
reintroduced dairy without symptoms but reported bloating recurrence with
gluten reintroduction (noted in her September symptom log).

Current status: GI protocol ongoing. Zonulin trending down. Gluten
sensitivity confirmed. Next retest scheduled for December 2025."
```

**Technical Implementation:** This requires the LLM to receive a curated timeline from the patient health memory (via RAG), then generate a coherent narrative. The 2025 research confirms that LLMs can handle longitudinal clinical summarization, though challenges remain with very long patient trajectories spanning years of data.

Sources: [LLMs Temporal Reasoning Clinical Summarization](https://www.larknlp.com/publication/conference_papers/emnlp/2025_llm_temp_reasn_clinical/) | [EHR Summarization with LLMs](https://www.medrxiv.org/content/10.1101/2025.06.02.25328807v1.full) | [Timeline Extraction from Clinical Reports](https://pmc.ncbi.nlm.nih.gov/articles/PMC12150726/) | [Clinical Text Summarization Review](https://www.jmir.org/2025/1/e68998)

#### Multi-Agent Systems with Specialist AI Agents

As described in the Autonomous Health Agents section above, multi-agent systems where specialist agents focus on different body systems are emerging as a research-backed architecture for comprehensive patient health management.

A practical implementation for Apothecare could start with a simpler version — a single AI agent with **domain-specific system prompts** that are dynamically selected based on the query context, before evolving into true multi-agent orchestration.

---

### 21.6 HIPAA & Ethical Considerations for AI Memory

#### Data Minimization in AI Memory

Under HIPAA, AI workflows should only access the PHI needed to perform their function — nothing more. For patient health memory, this means:

1. **Minimum Necessary Standard:** An AI agent scheduling an appointment needs the patient's name and desired time, not their entire medical history. The context assembly pipeline (Section 21.2) enforces this by only retrieving query-relevant data.

2. **Zero Data Retention for Intermediary Processing:** Process a patient's data to extract key information, then immediately delete intermediate artifacts (raw transcripts, temporary embeddings). Only persist the extracted memories.

3. **Tiered Access:** Different AI functions get different memory access levels:
   - Patient education AI: Lab results + supplement list (no visit notes)
   - Clinical reasoning AI: Full memory access (provider-facing only)
   - Scheduling AI: Demographics + appointment history only

#### Patient Consent for AI Memory Retention

**Transparency Requirements:**
- California SB 243 / AB 489 (effective January 2026): Continuous disclosure that the patient is interacting with AI, not a human.
- Colorado AI Act (enforcement June 2026): Disclosure whenever AI is used in high-risk decisions, annual impact assessments, anti-bias controls, record-keeping for at least three years.

**Consent Model for Apothecare:**

```sql
-- AI memory consent (extends consent_records table from Section 4)
INSERT INTO consent_records (
  patient_id, consent_type, scope, version, granted_at
) VALUES (
  $1,
  'ai_memory_retention',
  '{
    "ai_memory_enabled": true,
    "memory_types_consented": ["lab_analysis", "symptom_tracking",
      "supplement_protocol", "treatment_patterns"],
    "data_sharing_for_population_insights": false,
    "genomic_data_in_memory": true,
    "wearable_data_in_memory": true,
    "memory_retention_period": "indefinite",
    "right_to_deletion_acknowledged": true
  }'::JSONB,
  1,
  now()
);
```

#### Right to Be Forgotten / Memory Deletion

Patients must be able to request deletion of their AI memory. Implementation:

```sql
-- Hard delete all AI memory for a patient
CREATE OR REPLACE FUNCTION delete_patient_ai_memory(p_patient_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all embeddings
  DELETE FROM patient_health_embeddings WHERE patient_id = p_patient_id;

  -- Delete derived insights
  DELETE FROM patient_health_insights WHERE patient_id = p_patient_id;

  -- Delete treatment patterns
  DELETE FROM patient_treatment_patterns WHERE patient_id = p_patient_id;

  -- Log the deletion (audit trail must persist)
  INSERT INTO audit_log (
    action, entity_type, entity_id, details, performed_at
  ) VALUES (
    'ai_memory_deleted', 'patient', p_patient_id,
    '{"reason": "patient_requested", "records_deleted": true}'::JSONB,
    now()
  );
END;
$$ LANGUAGE plpgsql;
```

**HIPAA Retention Caveat:** HIPAA requires retention of policies and authorizations for six years. Some states require seven to ten years for medical records. AI memory deletion must preserve the audit trail of what was deleted and when, without preserving the actual PHI content.

#### Audit Trails for AI-Generated Insights

Every AI-generated insight derived from the patient health memory must be auditable:

```sql
-- AI insight audit table
CREATE TABLE ai_insight_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  insight_type TEXT NOT NULL,  -- 'pattern_detection', 'prediction', 'interaction_flag'
  insight_content TEXT NOT NULL,

  -- Provenance: what data was used to generate this insight
  source_embedding_ids UUID[],  -- Which embeddings were retrieved
  model_used TEXT,              -- 'claude-sonnet-4-6', 'gpt-4o', etc.
  prompt_template_version TEXT, -- Version of the system prompt used

  -- Clinical review
  reviewed_by UUID REFERENCES practitioners(id),
  reviewed_at TIMESTAMPTZ,
  review_status TEXT CHECK (review_status IN (
    'pending', 'approved', 'rejected', 'modified'
  )),
  reviewer_notes TEXT,

  -- Patient visibility
  surfaced_to_patient BOOLEAN DEFAULT false,
  surfaced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Bias Detection in Longitudinal Pattern Recognition

AI systems trained on health data can encode and amplify biases. For patient health memory:

**Sources of Bias:**
- **Population shifts:** Reference ranges derived from specific demographics may not apply to all patients.
- **Data scarcity:** Underrepresented populations have fewer data points, leading to less accurate pattern detection.
- **Historical bias:** If historical treatment data reflects biased clinical decision-making, AI patterns will reproduce those biases.

**Mitigation Strategies:**
- External validation across diverse patient demographics and clinical characteristics.
- Minimize model complexity and choose architectures that maximize explainability.
- Use LIME and SHAP for feature importance analysis in pattern detection algorithms.
- Regular bias audits comparing AI-generated insights across demographic groups.
- Longitudinal surveillance of model performance after deployment.

#### Explainability Requirements

For clinical decision support, explainability is not optional:

- **Technique:** SHAP (Shapley Additive exPlanations) and LIME (Local Interpretable Model-agnostic Explanations) for feature importance in pattern detection.
- **Clinical Interpretation:** Every AI-derived insight must include which data points contributed to the conclusion: "This pattern was detected based on: TSH results from 3/15, 6/15, 9/15; symptom logs from weeks 12-24; selenium supplementation start date 10/15."
- **Confidence Levels:** AI insights must include uncertainty: "High confidence (based on 5 data points over 12 months)" vs. "Low confidence (based on 2 data points over 3 months)."

Sources: [HIPAA Compliant AI 2026 Guide](https://www.getprosper.ai/blog/hipaa-compliant-ai-guide-healthcare) | [HIPAA AI Frameworks 2025-2026](https://www.getprosper.ai/blog/hipaa-compliant-ai-frameworks-guide) | [AI Healthcare Policy 2026](https://bluebrix.health/articles/ai-reset-a-new-era-for-healthcare-policy) | [HIPAA Compliance AI Security](https://www.sprypt.com/blog/hipaa-compliance-ai-in-2025-critical-security-requirements) | [AI Bias Healthcare](https://www.nature.com/articles/s41746-025-01503-7) | [Explainable AI Clinical Decision Support](https://pmc.ncbi.nlm.nih.gov/articles/PMC12427955/) | [Patient Privacy Clinical AI Memorization](https://techxplore.com/news/2026-01-patient-privacy-age-clinical-ai.html)

---

### 21.7 Technical Implementation Patterns for Apothecare

#### Complete pgvector Schema for Patient Health Memory

The schema from Section 21.2 (patient_health_embeddings) is the foundation. Additional tables for the full memory system:

```sql
-- Derived insights (semantic memory)
CREATE TABLE patient_health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,

  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'biomarker_trend', 'cross_system_correlation', 'treatment_response',
    'risk_pattern', 'lifestyle_correlation', 'comorbidity_pattern',
    'genomic_implication', 'supplement_efficacy'
  )),

  -- Content
  title TEXT NOT NULL,           -- "TSH trending toward functional high range"
  description TEXT NOT NULL,     -- Full insight explanation
  evidence_summary TEXT,         -- What data supports this insight
  confidence_level TEXT CHECK (confidence_level IN (
    'high', 'medium', 'low'
  )),

  -- Embedding for semantic retrieval
  embedding VECTOR(1536),

  -- Provenance
  source_embedding_ids UUID[],   -- Which episodic memories contributed
  derived_at TIMESTAMPTZ DEFAULT now(),

  -- Body systems involved
  body_systems TEXT[],           -- Can span multiple systems
  biomarker_codes TEXT[],

  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES patient_health_insights(id),
  last_validated TIMESTAMPTZ DEFAULT now(),

  -- Clinical review
  provider_reviewed BOOLEAN DEFAULT false,
  provider_id UUID REFERENCES practitioners(id),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_insights_patient ON patient_health_insights(patient_id, is_active);
CREATE INDEX idx_insights_hnsw ON patient_health_insights
  USING hnsw (embedding vector_cosine_ops);

-- Treatment patterns (procedural memory)
CREATE TABLE patient_treatment_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,

  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'effective_treatment', 'ineffective_treatment', 'adverse_reaction',
    'adherence_pattern', 'lifestyle_response', 'dietary_response'
  )),

  -- Content
  treatment TEXT NOT NULL,       -- "L-glutamine 5g/day"
  target TEXT NOT NULL,          -- "Elevated zonulin / intestinal permeability"
  outcome TEXT NOT NULL,         -- "40% reduction over 3 months"
  duration_days INTEGER,

  -- Embedding for semantic retrieval
  embedding VECTOR(1536),

  -- Evidence
  supporting_lab_ids UUID[],     -- Lab results that demonstrate the pattern
  supporting_symptom_ids UUID[], -- Symptom logs that demonstrate the pattern

  -- Lifecycle
  identified_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Patient snapshot cache (pre-computed context for fast loading)
CREATE TABLE patient_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL UNIQUE,

  -- Pre-computed summaries for rapid context loading
  demographics_summary TEXT,
  active_conditions TEXT,
  current_supplements TEXT,
  current_medications TEXT,
  recent_labs_summary TEXT,
  active_treatment_goals TEXT,
  key_genomic_factors TEXT,

  -- Full snapshot for context injection
  full_snapshot TEXT NOT NULL,
  snapshot_token_count INTEGER,

  -- Lifecycle
  generated_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,   -- Regenerate after this time
  last_data_change TIMESTAMPTZ  -- Track when underlying data last changed
);
```

#### Incremental Embedding Pipeline

```typescript
// src/lib/ai/memory/embedding-pipeline.ts

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

interface EmbeddingSource {
  patient_id: string;
  source_type: string;
  source_id: string;
  source_table: string;
  content: string;
  recorded_at: string;
  body_system?: string;
  biomarker_codes?: string[];
  snomed_codes?: string[];
  clinical_significance?: number;
}

/**
 * Embeds a new piece of patient health data and stores it in the
 * patient_health_embeddings table. Called whenever new data arrives
 * (lab result, visit note, symptom log, etc.)
 */
export async function embedPatientHealthData(
  source: EmbeddingSource
): Promise<void> {
  const openai = new OpenAI();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: source.content,
  });
  const embedding = embeddingResponse.data[0].embedding;

  // 2. Generate a concise summary for context loading
  const summaryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Summarize this clinical data point in one sentence.',
      },
      { role: 'user', content: source.content },
    ],
    max_tokens: 100,
  });
  const summary = summaryResponse.choices[0].message.content;

  // 3. Check for existing embeddings that this might supersede
  const { data: existing } = await supabase
    .from('patient_health_embeddings')
    .select('id')
    .eq('patient_id', source.patient_id)
    .eq('source_type', source.source_type)
    .eq('source_id', source.source_id)
    .is('superseded_by', null)
    .single();

  // 4. Insert new embedding
  const { data: newEmbedding, error } = await supabase
    .from('patient_health_embeddings')
    .insert({
      patient_id: source.patient_id,
      source_type: source.source_type,
      source_id: source.source_id,
      source_table: source.source_table,
      content: source.content,
      content_summary: summary,
      embedding,
      recorded_at: source.recorded_at,
      body_system: source.body_system,
      biomarker_codes: source.biomarker_codes,
      snomed_codes: source.snomed_codes,
      clinical_significance: source.clinical_significance ?? 5,
    })
    .select('id')
    .single();

  if (error) throw error;

  // 5. If superseding an existing embedding, mark the old one
  if (existing) {
    await supabase
      .from('patient_health_embeddings')
      .update({ superseded_by: newEmbedding!.id })
      .eq('id', existing.id);
  }

  // 6. Invalidate patient snapshot cache
  await supabase
    .from('patient_snapshots')
    .update({ valid_until: new Date().toISOString() })
    .eq('patient_id', source.patient_id);
}

/**
 * Trigger embedding when a new lab result is created.
 * Called from the lab result creation API route.
 */
export async function onLabResultCreated(
  patientId: string,
  labResult: {
    id: string;
    biomarker_name: string;
    value: number;
    unit: string;
    reference_range_low: number;
    reference_range_high: number;
    optimal_range_low?: number;
    optimal_range_high?: number;
    loinc_code?: string;
    collected_at: string;
  }
): Promise<void> {
  const isOutOfRange =
    labResult.value < labResult.reference_range_low ||
    labResult.value > labResult.reference_range_high;

  const isOutOfOptimal =
    labResult.optimal_range_low &&
    labResult.optimal_range_high &&
    (labResult.value < labResult.optimal_range_low ||
      labResult.value > labResult.optimal_range_high);

  const content = [
    `${labResult.biomarker_name}: ${labResult.value} ${labResult.unit}`,
    `on ${labResult.collected_at}.`,
    `Reference range: ${labResult.reference_range_low}-${labResult.reference_range_high} ${labResult.unit}.`,
    labResult.optimal_range_low
      ? `Functional optimal range: ${labResult.optimal_range_low}-${labResult.optimal_range_high} ${labResult.unit}.`
      : '',
    isOutOfRange ? 'OUTSIDE conventional reference range.' : 'Within conventional range.',
    isOutOfOptimal ? 'Outside functional optimal range.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  await embedPatientHealthData({
    patient_id: patientId,
    source_type: 'lab_result',
    source_id: labResult.id,
    source_table: 'lab_results',
    content,
    recorded_at: labResult.collected_at,
    body_system: inferBodySystem(labResult.biomarker_name),
    biomarker_codes: labResult.loinc_code ? [labResult.loinc_code] : [],
    clinical_significance: isOutOfRange ? 8 : isOutOfOptimal ? 6 : 4,
  });
}
```

#### Memory Scoring and Decay Functions

```sql
-- Batch decay function: reduce weight of older embeddings
-- Run daily via pg_cron or Supabase Edge Function cron
CREATE OR REPLACE FUNCTION apply_memory_decay()
RETURNS VOID AS $$
BEGIN
  UPDATE patient_health_embeddings
  SET decay_weight = GREATEST(
    0.1,  -- minimum weight (never fully forget)
    CASE source_type
      -- Lab results decay slowly (clinically important long-term)
      WHEN 'lab_result' THEN
        1.0 - (0.05 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
      -- Visit notes decay moderately
      WHEN 'visit_note' THEN
        1.0 - (0.10 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
      -- Symptom logs decay faster (less relevant over time)
      WHEN 'symptom_log' THEN
        1.0 - (0.20 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
      -- Wearable data decays fastest
      WHEN 'wearable_summary' THEN
        1.0 - (0.30 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
      -- AI insights stay relevant longer
      WHEN 'ai_derived_insight' THEN
        1.0 - (0.03 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
      -- Genomic data never decays
      WHEN 'genomic_data' THEN 1.0
      -- Default moderate decay
      ELSE
        1.0 - (0.10 * EXTRACT(EPOCH FROM (now() - recorded_at)) / 86400 / 365)
    END
  )
  WHERE decay_weight > 0.1
    AND source_type != 'genomic_data';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily at 3 AM UTC
-- (Use Supabase pg_cron or Edge Function cron)
-- SELECT cron.schedule('memory-decay', '0 3 * * *', 'SELECT apply_memory_decay()');
```

**Decay rates by data type:**
| Data Type | Annual Decay Rate | Rationale |
|---|---|---|
| Genomic data | 0% (never decays) | DNA doesn't change |
| AI-derived insights | 3%/year | Validated patterns remain relevant |
| Lab results | 5%/year | Historical values still matter for trends |
| Visit notes | 10%/year | Older visits become less contextually relevant |
| Supplement protocols | 10%/year | Historical protocols inform future decisions |
| Symptom logs | 20%/year | Daily symptom data becomes noise over years |
| Wearable data | 30%/year | Granular wearable data is most useful when recent |

#### Snapshot/Summary Generation for Efficient Context Loading

```typescript
// src/lib/ai/memory/patient-snapshot.ts

/**
 * Generate or refresh a patient snapshot — a pre-computed summary
 * of the patient's current health status for rapid context loading.
 *
 * The snapshot is the "always-loaded" layer of the patient health
 * memory, included in every AI interaction about this patient.
 */
export async function generatePatientSnapshot(
  patientId: string
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if existing snapshot is still valid
  const { data: existing } = await supabase
    .from('patient_snapshots')
    .select('*')
    .eq('patient_id', patientId)
    .single();

  if (existing && new Date(existing.valid_until) > new Date()) {
    return existing.full_snapshot;
  }

  // Gather current patient data
  const [patient, conditions, supplements, medications, recentLabs, insights] =
    await Promise.all([
      getPatientDemographics(patientId),
      getActiveConditions(patientId),
      getCurrentSupplements(patientId),
      getCurrentMedications(patientId),
      getRecentLabSummary(patientId, 90), // last 90 days
      getActiveInsights(patientId),
    ]);

  // Generate snapshot via LLM
  const openai = new OpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate a concise clinical snapshot of this patient
          for use as AI context. Include: demographics, active conditions,
          current treatment, recent lab highlights, and any critical
          genomic factors. Keep under 500 tokens. Use clinical
          shorthand where appropriate.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          demographics: patient,
          conditions,
          supplements,
          medications,
          recent_labs: recentLabs,
          active_insights: insights,
        }),
      },
    ],
    max_tokens: 600,
  });

  const snapshot = response.choices[0].message.content!;

  // Cache the snapshot
  await supabase.from('patient_snapshots').upsert({
    patient_id: patientId,
    full_snapshot: snapshot,
    snapshot_token_count: Math.ceil(snapshot.length / 4), // rough estimate
    generated_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    last_data_change: new Date().toISOString(),
    demographics_summary: patient?.summary,
    active_conditions: conditions?.map((c: any) => c.name).join(', '),
    current_supplements: supplements?.map((s: any) => s.name).join(', '),
    current_medications: medications?.map((m: any) => m.name).join(', '),
    recent_labs_summary: recentLabs?.summary,
    active_treatment_goals: insights
      ?.filter((i: any) => i.insight_type === 'treatment_response')
      .map((i: any) => i.title)
      .join(', '),
  });

  return snapshot;
}
```

#### Real-Time vs. Batch Memory Updates

| Trigger | Update Type | Latency | Example |
|---|---|---|---|
| New lab result uploaded | **Real-time** | < 5 seconds | Embed immediately, invalidate snapshot |
| Provider creates visit note | **Real-time** | < 10 seconds | Embed sections, trigger insight check |
| Patient logs daily symptoms | **Near real-time** | < 1 minute | Embed, update weekly aggregation |
| Patient reports supplement change | **Real-time** | < 5 seconds | Embed, trigger interaction check |
| Wearable data sync (daily) | **Batch** | Once/day | Aggregate daily summary, embed |
| Memory consolidation | **Batch** | Once/week | LLM reviews episodes, creates insights |
| Decay weight update | **Batch** | Once/day | Apply decay function to all embeddings |
| Snapshot regeneration | **On-demand** | When invalidated | Regenerate when data changes + next access |

**Implementation:** Use Supabase Database Webhooks (or Postgres LISTEN/NOTIFY) to trigger real-time embedding via Edge Functions. Use pg_cron for batch operations.

```sql
-- Trigger real-time embedding when new lab results are inserted
CREATE OR REPLACE FUNCTION trigger_lab_result_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Supabase Edge Function to embed the new lab result
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/embed-health-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'patient_id', NEW.patient_id,
      'source_type', 'lab_result',
      'source_id', NEW.id,
      'source_table', 'lab_results'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lab_result_insert
  AFTER INSERT ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lab_result_embedding();
```

---

### 21.8 Industry Landscape: Who Is Building What (2025-2026)

| Company | Focus | Patient Memory Approach | Key Insight for Apothecare |
|---|---|---|---|
| **Hippocratic AI** | Patient-facing AI agents | 115M+ clinical interactions, 50+ health systems, $3.5B valuation | Empathy inference + safety-first agent design |
| **Abridge** | Ambient clinical documentation | EHR context integration, predicted problems section | Adding patient history context improved doc quality 18% |
| **Suki** | Ambient AI scribe | Pre-visit summaries from past records, Q&A against patient history | Context-aware documentation with patient memory |
| **Ambience Healthcare** | Clinical AI copilot | Surfaces patient history, labs, and notes before visits | Real-time AI copilot pattern |
| **Glass Health** | Clinical decision support | AI-powered differential diagnosis with patient context | Structured reasoning from patient data |
| **Nabla** | AI clinical assistant | Context-aware agent creates patient summary pre-visit | Adding context doubled chronic condition documentation completeness |
| **Google DeepMind** | Medical AI research | AMIE: Two-agent longitudinal disease management | Multi-visit reasoning with temporal context |
| **Mem0** | Universal AI memory layer | Graph + vector memory with HIPAA healthcare use case | Most mature production memory architecture |
| **Letta (MemGPT)** | Agent framework | Context repositories with git-based versioning (Feb 2026) | Version-controlled memory management |

**Key Trend:** The industry is moving from "AI that answers questions" to "AI that remembers and reasons longitudinally." The companies winning in 2025-2026 are those that effectively combine persistent memory with clinical context.

Sources: [Hippocratic AI $126M Series C](https://www.fiercehealthcare.com/ai-and-machine-learning/hippocratic-ai-lands-126m-series-c-expand-patient-facing-ai-agents-fuel-ma) | [Abridge](https://www.abridge.com/) | [Suki AI](https://www.suki.ai/) | [AI Scribes Context Study](https://www.fiercehealthcare.com/ai-and-machine-learning/ai-scribes-generate-better-documentation-more-patient-context-study) | [2025 State of AI Healthcare](https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/) | [2026 AI Trends Healthcare](https://tateeda.com/blog/ai-trends-in-us-healthcare) | [Hippocratic AI NVIDIA](https://www.nvidia.com/en-us/case-studies/hippocratic-ai/)

---

### 21.9 Proposed Architecture for Apothecare Patient Health Memory

#### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APOTHECARE PATIENT HEALTH MEMORY                    │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Data Sources │  │ Embedding    │  │ Memory     │  │ Retrieval │ │
│  │              │  │ Pipeline     │  │ Store      │  │ Layer     │ │
│  │ Lab Results  │  │              │  │            │  │           │ │
│  │ Visit Notes  │──>│ Chunk       │──>│ pgvector   │──>│ Hybrid   │ │
│  │ Symptoms     │  │ ↓            │  │ (embeddings│  │ Search   │ │
│  │ Supplements  │  │ Embed        │  │  + metadata│  │ (semantic │ │
│  │ Wearables    │  │ ↓            │  │  + temporal│  │  + keyword│ │
│  │ Intake Forms │  │ Store +      │  │  indexes)  │  │  + time)  │ │
│  │ Genomics     │  │ Metadata     │  │            │  │           │ │
│  │ PROs         │  │              │  │            │  │           │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └─────┬─────┘ │
│                                                            │        │
│  ┌──────────────────────────────────────────────────────────┘       │
│  │                                                                   │
│  v                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Context Assembly │  │ AI Reasoning     │  │ Output             │ │
│  │                  │  │                  │  │                    │ │
│  │ 1. Snapshot      │  │ Patient-aware    │  │ Clinical insights  │ │
│  │    (always)      │──>│ LLM with curated│──>│ Pattern alerts    │ │
│  │ 2. RAG results   │  │ context window   │  │ Trend narratives  │ │
│  │    (per-query)   │  │                  │  │ Treatment evals   │ │
│  │ 3. Temporal      │  │ Guardrails:      │  │ Predictions       │ │
│  │    context       │  │ - Scope limits   │  │ Education         │ │
│  │ 4. System prompt │  │ - Safety checks  │  │                    │ │
│  │                  │  │ - Audit logging  │  │ All audited +     │ │
│  │ ~4-6K tokens     │  │                  │  │ provider-reviewed │ │
│  └─────────────────┘  └──────────────────┘  └────────────────────┘ │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Background Processes                                          │  │
│  │                                                                │  │
│  │ Daily: Memory decay + wearable aggregation + snapshot refresh │  │
│  │ Weekly: Episodic → Semantic consolidation (LLM-based)         │  │
│  │ On-demand: Interaction checks, anomaly detection              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Implementation Phases

**Phase 1: Foundation (4-6 weeks)**
- Create `patient_health_embeddings`, `patient_snapshots` tables
- Build embedding pipeline for lab results and visit notes
- Implement hybrid search function (`search_patient_health_memory`)
- Build patient snapshot generator
- Integrate memory retrieval into existing chat SSE stream
- Basic audit logging for AI memory operations

**Phase 2: Enrichment (4-6 weeks)**
- Add symptom log, supplement protocol, and intake form embeddings
- Build memory consolidation pipeline (episodic-to-semantic)
- Create `patient_health_insights` and `patient_treatment_patterns` tables
- Implement decay functions and scheduled maintenance
- Add wearable data daily summary embedding
- Pattern detection for biomarker trends

**Phase 3: Intelligence (6-8 weeks)**
- Cross-system correlation detection
- Treatment response tracking and evaluation
- Predictive biomarker trajectory projections
- Natural language patient timeline generation
- Drug/supplement interaction detection from accumulated history
- Genomic/SNP data integration

**Phase 4: Advanced (8-12 weeks)**
- Multi-agent specialist system (body system agents)
- Real-time wearable anomaly detection
- Federated learning pilot (population insights)
- Digital twin-lite (trajectory simulation)
- Patient-facing memory dashboard ("What the AI knows about me")
- Provider-facing memory visualization

#### Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| Vector store | Supabase pgvector | Already in stack, HIPAA-compliant, hybrid search support |
| Embedding model | OpenAI `text-embedding-3-small` | 1536 dims, good clinical performance, already integrated |
| Reasoning LLM | Anthropic `claude-sonnet-4-6` | Primary clinical reasoning, already integrated |
| Consolidation LLM | OpenAI `gpt-4o-mini` | Cost-effective for summarization and memory extraction |
| Background jobs | Supabase Edge Functions + pg_cron | Native to existing stack |
| Real-time triggers | Supabase Database Webhooks | Trigger embedding on data changes |
| Full-text search | PostgreSQL `tsvector` / `pg_textsearch` | BM25 ranking for keyword precision |
| Audit logging | Existing `auditLog()` pattern | Extends `src/lib/api/audit.ts` |

---

### 21.10 Key Takeaways and Strategic Recommendations

1. **Start with Mem0-inspired architecture, not raw vector search.** The memory extraction + update decision engine pattern (ADD/UPDATE/DELETE/NOOP) prevents memory bloat and keeps the knowledge graph clean.

2. **Adaptive chunking is non-negotiable for clinical data.** Fixed-length chunking drops accuracy to 50%. Adaptive chunking achieves 87% accuracy with 93% relevance. Chunk by clinical meaning, not by character count.

3. **Hybrid search (semantic + keyword + temporal) is essential.** Pure semantic search misses exact lab values and drug names. Pure keyword search misses conceptual relationships. Temporal weighting prevents the AI from citing outdated information.

4. **The patient snapshot pattern is the biggest UX win.** A pre-computed, always-fresh 500-token summary of each patient provides instant context for every AI interaction. Regenerate it when underlying data changes, cache it otherwise.

5. **Hierarchical memory (episodic/semantic/procedural) prevents context bloat.** Don't embed every data point forever at full weight. Consolidate episodes into insights, insights into patterns. Apply decay to raw data while preserving derived knowledge.

6. **HIPAA compliance is achievable with architecture discipline.** Data minimization (tiered access per AI function), audit trails for all AI-generated insights, patient consent for memory retention, and right-to-deletion implementation are all technically straightforward with the proposed schema.

7. **The two-agent pattern (AMIE) is the right model for clinical AI.** Separate the interaction agent (patient-facing, guardrailed) from the reasoning agent (provider-facing, full memory access). This is both safer and more effective.

8. **Genomic data is static but high-impact.** SNP data should be embedded once with high clinical significance, never decayed, and cross-referenced in every supplement recommendation and interaction check.

9. **Federated learning is a future differentiator but not an MVP requirement.** The architecture should support it (standardized ontologies, clean data pipelines), but implementation is Phase 4+.

10. **The industry is moving fast.** Hippocratic AI ($3.5B valuation), Google DeepMind (AMIE longitudinal management), Mem0 (production memory layer), and Letta (context repositories) are all validating the core thesis: persistent patient memory is the foundation of effective clinical AI.

---

## 22. Competitive Analysis: Superpower Health {#22-superpower-health}

### Overview

Superpower Health (superpower.com) is a DTC preventive health platform founded by **Mark Hyman** (functional medicine pioneer). Raised **$30M**, acquired Feminade (women's hormonal data) and Base (90K nutrition users + lab logistics). Pricing: **$199/year** for 100+ biomarkers.

### What Superpower Does Well

| Feature | Details |
|---------|---------|
| **Unified health profile** | Biomarkers, medical history, wearables, symptoms, and lifestyle in one secure profile |
| **Proprietary AI ("reasons through biology")** | Not a generic chatbot; structured clinical logic with functional medicine + longevity research from Oxford, Harvard, Stanford |
| **Human-in-the-loop** | Functional medicine doctors weekly review AI outputs, score accuracy, train improvements |
| **Visual design** | Described as "hands-down the most beautiful health platform" by reviewers |
| **Aggressive pricing** | $199/year for 100+ biomarkers, HSA/FSA eligible |
| **Curated supplement marketplace** | 20% member discounts on supplements |
| **Prescription access** | Text/video clinician visits for Rx renewals |
| **Engagement hooks** | Biological age + organ scores as progress metrics |

Sources: [Superpower vs Function Health](https://superpower.com/superpower-vs-function-health) | [Superpower AI Blog](https://superpower.com/blog/superpower-ai-a-new-kind-of-health-intelligence) | [TechCrunch](https://techcrunch.com/2025/04/22/superpower-wants-to-help-people-detect-and-address-health-issues-before-symptoms-appear/) | [Product Review](https://www.productpep.com/blog/2025/10/27/what-is-superpowers-superpower)

### Where Superpower Falls Short (Apothecare's Opportunity)

| Gap | Details | Apothecare Advantage |
|-----|---------|-------------------|
| **Generic AI analysis** | Doesn't explain biomarker relationships or build narratives. Reviewers describe output as "surface-level." | Apothecare's functional vs. conventional ranges, cross-lab correlation, and evidence citation system go deeper |
| **Safety failures** | Recommended a pre-hormone supplement without flagging prostate cancer family history contraindication | Provider approval loop + interaction detection + health memory (including family history) prevents this |
| **No practitioner layer** | DTC only — no provider collaboration, no approval workflows, no clinical oversight beyond internal team | Apothecare keeps the practitioner central to every patient interaction |
| **No longitudinal memory** | Snapshot-based analysis. No tracking of how interventions affect biomarkers over time | AI Health Memory tracks "zonulin down 40% since starting L-glutamine 3 months ago" |
| **Black-box analysis** | No transparency into methodology or reasoning | Evidence badges, citation system, and clinical lens give full visibility |
| **No mobile app** | Web only (rated C- by reviewers) | PWA-first architecture planned |
| **Broken wearable integration** | Apple HealthKit unsupported, Oura data unused, Strava API limits exceeded (rated D+) | Terra API integration covers 400+ devices properly |

### Strategic Insight

Superpower validates the market demand for AI-powered health intelligence at consumer scale. However, their DTC approach creates a fundamental safety gap: **no clinical oversight on AI-generated recommendations.** Apothecare's strategic advantage is the practitioner-patient loop — every patient-facing feature strengthens the clinical relationship rather than replacing it.

---

## 23. Prioritized Feature Investment Recommendations {#23-feature-prioritization}

### Strategic Thesis

> **Superpower and Function Health are DTC plays that cut out the provider. Apothecare should make the provider-patient relationship BETTER, not replace it.** Every patient feature should strengthen that bond. This is the moat — it's harder to build but creates stickier relationships on both sides.

### Tier 1 — Build First (Highest ROI)

#### 1. AI Lab Explanations in Plain Language
- **Impact:** 10 | **Feasibility:** 9 | **Differentiation:** 8
- Already have the lab interpretation engine. Add a "patient voice" output layer.
- Example: *"Your TSH is 3.8 — within conventional range, but your practitioner considers 1-2.5 optimal for functional medicine. This may relate to the fatigue you've reported."*
- Superpower does this generically. Apothecare can do it with functional context + evidence citations.
- **Effort:** Low — reuse existing AI, add patient-facing prompt template.
- **Leverages:** Existing lab interpretation engine, clinical lens toggle, evidence badges.

#### 2. Bidirectional Supplement Reconciliation ("Pull Request" Workflow)
- **Impact:** 9 | **Feasibility:** 8 | **Differentiation:** 10
- Nobody does this. Patients propose changes, providers approve/reject with context.
- Example: *Patient adds "started magnesium glycinate 400mg" → provider gets notification → approves/adjusts/flags interaction*
- Solves the real clinical problem: practitioners never know what patients are actually taking between visits.
- **Effort:** Medium — CRUD + approval workflow + notifications.
- **Leverages:** Existing supplement intelligence module, interaction checking.

#### 3. Longitudinal AI Health Memory
- **Impact:** 10 | **Feasibility:** 6 | **Differentiation:** 10
- The technical foundation that powers everything else. pgvector embeddings of all patient data.
- Enables: *"Zonulin down 40% since starting L-glutamine 3 months ago"* and *"fatigue scores correlate with thyroid changes across your last 4 visits."*
- Superpower does snapshot analysis only. This is genuinely differentiated.
- **Effort:** High but phase-able — start with lab trend memory, add visits/symptoms/supplements incrementally.
- **Leverages:** Existing pgvector infrastructure, biomarker timeline (recharts).

### Tier 2 — Build Next (High Impact, Moderate Effort)

#### 4. Symptom-Biomarker Correlation Tracking
- **Impact:** 8 | **Feasibility:** 7 | **Differentiation:** 9
- Patient logs symptoms daily → AI correlates with lab trends over time.
- Example: *"Your energy scores improved 60% since starting the thyroid protocol."*
- Creates **daily engagement** (the Holy Grail of health apps). Feeds data to practitioners between visits.
- **Effort:** Medium.
- **Leverages:** Health memory, biomarker timeline.

#### 5. Patient AI Chat (Scoped to Their Data)
- **Impact:** 9 | **Feasibility:** 7 | **Differentiation:** 7
- Reuse existing `streamCompletion()` infrastructure. Scope to patient's own labs/protocols.
- Guardrails: no diagnosis, no prescription advice, emergency detection, provider visibility of all conversations.
- Epic MyChart is building this. Superpower's version is reckless (recommended supplements conflicting with family history).
- **Effort:** Medium — infrastructure exists, need scoping + safety layer.
- **Leverages:** Existing streaming chat, evidence source filtering, citation system.

#### 6. Smart Supplement Adherence
- **Impact:** 7 | **Feasibility:** 8 | **Differentiation:** 7
- Daily check-ins, streak tracking, reminders, interaction warnings, refill predictions.
- Creates daily app opens. Adherence data is gold for practitioners.
- **Effort:** Medium.
- **Leverages:** Supplement intelligence module, notification system.

### Tier 3 — Build When Ready (Future Differentiation)

#### 7. Fullscript Integration
- **Impact:** 7 | **Feasibility:** 7 | **Differentiation:** 6
- Already stubbed in the codebase (`fullscript-stub-button.tsx`). Closes the loop: protocol → order → track → refill.
- Revenue generating via affiliate commission.
- **Effort:** Medium — API integration + UI.
- **Leverages:** Existing stub, supplement module, protocol generation.

#### 8. Wearable Integration (Terra API)
- **Impact:** 7 | **Feasibility:** 6 | **Differentiation:** 7
- Covers Oura, Whoop, Apple Health, Dexcom, 400+ devices at $399/mo.
- Superpower's biggest weakness — their wearable integration is broken. Getting this right is a visible competitive win.
- Data feeds into health memory for sleep/HRV/activity ↔ symptom/biomarker correlations.
- **Effort:** High.
- **Leverages:** Health memory, symptom tracking.

### Features to Skip

| Feature | Reason |
|---------|--------|
| **Patient communities / group programs** | Moderation nightmare, liability risk, low differentiation. Let Facebook groups handle this. |
| **Telehealth** | Commoditized. Zoom/Doxy.me work fine. Don't build a video platform. |
| **Voice-first interfaces** | Niche audience, expensive to build well, low ROI for a clinical tool. |
| **Full FHIR/HL7 interoperability** | Massive engineering effort for marginal early benefit. Do PDF/CSV import first. |
| **Prescription management** | Regulatory minefield. Stick to supplements (OTC) where Apothecare already has expertise. |

### Implementation Roadmap

```
Phase 1 (Weeks 1-4):   Auth + RLS + Read-only portal
                        AI Lab Explanations (patient voice)
                        Supplement list view (read-only)

Phase 2 (Weeks 5-8):   Supplement reconciliation (bidirectional)
                        Symptom logging + daily check-ins
                        Health Memory foundation (lab embeddings)

Phase 3 (Weeks 9-12):  Patient AI Chat (scoped + guardrailed)
                        Supplement adherence tracking
                        Health Memory expansion (visits, symptoms)
                        Fullscript integration

Phase 4 (Weeks 13+):   Symptom-biomarker correlation AI
                        Wearable integration (Terra API)
                        Predictive insights from longitudinal data
                        Genomic/SNP integration
```

### Key Metrics to Track

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Daily active patients | 40%+ of registered | Proves engagement beyond lab-result-day |
| Supplement reconciliation rate | 80%+ accuracy | Validates bidirectional workflow |
| AI chat sessions / patient / month | 3+ | Shows patients find AI useful |
| Symptom log streak (7+ days) | 50%+ of active patients | Daily engagement Holy Grail |
| Provider response time on supplement changes | <24 hours | Proves practitioner loop works |
| Patient NPS | 70+ | Overall satisfaction |

---

## 24. Unified Patient Health Timeline — Feature Specification {#24-unified-patient-health-timeline}

> **Specification Date:** February 20, 2026
> **Status:** Production-ready specification
> **Dependencies:** AI Patient Health Memory (Section 21), Biomarker Timeline (Sprint 8), Supplement Intelligence Module (Sprint 6), Symptom Tracking (Section 13), Wearable Integration (Section 8)
> **Connects to:** Prioritized Feature Recommendations (Section 23) -- Tier 1 Item #3 (Longitudinal AI Health Memory) and Tier 2 Item #4 (Symptom-Biomarker Correlation Tracking)

---

### 24.1 Overview

The Unified Patient Health Timeline is Apothecare's signature feature -- a three-layer visualization and intelligence system that transforms scattered patient health data into a coherent, navigable, AI-enriched narrative. It combines:

1. **Visual Layer** -- A chronological timeline of every patient health event
2. **Data Layer** -- Biomarker trend overlays with clinical context markers
3. **Intelligence Layer** -- AI-generated narrative summaries of the patient's health journey

No competitor in the functional medicine EHR space offers all three layers in a unified view. Cerbo provides a basic historical lab dashboard. Superpower provides snapshot analysis. Practice Better provides engagement metrics. Apothecare's Unified Timeline connects the dots across labs, visits, supplements, symptoms, wearables, and protocols -- then explains what the connections mean.

---

### 24.2 User Stories

#### Provider-Facing Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| P-TL-01 | As a practitioner, I want to see a chronological timeline of all events for a patient so I can understand their full health journey at a glance. | Timeline shows lab results, visits, supplement changes, symptom trends, and wearable highlights in a single scrollable view. Events are grouped by date. |
| P-TL-02 | As a practitioner, I want to filter the timeline by event type so I can focus on specific data categories. | Filter toggles for: Labs, Visits, Supplements, Symptoms, Wearables, Protocols. Filters persist in URL params. Multiple filters can be active simultaneously. |
| P-TL-03 | As a practitioner, I want to overlay biomarker trend lines on the timeline so I can see how a biomarker changed relative to interventions. | Clicking a biomarker name from any timeline event opens a trend overlay chart. The chart shows functional and conventional range bands. Supplement start/stop dates appear as vertical markers. |
| P-TL-04 | As a practitioner, I want to compare 2-3 biomarkers on the same chart so I can spot correlations. | Multi-select biomarker dropdown allows up to 3 biomarkers. Each gets its own Y-axis (dual-axis or normalized). Correlation coefficient displayed when 2+ markers are selected. |
| P-TL-05 | As a practitioner, I want to request an AI summary of a patient's health journey scoped to a body system so I can prepare for appointments efficiently. | "Summarize" button with system scope selector (e.g., "Thyroid," "GI," "Metabolic," "Full"). AI generates a narrative summary with citations. Summary is cacheable and refreshable. |
| P-TL-06 | As a practitioner, I want to see AI-detected correlations highlighted on the timeline so I can identify patterns I might miss manually. | AI flags (e.g., "Zonulin improved 33% after L-glutamine start") appear as annotated markers on the timeline. Clicking the flag shows the full AI insight with evidence. |
| P-TL-07 | As a practitioner, I want to zoom the timeline to different time scales so I can see both macro trends and granular detail. | Zoom controls: Day, Week, Month, Quarter, Year, All-Time. Default is last 6 months. Zoom level persists during the session. |
| P-TL-08 | As a practitioner, I want to generate a patient-friendly version of the AI narrative so I can share it through the patient portal. | "Share with patient" button generates a plain-language version of the narrative. Provider can review and edit before publishing. Published narratives appear in the patient portal. |
| P-TL-09 | As a practitioner, I want to see rate-of-change annotations on biomarker trends so I can quantify improvement velocity. | Each biomarker data point shows percentage change from prior value. The trend line includes a slope annotation (e.g., "+4.2 ng/mL per month"). |
| P-TL-10 | As a practitioner, I want to print or export the timeline view so I can include it in clinical documentation. | Export as PDF with current zoom level, active filters, and any visible biomarker overlays. Print-optimized CSS. |

#### Patient-Facing Stories (Patient Portal)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| PT-TL-01 | As a patient, I want to see my health timeline so I can understand my progress over time. | Read-only timeline shows labs, visits, supplement protocol changes, and symptom trends. No edit capability. Events use plain-language labels. |
| PT-TL-02 | As a patient, I want to read an AI-generated summary of my health journey so I can understand my progress without clinical jargon. | Patient-facing narrative uses 8th-grade reading level. Includes encouragement for positive trends. Disclaimer: "AI-generated summary reviewed by your care team." |
| PT-TL-03 | As a patient, I want to tap a biomarker on the timeline to see its trend chart with explanations so I can understand what the numbers mean. | Tapping a lab result event expands to show the biomarker trend chart. Below the chart, an AI explanation describes what the biomarker measures and what the trend means. Functional and conventional ranges are labeled in plain language. |
| PT-TL-04 | As a patient, I want to see how my supplements connect to my lab improvements so I can understand why I am taking them. | Timeline visually connects supplement start dates to subsequent biomarker improvements. E.g., "You started Vitamin D3 on Sept 20 -- your vitamin D level has improved from 22 to 42 ng/mL since then." |
| PT-TL-05 | As a patient, I want the timeline to load quickly on my phone so I can check my progress anywhere. | Mobile layout uses a single-column card-based timeline. Initial load under 2 seconds on 4G. Lazy loading for older events. Touch-friendly zoom controls. |
| PT-TL-06 | As a patient, I want to filter the timeline to see only labs or only visits so I can find what I need quickly. | Simple toggle filters at the top of the timeline. Active filter state is visually clear. |

---

### 24.3 Detailed UX Description

#### 24.3.1 Provider Dashboard Layout

The Unified Timeline lives at `/dashboard/patients/[id]/timeline` and is accessible from the patient detail page as a primary tab alongside existing tabs (Overview, Labs, Visits, Supplements, Chat).

```
+------------------------------------------------------------------+
|  Patient: Sarah Chen       DOB: 1985-03-14     Last Visit: 2/10  |
+------------------------------------------------------------------+
|  [Overview] [Labs] [Visits] [Supplements] [Chat] [*Timeline*]    |
+------------------------------------------------------------------+
|                                                                    |
|  UNIFIED HEALTH TIMELINE                                          |
|  +-----------+  +-------------------------------------------+     |
|  | FILTERS   |  | ZOOM: [Day] [Wk] [Mo] [*Qtr*] [Yr] [All] |     |
|  |           |  |                                             |     |
|  | [x] Labs  |  | BIOMARKER OVERLAY:                         |     |
|  | [x] Visits|  | [TSH v] [+ Add biomarker]                  |     |
|  | [x] Supps |  |                                             |     |
|  | [x] Sympt |  | [AI Summary]  [Export PDF]                 |     |
|  | [ ] Wear  |  +-------------------------------------------+     |
|  | [x] Proto |  |                                             |     |
|  +-----------+  | BIOMARKER OVERLAY CHART (when active)       |     |
|                 | +---------------------------------------+   |     |
|                 | |    TSH Trend                          |   |     |
|                 | |  5.0|                                 |   |     |
|                 | |     | ....x----- functional range     |   |     |
|                 | |  4.0| x                               |   |     |
|                 | |     |  \   supp start                 |   |     |
|                 | |  3.0|   \  |                          |   |     |
|                 | |     |    x-+--x                       |   |     |
|                 | |  2.0|         \                       |   |     |
|                 | |     | .........\x.... functional rng  |   |     |
|                 | |  1.0|                                 |   |     |
|                 | |     +--+--+--+--+--+--+--+--+--+--+   |   |     |
|                 | |     Mar  May  Jul  Sep  Nov  Jan      |   |     |
|                 | |                                       |   |     |
|                 | | Legend: --- Functional range           |   |     |
|                 | |         ... Conventional range         |   |     |
|                 | |         |   Supplement start/stop      |   |     |
|                 | |         x   Lab result data point       |   |     |
|                 | +---------------------------------------+   |     |
|                 |                                             |     |
|                 | TIMELINE EVENTS                             |     |
|                 | ============================================|     |
|                 |                                             |     |
|                 |  FEB 10, 2026                               |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Visit] Follow-up: Thyroid Protocol  |   |     |
|                 |  |  Assessment: TSH improving. Continue  |   |     |
|                 |  |  selenium. Retest in 90 days.         |   |     |
|                 |  |  [View full visit note ->]            |   |     |
|                 |  +--------------------------------------+   |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Lab] Thyroid Panel                  |   |     |
|                 |  |  TSH: 2.8 mIU/L  [optimal]  -1.4    |   |     |
|                 |  |  Free T3: 3.2 pg/mL [normal] +0.3   |   |     |
|                 |  |  Free T4: 1.3 ng/dL [optimal] +0.1  |   |     |
|                 |  |  [View full lab report ->]           |   |     |
|                 |  +--------------------------------------+   |     |
|                 |                                             |     |
|                 |  ------ AI INSIGHT -------------------------|     |
|                 |  | TSH improved 33% (4.2 -> 2.8) since  |  |     |
|                 |  | starting selenium 200mcg on Oct 15.   |  |     |
|                 |  | Correlates with 40% reduction in      |  |     |
|                 |  | fatigue score (3.2 -> 4.5/5).         |  |     |
|                 |  +------------------------------------------+     |
|                 |                                             |     |
|                 |  JAN 15, 2026                               |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Symptom] Weekly avg: Energy 3.8,    |   |     |
|                 |  |  Sleep 3.5, Mood 4.0, Digestion 4.2  |   |     |
|                 |  |  [View symptom details ->]            |   |     |
|                 |  +--------------------------------------+   |     |
|                 |                                             |     |
|                 |  DEC 20, 2025                               |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Wearable] Oura Ring Weekly Summary  |   |     |
|                 |  |  HRV avg: 48ms (+6 from baseline)    |   |     |
|                 |  |  Deep sleep: 18% (up from 12%)       |   |     |
|                 |  +--------------------------------------+   |     |
|                 |                                             |     |
|                 |  OCT 15, 2025                               |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Supplement] Protocol Change          |   |     |
|                 |  |  + Started: Selenium 200mcg daily     |   |     |
|                 |  |  Reason: Elevated TPO antibodies      |   |     |
|                 |  +--------------------------------------+   |     |
|                 |                                             |     |
|                 |  SEP 15, 2025                               |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Lab] Thyroid Panel                  |   |     |
|                 |  |  TSH: 4.2 mIU/L  [borderline] --     |   |     |
|                 |  |  TPO Ab: 45 IU/mL [out-of-range] --  |   |     |
|                 |  |  [View full lab report ->]           |   |     |
|                 |  +--------------------------------------+   |     |
|                 |  +--------------------------------------+   |     |
|                 |  | [Visit] Initial Consult: Thyroid     |   |     |
|                 |  |  CC: Fatigue, cold intolerance,      |   |     |
|                 |  |  weight gain. IFM Matrix: Endocrine  |   |     |
|                 |  |  dysfunction, autoimmune activation.  |   |     |
|                 |  |  [View full visit note ->]            |   |     |
|                 |  +--------------------------------------+   |     |
|                 |                                             |     |
|                 | [Load more events...]                       |     |
|                 +---------------------------------------------+     |
+------------------------------------------------------------------+
```

#### 24.3.2 Mobile Layout (Patient Portal)

On mobile (< 768px), the timeline renders as a single-column card stack with a simplified header:

```
+--------------------------------+
| My Health Timeline             |
| [Labs] [Visits] [All]   [v]   |
+--------------------------------+
|                                |
|  Feb 10                        |
|  +---------------------------+ |
|  | [Visit icon]              | |
|  | Follow-up: Thyroid        | |
|  | TSH improving. Continue   | |
|  | protocol.                 | |
|  |        [View details >]   | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | [Lab icon]                | |
|  | Thyroid Panel             | |
|  | TSH: 2.8 optimal         | |
|  | [Tap to see trend chart]  | |
|  +---------------------------+ |
|                                |
|  +---------------------------+ |
|  | [AI insight sparkle]     | |
|  | TSH improved 33% since   | |
|  | starting selenium.        | |
|  |       [Learn more >]     | |
|  +---------------------------+ |
|                                |
|  Jan 15                        |
|  +---------------------------+ |
|  | [Symptom icon]            | |
|  | Energy: 3.8/5 (up 19%)   | |
|  | Sleep: 3.5/5 (stable)    | |
|  +---------------------------+ |
|                                |
| [Load more...]                 |
+--------------------------------+
```

#### 24.3.3 Interaction Patterns

**Biomarker Overlay Activation:**
1. User clicks any lab result event on the timeline.
2. The biomarker overlay chart expands above the timeline event stream.
3. The chart shows the full history of that biomarker.
4. Vertical dashed lines on the chart mark supplement starts/stops and visit dates.
5. Horizontal shaded bands show functional (darker) and conventional (lighter) reference ranges.
6. User can click "+ Add biomarker" to overlay a second or third biomarker (max 3).
7. For multi-biomarker overlays, each biomarker gets its own Y-axis scale (left axis for first, right for second). A third biomarker uses a normalized percentage scale.

**AI Summary Generation:**
1. User clicks "AI Summary" button.
2. A modal/drawer opens with scope selector: "Full Journey," "Thyroid," "GI," "Metabolic," "Hormones," "Nutritional," "Custom..."
3. On scope selection, a streaming response generates the narrative (reuses existing `streamCompletion()` SSE pattern).
4. The narrative includes inline citations (evidence badges, same `EvidenceBadge` component from chat).
5. A "Share with patient" toggle generates a plain-language version.
6. Generated summaries are cached in `timeline_narratives` table and invalidated when new data arrives.

**Zoom Controls:**
- Day: Shows hour-level granularity (useful for wearable data deep dives).
- Week: Shows day-level events for the selected week.
- Month: Shows week-level groupings with daily events expandable.
- Quarter: Default view. Shows events grouped by month.
- Year: Shows events grouped by quarter.
- All-Time: Shows the entire patient history grouped by year.

**Filter Interactions:**
- Each event type has a toggle chip in the filter panel.
- Active filters update the URL query string (`?filters=labs,visits,supplements`).
- Filter state is stored in `sessionStorage` for persistence during navigation.
- "Clear all" resets to all event types visible.

---

### 24.4 Data Model

#### 24.4.1 New Tables

```sql
-- ===========================================
-- APOTHECARE - Unified Patient Health Timeline
-- ===========================================
-- Migration 009: Timeline events, narratives, and correlation data

-- ── Timeline Events (Unified Event Stream) ───────────────────────

-- This table serves as a denormalized, queryable event stream
-- that unifies data from multiple source tables into a single
-- chronological feed. Events are inserted by triggers or API
-- routes when source data changes.

CREATE TYPE timeline_event_type AS ENUM (
  'lab_result',
  'visit',
  'supplement_start',
  'supplement_stop',
  'supplement_dose_change',
  'symptom_log',
  'wearable_summary',
  'protocol_milestone',
  'patient_reported',
  'ai_insight'
);

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Event classification
  event_type timeline_event_type NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,

  -- Source reference (polymorphic FK)
  source_table TEXT NOT NULL,  -- 'lab_reports', 'visits', 'supplement_reviews', etc.
  source_id UUID NOT NULL,     -- FK to the source row

  -- Denormalized display data (avoids JOINs for timeline rendering)
  title TEXT NOT NULL,          -- "Thyroid Panel" / "Follow-up Visit" / "Started Selenium"
  summary TEXT,                 -- Short description for the timeline card
  detail JSONB DEFAULT '{}',   -- Type-specific detail payload

  -- For lab_result events:
  --   { biomarker_code, biomarker_name, value, unit, flag, previous_value, change_pct }
  -- For visit events:
  --   { chief_complaint, note_template, assessment_snippet }
  -- For supplement events:
  --   { supplement_name, dose, frequency, reason, action: 'start'|'stop'|'change' }
  -- For symptom_log events:
  --   { scores: { energy: 4, sleep: 3, ... }, note }
  -- For wearable_summary events:
  --   { source, hrv_avg, sleep_hours, deep_sleep_pct, glucose_avg }
  -- For ai_insight events:
  --   { insight_type, body_system, confidence, description }

  -- Categorization
  body_systems TEXT[],         -- e.g., ['endocrine', 'immune']
  biomarker_codes TEXT[],      -- For lab events, enables biomarker filtering

  -- Visibility
  visible_to_patient BOOLEAN DEFAULT false,  -- Controls patient portal visibility
  is_pinned BOOLEAN DEFAULT false,           -- Provider can pin important events

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Composite index for timeline queries (patient + date range + filters)
CREATE INDEX idx_timeline_events_patient_date
  ON timeline_events (patient_id, event_date DESC);
CREATE INDEX idx_timeline_events_type
  ON timeline_events (patient_id, event_type, event_date DESC);
CREATE INDEX idx_timeline_events_body_system
  ON timeline_events USING GIN (body_systems);
CREATE INDEX idx_timeline_events_biomarker
  ON timeline_events USING GIN (biomarker_codes);
CREATE INDEX idx_timeline_events_source
  ON timeline_events (source_table, source_id);
-- Cursor-based pagination index
CREATE INDEX idx_timeline_events_cursor
  ON timeline_events (patient_id, event_date DESC, id);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Practitioners see events for their own patients
CREATE POLICY "timeline_events_practitioner" ON timeline_events
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- Patient portal: patients see only their own events marked visible
-- (Requires patient_profiles auth integration from Section 20)
-- CREATE POLICY "timeline_events_patient" ON timeline_events
--   FOR SELECT USING (
--     auth.jwt()->>'user_role' = 'patient'
--     AND patient_id = (auth.jwt()->>'patient_id')::UUID
--     AND visible_to_patient = true
--   );

CREATE TRIGGER set_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── AI Timeline Narratives (Cached Summaries) ────────────────────

CREATE TABLE timeline_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Scope
  scope TEXT NOT NULL,                  -- 'full', 'thyroid', 'gi', 'metabolic', 'hormones', 'nutritional', 'custom'
  scope_detail TEXT,                    -- For custom scope: "gut health journey"
  body_systems TEXT[],                  -- Which body systems this covers
  time_range_start TIMESTAMPTZ,        -- Narrative covers events from
  time_range_end TIMESTAMPTZ,          -- Narrative covers events to

  -- Content
  provider_narrative TEXT NOT NULL,     -- Clinical-language narrative (for practitioner)
  patient_narrative TEXT,               -- Plain-language narrative (for patient portal)

  -- Metadata
  model_used TEXT,                      -- e.g., 'claude-sonnet-4-6'
  input_tokens INTEGER,
  output_tokens INTEGER,
  source_event_ids UUID[],             -- Which timeline events informed this narrative
  source_embedding_ids UUID[],         -- Which health memory embeddings were retrieved

  -- Lifecycle
  is_stale BOOLEAN DEFAULT false,      -- Set true when new data arrives
  published_to_patient BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  provider_edited BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_narratives_patient ON timeline_narratives(patient_id, scope, is_stale);
CREATE INDEX idx_narratives_created ON timeline_narratives(created_at DESC);

ALTER TABLE timeline_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "narratives_practitioner" ON timeline_narratives
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER set_narratives_updated_at
  BEFORE UPDATE ON timeline_narratives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Biomarker Correlations (AI-Detected) ─────────────────────────

CREATE TABLE biomarker_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- Correlation pair
  biomarker_code_a TEXT NOT NULL,
  biomarker_code_b TEXT,               -- NULL if correlating with non-biomarker data
  correlation_target TEXT,              -- 'supplement_adherence', 'symptom_score', 'wearable_hrv', etc.

  -- Statistical data
  correlation_coefficient REAL,         -- Pearson r value (-1 to 1)
  p_value REAL,                        -- Statistical significance
  data_points INTEGER,                 -- Number of observations

  -- Narrative
  description TEXT NOT NULL,            -- "TSH and Free T3 show inverse correlation (r=-0.82)"
  clinical_interpretation TEXT,         -- "As TSH decreases toward optimal, Free T3 is rising appropriately"

  -- Temporal
  time_range_start DATE,
  time_range_end DATE,

  -- Lifecycle
  detected_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  reviewed_by UUID REFERENCES practitioners(id),
  reviewed_at TIMESTAMPTZ,

  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_correlations_patient ON biomarker_correlations(patient_id, is_active);


-- ── Timeline Event Annotations ───────────────────────────────────
-- Provider or AI can annotate timeline events with context

CREATE TABLE timeline_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  annotation_type TEXT NOT NULL CHECK (annotation_type IN (
    'provider_note', 'ai_insight', 'correlation_flag', 'milestone', 'warning'
  )),
  content TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  -- Provenance
  created_by_type TEXT CHECK (created_by_type IN ('practitioner', 'ai_system')),
  created_by_id UUID,    -- practitioner ID or NULL for AI
  model_used TEXT,        -- For AI-generated annotations

  visible_to_patient BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_annotations_event ON timeline_annotations(timeline_event_id);
CREATE INDEX idx_annotations_patient ON timeline_annotations(patient_id, annotation_type);
```

#### 24.4.2 Relationships to Existing Tables

```
timeline_events.source_id ──> lab_reports.id        (event_type = 'lab_result')
timeline_events.source_id ──> visits.id             (event_type = 'visit')
timeline_events.source_id ──> supplement_reviews.id  (event_type = 'supplement_*')
timeline_events.source_id ──> symptom_logs.id       (event_type = 'symptom_log')
timeline_events.source_id ──> wearable_data.id      (event_type = 'wearable_summary')
timeline_events.source_id ──> patient_health_insights.id (event_type = 'ai_insight')

timeline_narratives ──> patient_health_embeddings   (via source_embedding_ids)
timeline_narratives ──> timeline_events             (via source_event_ids)

biomarker_correlations ──> biomarker_results        (via biomarker_code_a/b)
biomarker_correlations ──> biomarker_references     (for range data)
```

#### 24.4.3 Event Insertion Triggers

Timeline events are inserted automatically when source data changes. This keeps the timeline_events table as a denormalized read-optimized projection:

```sql
-- Auto-insert timeline event when a lab report completes processing
CREATE OR REPLACE FUNCTION insert_timeline_event_for_lab()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'complete'
  IF NEW.status = 'complete' AND (OLD.status IS NULL OR OLD.status != 'complete') THEN
    -- Insert one event per biomarker result
    INSERT INTO timeline_events (
      patient_id, practitioner_id, event_type, event_date,
      source_table, source_id, title, summary, detail,
      body_systems, biomarker_codes, visible_to_patient
    )
    SELECT
      NEW.patient_id,
      NEW.practitioner_id,
      'lab_result',
      COALESCE(NEW.collection_date::timestamptz, NEW.created_at),
      'lab_reports',
      NEW.id,
      COALESCE(NEW.test_name, 'Lab Report'),
      'Lab results processed with ' || (
        SELECT COUNT(*) FROM biomarker_results WHERE lab_report_id = NEW.id
      ) || ' biomarkers',
      jsonb_build_object(
        'test_type', NEW.test_type,
        'lab_vendor', NEW.lab_vendor,
        'biomarker_count', (
          SELECT COUNT(*) FROM biomarker_results WHERE lab_report_id = NEW.id
        )
      ),
      ARRAY(
        SELECT DISTINCT category FROM biomarker_results
        WHERE lab_report_id = NEW.id AND category IS NOT NULL
      ),
      ARRAY(
        SELECT DISTINCT biomarker_code FROM biomarker_results
        WHERE lab_report_id = NEW.id
      ),
      false  -- Not visible to patient until provider releases
    ;

    -- Invalidate any existing narratives for this patient
    UPDATE timeline_narratives
    SET is_stale = true
    WHERE patient_id = NEW.patient_id AND is_stale = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lab_report_complete
  AFTER UPDATE ON lab_reports
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_lab();


-- Auto-insert timeline event when a visit is created
CREATE OR REPLACE FUNCTION insert_timeline_event_for_visit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'visit',
    COALESCE(NEW.visit_date, NEW.created_at),
    'visits',
    NEW.id,
    COALESCE(
      'Visit: ' || LEFT(NEW.chief_complaint, 60),
      'Clinical Visit'
    ),
    LEFT(COALESCE(NEW.assessment, NEW.subjective, 'Visit documented'), 200),
    jsonb_build_object(
      'chief_complaint', NEW.chief_complaint,
      'note_template', NEW.note_template,
      'has_ai_assessment', NEW.ai_assessment IS NOT NULL
    ),
    false
  );

  UPDATE timeline_narratives
  SET is_stale = true
  WHERE patient_id = NEW.patient_id AND is_stale = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_visit_created
  AFTER INSERT ON visits
  FOR EACH ROW
  WHEN (NEW.patient_id IS NOT NULL)
  EXECUTE FUNCTION insert_timeline_event_for_visit();
```

---

### 24.5 API Endpoints

All timeline endpoints follow existing Apothecare patterns: CSRF validation, auth check, rate limiting, Zod validation, audit logging.

#### 24.5.1 Timeline Events

**`GET /api/patients/[id]/timeline`**

Retrieves paginated, filterable timeline events.

```typescript
// Request
GET /api/patients/{patientId}/timeline
  ?cursor={lastEventId}              // cursor-based pagination
  &limit=20                          // default 20, max 50
  &event_types=lab_result,visit      // comma-separated filter
  &body_systems=thyroid,endocrine    // comma-separated filter
  &date_from=2025-01-01             // ISO date
  &date_to=2026-02-20              // ISO date
  &zoom=quarter                     // day|week|month|quarter|year|all

// Response 200
{
  "events": [
    {
      "id": "uuid",
      "event_type": "lab_result",
      "event_date": "2026-02-10T00:00:00Z",
      "title": "Thyroid Panel",
      "summary": "Lab results processed with 4 biomarkers",
      "detail": {
        "test_type": "blood_panel",
        "lab_vendor": "quest",
        "biomarker_count": 4,
        "highlights": [
          { "biomarker_code": "TSH", "biomarker_name": "TSH",
            "value": 2.8, "unit": "mIU/L", "flag": "optimal",
            "previous_value": 4.2, "change_pct": -33.3 }
        ]
      },
      "body_systems": ["thyroid"],
      "biomarker_codes": ["TSH", "FREE_T3", "FREE_T4", "TPO_AB"],
      "annotations": [
        {
          "id": "uuid",
          "annotation_type": "ai_insight",
          "content": "TSH improved 33% since starting selenium 200mcg.",
          "confidence": "high"
        }
      ],
      "source_table": "lab_reports",
      "source_id": "uuid",
      "visible_to_patient": true,
      "is_pinned": false,
      "created_at": "2026-02-10T14:30:00Z"
    }
  ],
  "next_cursor": "uuid-of-last-event",
  "has_more": true,
  "total_count": 47
}
```

**`POST /api/patients/[id]/timeline/events`**

Manually create a timeline event (for protocol milestones, provider notes).

```typescript
// Request body
{
  "event_type": "protocol_milestone",
  "event_date": "2026-01-15",
  "title": "Phase 2: Reintroduction Started",
  "summary": "Patient began gluten reintroduction after 8 weeks on elimination diet.",
  "detail": {
    "protocol_name": "GI Reset Protocol",
    "phase": 2,
    "notes": "Start with small amounts, log symptoms daily"
  },
  "body_systems": ["gi"],
  "visible_to_patient": true
}

// Response 201
{
  "id": "uuid",
  "event_type": "protocol_milestone",
  "event_date": "2026-01-15T00:00:00Z",
  "title": "Phase 2: Reintroduction Started",
  "created_at": "2026-02-20T10:00:00Z"
}
```

#### 24.5.2 Biomarker Overlay

**`GET /api/patients/[id]/timeline/biomarker-overlay`**

Returns multi-biomarker trend data with context markers for the overlay chart.

```typescript
// Request
GET /api/patients/{patientId}/timeline/biomarker-overlay
  ?biomarker_codes=TSH,FREE_T3        // comma-separated, max 3
  &date_from=2025-01-01
  &date_to=2026-02-20
  &include_context_markers=true       // supplement starts, visits

// Response 200
{
  "biomarkers": [
    {
      "biomarker_code": "TSH",
      "biomarker_name": "Thyroid Stimulating Hormone",
      "unit": "mIU/L",
      "functional_low": 1.0,
      "functional_high": 2.0,
      "conventional_low": 0.45,
      "conventional_high": 4.5,
      "data_points": [
        {
          "date": "2025-03-15",
          "value": 4.8,
          "flag": "out-of-range",
          "lab_report_id": "uuid",
          "rate_of_change": null
        },
        {
          "date": "2025-09-15",
          "value": 4.2,
          "flag": "borderline",
          "lab_report_id": "uuid",
          "rate_of_change": -12.5
        },
        {
          "date": "2026-02-10",
          "value": 2.8,
          "flag": "optimal",
          "lab_report_id": "uuid",
          "rate_of_change": -33.3
        }
      ],
      "statistics": {
        "trend_direction": "improving",
        "avg_rate_of_change_per_month": -0.4,
        "projected_value_90_days": 2.2,
        "projected_flag_90_days": "optimal",
        "data_point_count": 3,
        "first_date": "2025-03-15",
        "last_date": "2026-02-10"
      }
    },
    {
      "biomarker_code": "FREE_T3",
      "biomarker_name": "Free Triiodothyronine",
      "unit": "pg/mL",
      "functional_low": 3.0,
      "functional_high": 4.0,
      "conventional_low": 2.0,
      "conventional_high": 4.4,
      "data_points": [ /* ... */ ],
      "statistics": { /* ... */ }
    }
  ],
  "context_markers": [
    {
      "date": "2025-10-15",
      "type": "supplement_start",
      "label": "Started Selenium 200mcg",
      "detail": { "supplement_name": "Selenium", "dose": "200mcg", "frequency": "daily" }
    },
    {
      "date": "2025-09-15",
      "type": "visit",
      "label": "Initial Consult",
      "detail": { "visit_id": "uuid" }
    },
    {
      "date": "2026-02-10",
      "type": "visit",
      "label": "Follow-up",
      "detail": { "visit_id": "uuid" }
    }
  ],
  "correlations": [
    {
      "biomarker_a": "TSH",
      "biomarker_b": "FREE_T3",
      "correlation_coefficient": -0.82,
      "interpretation": "Strong inverse correlation: as TSH normalizes, Free T3 is rising appropriately."
    }
  ]
}
```

#### 24.5.3 AI Narrative

**`POST /api/patients/[id]/timeline/narrative`**

Generates or retrieves a cached AI narrative summary.

```typescript
// Request body
{
  "scope": "thyroid",          // 'full' | 'thyroid' | 'gi' | 'metabolic' | 'hormones' | 'nutritional' | 'custom'
  "custom_prompt": null,       // For scope='custom': "Tell me about this patient's gut health journey"
  "force_refresh": false,      // If true, ignore cache and regenerate
  "include_patient_version": true  // Also generate plain-language version
}

// Response 200 (streaming via SSE if Accept: text/event-stream)
{
  "narrative_id": "uuid",
  "scope": "thyroid",
  "provider_narrative": "Sarah's thyroid journey began in March 2025 when she presented with...",
  "patient_narrative": "Your thyroid health has been improving steadily...",
  "time_range": {
    "start": "2025-03-15",
    "end": "2026-02-10"
  },
  "source_events_count": 12,
  "is_cached": false,
  "model_used": "claude-sonnet-4-6",
  "generated_at": "2026-02-20T10:30:00Z"
}
```

**`PUT /api/patients/[id]/timeline/narrative/[narrativeId]/publish`**

Publishes a narrative to the patient portal.

```typescript
// Request body
{
  "patient_narrative": "Your thyroid health has been improving...",  // Provider can edit before publishing
  "published": true
}

// Response 200
{
  "narrative_id": "uuid",
  "published_to_patient": true,
  "published_at": "2026-02-20T11:00:00Z"
}
```

#### 24.5.4 Timeline Annotations

**`POST /api/patients/[id]/timeline/events/[eventId]/annotate`**

Provider adds a note or flags a timeline event.

```typescript
// Request body
{
  "annotation_type": "provider_note",
  "content": "Patient responded well to this dose. Consider maintaining for 6 months.",
  "visible_to_patient": false
}

// Response 201
{
  "id": "uuid",
  "annotation_type": "provider_note",
  "content": "Patient responded well to this dose...",
  "created_at": "2026-02-20T12:00:00Z"
}
```

---

### 24.6 AI Integration

#### 24.6.1 Narrative Generation Prompt

The AI narrative generation uses the existing `streamCompletion()` infrastructure from `src/lib/ai/provider.ts` with a specialized system prompt:

```typescript
// src/lib/ai/timeline-narrative-prompts.ts

export function buildTimelineNarrativeSystemPrompt(
  scope: string,
  clinicalLens: 'functional' | 'conventional' | 'both'
): string {
  return `You are a clinical summarization assistant for a functional medicine practitioner.
Your task is to generate a cohesive narrative summary of a patient's health journey
based on the chronological health data provided.

## Scope
You are summarizing: ${scope === 'full' ? 'the complete health journey' : `the patient's ${scope} health journey`}.

## Clinical Lens
Use ${clinicalLens === 'functional' ? 'functional/optimal' : clinicalLens === 'conventional' ? 'conventional' : 'both functional and conventional'} reference ranges when discussing lab values.

## Output Requirements
1. Write in clinical language suitable for a practitioner review.
2. Structure the narrative chronologically.
3. Highlight:
   - Key turning points (when interventions started showing results)
   - Intervention outcomes (quantify: "TSH decreased 33% over 4 months")
   - Correlations detected (e.g., supplement adherence correlated with biomarker improvement)
   - Unresolved issues or plateaus requiring attention
   - Projected trajectory if data supports it
4. Include temporal context: dates, durations, intervals.
5. Reference specific data points with values and units.
6. Note any data gaps (e.g., "No labs between June and September").
7. End with a "Current Status" section summarizing where the patient is now.
8. If citations are available in the retrieved context, reference them using [Author, Year] format.

## Safety Guardrails
- Do NOT generate diagnoses. Describe patterns and let the practitioner interpret.
- Do NOT recommend treatments. Summarize what has been done and its measured effects.
- If data is insufficient for a claim, state the limitation explicitly.
- Use hedging language for correlations: "appears to correlate with," "may be associated with."

## Format
Use markdown formatting. Use headers (##) for major time periods or themes.
Keep the summary under 1500 words for a scoped view, under 3000 words for full journey.`;
}

export function buildPatientNarrativeSystemPrompt(): string {
  return `You are rewriting a clinical health summary into plain language that a patient
can understand. The patient is reading this in their health portal.

## Guidelines
1. Use an 8th-grade reading level. Avoid medical jargon.
2. Explain what biomarkers measure in simple terms the first time you mention them.
   Example: "TSH (a hormone that controls your thyroid)" not "TSH."
3. Frame improvements positively: "Your vitamin D has improved from low to the healthy range."
4. Include encouragement where genuine improvement exists.
5. For concerning trends, use supportive language: "This is something your provider
   is keeping an eye on" rather than alarming language.
6. Never suggest the patient change their protocol. Always direct them to discuss
   with their provider.
7. End with: "This summary was generated by AI and reviewed by your care team.
   If you have questions, message your provider."
8. Keep under 800 words.`;
}
```

#### 24.6.2 Context Assembly for Narrative Generation

The narrative generator assembles context from the patient health memory (Section 21) and the timeline events:

```typescript
// src/lib/ai/timeline-narrative.ts

import { createCompletion, streamCompletion, MODELS } from '@/lib/ai/provider';
import { buildTimelineNarrativeSystemPrompt, buildPatientNarrativeSystemPrompt } from './timeline-narrative-prompts';

interface NarrativeContext {
  patientSnapshot: string;           // From patient_snapshots table
  timelineEvents: TimelineEvent[];   // Filtered by scope
  biomarkerTrends: BiomarkerTrend[]; // From biomarker_results
  healthMemoryChunks: string[];      // From search_patient_health_memory()
  supplementHistory: SupplementChange[];
  symptomTrends?: SymptomTrend[];
}

export async function assembleNarrativeContext(
  patientId: string,
  scope: string,
  supabase: SupabaseClient
): Promise<NarrativeContext> {
  // 1. Patient snapshot (always loaded, ~500 tokens)
  const snapshot = await getOrGeneratePatientSnapshot(patientId, supabase);

  // 2. Timeline events filtered by scope
  const bodySystemFilter = scopeToBodySystems(scope);
  const events = await supabase
    .from('timeline_events')
    .select('*')
    .eq('patient_id', patientId)
    .in('body_systems', bodySystemFilter.length > 0 ? bodySystemFilter : undefined)
    .order('event_date', { ascending: true })
    .limit(100);

  // 3. Biomarker trends for relevant biomarkers
  const biomarkerCodes = extractBiomarkerCodes(events.data, scope);
  const trends = await fetchBiomarkerTrends(patientId, biomarkerCodes, supabase);

  // 4. Health memory retrieval (RAG)
  const memoryChunks = await searchPatientHealthMemory(
    patientId,
    `${scope} health journey summary trends interventions outcomes`,
    bodySystemFilter[0] || null,
    supabase
  );

  // 5. Supplement change history
  const supplements = await fetchSupplementHistory(patientId, supabase);

  // 6. Symptom trends (if scope is relevant)
  const symptoms = scope !== 'genomic'
    ? await fetchSymptomTrends(patientId, supabase)
    : undefined;

  return {
    patientSnapshot: snapshot,
    timelineEvents: events.data || [],
    biomarkerTrends: trends,
    healthMemoryChunks: memoryChunks,
    supplementHistory: supplements,
    symptomTrends: symptoms,
  };
}

function scopeToBodySystems(scope: string): string[] {
  const mapping: Record<string, string[]> = {
    thyroid: ['endocrine', 'thyroid'],
    gi: ['gi', 'gastrointestinal'],
    metabolic: ['metabolic'],
    hormones: ['hormone', 'endocrine'],
    nutritional: ['nutritional'],
    full: [],  // No filter -- all systems
  };
  return mapping[scope] || [];
}
```

#### 24.6.3 AI Correlation Detection

Correlations between biomarkers and interventions are detected via a batch process that runs after new data arrives:

```typescript
// src/lib/ai/timeline-correlations.ts

export const CORRELATION_DETECTION_PROMPT = `You are a clinical data analyst.
Given a patient's biomarker trends and intervention timeline, identify
statistically meaningful correlations.

For each correlation found, provide:
1. The two data series being correlated (e.g., "TSH values" and "Selenium supplementation start")
2. The direction and strength of the relationship
3. The time lag between intervention and observed effect
4. Your confidence level (high/medium/low) based on:
   - Number of data points
   - Consistency of the pattern
   - Biological plausibility
5. A one-sentence clinical interpretation

Output as JSON array:
[
  {
    "biomarker": "TSH",
    "correlated_with": "selenium_supplementation",
    "direction": "inverse",
    "strength": "strong",
    "time_lag_weeks": 8,
    "confidence": "medium",
    "data_points": 3,
    "interpretation": "TSH showed progressive improvement beginning approximately 8 weeks after selenium initiation, consistent with known selenium-thyroid peroxidase mechanism."
  }
]

Only report correlations with at least medium confidence.
Do NOT report obvious tautologies (e.g., "vitamin D level correlates with vitamin D supplementation").
Focus on cross-system and non-obvious correlations.`;
```

---

### 24.7 Component Architecture

#### 24.7.1 React Component Tree

```
pages/dashboard/patients/[id]/timeline/page.tsx
  |
  +-- <TimelinePageShell>                    (Server component: auth, data prefetch)
      |
      +-- <UnifiedTimeline>                  (Client component: main orchestrator)
          |
          +-- <TimelineHeader>              (Title, zoom controls, action buttons)
          |   +-- <ZoomControls>            (Day/Week/Month/Quarter/Year/All)
          |   +-- <TimelineActions>         (AI Summary, Export PDF, Filter toggle)
          |
          +-- <TimelineFilterPanel>         (Event type filter chips)
          |
          +-- <BiomarkerOverlayChart>       (Recharts: multi-biomarker trend overlay)
          |   +-- <BiomarkerSelector>       (Dropdown for adding/removing biomarkers)
          |   +-- <OverlayLegend>           (Range bands, context marker legend)
          |   +-- <TrendStatistics>         (Rate of change, projection)
          |
          +-- <TimelineEventStream>         (Virtualized scrollable event list)
          |   +-- <TimelineDateGroup>       (Date header with grouped events)
          |   |   +-- <TimelineEventCard>   (Individual event card)
          |   |       +-- <LabResultEvent>  (Lab-specific card content)
          |   |       +-- <VisitEvent>      (Visit-specific card content)
          |   |       +-- <SupplementEvent> (Supplement change card content)
          |   |       +-- <SymptomEvent>    (Symptom log card content)
          |   |       +-- <WearableEvent>   (Wearable summary card content)
          |   |       +-- <AIInsightEvent>  (AI insight card content)
          |   |       +-- <MilestoneEvent>  (Protocol milestone card content)
          |   |
          |   +-- <TimelineAnnotation>      (Annotation badges on events)
          |   +-- <LoadMoreTrigger>         (Intersection observer for pagination)
          |
          +-- <NarrativeSummaryDrawer>      (Slide-over drawer for AI narrative)
              +-- <ScopeSelector>           (Body system scope picker)
              +-- <NarrativeContent>        (Streaming markdown renderer)
              +-- <PublishToPatientToggle>  (Share with patient controls)
```

#### 24.7.2 Key Hooks

```typescript
// src/hooks/use-timeline.ts
// Primary hook for timeline data fetching and state management

import { useState, useCallback, useEffect, useRef } from 'react';

export interface TimelineFilters {
  eventTypes: TimelineEventType[];
  bodySystems: string[];
  dateFrom: string | null;
  dateTo: string | null;
  zoom: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
}

export interface UseTimelineReturn {
  events: TimelineEvent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  filters: TimelineFilters;
  setFilters: (filters: Partial<TimelineFilters>) => void;
  loadMore: () => void;
  refresh: () => void;
}

export function useTimeline(patientId: string): UseTimelineReturn {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TimelineFilters>({
    eventTypes: ['lab_result', 'visit', 'supplement_start', 'supplement_stop',
                 'supplement_dose_change', 'symptom_log', 'protocol_milestone', 'ai_insight'],
    bodySystems: [],
    dateFrom: null,
    dateTo: null,
    zoom: 'quarter',
  });

  const fetchEvents = useCallback(async (
    currentFilters: TimelineFilters,
    currentCursor: string | null,
    append: boolean
  ) => {
    const params = new URLSearchParams();
    if (currentCursor) params.set('cursor', currentCursor);
    params.set('limit', '20');
    if (currentFilters.eventTypes.length > 0) {
      params.set('event_types', currentFilters.eventTypes.join(','));
    }
    if (currentFilters.bodySystems.length > 0) {
      params.set('body_systems', currentFilters.bodySystems.join(','));
    }
    if (currentFilters.dateFrom) params.set('date_from', currentFilters.dateFrom);
    if (currentFilters.dateTo) params.set('date_to', currentFilters.dateTo);
    params.set('zoom', currentFilters.zoom);

    try {
      const res = await fetch(`/api/patients/${patientId}/timeline?${params}`);
      if (!res.ok) throw new Error('Failed to load timeline');
      const data = await res.json();

      if (append) {
        setEvents(prev => [...prev, ...data.events]);
      } else {
        setEvents(data.events);
      }
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    }
  }, [patientId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchEvents(filters, null, false).finally(() => setIsLoading(false));
  }, [filters, fetchEvents]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    fetchEvents(filters, cursor, true).finally(() => setIsLoadingMore(false));
  }, [hasMore, isLoadingMore, cursor, filters, fetchEvents]);

  const setFilters = useCallback((partial: Partial<TimelineFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
    setCursor(null);  // Reset pagination on filter change
  }, []);

  const refresh = useCallback(() => {
    setCursor(null);
    fetchEvents(filters, null, false);
  }, [filters, fetchEvents]);

  return { events, isLoading, isLoadingMore, error, hasMore, totalCount,
           filters, setFilters, loadMore, refresh };
}
```

```typescript
// src/hooks/use-biomarker-overlay.ts
// Hook for biomarker overlay chart data

export interface UseBiomarkerOverlayReturn {
  selectedBiomarkers: string[];
  addBiomarker: (code: string) => void;
  removeBiomarker: (code: string) => void;
  overlayData: BiomarkerOverlayResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useBiomarkerOverlay(
  patientId: string,
  dateFrom?: string,
  dateTo?: string
): UseBiomarkerOverlayReturn {
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<string[]>([]);
  const [overlayData, setOverlayData] = useState<BiomarkerOverlayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBiomarkers.length === 0) {
      setOverlayData(null);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      biomarker_codes: selectedBiomarkers.join(','),
      include_context_markers: 'true',
    });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    fetch(`/api/patients/${patientId}/timeline/biomarker-overlay?${params}`)
      .then(res => res.json())
      .then(data => {
        setOverlayData(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load biomarker overlay data');
        setIsLoading(false);
      });
  }, [patientId, selectedBiomarkers, dateFrom, dateTo]);

  const addBiomarker = useCallback((code: string) => {
    setSelectedBiomarkers(prev => {
      if (prev.length >= 3) return prev;  // Max 3 biomarkers
      if (prev.includes(code)) return prev;
      return [...prev, code];
    });
  }, []);

  const removeBiomarker = useCallback((code: string) => {
    setSelectedBiomarkers(prev => prev.filter(b => b !== code));
  }, []);

  return { selectedBiomarkers, addBiomarker, removeBiomarker,
           overlayData, isLoading, error };
}
```

```typescript
// src/hooks/use-timeline-narrative.ts
// Hook for AI narrative generation with SSE streaming

export function useTimelineNarrative(patientId: string) {
  const [narrative, setNarrative] = useState<string>('');
  const [patientNarrative, setPatientNarrative] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateNarrative = useCallback(async (
    scope: string,
    customPrompt?: string,
    forceRefresh = false
  ) => {
    // Abort any in-progress stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsStreaming(true);
    setNarrative('');
    setPatientNarrative('');

    try {
      const res = await fetch(`/api/patients/${patientId}/timeline/narrative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          scope,
          custom_prompt: customPrompt || null,
          force_refresh: forceRefresh,
          include_patient_version: true,
        }),
        signal: abortRef.current.signal,
      });

      // If cached, return JSON directly
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await res.json();
        setNarrative(data.provider_narrative);
        setPatientNarrative(data.patient_narrative || '');
        setNarrativeId(data.narrative_id);
        setIsStreaming(false);
        return;
      }

      // Otherwise, stream SSE (reuses existing SSE pattern from use-visit-stream.ts)
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Parse SSE events
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              setNarrative(prev => prev + data.content);
            } else if (data.type === 'patient_text') {
              setPatientNarrative(prev => prev + data.content);
            } else if (data.type === 'complete') {
              setNarrativeId(data.narrative_id);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Narrative generation failed:', err);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [patientId]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { narrative, patientNarrative, isStreaming, narrativeId,
           generateNarrative, cancelStream };
}
```

#### 24.7.3 Biomarker Overlay Chart (Recharts Configuration)

The overlay chart extends the existing `BiomarkerTimeline` component from `src/components/labs/biomarker-timeline.tsx` with multi-biomarker support and context markers:

```typescript
// src/components/timeline/biomarker-overlay-chart.tsx

"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Color palette for multi-biomarker overlay (max 3)
const BIOMARKER_COLORS = [
  "var(--color-brand-600)",      // Primary biomarker
  "oklch(0.55 0.15 270)",       // Second biomarker (purple)
  "oklch(0.55 0.12 30)",        // Third biomarker (amber)
];

const RANGE_FILLS = {
  functional: [
    "var(--color-brand-200)",
    "oklch(0.87 0.04 270)",
    "oklch(0.87 0.04 30)",
  ],
  conventional: [
    "var(--color-biomarker-normal)",
    "oklch(0.90 0.02 270)",
    "oklch(0.90 0.02 30)",
  ],
};

const CONTEXT_MARKER_STYLES: Record<string, { color: string; strokeDasharray: string }> = {
  supplement_start: { color: "oklch(0.55 0.15 145)", strokeDasharray: "4 4" },  // Green
  supplement_stop:  { color: "oklch(0.55 0.15 25)", strokeDasharray: "4 4" },   // Red
  visit:           { color: "var(--color-text-muted)", strokeDasharray: "8 4" },
  protocol_milestone: { color: "oklch(0.55 0.15 270)", strokeDasharray: "2 2" },
};

interface BiomarkerOverlayChartProps {
  data: BiomarkerOverlayResponse;
  onDataPointClick?: (biomarkerCode: string, labReportId: string) => void;
}

export function BiomarkerOverlayChart({ data, onDataPointClick }: BiomarkerOverlayChartProps) {
  // Merge all biomarker data points into a unified timeline
  const mergedData = mergeDataPoints(data.biomarkers);
  const biomarkerCount = data.biomarkers.length;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Chart header with statistics */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="space-y-1">
          {data.biomarkers.map((bm, idx) => (
            <div key={bm.biomarker_code} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: BIOMARKER_COLORS[idx] }}
              />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {bm.biomarker_name}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({bm.unit})
              </span>
              {bm.statistics?.trend_direction && (
                <span className={`text-xs font-medium ${
                  bm.statistics.trend_direction === 'improving'
                    ? 'text-[var(--color-biomarker-optimal)]'
                    : bm.statistics.trend_direction === 'worsening'
                    ? 'text-[var(--color-biomarker-out-of-range)]'
                    : 'text-[var(--color-text-muted)]'
                }`}>
                  {bm.statistics.trend_direction === 'improving' ? 'Improving' :
                   bm.statistics.trend_direction === 'worsening' ? 'Worsening' : 'Stable'}
                  {bm.statistics.avg_rate_of_change_per_month != null &&
                    ` (${bm.statistics.avg_rate_of_change_per_month > 0 ? '+' : ''}${
                      bm.statistics.avg_rate_of_change_per_month.toFixed(1)
                    }/mo)`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={mergedData}
          margin={{ top: 10, right: biomarkerCount > 1 ? 60 : 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-light)"
          />

          {/* Reference areas for each biomarker's ranges */}
          {data.biomarkers.map((bm, idx) => (
            <React.Fragment key={`ranges-${bm.biomarker_code}`}>
              {/* Conventional range (lighter) */}
              {bm.conventional_low != null && bm.conventional_high != null && idx === 0 && (
                <ReferenceArea
                  y1={bm.conventional_low}
                  y2={bm.conventional_high}
                  yAxisId={`y-${idx}`}
                  fill={RANGE_FILLS.conventional[idx]}
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
              )}
              {/* Functional range (stronger) */}
              {bm.functional_low != null && bm.functional_high != null && idx === 0 && (
                <ReferenceArea
                  y1={bm.functional_low}
                  y2={bm.functional_high}
                  yAxisId={`y-${idx}`}
                  fill={RANGE_FILLS.functional[idx]}
                  fillOpacity={0.2}
                  strokeOpacity={0}
                />
              )}
            </React.Fragment>
          ))}

          {/* Context markers (supplement starts, visits) */}
          {data.context_markers.map((marker, idx) => (
            <ReferenceLine
              key={`marker-${idx}`}
              x={marker.date}
              stroke={CONTEXT_MARKER_STYLES[marker.type]?.color || "var(--color-text-muted)"}
              strokeDasharray={CONTEXT_MARKER_STYLES[marker.type]?.strokeDasharray || "4 4"}
              strokeWidth={1.5}
              label={{
                value: marker.label,
                position: 'top',
                fill: 'var(--color-text-muted)',
                fontSize: 9,
                offset: 10,
              }}
            />
          ))}

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            tickFormatter={(date) =>
              new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              })
            }
          />

          {/* Primary Y-axis (left) */}
          <YAxis
            yAxisId="y-0"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            domain={['auto', 'auto']}
            width={50}
          />

          {/* Secondary Y-axis (right) for second biomarker */}
          {biomarkerCount > 1 && (
            <YAxis
              yAxisId="y-1"
              orientation="right"
              tick={{ fontSize: 11, fill: BIOMARKER_COLORS[1] }}
              axisLine={{ stroke: BIOMARKER_COLORS[1] }}
              tickLine={false}
              domain={['auto', 'auto']}
              width={50}
            />
          )}

          <Tooltip content={<OverlayTooltip biomarkers={data.biomarkers} />} />

          {/* Biomarker trend lines */}
          {data.biomarkers.map((bm, idx) => (
            <Line
              key={bm.biomarker_code}
              type="monotone"
              dataKey={`value_${bm.biomarker_code}`}
              yAxisId={`y-${Math.min(idx, 1)}`}
              stroke={BIOMARKER_COLORS[idx]}
              strokeWidth={2}
              dot={<BiomarkerDot color={BIOMARKER_COLORS[idx]} />}
              activeDot={{
                r: 7,
                strokeWidth: 2,
                stroke: BIOMARKER_COLORS[idx],
                fill: "var(--color-surface)",
              }}
              connectNulls
              name={bm.biomarker_name}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border-light)]">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
          Legend:
        </span>
        {data.biomarkers.length === 1 && (
          <>
            <LegendItem
              color="var(--color-brand-200)"
              opacity={0.4}
              label="Functional range"
              type="area"
            />
            <LegendItem
              color="var(--color-biomarker-normal)"
              opacity={0.15}
              label="Conventional range"
              type="area"
            />
          </>
        )}
        {Object.entries(CONTEXT_MARKER_STYLES).map(([type, style]) => (
          <LegendItem
            key={type}
            color={style.color}
            label={type.replace('_', ' ')}
            type="line"
            dasharray={style.strokeDasharray}
          />
        ))}
      </div>

      {/* Correlation callout */}
      {data.correlations?.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
            Correlations Detected
          </p>
          {data.correlations.map((corr, idx) => (
            <p key={idx} className="text-sm text-[var(--color-text-primary)]">
              <span className="font-medium">{corr.biomarker_a}</span>
              {corr.biomarker_b && (
                <> & <span className="font-medium">{corr.biomarker_b}</span></>
              )}
              : {corr.interpretation}
              <span className="text-xs text-[var(--color-text-muted)] ml-1">
                (r={corr.correlation_coefficient?.toFixed(2)})
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 24.8 Implementation Plan

The implementation is phased to deliver value incrementally and align with the existing roadmap from Section 23.

#### Phase 1: Timeline Foundation (Weeks 1-2)

| Task | Effort | Details |
|------|--------|---------|
| Create Migration 009 | 1 day | `timeline_events`, `timeline_narratives`, `timeline_annotations`, `biomarker_correlations` tables with RLS |
| Build timeline event insertion triggers | 1 day | Auto-insert events when lab reports complete and visits are created |
| Build `GET /api/patients/[id]/timeline` endpoint | 1 day | Cursor-based pagination, event type filtering, date range filtering |
| Build `useTimeline` hook | 0.5 day | Fetch, filter, paginate timeline events |
| Build `<TimelineEventStream>` component | 2 days | Event cards for lab results, visits, supplements. Date grouping. Reuse existing CSS variable patterns. |
| Build `<TimelineHeader>` with zoom controls | 0.5 day | Zoom selector, filter toggle |
| Add Timeline tab to patient detail page | 0.5 day | New route at `/dashboard/patients/[id]/timeline` |
| Add API route for manual event creation | 0.5 day | Protocol milestones, provider notes |
| **Phase 1 Total** | **~7 days** | |

#### Phase 2: Biomarker Overlay (Weeks 3-4)

| Task | Effort | Details |
|------|--------|---------|
| Build `GET /api/patients/[id]/timeline/biomarker-overlay` endpoint | 1 day | Multi-biomarker data, context markers, statistics |
| Build `useBiomarkerOverlay` hook | 0.5 day | Biomarker selection, data fetch, max-3 enforcement |
| Build `<BiomarkerOverlayChart>` component | 2 days | Recharts ComposedChart, dual Y-axis, ReferenceArea for ranges, ReferenceLine for context markers |
| Build `<BiomarkerSelector>` dropdown | 0.5 day | Grouped by category, shows data point count (reuses existing biomarker-timeline.tsx pattern) |
| Add rate-of-change and trend statistics | 1 day | Calculate in API, display in chart header |
| Wire overlay to timeline event clicks | 0.5 day | Clicking a lab event auto-adds biomarkers to the overlay |
| Build `<TrendStatistics>` component | 0.5 day | Avg rate of change, projected value, trend direction |
| **Phase 2 Total** | **~6 days** | |

#### Phase 3: AI Narrative Layer (Weeks 5-6)

| Task | Effort | Details |
|------|--------|---------|
| Build narrative system prompt templates | 1 day | Provider narrative, patient narrative, scope-specific prompts |
| Build context assembly pipeline | 1.5 days | Integrate with patient health memory (Section 21), timeline events, biomarker trends |
| Build `POST /api/patients/[id]/timeline/narrative` endpoint | 1 day | SSE streaming with `streamCompletion()`, caching in `timeline_narratives` |
| Build `useTimelineNarrative` hook | 0.5 day | SSE streaming, abort support (follows `use-visit-stream.ts` pattern) |
| Build `<NarrativeSummaryDrawer>` component | 1.5 days | Scope selector, streaming markdown renderer, publish toggle |
| Build narrative publish workflow | 0.5 day | Provider edits, publishes to patient portal |
| Build narrative staleness invalidation | 0.5 day | Mark narratives stale when new data arrives (trigger-based) |
| **Phase 3 Total** | **~7 days** | |

#### Phase 4: Intelligence Enhancements (Weeks 7-8)

| Task | Effort | Details |
|------|--------|---------|
| Build AI correlation detection pipeline | 2 days | Batch process after new data, store in `biomarker_correlations` |
| Build `<AIInsightEvent>` timeline cards | 1 day | Display AI insights inline in the timeline |
| Build timeline annotation system | 1 day | Provider notes on events, AI-generated annotations |
| Build PDF export | 1 day | Print-optimized CSS, current view export |
| Build patient portal timeline view | 2 days | Read-only, plain language, mobile-first at `/portal/timeline` |
| Accessibility audit and remediation | 1 day | Keyboard navigation, screen reader, ARIA labels, data table alternatives for charts |
| **Phase 4 Total** | **~8 days** | |

**Total Estimated Effort: ~28 days (5-6 developer-weeks)**

#### Roadmap Alignment

This maps to the existing Section 23 roadmap as follows:

- **Phase 1 (Timeline Foundation)** aligns with the Health Memory foundation work in Weeks 5-8.
- **Phase 2 (Biomarker Overlay)** extends the existing biomarker timeline (Sprint 8) with multi-biomarker and context marker support.
- **Phase 3 (AI Narrative)** builds on the Health Memory expansion in Weeks 9-12.
- **Phase 4 (Intelligence)** aligns with the Symptom-Biomarker Correlation AI work in Weeks 13+.

---

### 24.9 Technical Considerations

#### 24.9.1 Performance

**Large Dataset Handling:**
- Timeline events use cursor-based pagination (consistent with existing Apothecare pattern), not offset pagination.
- Events are loaded in batches of 20, with an intersection observer triggering `loadMore()`.
- Biomarker overlay queries are limited to the visible date range to avoid loading years of data.
- The `timeline_events` table is a denormalized projection -- no JOINs needed for rendering the event stream.

**Virtualization:**
- For patients with 100+ timeline events, use `react-window` or `@tanstack/react-virtual` to virtualize the event list.
- Only render events visible in the viewport, plus a buffer of 5 events above and below.

**Caching:**
- Timeline narratives are cached in `timeline_narratives` and served from cache when `is_stale = false`.
- Biomarker overlay responses are cached client-side in the hook state.
- The `timeline_events` table has composite indexes for all common query patterns.

**Query Performance:**
- The primary timeline query (`patient_id + event_date DESC + event_type`) uses the composite index `idx_timeline_events_patient_date`.
- The biomarker overlay query joins `biomarker_results` with `biomarker_references` -- both indexed on `biomarker_code`.
- For patients with >500 events, pagination ensures no query returns more than 50 rows.

**Target Performance Metrics:**
| Operation | Target | Method |
|-----------|--------|--------|
| Initial timeline load | < 800ms | Cursor pagination, denormalized events |
| Load more events | < 400ms | Cursor pagination, append |
| Biomarker overlay load | < 600ms | Indexed query, limited date range |
| AI narrative (cached) | < 200ms | Direct table lookup |
| AI narrative (fresh) | 3-8 seconds | Streaming SSE, user sees progressive content |
| Filter toggle | < 100ms | Client-side filter (no new network request for event_type filters) |

#### 24.9.2 Real-Time Updates

When new data arrives (lab report uploaded, visit created), the timeline should reflect it:

1. **Trigger-based event insertion** (database layer) ensures `timeline_events` stays current.
2. **Supabase Realtime** subscription on `timeline_events` table notifies connected clients:

```typescript
// In the useTimeline hook
useEffect(() => {
  const channel = supabase
    .channel(`timeline-${patientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'timeline_events',
        filter: `patient_id=eq.${patientId}`,
      },
      (payload) => {
        // Prepend new event to the timeline
        setEvents(prev => [payload.new as TimelineEvent, ...prev]);
        setTotalCount(prev => prev + 1);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [patientId]);
```

3. **Narrative invalidation** is handled by the trigger on source tables that sets `is_stale = true`.

#### 24.9.3 Accessibility (WCAG 2.1 AA)

Per Section 18 requirements (mandatory by May 2026):

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | All timeline events are focusable with Tab. Enter/Space expands event details. Arrow keys navigate between events. Biomarker selector is keyboard-operable. |
| **Screen reader** | Each event card has `role="article"` with `aria-label` describing the event type and date. The biomarker chart has a visually hidden data table alternative (`<table>` with `sr-only` class). |
| **Color contrast** | All event type icons use the existing `--color-brand-*` palette verified at 4.5:1 minimum. Biomarker flags use distinct patterns (not just color) for accessibility. |
| **Focus indicators** | Visible focus outlines on all interactive elements. Custom focus ring: `outline: 2px solid var(--color-brand-400); outline-offset: 2px`. |
| **Text alternatives** | Chart data is available as a downloadable CSV. AI narratives provide a text alternative to the visual timeline. |
| **Motion reduction** | Respect `prefers-reduced-motion`. Disable chart animations and timeline scroll animations when enabled. |
| **Touch targets** | All clickable elements are at least 44x44px on mobile. |

**Data Table Alternative for Charts:**

```typescript
// Visually hidden but accessible table for screen readers
<table className="sr-only" role="table" aria-label="Biomarker trend data">
  <caption>{biomarkerName} values over time</caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Value ({unit})</th>
      <th scope="col">Status</th>
      <th scope="col">Change from previous</th>
    </tr>
  </thead>
  <tbody>
    {dataPoints.map(dp => (
      <tr key={dp.date}>
        <td>{formatDate(dp.date)}</td>
        <td>{dp.value} {unit}</td>
        <td>{dp.flag}</td>
        <td>{dp.change_pct ? `${dp.change_pct}%` : 'N/A'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

#### 24.9.4 Security and HIPAA

- All timeline API routes follow the existing pattern: CSRF (`validateCsrf`) -> auth -> rate limit (`checkRateLimit`) -> Zod validate -> business logic -> audit log.
- The `timeline_events` table has RLS policies scoped to the practitioner's patients.
- Patient portal access requires a separate RLS policy (commented out in the schema above, to be enabled when patient auth is implemented per Section 20).
- All AI narrative generation is logged via `auditLog()` with `action: 'generate'` and `resourceType: 'timeline_narrative'`.
- Published narratives visible to patients are logged as `action: 'export'`.
- Timeline event data is denormalized PHI -- the same HIPAA protections that apply to the source tables apply here.

---

### 24.10 Edge Cases

#### 24.10.1 New Patients with Minimal Data

**Scenario:** A newly created patient with 0-1 lab reports and no visit history.

**Handling:**
- The timeline displays an encouraging empty state: "Your health timeline will build as your provider adds lab results, visit notes, and protocols."
- The biomarker overlay is hidden when no biomarker data exists (consistent with existing `BiomarkerTimeline` component behavior).
- The AI Summary button is disabled with a tooltip: "Need at least 2 data points to generate a health summary."
- If a single lab result exists, show it as the first event with an annotation: "Starting point -- your baseline values."

#### 24.10.2 Data Gaps

**Scenario:** Patient has labs from 2024, no data for 6 months, then labs from 2025.

**Handling:**
- The timeline shows a visual gap indicator: a dashed line between the last event before the gap and the first event after.
- AI narratives explicitly note gaps: "No data available between June and December 2024."
- Biomarker trend lines use `connectNulls` in Recharts so the trend is still visible, but the gap is noted in the tooltip.
- Rate-of-change calculations include the gap duration in their denominator to avoid inflated velocity calculations.

#### 24.10.3 Conflicting Information

**Scenario:** A patient's supplement list says "Taking Selenium 200mcg" but their self-reported supplement change says "Stopped Selenium 2 weeks ago" (pending provider review).

**Handling:**
- Both events appear on the timeline with distinct visual treatment:
  - The prescribed supplement shows with a "prescribed" badge.
  - The patient-reported change shows with a "patient-reported, pending review" badge.
- The AI narrative includes both perspectives: "Selenium 200mcg was prescribed on Oct 15. Patient reported stopping on Feb 5 (pending provider confirmation)."
- The biomarker overlay context markers show the prescribed start date. The patient-reported stop is shown as a different marker style (dashed vs solid) until the provider confirms.

#### 24.10.4 Very Long Patient Histories

**Scenario:** A patient with 5+ years of data, 200+ timeline events, 50+ lab reports.

**Handling:**
- Default zoom is "Quarter" showing the most recent 3 months of events.
- Cursor-based pagination loads events on demand (no loading of the full history).
- AI narratives are scoped by body system -- the full-journey narrative uses progressive summarization (older periods get shorter summaries, recent periods get more detail).
- The biomarker overlay limits the date range to the visible zoom window by default, with an option to "show all history."
- Consider implementing timeline event aggregation at the Year zoom level: instead of showing 50 individual symptom log entries from 2024, show "2024: 156 symptom logs. Average energy: 3.5, Sleep: 3.2, Digestion: 3.8."

#### 24.10.5 Multiple Biomarkers with Different Scales

**Scenario:** Provider overlays TSH (range 0.45-4.5 mIU/L) and Vitamin D (range 30-100 ng/mL) on the same chart.

**Handling:**
- First biomarker uses the left Y-axis.
- Second biomarker uses the right Y-axis with its own scale.
- Both axes are labeled with the unit.
- The functional range band is only shown for the primary (left-axis) biomarker to avoid visual clutter.
- If a third biomarker is added, all three are normalized to a 0-100% scale (percentage of functional range), with a toggle to switch back to absolute values.

#### 24.10.6 Wearable Data Density

**Scenario:** Patient has an Oura Ring syncing daily data -- 365 data points per year.

**Handling:**
- Wearable data is NOT inserted as individual daily events in `timeline_events`. Instead, weekly summaries are inserted.
- At Day/Week zoom, individual daily data can be fetched on demand from the `wearable_data` table.
- At Month/Quarter/Year zoom, the weekly summary events are displayed.
- AI narratives reference wearable trends at the weekly/monthly level, not daily granularity.

---

### 24.11 Success Metrics

#### 24.11.1 Feature Adoption Metrics

| Metric | Target (3 months post-launch) | Measurement |
|--------|-------------------------------|-------------|
| Timeline tab visits / active practitioner / week | 5+ | Analytics event on tab navigation |
| Biomarker overlay interactions / practitioner / month | 10+ | Analytics event on biomarker selection |
| AI narratives generated / practitioner / month | 4+ (1 per patient visit prep) | Count of `timeline_narratives` rows |
| Narratives published to patients | 30%+ of generated narratives | `published_to_patient = true` count |
| Patient portal timeline views / active patient / month | 3+ | Analytics event on `/portal/timeline` |
| Avg time on timeline page (practitioners) | 3+ minutes | Session analytics |

#### 24.11.2 Clinical Outcome Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Provider satisfaction with visit prep efficiency | 80%+ report "faster" | In-app survey after 30 days of usage |
| Correlation insights acted upon | 40%+ of flagged correlations lead to protocol adjustments | Track timeline annotations + subsequent protocol changes |
| Patient engagement with timeline narratives | 50%+ of patients open published narratives | Portal analytics |
| Reduction in "tell me what happened last time" questions | Practitioners report 50%+ reduction | Qualitative survey |

#### 24.11.3 Technical Health Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Timeline page load time (p95) | < 1.2 seconds | Server-side performance monitoring |
| Biomarker overlay load time (p95) | < 800ms | Client-side performance monitoring |
| AI narrative generation time (median) | < 5 seconds for scoped, < 10 seconds for full | Server-side timing |
| Timeline event insertion lag (from source data to timeline) | < 2 seconds | Database trigger latency |
| Cache hit rate for narratives | 60%+ | `is_stale = false` percentage on reads |
| Zero data loss on timeline event insertion failures | 100% | Dead letter queue + alerting on trigger failures |

---

### 24.12 Clinical Scenarios

These scenarios demonstrate the Unified Timeline's value in real functional medicine workflows.

#### Scenario 1: Thyroid Optimization Journey

**Patient:** Sarah, 38F, presenting with fatigue, cold intolerance, weight gain.

**Timeline tells this story:**

```
Mar 2025: [Visit] Initial consult. CC: fatigue, cold intolerance.
          [Lab] TSH 4.8 (functional HIGH), Free T3 2.5 (functional LOW),
                TPO Ab 45 (elevated).
          AI INSIGHT: "Pattern consistent with subclinical hypothyroidism
          with autoimmune component."

Jun 2025: [Lab] TSH 4.2 (-12.5%). Free T3 2.8. TPO Ab 40.
          [Symptom] Energy avg 3.0 (baseline).

Oct 2025: [Supplement] Started selenium 200mcg + zinc 30mg.
          [Visit] Follow-up. Plan: address autoimmune trigger.

Dec 2025: [Symptom] Energy avg 3.5 (+17%). Sleep quality improving.
          [Wearable] HRV +15% from baseline. Deep sleep 12% -> 16%.

Feb 2026: [Lab] TSH 2.8 (-33% from initial). Free T3 3.2 (+28%).
                TPO Ab 28 (-38%).
          [Visit] Follow-up. Assessment: "Excellent response to protocol."
          AI INSIGHT: "TSH normalized to functional optimal range. TPO
          antibodies declining, suggesting reduced autoimmune activity.
          Energy scores correlate with thyroid improvement (r=0.78)."
```

**Biomarker Overlay:** TSH and Free T3 plotted with selenium start date as a context marker. The inverse trend (TSH down, T3 up) is visually striking. The correlation callout confirms: "TSH and Free T3: r=-0.82 (strong inverse, expected improvement pattern)."

**AI Narrative (scoped to thyroid):** "Sarah's thyroid markers have shown progressive improvement over 11 months. TSH decreased from 4.8 to 2.8 mIU/L (42% reduction), entering the functional optimal range. Free T3 increased from 2.5 to 3.2 pg/mL (28% increase), indicating improved T4-to-T3 conversion. TPO antibodies declined 38% (45 to 28 IU/mL), suggesting reduced autoimmune thyroid activity. This improvement trajectory began approximately 8 weeks after initiating selenium 200mcg and zinc 30mg, consistent with literature on selenium's role in thyroid peroxidase function. Energy symptom scores improved 17% (3.0 to 3.5/5), correlating with the thyroid marker improvements (r=0.78). Wearable data from her Oura Ring confirms physiological improvement: HRV increased 15% and deep sleep percentage improved from 12% to 16% during the treatment period."

#### Scenario 2: Gut Healing Protocol

**Patient:** Mark, 45M, presenting with bloating, irregular bowels, food sensitivities.

**Timeline events span 8 months of a GI reset protocol:**
- Initial GI-MAP results (elevated calprotectin, dysbiotic flora)
- Elimination diet start
- L-glutamine and probiotic supplementation start
- Weekly symptom scores showing gradual GI improvement
- Follow-up GI-MAP showing normalized calprotectin
- Gluten reintroduction challenge (with symptom flare documented)
- Dairy reintroduction (tolerated)
- Protocol milestone: "GI Reset Complete - Maintenance Phase"

**Biomarker Overlay:** Calprotectin and zonulin plotted with supplement start dates and elimination diet start as context markers. Both markers trend down over the protocol period.

**Patient-Facing Narrative:** "Your gut health has improved significantly since starting the protocol in June 2025. The inflammation markers in your gut tests have dropped by more than half. Your daily symptom scores show your digestion has improved from a 2.1 out of 5 to a 4.2 out of 5. The elimination diet and supplements your provider prescribed are working well. We found that gluten continues to cause symptoms for you, while dairy seems to be fine. Your provider will discuss the next steps for maintaining these improvements."

#### Scenario 3: Metabolic Health - Early Insulin Resistance Detection

**Patient:** Lisa, 52F. Routine labs show a concerning metabolic trend invisible in any single lab report.

**Timeline reveals the pattern across 18 months:**

```
Jan 2025: Fasting insulin 5.2 (functional optimal)
          HbA1c 5.0% (optimal)
          hs-CRP 0.8 (optimal)

Jul 2025: Fasting insulin 7.1 (+37% from Jan)
          HbA1c 5.2% (still optimal)
          hs-CRP 1.2 (+50%)
          AI INSIGHT: "Fasting insulin trajectory suggests early
          insulin resistance. HbA1c has not yet reflected this change,
          which is expected -- insulin rises years before glucose
          dysregulates."

Jan 2026: Fasting insulin 8.4 (+18% from Jul, +62% from baseline)
          HbA1c 5.3%
          hs-CRP 1.5
          AI INSIGHT: "FLAGGED: Fasting insulin has exceeded functional
          optimal range (< 5.0). Linear projection suggests continued
          increase. Combined with rising hs-CRP, this pattern is
          consistent with early metabolic syndrome. Recommend dietary
          intervention and exercise protocol."
```

**Biomarker Overlay:** Fasting insulin and hs-CRP plotted together. Both show upward trends. The correlation callout: "Fasting insulin and hs-CRP: r=0.91 (strong positive correlation, consistent with systemic metabolic inflammation)."

This pattern would be invisible in conventional medicine (all values are within conventional reference ranges) and even difficult to spot in functional medicine without the longitudinal view. The Unified Timeline makes it obvious.

---

### 24.13 Relationship to AI Health Memory (Section 21)

The Unified Patient Health Timeline is the **visualization and interaction layer** for the AI Patient Health Memory described in Section 21. Their relationship:

| Section 21 (Health Memory) | Section 24 (Unified Timeline) |
|----------------------------|-------------------------------|
| `patient_health_embeddings` table stores vectorized patient data | `timeline_events` table stores denormalized, display-ready events |
| `search_patient_health_memory()` retrieves relevant context for AI | Timeline API queries `timeline_events` for display, uses health memory for AI narratives |
| Episodic memory (raw events) | Visual representation of those episodes as timeline cards |
| Semantic memory (derived insights) | AI insight cards displayed inline in the timeline |
| Procedural memory (treatment patterns) | Treatment response annotations on supplement/lab events |
| Memory consolidation pipeline | Narrative generation (consolidates episodes into readable narrative) |
| `patient_snapshots` cache | "Current Status" section at the top of generated narratives |

The Health Memory is the engine; the Timeline is the dashboard. Building the Timeline first provides immediate visual value while the Health Memory infrastructure is built incrementally behind it. Phase 1 of the Timeline works without Health Memory (just denormalized events from existing tables). Phases 3-4 integrate with Health Memory for AI-powered narratives and correlation detection.

---

### 24.14 Relationship to Prioritized Features (Section 23)

The Unified Timeline directly supports or enables multiple Tier 1 and Tier 2 features from Section 23:

| Section 23 Feature | How the Timeline Supports It |
|--------------------|------------------------------|
| **Tier 1: AI Lab Explanations** | Lab events on the timeline can include the AI explanation inline. Patient portal timeline shows plain-language explanations. |
| **Tier 1: Longitudinal AI Health Memory** | Timeline is the visual interface for health memory data. Narratives are the readable output of memory retrieval. |
| **Tier 2: Symptom-Biomarker Correlation** | Biomarker overlay with symptom trend data. AI correlation detection. Both visualized on the same timeline. |
| **Tier 2: Patient AI Chat** | Patient can ask "Tell me about my thyroid progress" and the AI can generate a response using timeline data and health memory. |
| **Tier 2: Smart Supplement Adherence** | Supplement start/stop/change events appear on the timeline. Adherence data informs correlation detection. |
| **Tier 3: Wearable Integration** | Wearable summary events on the timeline. Wearable data points as context markers on biomarker overlays. |
| **Tier 3: Fullscript Integration** | Supplement orders and refill events appear on the timeline. |

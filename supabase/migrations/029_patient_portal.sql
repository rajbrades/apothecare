-- ===========================================
-- MIGRATION 029: Patient Portal Foundation
-- ===========================================
-- Adds patient-facing portal infrastructure:
--   - portal_slug on practitioners
--   - auth_user_id + portal_status on patients
--   - is_shared_with_patient flags on lab_reports + visits
--   - patient_invites table
--   - consent_templates + patient_consent_signatures
--   - intake_form_templates + patient_intake_submissions
--   - Patient RLS policies
--   - Audit action enum additions
-- ===========================================

-- -----------------------------------------------
-- 1. PRACTITIONER: portal_slug
-- -----------------------------------------------
ALTER TABLE practitioners
  ADD COLUMN IF NOT EXISTS portal_slug TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_practitioners_portal_slug
  ON practitioners (portal_slug)
  WHERE portal_slug IS NOT NULL;

-- -----------------------------------------------
-- 2. PATIENTS: portal columns
-- -----------------------------------------------
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_status TEXT DEFAULT 'not_invited'
    CHECK (portal_status IN ('not_invited', 'invited', 'active', 'disabled'));

CREATE INDEX IF NOT EXISTS idx_patients_auth_user ON patients (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- -----------------------------------------------
-- 3. LAB REPORTS: sharing flag
-- -----------------------------------------------
ALTER TABLE lab_reports
  ADD COLUMN IF NOT EXISTS is_shared_with_patient BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lab_reports_shared
  ON lab_reports (patient_id, is_shared_with_patient)
  WHERE is_shared_with_patient = true;

-- -----------------------------------------------
-- 4. VISITS: sharing flag
-- -----------------------------------------------
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS is_shared_with_patient BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_visits_shared
  ON visits (patient_id, is_shared_with_patient)
  WHERE is_shared_with_patient = true;

-- -----------------------------------------------
-- 5. PATIENT INVITES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS patient_invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  token_hash      TEXT NOT NULL,  -- SHA-256 of raw token; raw token never stored
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_invites_token_hash
  ON patient_invites (token_hash);

CREATE INDEX IF NOT EXISTS idx_patient_invites_patient_status
  ON patient_invites (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_patient_invites_practitioner_status
  ON patient_invites (practitioner_id, status, created_at DESC);

-- -----------------------------------------------
-- 6. CONSENT TEMPLATES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS consent_templates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id  UUID REFERENCES practitioners(id) ON DELETE CASCADE,
  -- NULL = platform default visible to all practitioners
  document_type    TEXT NOT NULL,  -- 'hipaa_notice', 'treatment_consent', etc.
  version          INTEGER NOT NULL DEFAULT 1,
  title            TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  is_required      BOOLEAN NOT NULL DEFAULT true,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_templates_practitioner
  ON consent_templates (practitioner_id, is_active);

-- -----------------------------------------------
-- 7. PATIENT CONSENT SIGNATURES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS patient_consent_signatures (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id      UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consent_template_id  UUID NOT NULL REFERENCES consent_templates(id),
  template_version     INTEGER NOT NULL,
  signed_name          TEXT NOT NULL,       -- typed legal name
  signature_method     TEXT NOT NULL DEFAULT 'typed_ack',
  signed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address           INET,
  user_agent           TEXT,
  artifact_storage_path TEXT,               -- path to immutable signed snapshot
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_signatures_patient
  ON patient_consent_signatures (patient_id, consent_template_id);

CREATE INDEX IF NOT EXISTS idx_consent_signatures_practitioner
  ON patient_consent_signatures (practitioner_id, patient_id);

-- -----------------------------------------------
-- 8. INTAKE FORM TEMPLATES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS intake_form_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
  -- NULL = global default
  version         INTEGER NOT NULL DEFAULT 1,
  title           TEXT NOT NULL,
  schema_json     JSONB NOT NULL DEFAULT '[]',
  -- array of { key, label, type, required, options?, maps_to? }
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 9. PATIENT INTAKE SUBMISSIONS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS patient_intake_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id     UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  template_id         UUID NOT NULL REFERENCES intake_form_templates(id),
  template_version    INTEGER NOT NULL,
  responses_json      JSONB NOT NULL DEFAULT '{}',
  mapped_fields_json  JSONB NOT NULL DEFAULT '{}',
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_patient
  ON patient_intake_submissions (patient_id, submitted_at DESC);

-- -----------------------------------------------
-- 10. AUDIT ACTION ADDITIONS
-- -----------------------------------------------
-- Extend the audit_action enum with portal-specific events
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invite_created';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invite_accepted';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invite_revoked';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invite_resent';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'consent_signed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'intake_submitted';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_view_lab';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_view_note';

-- -----------------------------------------------
-- 11. PATIENT RLS POLICIES
-- -----------------------------------------------

-- patients: patient can read own row
DROP POLICY IF EXISTS "patients_patient_select" ON patients;
CREATE POLICY "patients_patient_select" ON patients
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- lab_reports: patient can read own shared labs
DROP POLICY IF EXISTS "lab_reports_patient_select" ON lab_reports;
CREATE POLICY "lab_reports_patient_select" ON lab_reports
  FOR SELECT
  USING (
    is_shared_with_patient = true
    AND patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- visits: patient can read own shared visits
DROP POLICY IF EXISTS "visits_patient_select" ON visits;
CREATE POLICY "visits_patient_select" ON visits
  FOR SELECT
  USING (
    is_shared_with_patient = true
    AND patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- patient_invites: patient can read own invites
DROP POLICY IF EXISTS "patient_invites_patient_select" ON patient_invites;
CREATE POLICY "patient_invites_patient_select" ON patient_invites
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- patient_consent_signatures: patient can insert own
DROP POLICY IF EXISTS "consent_signatures_patient_insert" ON patient_consent_signatures;
CREATE POLICY "consent_signatures_patient_insert" ON patient_consent_signatures
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consent_signatures_patient_select" ON patient_consent_signatures;
CREATE POLICY "consent_signatures_patient_select" ON patient_consent_signatures
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- consent_templates: anyone can read active templates
DROP POLICY IF EXISTS "consent_templates_select" ON consent_templates;
CREATE POLICY "consent_templates_select" ON consent_templates
  FOR SELECT
  USING (is_active = true);

-- intake_form_templates: anyone can read active templates
DROP POLICY IF EXISTS "intake_templates_select" ON intake_form_templates;
CREATE POLICY "intake_templates_select" ON intake_form_templates
  FOR SELECT
  USING (is_active = true);

-- patient_intake_submissions: patient can insert + read own
DROP POLICY IF EXISTS "intake_submissions_patient_insert" ON patient_intake_submissions;
CREATE POLICY "intake_submissions_patient_insert" ON patient_intake_submissions
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "intake_submissions_patient_select" ON patient_intake_submissions;
CREATE POLICY "intake_submissions_patient_select" ON patient_intake_submissions
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 12. ENABLE RLS on new tables
-- -----------------------------------------------
ALTER TABLE patient_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_intake_submissions ENABLE ROW LEVEL SECURITY;

-- Provider policies for new tables
DROP POLICY IF EXISTS "patient_invites_practitioner" ON patient_invites;
CREATE POLICY "patient_invites_practitioner" ON patient_invites
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consent_templates_practitioner" ON consent_templates;
CREATE POLICY "consent_templates_practitioner" ON consent_templates
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    OR practitioner_id IS NULL  -- platform defaults readable by all
  );

DROP POLICY IF EXISTS "consent_signatures_practitioner" ON patient_consent_signatures;
CREATE POLICY "consent_signatures_practitioner" ON patient_consent_signatures
  FOR SELECT
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "intake_templates_practitioner" ON intake_form_templates;
CREATE POLICY "intake_templates_practitioner" ON intake_form_templates
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    OR practitioner_id IS NULL
  );

DROP POLICY IF EXISTS "intake_submissions_practitioner" ON patient_intake_submissions;
CREATE POLICY "intake_submissions_practitioner" ON patient_intake_submissions
  FOR SELECT
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- 13. SEED: Default intake form template
-- -----------------------------------------------
INSERT INTO intake_form_templates (id, practitioner_id, version, title, schema_json, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  1,
  'Standard Patient Intake',
  '[
    {"key":"chief_complaint","label":"Primary reason for your visit","type":"textarea","required":true,"maps_to":"chief_complaints"},
    {"key":"medical_history","label":"Significant medical history","type":"textarea","required":false,"maps_to":"medical_history"},
    {"key":"current_medications","label":"Current medications (name, dose, frequency)","type":"textarea","required":false,"maps_to":"current_medications"},
    {"key":"supplements","label":"Current supplements","type":"textarea","required":false,"maps_to":"supplements"},
    {"key":"allergies","label":"Known allergies","type":"text","required":false,"maps_to":"allergies"},
    {"key":"goals","label":"What are your health goals for this practice?","type":"textarea","required":false}
  ]',
  true
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 14. SEED: Default consent templates (platform-wide)
-- -----------------------------------------------
INSERT INTO consent_templates (practitioner_id, document_type, version, title, content_markdown, is_required, is_active)
VALUES
  (
    NULL,
    'hipaa_notice',
    1,
    'HIPAA Notice of Privacy Practices',
    E'## Notice of Privacy Practices\n\nThis notice describes how medical information about you may be used and disclosed and how you can get access to this information. **Please review it carefully.**\n\n### How We Use Your Health Information\n\nYour health information may be used and disclosed for treatment, payment, and healthcare operations. We are required by law to:\n\n- Maintain the privacy of your protected health information\n- Provide you with this notice of our legal duties and privacy practices\n- Notify you following a breach of your unsecured protected health information\n\n### Your Rights\n\nYou have the right to:\n- Inspect and copy your health information\n- Request amendments to your health information\n- Request restrictions on how we use or disclose your health information\n- Receive a list of disclosures of your health information\n- Revoke your authorization at any time\n\n### Contact\n\nIf you have questions or concerns, please contact your provider directly through this portal.',
    true,
    true
  ),
  (
    NULL,
    'treatment_consent',
    1,
    'Informed Consent for Telehealth Services',
    E'## Informed Consent for Telehealth Services\n\n### What is Telehealth?\n\nTelehealth involves the delivery of healthcare services using electronic communications, information technology, or other means between a healthcare practitioner and a patient who are not in the same physical location.\n\n### Benefits and Risks\n\n**Benefits** may include easier access to care, no travel requirement, and continuity of care.\n\n**Risks** may include technical failures, limitations of remote assessment, and the possibility that information transmitted could be intercepted.\n\n### My Rights\n\nBy signing below, I acknowledge that:\n\n1. I have been given the opportunity to ask questions about telehealth services\n2. I understand the risks and benefits described above\n3. My provider has my consent to provide telehealth services\n4. I may withdraw consent at any time by contacting my provider\n5. My health information may be shared with other treating providers as necessary for my care\n\n### Functional Medicine Context\n\nThis practice uses a functional medicine approach, which focuses on identifying root causes of conditions. Recommendations may include lifestyle modifications, nutritional interventions, and supplement protocols. These are intended to complement, not replace, conventional medical care.',
    true,
    true
  )
ON CONFLICT DO NOTHING;

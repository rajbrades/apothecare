-- ============================================================
-- 037: Structured Patient Medications
-- Mirrors patient_supplements with medication-specific fields
-- (name, dosage, frequency, route, prescriber, indication).
-- Replaces freeform patients.current_medications text field.
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Medication details
  name TEXT NOT NULL,
  dosage TEXT,                          -- e.g., "50mg", "10mg/mL"
  frequency TEXT,                       -- e.g., "1x daily", "BID", "PRN"
  route TEXT,                           -- e.g., "oral", "topical", "sublingual", "injection"
  form TEXT,                            -- e.g., "tablet", "capsule", "cream", "liquid"
  prescriber TEXT,                      -- e.g., "Dr. Smith" (if prescribed by another provider)
  indication TEXT,                      -- e.g., "hypothyroidism", "hypertension"

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'discontinued', 'as_needed')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'patient_reported', 'document_extracted')),

  -- Dates
  started_at TIMESTAMPTZ,
  discontinued_at TIMESTAMPTZ,

  -- Notes & ordering
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_medications_patient
  ON patient_medications (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_patient_medications_practitioner
  ON patient_medications (practitioner_id);

ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_medications_practitioner"
  ON patient_medications FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

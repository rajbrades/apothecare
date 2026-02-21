-- Migration 010: Patient Supplements
-- Structured supplement management replacing freeform patients.supplements text field
-- Supports per-supplement tracking with dosage, frequency, timing, status, and provenance

-- ── Enums ─────────────────────────────────────────────────────────────

CREATE TYPE patient_supplement_status AS ENUM ('active', 'discontinued', 'pending_patient');
CREATE TYPE patient_supplement_source AS ENUM ('manual', 'review', 'patient_reported');

-- ── Table ─────────────────────────────────────────────────────────────

CREATE TABLE patient_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Supplement details
  name TEXT NOT NULL,
  dosage TEXT,                          -- e.g., "400mg", "5000 IU"
  form TEXT,                            -- e.g., "capsule", "liquid", "softgel"
  frequency TEXT,                       -- e.g., "1x daily", "2x daily"
  timing TEXT,                          -- e.g., "with breakfast", "before bed"
  brand TEXT,                           -- recommended brand

  -- Status tracking
  status patient_supplement_status NOT NULL DEFAULT 'active',
  source patient_supplement_source NOT NULL DEFAULT 'manual',
  review_id UUID REFERENCES supplement_reviews(id) ON DELETE SET NULL,

  -- Dates
  started_at TIMESTAMPTZ,
  discontinued_at TIMESTAMPTZ,

  -- Notes & ordering
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────

-- Primary query: active supplements for a patient, ordered
CREATE INDEX idx_patient_supplements_active
  ON patient_supplements (patient_id, status, sort_order);

-- RLS ownership check
CREATE INDEX idx_patient_supplements_practitioner
  ON patient_supplements (practitioner_id, patient_id);

-- Provenance: which review generated this
CREATE INDEX idx_patient_supplements_review
  ON patient_supplements (review_id)
  WHERE review_id IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE patient_supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_supplements_own_data" ON patient_supplements
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- ── Trigger: auto-update updated_at ───────────────────────────────────

CREATE TRIGGER update_patient_supplements_updated_at
  BEFORE UPDATE ON patient_supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

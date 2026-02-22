-- Migration 013: Protocol Push Support
-- Enables pushing visit protocol supplements to patient_supplements with timeline events

-- ── Add 'protocol' source enum value ──────────────────────────────────
ALTER TYPE patient_supplement_source ADD VALUE IF NOT EXISTS 'protocol';

-- ── Track which visit pushed a supplement (mirrors review_id) ─────────
ALTER TABLE patient_supplements
  ADD COLUMN visit_id UUID REFERENCES visits(id) ON DELETE SET NULL;

CREATE INDEX idx_patient_supplements_visit
  ON patient_supplements (visit_id) WHERE visit_id IS NOT NULL;

-- ── Track when protocol supplements were pushed from a visit ──────────
ALTER TABLE visits ADD COLUMN protocol_pushed_at TIMESTAMPTZ;

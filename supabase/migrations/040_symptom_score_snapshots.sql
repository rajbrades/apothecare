-- Migration 040: Symptom Score Snapshots
-- Creates a time-series table for recurring patient symptom check-ins.
-- Each row stores a full JSONB snapshot of all symptom scores (same shape
-- as patients.symptom_scores), enabling longitudinal trend analysis.

-- ══════════════════════════════════════════════════════════════════════
-- Table: symptom_score_snapshots
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE symptom_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Full scores object — same shape as patients.symptom_scores
  -- e.g. { "fatigue": 7, "brain_fog": 5, "bloating": 3, ... }
  scores JSONB NOT NULL DEFAULT '{}',

  -- Optional patient-provided context
  notes TEXT,

  -- Source: 'intake' for initial snapshot, 'check_in' for subsequent, 'visit' for during-visit
  source TEXT NOT NULL DEFAULT 'check_in'
    CHECK (source IN ('intake', 'check_in', 'visit')),

  -- When the check-in was recorded (separate from created_at for backdating)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────

CREATE INDEX idx_symptom_snapshots_patient_date
  ON symptom_score_snapshots (patient_id, recorded_at DESC);

CREATE INDEX idx_symptom_snapshots_practitioner
  ON symptom_score_snapshots (practitioner_id, patient_id);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE symptom_score_snapshots ENABLE ROW LEVEL SECURITY;

-- Practitioner can CRUD their own patients' snapshots
CREATE POLICY "symptom_snapshots_practitioner" ON symptom_score_snapshots
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- Patient can read own snapshots
CREATE POLICY "symptom_snapshots_patient_select" ON symptom_score_snapshots
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- Patient can insert own snapshots
CREATE POLICY "symptom_snapshots_patient_insert" ON symptom_score_snapshots
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- ── Updated-at trigger ───────────────────────────────────────────────

CREATE TRIGGER update_symptom_score_snapshots_updated_at
  BEFORE UPDATE ON symptom_score_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- Timeline trigger: auto-insert timeline_events on new snapshot
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_symptom_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
BEGIN
  -- Count non-zero scores
  SELECT COUNT(*) INTO score_count
  FROM jsonb_each_text(NEW.scores)
  WHERE value::integer > 0;

  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    body_systems, biomarker_codes, visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'patient_reported',
    NEW.recorded_at,
    'symptom_score_snapshots',
    NEW.id,
    'Symptom Check-in',
    score_count || ' symptoms rated',
    jsonb_build_object(
      'source', NEW.source,
      'score_count', score_count
    ),
    '{}',
    '{}',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER symptom_snapshot_timeline_trigger
  AFTER INSERT ON symptom_score_snapshots
  FOR EACH ROW EXECUTE FUNCTION insert_timeline_event_for_symptom_snapshot();

-- ══════════════════════════════════════════════════════════════════════
-- Backfill: seed intake snapshots for patients with existing scores
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO symptom_score_snapshots (patient_id, practitioner_id, scores, source, recorded_at, created_at)
SELECT
  p.id,
  p.practitioner_id,
  p.symptom_scores,
  'intake',
  p.updated_at,
  p.updated_at
FROM patients p
WHERE p.symptom_scores IS NOT NULL
  AND p.symptom_scores != '{}'::jsonb
  AND p.symptom_scores != 'null'::jsonb;

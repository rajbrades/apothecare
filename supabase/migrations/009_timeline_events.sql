-- Migration 009: Timeline Events
-- Unified Patient Health Timeline — Phase 1 Foundation
-- Tracks all patient health events chronologically (labs, visits, supplements, milestones)

-- ── Enum ───────────────────────────────────────────────────────────────

CREATE TYPE timeline_event_type AS ENUM (
  'lab_result',
  'visit',
  'supplement_start',
  'supplement_stop',
  'supplement_dose_change',
  'symptom_log',
  'protocol_milestone',
  'patient_reported',
  'ai_insight'
);

-- ── Table ──────────────────────────────────────────────────────────────

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,

  -- Event classification
  event_type timeline_event_type NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,

  -- Source reference (polymorphic FK)
  source_table TEXT NOT NULL,     -- 'lab_reports', 'visits', 'supplement_reviews', etc.
  source_id UUID NOT NULL,        -- FK to the source row

  -- Denormalized display data (avoids JOINs for timeline rendering)
  title TEXT NOT NULL,
  summary TEXT,
  detail JSONB DEFAULT '{}',

  -- Categorization
  body_systems TEXT[],            -- e.g., ARRAY['thyroid', 'immune']
  biomarker_codes TEXT[],         -- e.g., ARRAY['TSH', 'FREE_T3'] for lab events

  -- Visibility & pinning
  visible_to_patient BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────

-- Primary query: patient timeline with cursor pagination
CREATE INDEX idx_timeline_events_patient_date
  ON timeline_events (patient_id, event_date DESC, id);

-- Filter by event type
CREATE INDEX idx_timeline_events_type
  ON timeline_events (patient_id, event_type, event_date DESC);

-- Filter by body system (GIN for array overlap)
CREATE INDEX idx_timeline_events_body_systems
  ON timeline_events USING GIN (body_systems);

-- Filter by biomarker code (GIN for array overlap)
CREATE INDEX idx_timeline_events_biomarkers
  ON timeline_events USING GIN (biomarker_codes);

-- Dedup / lookup by source
CREATE INDEX idx_timeline_events_source
  ON timeline_events (source_table, source_id);

-- ── RLS ────────────────────────────────────────────────────────────────

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_events_own_data" ON timeline_events
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- ── Trigger: auto-update updated_at ────────────────────────────────────

CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Trigger: auto-insert on lab report completion ──────────────────────

CREATE OR REPLACE FUNCTION insert_timeline_event_for_lab()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status transitions to 'complete'
  IF NEW.status = 'complete' AND (OLD.status IS NULL OR OLD.status != 'complete') THEN
    INSERT INTO timeline_events (
      patient_id,
      practitioner_id,
      event_type,
      event_date,
      source_table,
      source_id,
      title,
      summary,
      detail,
      body_systems,
      biomarker_codes,
      visible_to_patient
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
        'biomarker_count', (SELECT COUNT(*) FROM biomarker_results WHERE lab_report_id = NEW.id),
        'flagged_count', (
          SELECT COUNT(*) FROM biomarker_results
          WHERE lab_report_id = NEW.id
            AND functional_flag IN ('borderline_low', 'borderline_high', 'low', 'high', 'critical')
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
      false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lab_report_complete
  AFTER UPDATE ON lab_reports
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_lab();

-- ── Trigger: auto-insert on visit creation ─────────────────────────────

CREATE OR REPLACE FUNCTION insert_timeline_event_for_visit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    patient_id,
    practitioner_id,
    event_type,
    event_date,
    source_table,
    source_id,
    title,
    summary,
    detail,
    visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'visit',
    COALESCE(NEW.visit_date, NEW.created_at),
    'visits',
    NEW.id,
    COALESCE('Visit: ' || LEFT(NEW.chief_complaint, 60), 'Clinical Visit'),
    LEFT(COALESCE(NEW.assessment, NEW.subjective, 'Visit documented'), 200),
    jsonb_build_object(
      'visit_type', NEW.visit_type,
      'note_template', NEW.note_template,
      'chief_complaint', NEW.chief_complaint
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_visit_created
  AFTER INSERT ON visits
  FOR EACH ROW
  WHEN (NEW.patient_id IS NOT NULL)
  EXECUTE FUNCTION insert_timeline_event_for_visit();

-- ── Backfill existing data ─────────────────────────────────────────────

-- Backfill completed lab reports
INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  body_systems, biomarker_codes, visible_to_patient
)
SELECT
  lr.patient_id,
  lr.practitioner_id,
  'lab_result',
  COALESCE(lr.collection_date::timestamptz, lr.created_at),
  'lab_reports',
  lr.id,
  COALESCE(lr.test_name, 'Lab Report'),
  'Lab results with ' || (
    SELECT COUNT(*) FROM biomarker_results br WHERE br.lab_report_id = lr.id
  ) || ' biomarkers',
  jsonb_build_object(
    'test_type', lr.test_type,
    'lab_vendor', lr.lab_vendor,
    'biomarker_count', (SELECT COUNT(*) FROM biomarker_results br WHERE br.lab_report_id = lr.id),
    'flagged_count', (
      SELECT COUNT(*) FROM biomarker_results br
      WHERE br.lab_report_id = lr.id
        AND br.functional_flag IN ('borderline_low', 'borderline_high', 'low', 'high', 'critical')
    )
  ),
  ARRAY(
    SELECT DISTINCT br.category FROM biomarker_results br
    WHERE br.lab_report_id = lr.id AND br.category IS NOT NULL
  ),
  ARRAY(
    SELECT DISTINCT br.biomarker_code FROM biomarker_results br
    WHERE br.lab_report_id = lr.id
  ),
  false
FROM lab_reports lr
WHERE lr.status = 'complete'
  AND lr.patient_id IS NOT NULL;

-- Backfill existing visits
INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  visible_to_patient
)
SELECT
  v.patient_id,
  v.practitioner_id,
  'visit',
  COALESCE(v.visit_date, v.created_at),
  'visits',
  v.id,
  COALESCE('Visit: ' || LEFT(v.chief_complaint, 60), 'Clinical Visit'),
  LEFT(COALESCE(v.assessment, v.subjective, 'Visit documented'), 200),
  jsonb_build_object(
    'visit_type', v.visit_type,
    'note_template', v.note_template,
    'chief_complaint', v.chief_complaint
  ),
  false
FROM visits v
WHERE v.patient_id IS NOT NULL;

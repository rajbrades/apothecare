-- Migration 015: Supplement Timeline Event Triggers
-- Automatically inserts timeline_events when patient_supplements are created/changed
-- Covers: supplement_start, supplement_stop, supplement_dose_change

-- ══════════════════════════════════════════════════════════════════════
-- Trigger Function
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_supplement()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type timeline_event_type;
  v_event_date TIMESTAMPTZ;
  v_title TEXT;
  v_summary TEXT;
  v_detail JSONB;
BEGIN

  -- ── INSERT path ────────────────────────────────────────────────────
  IF TG_OP = 'INSERT' THEN

    IF NEW.status = 'active' THEN
      v_event_type := 'supplement_start';
      v_event_date := COALESCE(NEW.started_at, NOW());
      v_title := 'Started ' || NEW.name;
      v_summary := concat_ws(' · ',
        NULLIF(TRIM(COALESCE(NEW.dosage, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.form, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.frequency, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.timing, '')), '')
      );
      v_detail := jsonb_build_object(
        'dosage', NEW.dosage,
        'form', NEW.form,
        'frequency', NEW.frequency,
        'timing', NEW.timing,
        'brand', NEW.brand,
        'source', NEW.source::text,
        'visit_id', NEW.visit_id,
        'review_id', NEW.review_id
      );

    ELSIF NEW.status = 'discontinued' THEN
      v_event_type := 'supplement_stop';
      v_event_date := COALESCE(NEW.discontinued_at, NOW());
      v_title := 'Stopped ' || NEW.name;
      v_summary := 'Discontinued';
      v_detail := jsonb_build_object(
        'dosage', NEW.dosage,
        'form', NEW.form,
        'frequency', NEW.frequency,
        'timing', NEW.timing,
        'source', NEW.source::text,
        'visit_id', NEW.visit_id,
        'review_id', NEW.review_id
      );

    ELSE
      -- pending_patient: no timeline event until approved
      RETURN NEW;
    END IF;

  -- ── UPDATE path (priority chain: stop > start > dose_change) ───────
  ELSIF TG_OP = 'UPDATE' THEN

    -- Priority 1: Discontinued (supplement_stop)
    IF NEW.status = 'discontinued' AND OLD.status IS DISTINCT FROM 'discontinued' THEN
      v_event_type := 'supplement_stop';
      v_event_date := COALESCE(NEW.discontinued_at, NOW());
      v_title := 'Stopped ' || NEW.name;
      v_summary := 'Discontinued';
      v_detail := jsonb_build_object(
        'last_dosage', OLD.dosage,
        'last_frequency', OLD.frequency,
        'last_timing', OLD.timing,
        'source', NEW.source::text,
        'visit_id', NEW.visit_id,
        'review_id', NEW.review_id
      );

    -- Priority 2: Activated / reactivated (supplement_start)
    ELSIF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
      v_event_type := 'supplement_start';
      v_event_date := COALESCE(NEW.started_at, NOW());
      v_title := CASE
        WHEN OLD.status = 'discontinued' THEN 'Restarted ' || NEW.name
        ELSE 'Started ' || NEW.name
      END;
      v_summary := concat_ws(' · ',
        NULLIF(TRIM(COALESCE(NEW.dosage, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.form, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.frequency, '')), ''),
        NULLIF(TRIM(COALESCE(NEW.timing, '')), '')
      );
      v_detail := jsonb_build_object(
        'dosage', NEW.dosage,
        'form', NEW.form,
        'frequency', NEW.frequency,
        'timing', NEW.timing,
        'brand', NEW.brand,
        'source', NEW.source::text,
        'visit_id', NEW.visit_id,
        'review_id', NEW.review_id
      );

    -- Priority 3: Dose/form/frequency/timing change on active supplement
    ELSIF NEW.status = 'active' AND (
      NEW.dosage IS DISTINCT FROM OLD.dosage OR
      NEW.form IS DISTINCT FROM OLD.form OR
      NEW.frequency IS DISTINCT FROM OLD.frequency OR
      NEW.timing IS DISTINCT FROM OLD.timing
    ) THEN
      v_event_type := 'supplement_dose_change';
      v_event_date := NEW.updated_at;
      v_title := NEW.name || ' — dosage changed';

      -- Build human-readable change summary
      v_summary := '';
      IF NEW.dosage IS DISTINCT FROM OLD.dosage THEN
        v_summary := COALESCE(OLD.dosage, 'none') || ' → ' || COALESCE(NEW.dosage, 'none');
      END IF;
      IF NEW.form IS DISTINCT FROM OLD.form THEN
        IF v_summary != '' THEN v_summary := v_summary || ', '; END IF;
        v_summary := v_summary || 'form: '
          || COALESCE(OLD.form, 'none') || ' → ' || COALESCE(NEW.form, 'none');
      END IF;
      IF NEW.frequency IS DISTINCT FROM OLD.frequency THEN
        IF v_summary != '' THEN v_summary := v_summary || ', '; END IF;
        v_summary := v_summary || 'frequency: '
          || COALESCE(OLD.frequency, 'none') || ' → ' || COALESCE(NEW.frequency, 'none');
      END IF;
      IF NEW.timing IS DISTINCT FROM OLD.timing THEN
        IF v_summary != '' THEN v_summary := v_summary || ', '; END IF;
        v_summary := v_summary || 'timing: '
          || COALESCE(OLD.timing, 'none') || ' → ' || COALESCE(NEW.timing, 'none');
      END IF;

      v_detail := jsonb_build_object(
        'previous', jsonb_build_object(
          'dosage', OLD.dosage,
          'form', OLD.form,
          'frequency', OLD.frequency,
          'timing', OLD.timing
        ),
        'updated', jsonb_build_object(
          'dosage', NEW.dosage,
          'form', NEW.form,
          'frequency', NEW.frequency,
          'timing', NEW.timing
        ),
        'source', NEW.source::text,
        'visit_id', NEW.visit_id,
        'review_id', NEW.review_id
      );

    ELSE
      -- No timeline-worthy change (notes, sort_order, brand-only, etc.)
      RETURN NEW;
    END IF;
  END IF;

  -- ── Insert the timeline event ──────────────────────────────────────
  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    body_systems, biomarker_codes, visible_to_patient
  ) VALUES (
    NEW.patient_id, NEW.practitioner_id, v_event_type, v_event_date,
    'patient_supplements', NEW.id, v_title,
    NULLIF(v_summary, ''), v_detail,
    '{}', '{}', false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════
-- Trigger
-- ══════════════════════════════════════════════════════════════════════

CREATE TRIGGER on_patient_supplement_changed
  AFTER INSERT OR UPDATE ON patient_supplements
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_supplement();

-- ══════════════════════════════════════════════════════════════════════
-- Backfill: Active supplements → supplement_start
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  body_systems, biomarker_codes, visible_to_patient
)
SELECT
  ps.patient_id,
  ps.practitioner_id,
  'supplement_start',
  COALESCE(ps.started_at, ps.created_at),
  'patient_supplements',
  ps.id,
  'Started ' || ps.name,
  NULLIF(concat_ws(' · ',
    NULLIF(TRIM(COALESCE(ps.dosage, '')), ''),
    NULLIF(TRIM(COALESCE(ps.form, '')), ''),
    NULLIF(TRIM(COALESCE(ps.frequency, '')), ''),
    NULLIF(TRIM(COALESCE(ps.timing, '')), '')
  ), ''),
  jsonb_build_object(
    'dosage', ps.dosage,
    'form', ps.form,
    'frequency', ps.frequency,
    'timing', ps.timing,
    'brand', ps.brand,
    'source', ps.source::text,
    'visit_id', ps.visit_id,
    'review_id', ps.review_id
  ),
  '{}', '{}', false
FROM patient_supplements ps
WHERE ps.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM timeline_events te
    WHERE te.source_table = 'patient_supplements'
      AND te.source_id = ps.id
      AND te.event_type = 'supplement_start'
  );

-- ══════════════════════════════════════════════════════════════════════
-- Backfill: Discontinued supplements → supplement_start + supplement_stop
-- ══════════════════════════════════════════════════════════════════════

-- Start event for discontinued supplements
INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  body_systems, biomarker_codes, visible_to_patient
)
SELECT
  ps.patient_id,
  ps.practitioner_id,
  'supplement_start',
  COALESCE(ps.started_at, ps.created_at),
  'patient_supplements',
  ps.id,
  'Started ' || ps.name,
  NULLIF(concat_ws(' · ',
    NULLIF(TRIM(COALESCE(ps.dosage, '')), ''),
    NULLIF(TRIM(COALESCE(ps.form, '')), ''),
    NULLIF(TRIM(COALESCE(ps.frequency, '')), ''),
    NULLIF(TRIM(COALESCE(ps.timing, '')), '')
  ), ''),
  jsonb_build_object(
    'dosage', ps.dosage,
    'form', ps.form,
    'frequency', ps.frequency,
    'timing', ps.timing,
    'brand', ps.brand,
    'source', ps.source::text
  ),
  '{}', '{}', false
FROM patient_supplements ps
WHERE ps.status = 'discontinued'
  AND NOT EXISTS (
    SELECT 1 FROM timeline_events te
    WHERE te.source_table = 'patient_supplements'
      AND te.source_id = ps.id
      AND te.event_type = 'supplement_start'
  );

-- Stop event for discontinued supplements
INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  body_systems, biomarker_codes, visible_to_patient
)
SELECT
  ps.patient_id,
  ps.practitioner_id,
  'supplement_stop',
  COALESCE(ps.discontinued_at, ps.updated_at),
  'patient_supplements',
  ps.id,
  'Stopped ' || ps.name,
  'Discontinued',
  jsonb_build_object(
    'last_dosage', ps.dosage,
    'last_frequency', ps.frequency,
    'last_timing', ps.timing,
    'source', ps.source::text
  ),
  '{}', '{}', false
FROM patient_supplements ps
WHERE ps.status = 'discontinued'
  AND NOT EXISTS (
    SELECT 1 FROM timeline_events te
    WHERE te.source_table = 'patient_supplements'
      AND te.source_id = ps.id
      AND te.event_type = 'supplement_stop'
  );

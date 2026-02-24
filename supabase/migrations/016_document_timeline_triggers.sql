-- Migration 016: Document Upload & Visit Completion Timeline Triggers
-- Auto-inserts/updates timeline_events for document uploads and visit completions.
-- Completes the "every clinical event lives in the timeline" principle.

-- ── New event type ──────────────────────────────────────────────────────
-- Must run outside a transaction block in some PG versions; Supabase handles this fine.

ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'document_upload';

-- ══════════════════════════════════════════════════════════════════════
-- 1. DOCUMENT UPLOAD TRIGGER
--    Fires on INSERT into patient_documents.
--    Creates a document_upload timeline event so every uploaded clinical
--    document (intake forms, referrals, imaging, consent, etc.) is
--    automatically visible in the patient's living history.
--    Note: lab_reports are tracked separately via the lab_result trigger.
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_document()
RETURNS TRIGGER AS $$
DECLARE
  v_title   TEXT;
  v_summary TEXT;
BEGIN
  -- Skip if not linked to a patient
  IF NEW.patient_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_title := COALESCE(NULLIF(TRIM(NEW.title), ''), NULLIF(TRIM(NEW.file_name), ''), 'Document');

  v_summary := CASE NEW.document_type
    WHEN 'lab_report'      THEN 'Lab report uploaded'
    WHEN 'intake_form'     THEN 'Intake form uploaded'
    WHEN 'health_history'  THEN 'Health history uploaded'
    WHEN 'imaging'         THEN 'Imaging document uploaded'
    WHEN 'referral'        THEN 'Referral uploaded'
    WHEN 'consent'         THEN 'Consent form uploaded'
    WHEN 'insurance'       THEN 'Insurance document uploaded'
    ELSE                        'Document uploaded'
  END;

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
    visible_to_patient,
    is_pinned
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'document_upload',
    COALESCE(NEW.uploaded_at, NOW()),
    'patient_documents',
    NEW.id,
    v_title,
    v_summary,
    jsonb_build_object(
      'document_type', NEW.document_type,
      'file_name',     NEW.file_name,
      'file_size',     NEW.file_size
    ),
    false,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_document_uploaded
  AFTER INSERT ON patient_documents
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_document();


-- ══════════════════════════════════════════════════════════════════════
-- 2. VISIT COMPLETION TRIGGER
--    Fires on UPDATE to visits when status transitions to 'completed'.
--    Updates the existing visit timeline event (created on INSERT) to
--    reflect the completed state rather than creating a duplicate event.
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_timeline_event_on_visit_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status transitions TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE timeline_events
    SET
      title      = COALESCE(NULLIF(TRIM(NEW.chief_complaint), ''), 'Visit'),
      summary    = CASE NEW.visit_type
                     WHEN 'follow_up' THEN 'Follow-up visit completed'
                     ELSE 'Visit completed'
                   END,
      detail     = COALESCE(detail, '{}'::jsonb) || jsonb_build_object(
                     'status',     'completed',
                     'visit_type', NEW.visit_type
                   ),
      updated_at = NOW()
    WHERE source_table = 'visits'
      AND source_id    = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_visit_completed
  AFTER UPDATE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_event_on_visit_completion();


-- ══════════════════════════════════════════════════════════════════════
-- 3. BACKFILL — existing documents with no timeline event
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO timeline_events (
  patient_id, practitioner_id, event_type, event_date,
  source_table, source_id, title, summary, detail,
  visible_to_patient, is_pinned
)
SELECT
  pd.patient_id,
  pd.practitioner_id,
  'document_upload',
  COALESCE(pd.uploaded_at, pd.created_at, NOW()),
  'patient_documents',
  pd.id,
  COALESCE(NULLIF(TRIM(pd.title), ''), NULLIF(TRIM(pd.file_name), ''), 'Document'),
  CASE pd.document_type
    WHEN 'lab_report'     THEN 'Lab report uploaded'
    WHEN 'intake_form'    THEN 'Intake form uploaded'
    WHEN 'health_history' THEN 'Health history uploaded'
    WHEN 'imaging'        THEN 'Imaging document uploaded'
    WHEN 'referral'       THEN 'Referral uploaded'
    WHEN 'consent'        THEN 'Consent form uploaded'
    WHEN 'insurance'      THEN 'Insurance document uploaded'
    ELSE                       'Document uploaded'
  END,
  jsonb_build_object(
    'document_type', pd.document_type,
    'file_name',     pd.file_name,
    'file_size',     pd.file_size
  ),
  false,
  false
FROM patient_documents pd
WHERE pd.patient_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM timeline_events te
    WHERE te.source_table = 'patient_documents'
      AND te.source_id    = pd.id
  );

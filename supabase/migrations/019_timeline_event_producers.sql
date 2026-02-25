-- Migration 016: Timeline Event Producer Tables
-- Creates 4 new tables with RLS, indexes, and Postgres triggers that
-- auto-insert timeline_events for: symptom_log, protocol_milestone,
-- patient_reported, ai_insight.

-- ══════════════════════════════════════════════════════════════════════
-- Enums
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE patient_report_type AS ENUM (
  'symptom', 'side_effect', 'improvement', 'concern', 'general'
);

CREATE TYPE ai_insight_type AS ENUM (
  'clinical_correlation', 'risk_flag', 'trend_observation', 'recommendation'
);

-- ══════════════════════════════════════════════════════════════════════
-- Table: symptom_logs
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  symptom_name TEXT NOT NULL,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  body_system TEXT,
  onset_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_symptom_logs_patient ON symptom_logs (patient_id, created_at DESC);

ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "symptom_logs_own_data" ON symptom_logs
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_symptom_logs_updated_at
  BEFORE UPDATE ON symptom_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- Table: protocol_milestones
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE protocol_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_date TIMESTAMPTZ NOT NULL,
  category TEXT,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  clinical_review_id UUID REFERENCES clinical_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protocol_milestones_patient ON protocol_milestones (patient_id, milestone_date DESC);

ALTER TABLE protocol_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "protocol_milestones_own_data" ON protocol_milestones
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_protocol_milestones_updated_at
  BEFORE UPDATE ON protocol_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- Table: patient_reports
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE patient_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  report_type patient_report_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  reported_date TIMESTAMPTZ NOT NULL,
  related_supplement_id UUID REFERENCES patient_supplements(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_reports_patient ON patient_reports (patient_id, reported_date DESC);
CREATE INDEX idx_patient_reports_supplement ON patient_reports (related_supplement_id)
  WHERE related_supplement_id IS NOT NULL;

ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_reports_own_data" ON patient_reports
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_patient_reports_updated_at
  BEFORE UPDATE ON patient_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- Table: ai_insights
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  insight_type ai_insight_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  body_systems TEXT[],
  biomarker_codes TEXT[],
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_patient ON ai_insights (patient_id, created_at DESC);
CREATE INDEX idx_ai_insights_source ON ai_insights (source_type, source_id);
CREATE INDEX idx_ai_insights_active ON ai_insights (patient_id)
  WHERE is_dismissed = false;

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights_own_data" ON ai_insights
  FOR ALL USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- Trigger Function: symptom_logs → timeline_events
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_symptom_log()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: new symptom logged
  IF TG_OP = 'INSERT' THEN
    INSERT INTO timeline_events (
      patient_id, practitioner_id, event_type, event_date,
      source_table, source_id, title, summary, detail,
      body_systems, biomarker_codes, visible_to_patient
    ) VALUES (
      NEW.patient_id,
      NEW.practitioner_id,
      'symptom_log',
      COALESCE(NEW.onset_date, NEW.created_at),
      'symptom_logs',
      NEW.id,
      'Symptom: ' || NEW.symptom_name,
      CASE WHEN NEW.severity IS NOT NULL
        THEN 'Severity ' || NEW.severity || '/10'
        ELSE NULL
      END,
      jsonb_build_object(
        'severity', NEW.severity,
        'body_system', NEW.body_system,
        'onset_date', NEW.onset_date,
        'visit_id', NEW.visit_id
      ),
      CASE WHEN NEW.body_system IS NOT NULL
        THEN ARRAY[NEW.body_system]
        ELSE '{}'
      END,
      '{}',
      false
    );

  -- UPDATE: symptom resolved
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
      INSERT INTO timeline_events (
        patient_id, practitioner_id, event_type, event_date,
        source_table, source_id, title, summary, detail,
        body_systems, biomarker_codes, visible_to_patient
      ) VALUES (
        NEW.patient_id,
        NEW.practitioner_id,
        'symptom_log',
        NEW.resolved_at,
        'symptom_logs',
        NEW.id,
        'Resolved: ' || NEW.symptom_name,
        CASE WHEN NEW.severity IS NOT NULL
          THEN 'Was severity ' || NEW.severity || '/10'
          ELSE 'Symptom resolved'
        END,
        jsonb_build_object(
          'severity', NEW.severity,
          'body_system', NEW.body_system,
          'resolved', true,
          'duration_days', EXTRACT(DAY FROM (NEW.resolved_at - COALESCE(NEW.onset_date, NEW.created_at)))
        ),
        CASE WHEN NEW.body_system IS NOT NULL
          THEN ARRAY[NEW.body_system]
          ELSE '{}'
        END,
        '{}',
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_symptom_log_changed
  AFTER INSERT OR UPDATE ON symptom_logs
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_symptom_log();

-- ══════════════════════════════════════════════════════════════════════
-- Trigger Function: protocol_milestones → timeline_events
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_protocol_milestone()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    body_systems, biomarker_codes, visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'protocol_milestone',
    NEW.milestone_date,
    'protocol_milestones',
    NEW.id,
    NEW.title,
    NEW.description,
    jsonb_build_object(
      'category', NEW.category,
      'visit_id', NEW.visit_id,
      'clinical_review_id', NEW.clinical_review_id
    ),
    '{}',
    '{}',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_protocol_milestone_created
  AFTER INSERT ON protocol_milestones
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_protocol_milestone();

-- ══════════════════════════════════════════════════════════════════════
-- Trigger Function: patient_reports → timeline_events
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_patient_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    body_systems, biomarker_codes, visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'patient_reported',
    NEW.reported_date,
    'patient_reports',
    NEW.id,
    NEW.title,
    LEFT(NEW.content, 200),
    jsonb_build_object(
      'report_type', NEW.report_type::text,
      'severity', NEW.severity,
      'related_supplement_id', NEW.related_supplement_id,
      'visit_id', NEW.visit_id
    ),
    '{}',
    '{}',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_patient_report_created
  AFTER INSERT ON patient_reports
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_patient_report();

-- ══════════════════════════════════════════════════════════════════════
-- Trigger Function: ai_insights → timeline_events
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION insert_timeline_event_for_ai_insight()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    patient_id, practitioner_id, event_type, event_date,
    source_table, source_id, title, summary, detail,
    body_systems, biomarker_codes, visible_to_patient
  ) VALUES (
    NEW.patient_id,
    NEW.practitioner_id,
    'ai_insight',
    NEW.created_at,
    'ai_insights',
    NEW.id,
    NEW.title,
    LEFT(NEW.content, 200),
    jsonb_build_object(
      'insight_type', NEW.insight_type::text,
      'confidence', NEW.confidence,
      'source_type', NEW.source_type,
      'source_id', NEW.source_id
    ),
    COALESCE(NEW.body_systems, '{}'),
    COALESCE(NEW.biomarker_codes, '{}'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ai_insight_created
  AFTER INSERT ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION insert_timeline_event_for_ai_insight();

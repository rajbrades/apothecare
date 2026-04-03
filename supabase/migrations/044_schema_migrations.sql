-- Migration 044: Schema migration version tracking
-- Records which migrations have been applied to each environment.
-- Prevents re-runs and enables rollback awareness.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,             -- e.g. "001", "042"
  name        TEXT NOT NULL,                -- e.g. "initial_schema", "stripe_webhook_events"
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum    TEXT                          -- optional: SHA256 of migration file for drift detection
);

-- Seed with all existing migrations (idempotent)
INSERT INTO schema_migrations (version, name) VALUES
  ('001', 'initial_schema'),
  ('002', 'visit_type_status'),
  ('003', 'patient_documents'),
  ('004', 'template_content'),
  ('005', 'rate_limits'),
  ('006', 'supplements_reviews'),
  ('007', 'lab_archive_flag'),
  ('008', 'chat_attachments'),
  ('009', 'timeline_events'),
  ('010', 'supplement_brands'),
  ('011', 'visit_archive'),
  ('012', 'patient_supplements'),
  ('013', 'ai_insights'),
  ('014', 'interaction_checks'),
  ('015', 'lab_timeline_trigger'),
  ('016', 'supplement_timeline_trigger'),
  ('017', 'vitals_health_ratings'),
  ('018', 'clinical_reviews'),
  ('019', 'patient_reports_trigger'),
  ('020', 'patient_reports'),
  ('021', 'evidence_sources'),
  ('022', 'verified_citations'),
  ('023', 'biomarker_references'),
  ('024', 'partnership_rag'),
  ('025', 'practitioner_biomarker_ranges'),
  ('026', 'practice_branding'),
  ('027', 'verified_citations_table'),
  ('028', 'treatment_protocols'),
  ('029', 'patient_portal'),
  ('030', 'consent_templates'),
  ('031', 'intake_forms'),
  ('032', 'fix_biomarker_ranges_rls'),
  ('033', 'audit_log_hardening'),
  ('034', 'patient_medications'),
  ('035', 'symptom_tracking'),
  ('036', 'protocol_progress'),
  ('037', 'citation_corrections'),
  ('038', 'protocol_milestones'),
  ('039', 'amendment_requests'),
  ('040', 'amendment_timeline_trigger'),
  ('041', 'functional_intake_template'),
  ('042', 'check_in_template'),
  ('043', 'stripe_webhook_events'),
  ('044', 'schema_migrations')
ON CONFLICT (version) DO NOTHING;

COMMENT ON TABLE schema_migrations IS 'Tracks which migrations have been applied. Used for drift detection and rollback awareness.';

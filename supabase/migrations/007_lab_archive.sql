-- Add is_archived column to lab_reports for archival workflow
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering of non-archived reports
CREATE INDEX IF NOT EXISTS idx_lab_reports_archived ON lab_reports (practitioner_id, is_archived, created_at DESC);

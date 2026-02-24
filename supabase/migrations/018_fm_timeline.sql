ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS fm_timeline_data JSONB;

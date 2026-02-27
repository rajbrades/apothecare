-- Migration 021: Add vitals_pushed_at to visits table
-- Tracks when vitals/health ratings were last pushed to the patient chart

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS vitals_pushed_at TIMESTAMPTZ;

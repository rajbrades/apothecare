-- Migration 023: Add dietary, lifestyle, and follow-up lab recommendation columns to patients
-- These store protocol recommendations pushed from visit workspace

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS dietary_recommendations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS lifestyle_recommendations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS follow_up_labs JSONB DEFAULT '[]';

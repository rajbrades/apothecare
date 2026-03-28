-- Add address field to patients table for street address (separate from city/state)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address text;

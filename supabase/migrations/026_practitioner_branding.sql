-- ==========================================
-- 026_practitioner_branding.sql
-- Feature: Practice Branding for PDF Exports
-- ==========================================

-- Add branding columns to practitioners table
ALTER TABLE public.practitioners
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS practice_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS practice_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS practice_city TEXT,
  ADD COLUMN IF NOT EXISTS practice_state TEXT,
  ADD COLUMN IF NOT EXISTS practice_zip VARCHAR(10),
  ADD COLUMN IF NOT EXISTS practice_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS practice_fax VARCHAR(20),
  ADD COLUMN IF NOT EXISTS practice_website TEXT;

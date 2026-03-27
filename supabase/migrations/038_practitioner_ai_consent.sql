-- ==========================================
-- 038_practitioner_ai_consent.sql
-- HIPAA M4: Practitioner AI processing consent
--   - Records when practitioner acknowledged AI processing of patient PHI
-- ==========================================

ALTER TABLE public.practitioners
    ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;

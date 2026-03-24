-- ============================================================
-- 034: Per-patient evidence source preferences
-- Allows practitioners to save preferred evidence sources
-- per patient for recurring consults.
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS preferred_evidence_sources TEXT[];

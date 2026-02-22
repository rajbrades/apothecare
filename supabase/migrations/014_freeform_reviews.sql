-- Migration 014: Freeform Supplement Reviews
-- Allows supplement reviews without a patient (freeform text input mode)

-- ── Make patient_id nullable on supplement_reviews ─────────────────────
ALTER TABLE supplement_reviews ALTER COLUMN patient_id DROP NOT NULL;

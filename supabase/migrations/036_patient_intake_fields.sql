-- ============================================================
-- 036: Extended patient fields for FM intake mapping
-- Adds columns to store structured intake data from the
-- comprehensive functional medicine health intake form.
-- ============================================================

-- ── Contact & Demographics ──────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS gender_identity TEXT,
  ADD COLUMN IF NOT EXISTS ethnicity TEXT,
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- ── Structured Medical History ──────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS diagnoses TEXT[],
  ADD COLUMN IF NOT EXISTS surgeries JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS hospitalizations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS family_history_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS family_history_detail TEXT;

-- ── Genetics ────────────────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS genetic_testing TEXT,
  ADD COLUMN IF NOT EXISTS apoe_genotype TEXT,
  ADD COLUMN IF NOT EXISTS mthfr_variants TEXT;

-- ── Symptom Scores (0-10 sliders) ───────────────────────────
-- Stored as JSONB for flexibility — new symptoms can be added
-- without schema changes. Keys match intake form field names.
-- e.g. { "fatigue": 7, "brain_fog": 5, "bloating": 3, ... }
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS symptom_scores JSONB DEFAULT '{}';

-- ── Lifestyle & Environment ─────────────────────────────────
-- Stored as JSONB — diet, exercise, stress, substances, exposures
-- e.g. { "diet_type": "Mediterranean", "exercise_freq": "3-4", ... }
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS lifestyle JSONB DEFAULT '{}';

-- ── Prior Labs & Goals ──────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS prior_labs TEXT[],
  ADD COLUMN IF NOT EXISTS health_goals TEXT;

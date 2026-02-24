-- Migration 017: Add vitals_data and health_ratings JSONB columns to visits
-- vitals_data: numeric measurements (weight, BP, heart rate)
-- health_ratings: patient-reported 1–10 scores for 8 Pillars of Health

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS vitals_data    JSONB,
  ADD COLUMN IF NOT EXISTS health_ratings JSONB;

-- vitals_data expected shape:
-- { "weight_kg": 74.2, "height_cm": 170, "bp_systolic": 118, "bp_diastolic": 76, "heart_rate_bpm": 68 }

-- health_ratings expected shape (all values 1–10):
-- { "sleep": 6, "stress": 4, "movement": 7, "nutrition": 8, "digestion": 5, "energy": 4, "mood": 7, "hydration": 6 }

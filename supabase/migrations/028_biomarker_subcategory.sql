-- Migration 028: Add subcategory column to biomarker_results
-- Used for DUTCH Complete and other multi-tiered lab reports.
-- NULL for all standard labs (blood panels, GI-MAP, etc.)

ALTER TABLE biomarker_results
  ADD COLUMN IF NOT EXISTS subcategory TEXT;

COMMENT ON COLUMN biomarker_results.subcategory IS
  'Optional sub-grouping within a category. Used for DUTCH Complete (e.g. vitamin_b12_marker within nutritional_organic_acids). NULL for most lab types.';

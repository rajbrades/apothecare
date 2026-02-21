-- Migration 011: Patient-level IFM Matrix
-- Adds a persistent IFM Matrix to the patient record as the living source of truth.
-- Visit-level matrices remain per-visit snapshots; this column aggregates across visits.

ALTER TABLE patients ADD COLUMN ifm_matrix JSONB DEFAULT '{}';
-- Format: { assimilation: { findings: [], severity: "none", notes: "" }, ... }

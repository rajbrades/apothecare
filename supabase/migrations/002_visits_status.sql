-- ===========================================
-- APOTHECA - Visits Module Schema Additions
-- ===========================================
-- Adds status lifecycle, visit type, and AI protocol column
-- to the existing visits table.
-- ===========================================

-- Add visit status enum
CREATE TYPE visit_status AS ENUM ('draft', 'completed');

-- Add new columns to visits table
ALTER TABLE visits ADD COLUMN status visit_status DEFAULT 'draft';
ALTER TABLE visits ADD COLUMN visit_type TEXT DEFAULT 'soap';
ALTER TABLE visits ADD COLUMN ai_protocol JSONB DEFAULT '{}';

-- Index for status filtering and visit type
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_type ON visits(visit_type);

-- Composite index for common list query pattern
CREATE INDEX idx_visits_practitioner_status_date ON visits(practitioner_id, status, visit_date DESC);

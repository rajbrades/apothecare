-- Migration 022: Link lab_reports back to source patient_document
-- Enables "Parse as Lab" from documents uploaded on the Documents tab

ALTER TABLE lab_reports
  ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES patient_documents(id) ON DELETE SET NULL;

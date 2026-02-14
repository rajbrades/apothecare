-- ===========================================
-- Migration 003: Patient Documents
-- ===========================================
-- Adds document upload + AI extraction support for patient intake forms,
-- health histories, and other clinical documents.

-- Document type classification
CREATE TYPE document_type AS ENUM (
  'intake_form',
  'health_history',
  'lab_report',
  'imaging',
  'referral',
  'consent',
  'insurance',
  'other'
);

-- Document processing status
CREATE TYPE document_status AS ENUM (
  'uploading',
  'uploaded',
  'extracting',
  'extracted',
  'error'
);

-- Patient documents table
CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  -- Classification
  document_type document_type DEFAULT 'other',
  document_date DATE,
  title TEXT,

  -- Extraction results
  status document_status DEFAULT 'uploading',
  extracted_text TEXT,
  extracted_data JSONB DEFAULT '{}',
  extraction_summary TEXT,
  extraction_model TEXT,
  error_message TEXT,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_documents_practitioner ON patient_documents(practitioner_id);
CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_status ON patient_documents(status);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX idx_patient_documents_patient_status ON patient_documents(patient_id, status);

-- RLS
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_documents_own_data" ON patient_documents
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Auto-update trigger
CREATE TRIGGER update_patient_documents_updated_at
  BEFORE UPDATE ON patient_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add clinical summary to patients (synthesized view of all documents)
ALTER TABLE patients ADD COLUMN clinical_summary JSONB DEFAULT '{}';

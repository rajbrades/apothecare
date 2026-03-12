-- ============================================================
-- 024: Partnership RAG Infrastructure
-- Adds partnership tables and extends evidence schema for
-- partner document ingestion and retrieval.
-- ============================================================

-- ── Partnerships table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partnerships_read_authenticated"
  ON partnerships FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ── Practitioner ↔ Partnership access ───────────────────────
CREATE TABLE IF NOT EXISTS practitioner_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(practitioner_id, partnership_id)
);

ALTER TABLE practitioner_partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practitioner_partnerships_own_read"
  ON practitioner_partnerships FOR SELECT
  TO authenticated
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- ── Extend evidence_documents for partnership content ───────
ALTER TABLE evidence_documents
  ADD COLUMN IF NOT EXISTS partnership_id UUID REFERENCES partnerships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

CREATE INDEX IF NOT EXISTS idx_evidence_documents_partnership
  ON evidence_documents(partnership_id);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_status
  ON evidence_documents(status);

-- ── Updated search function with partnership filtering ──────
CREATE OR REPLACE FUNCTION search_evidence_v2(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL,
  filter_partnership_ids UUID[] DEFAULT NULL,
  filter_document_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  similarity FLOAT,
  source TEXT,
  title TEXT,
  authors TEXT[],
  publication TEXT,
  published_date DATE,
  doi TEXT,
  evidence_level evidence_level,
  partnership_id UUID,
  document_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.document_id,
    ec.content,
    ec.chunk_index,
    (1 - (ec.embedding <=> query_embedding))::FLOAT AS similarity,
    ed.source,
    ed.title,
    ed.authors,
    ed.publication,
    ed.published_date,
    ed.doi,
    ed.evidence_level,
    ed.partnership_id,
    ed.document_type
  FROM evidence_chunks ec
  JOIN evidence_documents ed ON ec.document_id = ed.id
  WHERE (1 - (ec.embedding <=> query_embedding)) > match_threshold
    AND ed.status = 'ready'
    AND (filter_source IS NULL OR ed.source = filter_source)
    AND (filter_partnership_ids IS NULL OR ed.partnership_id = ANY(filter_partnership_ids))
    AND (filter_document_types IS NULL OR ed.document_type = ANY(filter_document_types))
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ── Seed Apex Energetics as first partnership ───────────────
INSERT INTO partnerships (slug, name, description)
VALUES (
  'apex-energetics',
  'Apex Energetics',
  'Professional-grade nutritional supplements and clinical education for healthcare practitioners.'
)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- Migration 019: Upgrade search_evidence() to support multi-source filtering
-- ===========================================
-- The original function accepted a single filter_source TEXT. This upgrade
-- changes it to filter_sources TEXT[] so the chat source filter (which
-- can have multiple sources selected) maps directly to vector search.

CREATE OR REPLACE FUNCTION search_evidence(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL,
  filter_sources TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  source TEXT,
  title TEXT,
  authors TEXT[],
  publication TEXT,
  published_date DATE,
  doi TEXT,
  evidence_level evidence_level
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.document_id,
    ec.content,
    1 - (ec.embedding <=> query_embedding) AS similarity,
    ed.source,
    ed.title,
    ed.authors,
    ed.publication,
    ed.published_date,
    ed.doi,
    ed.evidence_level
  FROM evidence_chunks ec
  JOIN evidence_documents ed ON ec.document_id = ed.id
  WHERE 1 - (ec.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR ed.source = filter_source)
    AND (filter_sources IS NULL OR ed.source = ANY(filter_sources))
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Add a source_id column for deduplication by external ID (e.g. PMID)
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evidence_documents' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE evidence_documents ADD COLUMN source_id TEXT;
    CREATE INDEX idx_evidence_documents_source_id ON evidence_documents(source, source_id);
  END IF;
END $$;

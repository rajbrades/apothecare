-- ==========================================
-- 028_citation_corrections.sql
-- Feature: Citation Quality Feedback Loop
--   - Add conversation/message context to flagged citations
--   - Citation corrections table (bad DOI → good DOI mapping)
--   - Flag count tracking for community consensus auto-exclusion
-- ==========================================

-- 1. Add context columns to verified_citations for flagged citation review
ALTER TABLE public.verified_citations
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS message_id UUID,
    ADD COLUMN IF NOT EXISTS flag_count INTEGER NOT NULL DEFAULT 0;

-- Index for looking up flags by conversation
CREATE INDEX IF NOT EXISTS idx_verified_citations_conversation
    ON public.verified_citations(conversation_id)
    WHERE conversation_id IS NOT NULL;

-- Index for flag count queries (auto-exclusion threshold)
CREATE INDEX IF NOT EXISTS idx_verified_citations_flag_count
    ON public.verified_citations(doi, flag_count)
    WHERE is_flagged = true;

-- 2. Citation corrections table — maps bad DOIs to verified replacements
CREATE TABLE IF NOT EXISTS public.citation_corrections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flagged_doi TEXT NOT NULL,
    replacement_doi TEXT NOT NULL,
    replacement_title TEXT NOT NULL,
    replacement_authors TEXT[] DEFAULT '{}',
    replacement_year INTEGER,
    replacement_journal TEXT,
    replacement_evidence_level TEXT,
    replacement_evidence_rank INTEGER DEFAULT 7,
    corrected_by UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    correction_reason TEXT,
    is_auto BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only one active correction per bad DOI
    UNIQUE (flagged_doi)
);

-- Fast lookup by flagged DOI (used during citation resolution)
CREATE INDEX IF NOT EXISTS idx_citation_corrections_flagged_doi
    ON public.citation_corrections(flagged_doi);

-- 3. RLS — admins manage corrections via service client; all can read
ALTER TABLE public.citation_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read citation corrections"
    ON public.citation_corrections
    FOR SELECT
    USING (true);

-- Write access is via service client (admin API), so no INSERT/UPDATE policy needed for regular users

-- 4. Auto-update trigger
CREATE TRIGGER set_citation_corrections_updated_at
BEFORE UPDATE ON public.citation_corrections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- 027_verified_citations.sql
-- Feature: Universal Citation Verification
-- ==========================================

-- 1. Context type enum
DO $$ BEGIN
  CREATE TYPE public.citation_context_type AS ENUM ('chat', 'supplement', 'lab', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Verified citations table (keyed on DOI)
CREATE TABLE IF NOT EXISTS public.verified_citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doi TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT '{}',
    year INTEGER,
    journal TEXT,
    evidence_level TEXT,
    evidence_rank INTEGER DEFAULT 7,
    abstract_snippet TEXT,
    verified_by UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context_type public.citation_context_type NOT NULL DEFAULT 'general',
    context_value TEXT,
    origin TEXT DEFAULT 'manual',
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A practitioner can only verify a DOI once per context
    UNIQUE (doi, verified_by, context_type, context_value)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_verified_citations_doi ON public.verified_citations(doi);
CREATE INDEX IF NOT EXISTS idx_verified_citations_verified_by ON public.verified_citations(verified_by);
CREATE INDEX IF NOT EXISTS idx_verified_citations_context ON public.verified_citations(context_type, context_value);

-- 4. RLS — all practitioners can read, only own writes
ALTER TABLE public.verified_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verified citations"
    ON public.verified_citations
    FOR SELECT
    USING (true);

CREATE POLICY "Practitioners can insert their own verifications"
    ON public.verified_citations
    FOR INSERT
    WITH CHECK (verified_by IN (SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()));

CREATE POLICY "Practitioners can update their own verifications"
    ON public.verified_citations
    FOR UPDATE
    USING (verified_by IN (SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()));

-- 5. Auto-update trigger
CREATE TRIGGER set_verified_citations_updated_at
BEFORE UPDATE ON public.verified_citations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

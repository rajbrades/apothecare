-- ==========================================
-- 025_practitioner_biomarker_ranges.sql
-- Feature: Global Biomarker Range Overrides
-- ==========================================

-- 1. Create table for practitioner-specific biomarker overrides
CREATE TABLE public.practitioner_biomarker_ranges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    practitioner_id UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    biomarker_code VARCHAR(100) NOT NULL,
    biomarker_name VARCHAR(255) NOT NULL,
    functional_low DECIMAL,
    functional_high DECIMAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a practitioner only has one override per biomarker
    UNIQUE (practitioner_id, biomarker_code)
);

-- 2. Indexes and RLS
CREATE INDEX idx_prac_biomarkers_practitioner_id ON public.practitioner_biomarker_ranges(practitioner_id);

ALTER TABLE public.practitioner_biomarker_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage their own biomarker ranges" 
    ON public.practitioner_biomarker_ranges
    FOR ALL 
    USING (auth.uid() = practitioner_id)
    WITH CHECK (auth.uid() = practitioner_id);

-- 3. Trigger to auto-update updated_at
CREATE TRIGGER set_practitioner_biomarker_ranges_updated_at
BEFORE UPDATE ON public.practitioner_biomarker_ranges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


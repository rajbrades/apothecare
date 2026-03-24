-- Migration 032: Fix RLS policy on practitioner_biomarker_ranges
--
-- The original policy compared auth.uid() directly to practitioner_id,
-- but practitioner_id references practitioners.id (not the auth user UUID).
-- This caused all writes to be silently blocked by RLS.

DROP POLICY IF EXISTS "Practitioners can manage their own biomarker ranges"
  ON public.practitioner_biomarker_ranges;

CREATE POLICY "Practitioners can manage their own biomarker ranges"
  ON public.practitioner_biomarker_ranges
  FOR ALL
  USING (
    practitioner_id IN (
      SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    practitioner_id IN (
      SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()
    )
  );

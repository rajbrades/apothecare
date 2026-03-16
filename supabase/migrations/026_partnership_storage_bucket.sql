-- ============================================================
-- 026: Partnership Document Storage Bucket
-- Creates a private Supabase Storage bucket for partnership PDFs
-- and policies for admin upload + authenticated read.
-- ============================================================

-- ── Create private bucket for partnership documents ──────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partnership-docs',
  'partnership-docs',
  false,
  52428800,  -- 50 MB max file size
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage policies ─────────────────────────────────────────

-- Admins can upload files (service role bypasses RLS, so this
-- policy allows authenticated users who are checked at the API layer)
CREATE POLICY "partnership_docs_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'partnership-docs');

-- Authenticated users can read partnership docs
CREATE POLICY "partnership_docs_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'partnership-docs');

-- Admins can delete files (checked at API layer)
CREATE POLICY "partnership_docs_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'partnership-docs');

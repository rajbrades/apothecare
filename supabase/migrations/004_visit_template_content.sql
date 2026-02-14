-- Add template_content column to store Tiptap editor JSON
ALTER TABLE visits ADD COLUMN IF NOT EXISTS template_content JSONB DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN visits.template_content IS 'Tiptap editor JSON document. If non-null, the visit uses the block editor; if null, falls back to raw_notes textarea.';

-- Migration 008: Add attachments column to messages table for chat file attachments
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
-- Format: [{ id, name, size, type, storage_path }]

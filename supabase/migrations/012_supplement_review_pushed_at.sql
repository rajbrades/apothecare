-- Migration 012: Track when a supplement review has been pushed to patient file
-- Adds pushed_at timestamp to supplement_reviews for idempotency tracking

ALTER TABLE supplement_reviews ADD COLUMN pushed_at TIMESTAMPTZ;

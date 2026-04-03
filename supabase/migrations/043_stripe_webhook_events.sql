-- Migration 043: Stripe webhook event tracking for idempotency
-- Prevents double-processing of webhook events

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type      TEXT NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_summary JSONB DEFAULT '{}',
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_webhook_events (event_type, processed_at DESC);

-- RLS: service role only (no client access)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE stripe_webhook_events IS 'Idempotency tracking for Stripe webhook events. Service role insert only.';

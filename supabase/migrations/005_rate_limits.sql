-- ===========================================
-- Migration 005: Generic Rate Limiting
-- ===========================================
-- Adds a dedicated rate_limits table and a generic check_rate_limit RPC
-- that supports configurable per-action, per-tier, sliding-window limits.

-- ===========================================
-- TABLE: rate_limits
-- ===========================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(practitioner_id, action)
);

-- Index for cleanup queries (find expired windows)
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- ===========================================
-- RLS
-- ===========================================

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Practitioners can read their own rate limit rows (useful for future client-side display)
CREATE POLICY "rate_limits_select_own" ON rate_limits
  FOR SELECT USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- No INSERT/UPDATE/DELETE policy for authenticated users.
-- All writes go through the SECURITY DEFINER RPC below.

-- ===========================================
-- RPC: check_rate_limit
-- ===========================================
-- Atomic check-and-increment with row-level locking.
-- Returns JSONB: { allowed: bool, remaining: int, reset_at: timestamptz }
--
-- Parameters:
--   p_practitioner_id: the practitioner to check
--   p_action: the action being rate-limited (e.g., 'visit_generate')
--   p_max_count: maximum requests allowed in the window
--   p_window_interval: window duration as a PostgreSQL interval (e.g., '1 day')

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_practitioner_id UUID,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_interval INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  v_row rate_limits%ROWTYPE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Ensure a row exists (no-op if it already does).
  INSERT INTO rate_limits (practitioner_id, action, request_count, window_start)
  VALUES (p_practitioner_id, p_action, 0, NOW())
  ON CONFLICT (practitioner_id, action) DO NOTHING;

  -- Lock the row for the duration of this transaction.
  SELECT * INTO v_row
  FROM rate_limits
  WHERE practitioner_id = p_practitioner_id AND action = p_action
  FOR UPDATE;

  -- If the window has expired, reset it.
  IF v_row.window_start + p_window_interval <= NOW() THEN
    UPDATE rate_limits
    SET request_count = 1, window_start = NOW()
    WHERE practitioner_id = p_practitioner_id AND action = p_action;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_count - 1,
      'reset_at', NOW() + p_window_interval
    );
  END IF;

  -- Window is still active. Check if at or over the limit.
  v_reset_at := v_row.window_start + p_window_interval;

  IF v_row.request_count >= p_max_count THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', v_reset_at
    );
  END IF;

  -- Under the limit: increment and allow.
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE practitioner_id = p_practitioner_id AND action = p_action;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_count - (v_row.request_count + 1),
    'reset_at', v_reset_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- CLEANUP FUNCTION (optional, for pg_cron)
-- ===========================================
-- Removes rate_limit rows whose windows expired more than 7 days ago.

CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

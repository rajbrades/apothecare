-- Migration 033: Harden audit_logs for HIPAA compliance
--
-- 1. Make audit_logs append-only: practitioners cannot delete or update rows.
--    Only the service role (used server-side) can insert.
-- 2. Add retention_until column (created_at + 6 years) for retention queries.
-- 3. Add index on created_at for efficient retention/reporting queries.

-- Drop any existing permissive policies first
DROP POLICY IF EXISTS "Practitioners can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Enable RLS if not already enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Practitioners can only SELECT their own logs — no insert/update/delete
CREATE POLICY "Practitioners can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    practitioner_id IN (
      SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()
    )
  );

-- Prevent any client-side deletes or updates (service role bypasses RLS)
-- No INSERT policy needed — inserts are done via service role only

-- Index for retention queries and time-range reporting
-- (retention_until = created_at + 6 years — compute in queries, no stored column needed)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_practitioner_action
  ON public.audit_logs (practitioner_id, action, created_at DESC);

COMMENT ON TABLE public.audit_logs IS
  'HIPAA audit trail. Append-only via RLS — service role inserts only. '
  'Retain all rows for minimum 6 years per 45 CFR §164.530(j). '
  'Do not delete rows without legal authorization.';

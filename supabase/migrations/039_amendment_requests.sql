-- ==========================================
-- 039_amendment_requests.sql
-- HIPAA §164.526: Patient Right to Amendment
--   - Patients can request corrections to their PHI
--   - Practitioner reviews and approves/denies with reason
-- ==========================================

CREATE TABLE IF NOT EXISTS public.amendment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    practitioner_id UUID NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    current_value TEXT,
    requested_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.amendment_requests ENABLE ROW LEVEL SECURITY;

-- Patients can read their own amendment requests
CREATE POLICY "Patients read own amendments"
    ON public.amendment_requests
    FOR SELECT
    USING (patient_id IN (
        SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    ));

-- Patients can insert their own amendment requests
CREATE POLICY "Patients create own amendments"
    ON public.amendment_requests
    FOR INSERT
    WITH CHECK (patient_id IN (
        SELECT id FROM public.patients WHERE auth_user_id = auth.uid()
    ));

-- Practitioners can read their patients' amendment requests
CREATE POLICY "Practitioners read patient amendments"
    ON public.amendment_requests
    FOR SELECT
    USING (practitioner_id IN (
        SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()
    ));

-- Practitioners can update (approve/deny) their patients' amendment requests
CREATE POLICY "Practitioners update patient amendments"
    ON public.amendment_requests
    FOR UPDATE
    USING (practitioner_id IN (
        SELECT id FROM public.practitioners WHERE auth_user_id = auth.uid()
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amendment_requests_patient
    ON public.amendment_requests(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_amendment_requests_practitioner
    ON public.amendment_requests(practitioner_id, status);

-- Auto-update trigger
CREATE TRIGGER set_amendment_requests_updated_at
BEFORE UPDATE ON public.amendment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

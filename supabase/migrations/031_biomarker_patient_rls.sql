-- ===========================================
-- MIGRATION 031: Patient RLS for biomarker_results
-- ===========================================
-- Allows patients to read biomarker results for their shared lab reports.

DROP POLICY IF EXISTS "biomarker_results_patient_select" ON biomarker_results;
CREATE POLICY "biomarker_results_patient_select" ON biomarker_results
  FOR SELECT
  USING (
    lab_report_id IN (
      SELECT id FROM lab_reports
      WHERE is_shared_with_patient = true
        AND patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    )
  );

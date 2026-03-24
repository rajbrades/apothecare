-- ============================================================
-- 035: Functional Medicine Intake Template
-- Replaces the basic 6-field intake with a comprehensive
-- functional medicine health intake (6 sections, 80+ fields).
-- ============================================================

UPDATE intake_form_templates
SET
  version = 2,
  title = 'Functional Medicine Health Intake',
  schema_json = '[
    {"key":"reason_for_visit","label":"Primary reason for visit","type":"textarea","required":true,"maps_to":"chief_complaints"},
    {"key":"diagnoses","label":"Current & past diagnoses","type":"checkbox_grid","required":false,"maps_to":"medical_history"},
    {"key":"diagnoses_detail","label":"Additional diagnosis details","type":"textarea","required":false,"maps_to":"medical_history"},
    {"key":"medications","label":"Current medications","type":"dynamic_rows","required":false,"maps_to":"current_medications"},
    {"key":"supplements","label":"Current supplements","type":"dynamic_rows","required":false,"maps_to":"supplements"},
    {"key":"allergies_list","label":"Allergies & sensitivities","type":"dynamic_rows","required":false,"maps_to":"allergies"},
    {"key":"top_3_symptoms","label":"Top 3 symptoms to resolve","type":"textarea","required":false},
    {"key":"health_goals","label":"Health goals (next 6 months)","type":"textarea","required":false,"maps_to":"notes"}
  ]'
WHERE id = '00000000-0000-0000-0000-000000000001';

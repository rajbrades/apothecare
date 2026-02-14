import type { EncounterTemplate } from "./types";

export const SOAP_TEMPLATE: EncounterTemplate = {
  visitType: "soap",
  label: "SOAP Note",
  sections: [
    {
      key: "chief_complaint",
      heading: "Chief Complaint",
      badge: "CC",
      placeholder: "Primary reason for the visit...",
      defaultCollapsed: false,
    },
    {
      key: "hpi",
      heading: "History of Present Illness",
      badge: "HPI",
      placeholder: "Onset, duration, severity, associated symptoms, prior treatments...",
      defaultCollapsed: false,
    },
    {
      key: "ros",
      heading: "Review of Systems",
      badge: "ROS",
      placeholder: "Constitutional, HEENT, cardiovascular, respiratory, GI, GU, MSK, neuro, psych...",
      defaultCollapsed: true,
    },
    {
      key: "vitals",
      heading: "Vitals",
      badge: "VS",
      placeholder: "BP, HR, RR, Temp, SpO2, Weight, BMI...",
      defaultCollapsed: true,
    },
    {
      key: "physical_exam",
      heading: "Physical Exam",
      badge: "PE",
      placeholder: "General appearance, HEENT, cardiovascular, pulmonary, abdomen, extremities, neuro...",
      defaultCollapsed: true,
    },
    {
      key: "lab_results",
      heading: "Lab Results",
      badge: "Lab",
      placeholder: "CBC, CMP, thyroid panel, inflammatory markers, specialty labs...",
      defaultCollapsed: true,
    },
    {
      key: "medications",
      heading: "Medications & Supplements",
      badge: "Rx",
      placeholder: "Current medications, supplements, dosages...",
      defaultCollapsed: true,
    },
    {
      key: "assessment",
      heading: "Assessment",
      badge: "A",
      placeholder: "Clinical impressions, diagnoses, root cause analysis...",
      defaultCollapsed: false,
    },
    {
      key: "plan",
      heading: "Plan",
      badge: "P",
      placeholder: "Treatment plan, dietary changes, supplements, follow-up labs, referrals...",
      defaultCollapsed: false,
    },
  ],
};

export const HP_TEMPLATE: EncounterTemplate = {
  visitType: "history_physical",
  label: "History & Physical",
  sections: [
    {
      key: "chief_complaint",
      heading: "Chief Complaint",
      badge: "CC",
      placeholder: "Primary reason for the visit in the patient's words...",
      defaultCollapsed: false,
    },
    {
      key: "hpi",
      heading: "History of Present Illness",
      badge: "HPI",
      placeholder: "Detailed narrative — onset, location, duration, character, aggravating/alleviating factors...",
      defaultCollapsed: false,
    },
    {
      key: "pmh",
      heading: "Past Medical History",
      badge: "PMH",
      placeholder: "Chronic conditions, surgeries, hospitalizations...",
      defaultCollapsed: true,
    },
    {
      key: "family_history",
      heading: "Family History",
      badge: "FH",
      placeholder: "Relevant hereditary conditions, parental and sibling health history...",
      defaultCollapsed: true,
    },
    {
      key: "social_history",
      heading: "Social History",
      badge: "SH",
      placeholder: "Occupation, lifestyle factors (diet, exercise, sleep, stress), tobacco, alcohol, substances, environmental exposures...",
      defaultCollapsed: true,
    },
    {
      key: "ros",
      heading: "Review of Systems",
      badge: "ROS",
      placeholder: "Systematic screening by body system — constitutional, HEENT, CV, respiratory, GI, GU, MSK, neuro, psych, integumentary, endocrine...",
      defaultCollapsed: true,
    },
    {
      key: "medications_allergies",
      heading: "Medications & Allergies",
      badge: "Rx",
      placeholder: "Current medications, supplements with dosing. Drug, food, and environmental allergies with reaction types...",
      defaultCollapsed: true,
    },
    {
      key: "vitals",
      heading: "Vitals",
      badge: "VS",
      placeholder: "BP, HR, RR, Temp, SpO2, Weight, BMI...",
      defaultCollapsed: true,
    },
    {
      key: "physical_exam",
      heading: "Physical Examination",
      badge: "PE",
      placeholder: "General appearance, HEENT, neck, CV, pulmonary, abdomen, extremities, neuro, skin, MSK, lymphatic...",
      defaultCollapsed: false,
    },
    {
      key: "lab_diagnostics",
      heading: "Laboratory & Diagnostics",
      badge: "Lab",
      placeholder: "Lab results with both conventional and functional/optimal ranges, diagnostic imaging...",
      defaultCollapsed: true,
    },
    {
      key: "assessment",
      heading: "Assessment",
      badge: "A",
      placeholder: "Problem list, functional medicine assessment, root causes, differential diagnoses...",
      defaultCollapsed: false,
    },
    {
      key: "plan",
      heading: "Plan",
      badge: "P",
      placeholder: "Diagnostic workup, therapeutic interventions, dietary/lifestyle modifications, referrals, follow-up...",
      defaultCollapsed: false,
    },
  ],
};

export const CONSULT_TEMPLATE: EncounterTemplate = {
  visitType: "consult",
  label: "Consultation Note",
  sections: [
    {
      key: "reason_for_consult",
      heading: "Reason for Consultation",
      badge: "RC",
      placeholder: "Why the patient was referred, referring provider, specific question being asked...",
      defaultCollapsed: false,
    },
    {
      key: "relevant_history",
      heading: "Relevant History",
      badge: "Hx",
      placeholder: "HPI focused on the consultation question, relevant past medical/surgical/family history...",
      defaultCollapsed: false,
    },
    {
      key: "focused_exam",
      heading: "Focused Examination",
      badge: "PE",
      placeholder: "Vital signs, focused physical examination pertinent to the consultation question...",
      defaultCollapsed: false,
    },
    {
      key: "records_reviewed",
      heading: "Records Reviewed",
      badge: "RR",
      placeholder: "Summary of outside records, imaging, prior specialist notes...",
      defaultCollapsed: true,
    },
    {
      key: "clinical_impression",
      heading: "Clinical Impression",
      badge: "Dx",
      placeholder: "Synthesized diagnosis, differential, functional medicine perspective, response to consultation question...",
      defaultCollapsed: false,
    },
    {
      key: "recommendations",
      heading: "Recommendations",
      badge: "Rec",
      placeholder: "Specific recommendations for referring provider, protocol, suggested workup, follow-up plan...",
      defaultCollapsed: false,
    },
  ],
};

export const FOLLOW_UP_TEMPLATE: EncounterTemplate = {
  visitType: "follow_up",
  label: "Follow-up",
  sections: [
    {
      key: "progress",
      heading: "Progress Since Last Visit",
      badge: "Prg",
      placeholder: "Symptom changes since last visit — improved, unchanged, worsened...",
      defaultCollapsed: false,
    },
    {
      key: "current_symptoms",
      heading: "Current Symptoms",
      badge: "Sx",
      placeholder: "Current symptom severity, new symptoms or concerns, functional status changes...",
      defaultCollapsed: false,
    },
    {
      key: "protocol_adherence",
      heading: "Protocol Adherence",
      badge: "PA",
      placeholder: "What the patient has been taking/doing, any barriers, supplement/medication compliance...",
      defaultCollapsed: false,
    },
    {
      key: "new_labs",
      heading: "New Labs & Findings",
      badge: "Lab",
      placeholder: "New lab results, compare to previous values, trends (improving, stable, declining)...",
      defaultCollapsed: false,
    },
    {
      key: "updated_assessment",
      heading: "Updated Assessment",
      badge: "A",
      placeholder: "Progress toward treatment goals, protocol effectiveness, need for adjustments...",
      defaultCollapsed: false,
    },
    {
      key: "plan_modifications",
      heading: "Plan Modifications",
      badge: "P",
      placeholder: "Dose changes, additions/removals, new interventions, updated lab schedule, next follow-up...",
      defaultCollapsed: false,
    },
  ],
};

/** All templates indexed by visit type */
export const ENCOUNTER_TEMPLATES: Record<string, EncounterTemplate> = {
  soap: SOAP_TEMPLATE,
  history_physical: HP_TEMPLATE,
  consult: CONSULT_TEMPLATE,
  follow_up: FOLLOW_UP_TEMPLATE,
};

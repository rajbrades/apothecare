// Mock data for the icon-rail sidebar prototype
// Self-contained — no Supabase dependency

export interface MockConversation {
  id: string;
  title: string;
  updated_at: string;
  is_favorited: boolean;
}

export interface MockVisit {
  id: string;
  visit_date: string;
  visit_type: "soap" | "follow_up" | "history_physical" | "consult";
  chief_complaint: string | null;
  patient_name: string;
}

export interface MockPatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  last_visit_date: string | null;
}

export const MOCK_PRACTITIONER = {
  full_name: "Dr. Sarah Chen",
  email: "sarah.chen@integrative.health",
  subscription_tier: "pro" as const,
  initials: "SC",
};

export const MOCK_CONVERSATIONS: MockConversation[] = [
  { id: "conv-1", title: "Berberine vs metformin for insulin resistance", updated_at: "2026-03-02T10:30:00Z", is_favorited: true },
  { id: "conv-2", title: "Elevated zonulin — intestinal permeability protocol", updated_at: "2026-03-01T16:45:00Z", is_favorited: true },
  { id: "conv-3", title: "DUTCH test interpretation for 42F fatigue", updated_at: "2026-03-01T09:15:00Z", is_favorited: false },
  { id: "conv-4", title: "Omega-3 dosing for inflammatory markers", updated_at: "2026-02-28T14:20:00Z", is_favorited: false },
  { id: "conv-5", title: "Methylation pathway SNP implications", updated_at: "2026-02-27T11:00:00Z", is_favorited: false },
  { id: "conv-6", title: "Ashwagandha for HPA axis dysregulation", updated_at: "2026-02-26T08:30:00Z", is_favorited: false },
  { id: "conv-7", title: "Stool analysis — dysbiosis markers interpretation", updated_at: "2026-02-25T15:45:00Z", is_favorited: false },
  { id: "conv-8", title: "NAD+ precursors and mitochondrial support", updated_at: "2026-02-24T10:00:00Z", is_favorited: false },
  { id: "conv-9", title: "Thyroid antibodies and selenium dosing", updated_at: "2026-02-23T13:30:00Z", is_favorited: true },
  { id: "conv-10", title: "Peptide therapy — BPC-157 vs TB-500 comparison", updated_at: "2026-02-22T09:00:00Z", is_favorited: false },
];

export const MOCK_VISITS: MockVisit[] = [
  { id: "visit-1", visit_date: "2026-03-02T09:00:00Z", visit_type: "soap", chief_complaint: "Chronic fatigue, brain fog", patient_name: "Maria Santos" },
  { id: "visit-2", visit_date: "2026-03-01T14:00:00Z", visit_type: "follow_up", chief_complaint: "Thyroid panel review", patient_name: "James Mitchell" },
  { id: "visit-3", visit_date: "2026-02-28T10:30:00Z", visit_type: "history_physical", chief_complaint: "Initial intake — weight gain, fatigue", patient_name: "Priya Patel" },
  { id: "visit-4", visit_date: "2026-02-27T15:00:00Z", visit_type: "consult", chief_complaint: "Gut health protocol review", patient_name: "David Nguyen" },
  { id: "visit-5", visit_date: "2026-02-26T11:00:00Z", visit_type: "soap", chief_complaint: "Migraines, sleep disruption", patient_name: "Emily Johansson" },
  { id: "visit-6", visit_date: "2026-02-25T09:30:00Z", visit_type: "follow_up", chief_complaint: "Adrenal protocol — 6 week check", patient_name: "Robert Kim" },
];

export const MOCK_PATIENTS: MockPatient[] = [
  { id: "pt-1", first_name: "Emily", last_name: "Johansson", date_of_birth: "1984-07-15", last_visit_date: "2026-02-26T11:00:00Z" },
  { id: "pt-2", first_name: "James", last_name: "Mitchell", date_of_birth: "1972-03-22", last_visit_date: "2026-03-01T14:00:00Z" },
  { id: "pt-3", first_name: "Robert", last_name: "Kim", date_of_birth: "1990-11-08", last_visit_date: "2026-02-25T09:30:00Z" },
  { id: "pt-4", first_name: "Maria", last_name: "Santos", date_of_birth: "1988-01-30", last_visit_date: "2026-03-02T09:00:00Z" },
  { id: "pt-5", first_name: "David", last_name: "Nguyen", date_of_birth: "1965-09-12", last_visit_date: "2026-02-27T15:00:00Z" },
  { id: "pt-6", first_name: "Priya", last_name: "Patel", date_of_birth: "1995-05-19", last_visit_date: "2026-02-28T10:30:00Z" },
  { id: "pt-7", first_name: "Sarah", last_name: "Adler", date_of_birth: "1979-12-03", last_visit_date: "2026-02-20T10:00:00Z" },
  { id: "pt-8", first_name: "Thomas", last_name: "Brandt", date_of_birth: "1958-06-27", last_visit_date: null },
];

export const VISIT_TYPE_LABELS: Record<MockVisit["visit_type"], string> = {
  soap: "SOAP",
  follow_up: "Follow-up",
  history_physical: "H&P",
  consult: "Consult",
};

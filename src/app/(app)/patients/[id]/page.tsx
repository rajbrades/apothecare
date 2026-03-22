import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { PatientProfile } from "@/components/patients/patient-profile";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  const [{ data: patient, error }, { data: documents }, { data: visits }, { data: labReports }, { data: supplements }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, practitioner_id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, notes, clinical_summary, ifm_matrix, fm_timeline_data, dietary_recommendations, lifestyle_recommendations, follow_up_labs, portal_status, is_archived, created_at, updated_at")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single(),
    supabase
      .from("patient_documents")
      .select("id, file_name, file_size, document_type, title, status, error_message, uploaded_at, extracted_at")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("visits")
      .select("id, visit_date, visit_type, status, chief_complaint, subjective, assessment")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("visit_date", { ascending: false })
      .limit(10),
    supabase
      .from("lab_reports")
      .select("id, raw_file_name, raw_file_size, lab_vendor, test_type, test_name, status, error_message, is_archived, created_at, collection_date")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("patient_supplements")
      .select("*")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (error || !patient) notFound();

  const validTabs = ["overview", "documents", "trends", "prechart", "ifm_matrix", "visits", "timeline", "fm_timeline"];
  const initialTab = validTabs.includes(tab ?? "") ? tab as "overview" | "documents" | "trends" | "prechart" | "ifm_matrix" | "visits" | "timeline" | "fm_timeline" : "overview";

  return (
    <PatientProfile
      patient={patient}
      documents={documents || []}
      labReports={labReports || []}
      visits={visits || []}
      supplements={supplements || []}
      initialTab={initialTab}
    />
  );
}

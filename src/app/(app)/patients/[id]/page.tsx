import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { PatientProfile } from "@/components/patients/patient-profile";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  const [{ data: patient, error }, { data: documents }, { data: visits }, { data: labReports }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, practitioner_id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, notes, clinical_summary, is_archived, created_at, updated_at")
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
      .select("id, visit_date, visit_type, status, chief_complaint")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("visit_date", { ascending: false })
      .limit(10),
    supabase
      .from("lab_reports")
      .select("id, raw_file_name, raw_file_size, lab_vendor, test_type, test_name, status, error_message, created_at, collection_date")
      .eq("patient_id", id)
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !patient) notFound();

  return (
    <PatientProfile
      patient={patient}
      documents={documents || []}
      labReports={labReports || []}
      visits={visits || []}
    />
  );
}

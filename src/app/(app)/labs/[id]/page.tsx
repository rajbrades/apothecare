import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage/lab-reports";
import { LabReportDetail } from "@/components/labs/lab-report-detail";
import { ShareWithPatientToggle } from "@/components/portal/share-with-patient-toggle";

export default async function LabDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; patientId?: string; patientName?: string }>;
}) {
  const { id } = await params;
  const { from, patientId, patientName } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  // Fetch lab report with ownership check
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("id, practitioner_id, patient_id, visit_id, lab_vendor, test_type, test_name, collection_date, raw_file_url, raw_file_name, raw_file_size, parsed_data, status, error_message, parsing_model, parsing_confidence, is_shared_with_patient, created_at, updated_at, patients(first_name, last_name, date_of_birth, sex)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (error || !report) notFound();

  // Fetch biomarker results
  const { data: biomarkers } = await supabase
    .from("biomarker_results")
    .select("id, biomarker_code, biomarker_name, category, subcategory, value, unit, conventional_low, conventional_high, conventional_flag, functional_low, functional_high, functional_flag, interpretation, clinical_significance, collection_date")
    .eq("lab_report_id", id)
    .order("category", { ascending: true })
    .order("biomarker_name", { ascending: true });

  // Build map of previous values per biomarker_code
  let previousValues: Record<string, number> = {};
  if (report.patient_id && report.collection_date && biomarkers && biomarkers.length > 0) {
    const biomarkerCodes = biomarkers.map((b: any) => b.biomarker_code);

    const { data: previousResults } = await supabase
      .from("biomarker_results")
      .select("biomarker_code, value, collection_date")
      .eq("patient_id", report.patient_id)
      .neq("lab_report_id", id)
      .in("biomarker_code", biomarkerCodes)
      .lt("collection_date", report.collection_date)
      .order("collection_date", { ascending: false });

    // Take the most recent previous value per biomarker_code
    for (const result of previousResults || []) {
      if (!(result.biomarker_code in previousValues)) {
        previousValues[result.biomarker_code] = result.value;
      }
    }
  }

  // Generate signed URL for the original PDF
  let pdfUrl: string | null = null;
  if (report.raw_file_url) {
    try {
      pdfUrl = await getSignedUrl(report.raw_file_url, 3600);
    } catch {
      // Non-fatal — PDF viewing is optional
    }
  }

  const fromPatient = from === "patient" && patientId
    ? { id: patientId, name: decodeURIComponent(patientName || "") }
    : undefined;

  const assignedPatientName = report.patients
    ? [report.patients.first_name, report.patients.last_name].filter(Boolean).join(" ")
    : null;

  return (
    <div>
      {report.patient_id && (
        <div className="px-6 pt-4 pb-0 flex justify-end">
          <ShareWithPatientToggle
            resourceType="lab"
            resourceId={id}
            initialShared={report.is_shared_with_patient ?? false}
            patientName={assignedPatientName}
          />
        </div>
      )}
      <LabReportDetail
        report={report}
        biomarkers={biomarkers || []}
        pdfUrl={pdfUrl}
        previousValues={previousValues}
        fromPatient={fromPatient}
      />
    </div>
  );
}

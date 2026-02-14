import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage/lab-reports";
import { LabReportDetail } from "@/components/labs/lab-report-detail";

export default async function LabDetailPage({
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

  // Fetch lab report with ownership check
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("*, patients(first_name, last_name, date_of_birth, sex)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (error || !report) notFound();

  // Fetch biomarker results
  const { data: biomarkers } = await supabase
    .from("biomarker_results")
    .select("*")
    .eq("lab_report_id", id)
    .order("category", { ascending: true })
    .order("biomarker_name", { ascending: true });

  // Generate signed URL for the original PDF
  let pdfUrl: string | null = null;
  if (report.raw_file_url) {
    try {
      pdfUrl = await getSignedUrl(report.raw_file_url, 3600);
    } catch {
      // Non-fatal — PDF viewing is optional
    }
  }

  return (
    <LabReportDetail
      report={report}
      biomarkers={biomarkers || []}
      pdfUrl={pdfUrl}
    />
  );
}

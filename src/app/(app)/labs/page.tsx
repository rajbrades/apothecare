import { redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { LabListClient } from "@/components/labs/lab-list-client";

export default async function LabsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  // Fetch initial labs server-side
  const { data: labs } = await supabase
    .from("lab_reports")
    .select("id, test_name, lab_vendor, test_type, collection_date, status, raw_file_name, raw_file_size, created_at, patients(first_name, last_name)")
    .eq("practitioner_id", practitioner.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch patient list for the upload form
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("last_name", { ascending: true })
    .limit(500);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Lab Results
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Upload lab panels for AI-powered biomarker extraction and functional range analysis
        </p>
      </div>

      {labs && labs.length > 0 ? (
        <LabListClient initialLabs={labs} patients={patients || []} />
      ) : (
        <div>
          {/* Upload section always visible when empty */}
          <LabListClient initialLabs={[]} patients={patients || []} />

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-6">
              <FlaskConical className="w-8 h-8 text-[var(--color-brand-600)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              No lab reports yet
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm">
              Upload a lab report PDF above to get started. AI will extract biomarker
              values and compare against functional and conventional reference ranges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

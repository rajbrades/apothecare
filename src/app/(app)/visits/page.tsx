import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { VisitListClient } from "@/components/visits/visit-list-client";

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; patient_id?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const params = await searchParams;
  const supabase = await createClient();

  // Fetch initial visits server-side
  let query = supabase
    .from("visits")
    .select("id, visit_date, visit_type, status, chief_complaint, patient_id, patients(first_name, last_name)")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("visit_date", { ascending: false })
    .limit(20);

  if (params.status) query = query.eq("status", params.status);
  if (params.patient_id) query = query.eq("patient_id", params.patient_id);

  const { data: visits } = await query;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Visit Notes
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            AI-assisted clinical documentation with SOAP notes and IFM mapping
          </p>
        </div>
        <Link
          href="/visits/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Visit
        </Link>
      </div>

      {/* Visit list or empty state */}
      {visits && visits.length > 0 ? (
        <VisitListClient initialVisits={visits} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-6">
            <Stethoscope className="w-8 h-8 text-[var(--color-brand-600)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            No visits yet
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm mb-5">
            Start documenting patient visits with AI-assisted SOAP notes,
            IFM Matrix mapping, and evidence-based protocol recommendations.
          </p>
          <Link
            href="/visits/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start First Visit
          </Link>
        </div>
      )}
    </div>
  );
}

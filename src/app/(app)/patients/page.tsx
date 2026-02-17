import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { escapePostgrestPattern } from "@/lib/search";
import { PatientListClient } from "@/components/patients/patient-list-client";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const { search } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, sex, chief_complaints, updated_at")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (search) {
    const escaped = escapePostgrestPattern(search);
    query = query.or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%`);
  }

  const { data: patients } = await query;
  const patientList = patients || [];

  const nextCursor = patientList.length === 20
    ? patientList[patientList.length - 1].updated_at
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Patients</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage patient profiles and clinical documents
          </p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Patient
        </Link>
      </div>

      {patientList.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[var(--color-brand-600)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-medium text-[var(--color-text-primary)] mb-1">No patients yet</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Add your first patient to get started
          </p>
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-700)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </Link>
        </div>
      ) : (
        <PatientListClient
          initialPatients={patientList}
          initialCursor={nextCursor}
        />
      )}
    </div>
  );
}

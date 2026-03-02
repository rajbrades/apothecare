import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { VisitWorkspace } from "@/components/visits/visit-workspace";
import type { VitalsData, HealthRatings } from "@/types/database";

export default async function VisitDetailPage({
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
  const [{ data: visit, error }, { data: patients }] = await Promise.all([
    supabase
      .from("visits")
      .select("*, patients(id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies, notes)")
      .eq("id", id)
      .eq("practitioner_id", practitioner.id)
      .single(),
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("last_name", { ascending: true })
      .limit(500),
  ]);

  if (error || !visit) notFound();

  // Fetch most recent prior visit with vitals for carry-forward
  let previousVitalsContext: {
    vitals: VitalsData | null;
    ratings: HealthRatings | null;
    date: string;
  } | null = null;

  if (visit.patient_id) {
    const { data: priorVisits } = await supabase
      .from("visits")
      .select("visit_date, vitals_data, health_ratings")
      .eq("patient_id", visit.patient_id)
      .eq("practitioner_id", practitioner.id)
      .neq("id", id)
      .or("vitals_data.not.is.null,health_ratings.not.is.null")
      .order("visit_date", { ascending: false })
      .limit(1);

    if (priorVisits && priorVisits.length > 0) {
      const row = priorVisits[0];
      previousVitalsContext = {
        vitals: (row.vitals_data as VitalsData) ?? null,
        ratings: (row.health_ratings as HealthRatings) ?? null,
        date: row.visit_date,
      };
    }
  }

  return (
    <VisitWorkspace
      visit={visit}
      patients={patients || []}
      previousVitalsContext={previousVitalsContext}
    />
  );
}

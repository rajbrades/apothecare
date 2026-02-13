import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { VisitWorkspace } from "@/components/visits/visit-workspace";

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
  const { data: visit, error } = await supabase
    .from("visits")
    .select("*, patients(id, first_name, last_name, date_of_birth, sex, chief_complaints, medical_history, current_medications, supplements, allergies)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (error || !visit) notFound();

  return <VisitWorkspace visit={visit} />;
}

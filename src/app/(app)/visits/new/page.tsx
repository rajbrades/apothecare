import { redirect } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { NewVisitForm } from "@/components/visits/new-visit-form";

export default async function NewVisitPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  // Fetch patient list for the selector
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <NewVisitForm patients={patients || []} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { SupplementsPageClient } from "@/components/supplements/supplements-page-client";

export default async function SupplementsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  // Fetch initial reviews with patient names
  const { data: reviews } = await supabase
    .from("supplement_reviews")
    .select(
      "id, patient_id, status, review_data, created_at, patients(first_name, last_name)"
    )
    .eq("practitioner_id", practitioner.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch patients for selector
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, supplements, current_medications")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("last_name", { ascending: true })
    .limit(500);

  // Overlay structured patient_supplements when available — prefer over freeform field
  type PatientRow = { id: string; first_name: string | null; last_name: string | null; supplements: string | null; current_medications: string | null };
  let mergedPatients: PatientRow[] = (patients || []) as PatientRow[];
  if (mergedPatients.length > 0) {
    const { data: structuredSupps } = await supabase
      .from("patient_supplements")
      .select("patient_id, name, dosage")
      .in("patient_id", mergedPatients.map((p) => p.id))
      .eq("status", "active")
      .order("sort_order", { ascending: true });

    if (structuredSupps && structuredSupps.length > 0) {
      const suppsByPatient = new Map<string, string[]>();
      for (const s of structuredSupps as { patient_id: string; name: string; dosage: string | null }[]) {
        const list = suppsByPatient.get(s.patient_id) ?? [];
        list.push(s.dosage ? `${s.name} ${s.dosage}` : s.name);
        suppsByPatient.set(s.patient_id, list);
      }
      mergedPatients = mergedPatients.map((p) => {
        const structured = suppsByPatient.get(p.id);
        return structured ? { ...p, supplements: structured.join("\n") } : p;
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Supplement Intelligence
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          AI-powered supplement reviews, interaction checks, and brand management
        </p>
      </div>
      <SupplementsPageClient
        initialReviews={reviews || []}
        patients={mergedPatients}
      />
    </div>
  );
}

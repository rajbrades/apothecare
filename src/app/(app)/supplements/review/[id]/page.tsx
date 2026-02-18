import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { SupplementReviewDetail } from "@/components/supplements/supplement-review-detail";

export default async function SupplementReviewPage({
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

  // Fetch review with patient join
  const { data: review } = await supabase
    .from("supplement_reviews")
    .select("*, patients(first_name, last_name)")
    .eq("id", id)
    .eq("practitioner_id", practitioner.id)
    .single();

  if (!review) notFound();

  const patientName =
    [review.patients?.first_name, review.patients?.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown Patient";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm mb-6"
      >
        <Link
          href="/supplements"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Supplements
        </Link>
        <span className="text-[var(--color-text-muted)]">&gt;</span>
        <span className="text-[var(--color-text-primary)]">{patientName}</span>
      </nav>
      <SupplementReviewDetail review={review} patientName={patientName} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get practitioner profile
  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) {
    redirect("/auth/onboarding");
  }

  // Parallelize remaining queries
  const [{ data: recentConversations }, { data: recentVisits }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("visits")
      .select("id, visit_date, chief_complaint")
      .eq("practitioner_id", practitioner.id)
      .eq("is_archived", false)
      .order("visit_date", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Sidebar
        practitioner={{
          full_name: practitioner.full_name,
          email: practitioner.email,
          subscription_tier: practitioner.subscription_tier,
        }}
        recentConversations={recentConversations || []}
        recentVisits={recentVisits || []}
      />

      {/* Main content area */}
      <main className="ml-[var(--sidebar-width)]">
        {/* Trust banner */}
        <div className="bg-[var(--color-brand-50)] border-b border-[var(--color-brand-100)] px-6 py-2 text-center text-sm text-[var(--color-brand-700)]">
          Evidence partnerships with{" "}
          <span className="font-semibold underline">A4M</span>,{" "}
          <span className="font-semibold underline">IFM</span>,{" "}
          <span className="font-semibold underline">Cleveland Clinic</span>, and more.
        </div>

        {children}
      </main>
    </div>
  );
}

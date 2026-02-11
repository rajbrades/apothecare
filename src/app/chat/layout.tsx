import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ChatLayout({
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

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) {
    redirect("/auth/onboarding");
  }

  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: recentVisits } = await supabase
    .from("visits")
    .select("id, visit_date, chief_complaint")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("visit_date", { ascending: false })
    .limit(3);

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
      <main className="ml-[var(--sidebar-width)]">
        {children}
      </main>
    </div>
  );
}

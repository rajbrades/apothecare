import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side guard: requires authenticated practitioner with
 * corporate admin role. Redirects to dashboard if not authorized.
 *
 * Returns the practitioner, corporate account, and membership.
 */
export async function requireCorporateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, full_name, email")
    .eq("auth_user_id", user.id)
    .single();

  if (!practitioner) redirect("/auth/onboarding");

  const { data: membership } = await supabase
    .from("corporate_provider_memberships")
    .select("id, corporate_id, role, corporate_accounts(id, name, slug, logo_url, branding)")
    .eq("practitioner_id", practitioner.id)
    .eq("role", "admin")
    .eq("is_active", true)
    .single();

  if (!membership) redirect("/dashboard");

  const corporate = membership.corporate_accounts as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    branding: Record<string, unknown>;
  };

  return { practitioner, corporate, membership };
}

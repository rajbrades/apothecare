import { redirect } from "next/navigation";
import { getAuthUser, getFullPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "@/components/settings/settings-page";

export default async function SettingsRoute() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getFullPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  // Fetch brand preferences server-side
  const supabase = await createClient();
  const { data: brandRows } = await supabase
    .from("practitioner_brand_preferences")
    .select("id, brand_name, priority, is_active")
    .eq("practitioner_id", practitioner.id)
    .order("priority", { ascending: true });

  const allBrands = brandRows || [];
  const strictModeRow = allBrands.find((b: any) => b.brand_name === "__strict_mode__");
  const brands = allBrands.filter((b: any) => b.brand_name !== "__strict_mode__");
  const strictMode = strictModeRow?.is_active ?? false;

  return (
    <SettingsPage
      practitioner={practitioner}
      initialBrands={brands}
      initialStrictMode={strictMode}
      userEmail={user.email!}
      authProvider={user.app_metadata?.provider || "email"}
    />
  );
}

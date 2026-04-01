import { redirect } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata = {
  title: "Clinical Insights | Apothecare",
  description: "Practice-level analytics and clinical insights dashboard",
};

export default async function AnalyticsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  return (
    <AnalyticsDashboard
      subscriptionTier={practitioner.subscription_tier}
    />
  );
}

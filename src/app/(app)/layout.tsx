import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import {
  getAuthUser,
  getPractitioner,
  getSidebarData,
} from "@/lib/supabase/cached-queries";

/**
 * Shared authenticated layout for /chat and /dashboard routes.
 *
 * Fetches auth, practitioner, and sidebar data once. Because Next.js
 * preserves layouts across client-side navigations, moving between
 * /chat and /dashboard no longer triggers redundant database calls.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const practitioner = await getPractitioner(user.id);

  if (!practitioner) {
    redirect("/auth/onboarding");
  }

  const { recentConversations, recentVisits } = await getSidebarData(
    practitioner.id
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-brand-600)] focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Sidebar
        practitioner={{
          full_name: practitioner.full_name,
          email: practitioner.email,
          subscription_tier: practitioner.subscription_tier,
        }}
        recentConversations={recentConversations}
        recentVisits={recentVisits}
      />
      <main id="main-content" className="pt-[var(--header-height)] md:pt-0 md:ml-[var(--sidebar-width)]">{children}</main>
    </div>
  );
}

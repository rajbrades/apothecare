import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dna, Stethoscope, Users } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("full_name, subscription_tier, daily_query_count, daily_query_reset_at")
    .eq("auth_user_id", user.id)
    .single();

  // Reset stale daily count on the client side for display
  let queriesUsed = practitioner?.daily_query_count || 0;
  if (practitioner?.daily_query_reset_at) {
    const resetAt = new Date(practitioner.daily_query_reset_at);
    const now = new Date();
    if (now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000) {
      queriesUsed = 0;
    }
  }
  const isFree = practitioner?.subscription_tier === "free";
  const queriesRemaining = isFree ? Math.max(0, 2 - queriesUsed) : null;

  const suggestedQuestions = [
    "What are evidence-based interventions for elevated zonulin and intestinal permeability?",
    "Compare berberine vs. metformin for insulin resistance in prediabetic patients",
    "Optimal DUTCH test interpretation for a 42F with fatigue and weight gain",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-40px)] px-6">
      {/* Brand mark */}
      <div className="mb-6">
        <Logomark size="lg" />
      </div>

      {/* Search input */}
      <div className="w-full max-w-2xl mb-6">
        <form action="/chat" method="GET">
          <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <input
              name="q"
              type="text"
              placeholder="Ask a clinical question..."
              className="w-full px-6 py-4 text-base bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] rounded-[var(--radius-lg)]"
              autoFocus
            />
            <div className="flex items-center justify-between px-6 pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[var(--color-text-muted)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  📎 Attach
                </button>
                <select className="text-xs text-[var(--color-text-muted)] bg-transparent border border-[var(--color-border-light)] rounded-full px-3 py-1 outline-none">
                  <option value="">Select Patient</option>
                </select>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[var(--color-text-muted)] border border-[var(--color-border-light)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-600)] hover:border-[var(--color-brand-200)] transition-colors"
                >
                  🔬 Deep Consult
                </button>
              </div>
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center hover:bg-[var(--color-brand-700)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Query limit indicator for free users */}
        {isFree && (
          <div className="text-center mt-3">
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="font-[var(--font-mono)]">{queriesRemaining}</span> of <span className="font-[var(--font-mono)]">2</span> free queries remaining today
              {queriesRemaining === 0 && (
                <> · <Link href="/pricing" className="text-[var(--color-brand-600)] font-medium hover:underline">Upgrade to Pro</Link></>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      <div className="w-full max-w-2xl space-y-2">
        {suggestedQuestions.map((q) => (
          <Link
            key={q}
            href={`/chat?q=${encodeURIComponent(q)}`}
            className="flex items-center justify-between w-full px-5 py-3.5 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all group"
          >
            <span>{q}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors flex-shrink-0 ml-3"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ))}

        {/* Refresh button */}
        <button className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Quick action cards */}
      <div className="flex gap-4 mt-12">
        {[
          { href: "/labs", icon: <Dna className="icon-feature" />, label: "Upload Labs" },
          { href: "/visits/new", icon: <Stethoscope className="icon-feature" />, label: "Start Visit" },
          { href: "/patients", icon: <Users className="icon-feature" />, label: "Patients" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-700)]"
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

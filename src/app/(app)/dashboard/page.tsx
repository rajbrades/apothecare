import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Dna, MessageSquare, Stethoscope, Users } from "lucide-react";
import { EvidenceSection } from "@/components/dashboard/evidence-section";
import { ResetCountdown } from "@/components/ui/reset-countdown";
import { getAuthUser, getPractitioner, getSidebarData, getActivePartnerships, getPractitionerPartnerships } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { CreateVisitButton } from "@/components/visits/create-visit-button";
import { formatRelativeTime } from "@/lib/utils";
import { type ConversationItem } from "@/components/layout/sidebar-conversation";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  // Parse display name — use last name if full_name has multiple words
  const nameParts = (practitioner.full_name || "").trim().split(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : practitioner.full_name || "";
  const displayName = lastName ? `Dr. ${lastName}` : "Doctor";

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

  const supabase = await createClient();

  let patients: { id: string; first_name: string | null; last_name: string | null }[] = [];
  let recentConversations: ConversationItem[] = [];
  let partnerships: Awaited<ReturnType<typeof getActivePartnerships>> = [];
  let practitionerPartnerships: Awaited<ReturnType<typeof getPractitionerPartnerships>> = [];

  try {
    const [patientsRes, sidebarRes, partnershipsRes, practPartRes] = await Promise.all([
      supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("practitioner_id", practitioner.id)
        .eq("is_archived", false)
        .order("last_name", { ascending: true })
        .limit(500),
      getSidebarData(practitioner.id),
      getActivePartnerships(),
      isFree ? Promise.resolve([]) : getPractitionerPartnerships(practitioner.id),
    ]);
    patients = patientsRes.data || [];
    recentConversations = sidebarRes.recentConversations;
    partnerships = partnershipsRes;
    practitionerPartnerships = practPartRes;
  } catch (err) {
    console.error("[Dashboard] Failed to load data:", err);
  }

  const hasConversations = recentConversations.length > 0;

  const suggestedQuestions = [
    "What are evidence-based interventions for elevated zonulin and intestinal permeability?",
    "Compare berberine vs. metformin for insulin resistance in prediabetic patients",
    "Optimal DUTCH test interpretation for a 42F with fatigue and weight gain",
  ];

  return (
    <div className="flex flex-col items-center px-6 pt-14 pb-16 min-h-[calc(100vh-40px)]">
      {/* Greeting */}
      <div className="w-full max-w-2xl mb-7 text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          What would you like to explore today?
        </p>
      </div>

      {/* Search input */}
      <div className="w-full max-w-2xl mb-5">
        <DashboardSearch patients={patients || []} defaultSources={practitioner.preferred_evidence_sources} />

        {/* Query limit indicator for free users */}
        {isFree && (
          <div className="text-center mt-3">
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="font-[var(--font-mono)]">{queriesRemaining}</span> of <span className="font-[var(--font-mono)]">2</span> free queries remaining today
              {queriesRemaining === 0 && (
                <>
                  {" · "}
                  <ResetCountdown />
                  {" · "}
                  <Link href="/pricing" className="text-[var(--color-brand-600)] font-medium hover:underline">Upgrade to Pro</Link>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Recent conversations or suggested questions */}
      <div className="w-full max-w-2xl space-y-2">
        {hasConversations ? (
          <>
            <div className="flex items-center gap-2 mb-1 px-1">
              <MessageSquare className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Recent conversations
              </span>
            </div>
            {recentConversations.map((conv: ConversationItem) => (
              <Link
                key={conv.id}
                href={`/chat?id=${conv.id}`}
                className="flex items-center justify-between w-full px-5 py-3.5 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] transition-all group"
              >
                <span className="truncate mr-3">{conv.title || "Untitled conversation"}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatRelativeTime(conv.updated_at)}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </>
        ) : (
          suggestedQuestions.map((q) => (
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
          ))
        )}
      </div>

      {/* Quick action cards */}
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <Link
          href="/labs"
          className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]"
        >
          <Dna className="icon-feature" />
          Upload Labs
        </Link>
        <CreateVisitButton
          className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]"
        >
          <Stethoscope className="icon-feature" />
          Start Visit
        </CreateVisitButton>
        <Link
          href="/patients"
          className="flex flex-col items-center gap-2 px-6 py-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-400)] transition-all text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)]"
        >
          <Users className="icon-feature" />
          Patients
        </Link>
      </div>

      {/* Evidence partnerships section — tier-aware */}
      <EvidenceSection
        isFree={isFree}
        partnerships={partnerships}
        practitionerPartnerships={practitionerPartnerships}
      />

      {/* Evidence trust badge */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <span className="text-[11px] text-[var(--color-text-muted)]">Powered by evidence from</span>
        <div className="flex items-center gap-6 opacity-40 grayscale">
          <Image src="/logos/a4m.svg" alt="A4M" width={40} height={20} />
          <Image src="/logos/ifm.svg" alt="IFM" width={38} height={20} />
          <Image src="/logos/cleveland-clinic.svg" alt="Cleveland Clinic" width={108} height={20} />
          <Image src="/logos/pubmed.svg" alt="PubMed" width={70} height={20} />
          <Image src="/logos/cochrane.svg" alt="Cochrane" width={80} height={20} />
        </div>
      </div>
    </div>
  );
}

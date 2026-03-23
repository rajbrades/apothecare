import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logomark } from "@/components/ui/logomark";
import { Shield } from "lucide-react";

interface Props {
  params: Promise<{ portalSlug: string }>;
}

export default async function PortalEntryPage({ params }: Props) {
  const { portalSlug } = await params;
  const service = createServiceClient();

  const { data: practitioner } = await service
    .from("practitioners")
    .select("id, full_name, practice_name, portal_slug")
    .eq("portal_slug", portalSlug)
    .single();

  if (!practitioner) return notFound();

  const practiceName = practitioner.practice_name || practitioner.full_name;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          <Logomark className="h-7 w-7" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-none">
              {practiceName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Patient Portal</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
              Welcome to your portal
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              View your lab results, encounter notes, and complete required onboarding forms — all in one secure place.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/portal/login?slug=${portalSlug}`}
              className="block w-full rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white text-sm font-medium py-2.5 px-4 hover:bg-[var(--color-brand-500)] transition-colors text-center shadow-[var(--shadow-card)]"
            >
              Sign in to your portal
            </Link>
            <p className="text-xs text-[var(--color-text-muted)]">
              Don&apos;t have an account?{" "}
              <span className="text-[var(--color-text-secondary)]">
                Check your email for an invitation from {practiceName}.
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Shield className="h-3.5 w-3.5" />
            <p>Secured by Apothecare &middot; HIPAA compliant</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)] py-4 px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</Link>
          <Link href="/telehealth" className="hover:text-[var(--color-text-secondary)] transition-colors">Telehealth</Link>
        </nav>
      </footer>
    </div>
  );
}

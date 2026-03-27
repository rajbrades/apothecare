"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";
import { createClient } from "@/lib/supabase/client";

interface PortalShellProps {
  children: React.ReactNode;
  /** Max content width — "sm" (640px), "2xl" (672px), or "3xl" (768px) */
  maxWidth?: "sm" | "2xl" | "3xl";
}

const WIDTH_CLASSES = {
  sm: "max-w-sm",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
} as const;

export function PortalShell({ children, maxWidth = "3xl" }: PortalShellProps) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/portal/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className={`${WIDTH_CLASSES[maxWidth]} mx-auto px-6 py-4 flex items-center justify-between`}>
          <Link href="/portal/dashboard" className="flex items-center gap-2.5">
            <Logomark className="h-6 w-6" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Patient Portal</span>
          </Link>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-surface-secondary)]"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</a>
          <a href="/security" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</a>
          <a href="/telehealth" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text-secondary)] transition-colors">Telehealth</a>
        </nav>
      </footer>
    </div>
  );
}

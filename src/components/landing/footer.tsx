import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";

export function Footer() {
  return (
    <footer id="about" className="border-t border-[var(--color-border-light)] py-12 bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logomark size="xs" withText />
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Apothecare is a clinical decision support tool. It is not a substitute for
            professional medical judgment. All treatment decisions remain with the licensed
            practitioner.
          </p>
          <nav className="flex items-center gap-6 text-xs text-[var(--color-text-muted)]">
            <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">
              Security
            </Link>
          </nav>
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} Apothecare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

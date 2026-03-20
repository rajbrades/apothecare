"use client";

import Link from "next/link";

/**
 * Small "Pro" pill badge shown next to gated features in nav/UI.
 * Clicking links to the settings subscription section.
 */
export function ProFeatureBadge({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/settings#subscription"
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-[var(--color-gold-100)] text-[var(--color-gold-700)] border border-[var(--color-gold-300)] hover:bg-[var(--color-gold-200)] transition-colors flex-shrink-0 ${className}`}
      title="Upgrade to Pro to unlock this feature"
      onClick={(e) => e.stopPropagation()}
    >
      Pro
    </Link>
  );
}

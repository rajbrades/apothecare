"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Inline upgrade CTA shown when a free-tier practitioner hits a feature gate.
 * Use compact=true for tight spaces (table rows, sidebars).
 */
export function UpgradePrompt({
  feature,
  description,
  compact = false,
  className = "",
}: UpgradePromptProps) {
  if (compact) {
    return (
      <Link
        href="/settings#subscription"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--color-gold-700)] bg-[var(--color-gold-50)] border border-[var(--color-gold-200)] rounded-full hover:bg-[var(--color-gold-100)] transition-colors ${className}`}
      >
        <Sparkles size={11} />
        Upgrade to use {feature}
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-8 px-6 text-center rounded-xl border border-[var(--color-gold-200)] bg-[var(--color-gold-50)] ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--color-gold-100)] flex items-center justify-center">
        <Sparkles size={20} className="text-[var(--color-gold-600)]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {feature} is a Pro feature
        </p>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs">
            {description}
          </p>
        )}
      </div>
      <Link
        href="/settings#subscription"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--color-gold-500)] text-white hover:bg-[var(--color-gold-600)] transition-colors"
      >
        <Sparkles size={14} />
        Upgrade to Pro
      </Link>
    </div>
  );
}

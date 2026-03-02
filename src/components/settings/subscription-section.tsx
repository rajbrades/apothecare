"use client";

import { Sparkles, Zap, FlaskConical, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Practitioner } from "@/types/database";

interface SubscriptionSectionProps {
  practitioner: Practitioner;
}

export function SubscriptionSection({ practitioner }: SubscriptionSectionProps) {
  const isPro = practitioner.subscription_tier === "pro";
  const isFree = !isPro;

  const queryLimit = isFree ? 2 : null;
  const queriesUsed = practitioner.daily_query_count || 0;
  const labsUsed = practitioner.monthly_lab_count || 0;

  const memberSince = new Date(practitioner.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const queryResetTime = practitioner.daily_query_reset_at
    ? new Date(practitioner.daily_query_reset_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
        Subscription & Usage
      </h2>

      {/* Plan badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[var(--color-text-secondary)]">Current Plan</span>
        {isPro ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[var(--color-gold-100)] text-[var(--color-gold-700)] rounded-full">
            <Sparkles className="w-3 h-3" />
            Pro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-full">
            Free
          </span>
        )}
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Daily Queries */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[var(--color-brand-500)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Daily Queries
            </span>
          </div>
          {isFree ? (
            <>
              <p className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-mono)]">
                {queriesUsed} / {queryLimit}
              </p>
              {queryResetTime && (
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Resets at {queryResetTime}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-semibold text-[var(--color-brand-600)]">
              Unlimited
            </p>
          )}
        </div>

        {/* Monthly Labs */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-[var(--color-brand-500)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Labs This Month
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-mono)]">
            {labsUsed}
          </p>
        </div>

        {/* Member Since */}
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-[var(--color-brand-500)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Member Since
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {memberSince}
          </p>
        </div>
      </div>

      {/* CTA */}
      {isFree ? (
        <Button
          variant="gold"
          onClick={() => toast.info("Pro upgrade coming soon")}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Pro
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => toast.info("Billing portal coming soon")}
        >
          Manage Billing
        </Button>
      )}
    </div>
  );
}

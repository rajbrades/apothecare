"use client";

import { useState, useEffect } from "react";
import { Library, CheckCircle2, Lock, Loader2 } from "lucide-react";
import type { Practitioner } from "@/types/database";

interface PartnershipAccess {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hasAccess: boolean;
  documentCount: number;
}

interface PartnershipsSectionProps {
  practitioner: Practitioner;
}

export function PartnershipsSection({ practitioner }: PartnershipsSectionProps) {
  const [partnerships, setPartnerships] = useState<PartnershipAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartnerships() {
      try {
        const res = await fetch("/api/practitioners/partnerships");
        if (res.ok) {
          const data = await res.json();
          setPartnerships(data.partnerships || []);
        }
      } catch {
        // Silently fail — non-critical section
      } finally {
        setLoading(false);
      }
    }
    fetchPartnerships();
  }, []);

  const isPro = practitioner.subscription_tier === "pro";

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Library className="w-5 h-5 text-violet-600" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
          Evidence Partnerships
        </h2>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-5">
        Partner knowledge bases that enhance your evidence sources.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
        </div>
      ) : partnerships.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] py-4">
          No partnerships available.
        </p>
      ) : (
        <div className="space-y-3">
          {partnerships.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border ${
                p.hasAccess
                  ? "border-violet-200 bg-violet-50/50"
                  : "border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.hasAccess ? "bg-violet-100" : "bg-[var(--color-surface-tertiary)]"
                  }`}
                >
                  <Library
                    size={16}
                    className={p.hasAccess ? "text-violet-600" : "text-[var(--color-text-muted)]"}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {p.name}
                  </p>
                  {p.description && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {p.hasAccess && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {p.documentCount} docs
                  </span>
                )}
                {p.hasAccess ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={14} />
                    Active
                  </span>
                ) : !isPro ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)]">
                    <Lock size={14} />
                    Pro only
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Not granted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { FlaskConical, ArrowRight, Clock, Target } from "lucide-react";

interface ActiveProtocolCardProps {
  patientId: string;
  protocols: Array<{
    id: string;
    title: string;
    status: string;
    focus_areas: string[];
    total_duration_weeks: number | null;
    created_at: string;
  }>;
}

export function ActiveProtocolCard({ patientId, protocols }: ActiveProtocolCardProps) {
  const active = protocols.find((p) => p.status === "active");
  if (!active) return null;

  const startDate = new Date(active.created_at);
  const weeksElapsed = Math.floor((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const totalWeeks = active.total_duration_weeks || 0;
  const progressPct = totalWeeks > 0 ? Math.min((weeksElapsed / totalWeeks) * 100, 100) : 0;

  return (
    <Link
      href={`/patients/${patientId}/protocols/${active.id}`}
      className="block rounded-[var(--radius-md)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-card)] transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-600)] flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{active.title}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Active Protocol</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors" />
      </div>

      {totalWeeks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Week {Math.min(weeksElapsed + 1, totalWeeks)} of {totalWeeks}
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-brand-200)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand-600)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {active.focus_areas?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Target className="w-3 h-3 text-[var(--color-text-muted)]" />
          {active.focus_areas.slice(0, 3).map((area) => (
            <span key={area} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-brand-100)] text-[var(--color-brand-700)] capitalize">
              {area.replace(/_/g, " ")}
            </span>
          ))}
          {active.focus_areas.length > 3 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">+{active.focus_areas.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  );
}

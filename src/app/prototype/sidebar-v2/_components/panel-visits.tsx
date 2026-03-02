"use client";

import { Stethoscope } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { MOCK_VISITS, VISIT_TYPE_LABELS } from "./mock-data";
import type { MockVisit } from "./mock-data";

const TYPE_COLORS: Record<MockVisit["visit_type"], string> = {
  soap: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
  follow_up: "bg-blue-50 text-blue-700",
  history_physical: "bg-amber-50 text-amber-700",
  consult: "bg-purple-50 text-purple-700",
};

export function PanelVisits() {
  return (
    <div className="flex flex-col h-full">
      {/* Header sub-text */}
      <div className="px-3 pb-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          {MOCK_VISITS.length} recent visits
        </p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {MOCK_VISITS.map((visit) => (
          <button
            key={visit.id}
            className="w-full text-left px-2 py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-tertiary)] transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {visit.patient_name}
                </p>
                {visit.chief_complaint && (
                  <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                    {visit.chief_complaint}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded ${TYPE_COLORS[visit.visit_type]}`}
              >
                {VISIT_TYPE_LABELS[visit.visit_type]}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              {formatRelativeTime(visit.visit_date)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

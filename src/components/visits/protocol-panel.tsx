"use client";

import { useState } from "react";
import { Loader2, Pill, Salad, HeartPulse, FlaskConical, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { VisitProtocol, ProtocolItem } from "@/types/database";

const EVIDENCE_LABELS: Record<string, string> = {
  meta_analysis: "Meta-Analysis",
  rct: "RCT",
  clinical_guideline: "Guideline",
  cohort_study: "Cohort",
  case_study: "Case Study",
  expert_consensus: "Expert Consensus",
};

const EVIDENCE_COLORS: Record<string, string> = {
  meta_analysis: "bg-[var(--color-evidence-meta-bg)] text-[var(--color-evidence-meta-text)] border-[var(--color-evidence-meta-border)]",
  rct: "bg-blue-50 text-blue-700 border-blue-200",
  clinical_guideline: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cohort_study: "bg-purple-50 text-purple-700 border-purple-200",
  case_study: "bg-gray-50 text-gray-600 border-gray-200",
  expert_consensus: "bg-gray-50 text-gray-600 border-gray-200",
};

function ProtocolItemCard({ item }: { item: ProtocolItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-[var(--color-surface-secondary)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {item.name}
            </span>
            {item.evidence_level && (
              <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded border ${
                EVIDENCE_COLORS[item.evidence_level] || EVIDENCE_COLORS.expert_consensus
              }`}>
                {EVIDENCE_LABELS[item.evidence_level] || item.evidence_level}
              </span>
            )}
          </div>
          {item.dosage && (
            <span className="text-xs text-[var(--color-text-secondary)] font-[var(--font-mono)]">
              {item.dosage}
              {item.form ? ` (${item.form})` : ""}
              {item.timing ? ` — ${item.timing}` : ""}
            </span>
          )}
          {!item.dosage && item.detail && (
            <span className="text-xs text-[var(--color-text-secondary)]">{item.detail}</span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-[var(--color-border-light)]">
          {item.detail && item.dosage && (
            <p className="text-xs text-[var(--color-text-secondary)] pt-2">{item.detail}</p>
          )}
          {item.rationale && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium">Rationale:</span> {item.rationale}
            </p>
          )}
          {item.duration && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium">Duration:</span> {item.duration}
            </p>
          )}
          {item.interactions && item.interactions.length > 0 && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800">
                <span className="font-medium">Interactions:</span>{" "}
                {item.interactions.join("; ")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ProtocolPanelProps {
  protocol: VisitProtocol | Record<string, unknown> | null;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
}

export function ProtocolPanel({ protocol, status }: ProtocolPanelProps) {
  const isGenerating = status === "generating" || status === "streaming";

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-[var(--color-brand-500)]" />
        <p className="text-sm">Generating protocol recommendations...</p>
      </div>
    );
  }

  if (status === "idle" || !protocol) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <p className="text-sm">Generate a SOAP note to get protocol recommendations</p>
      </div>
    );
  }

  const p = protocol as VisitProtocol;
  const sections = [
    { key: "supplements", label: "Supplements", icon: Pill, items: p.supplements || [] },
    { key: "dietary", label: "Dietary", icon: Salad, items: p.dietary || [] },
    { key: "lifestyle", label: "Lifestyle", icon: HeartPulse, items: p.lifestyle || [] },
    { key: "follow_up_labs", label: "Follow-up Labs", icon: FlaskConical, items: p.follow_up_labs || [] },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ key, label, icon: Icon, items }) => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-[var(--color-brand-600)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">({items.length})</span>
          </div>
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, i) => (
                <ProtocolItemCard key={i} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] italic pl-6">
              No {label.toLowerCase()} recommendations
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

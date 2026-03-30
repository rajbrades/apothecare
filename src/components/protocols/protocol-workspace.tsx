"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Play,
  FileDown,
  Archive,
  Check,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PhaseCard } from "./phase-card";
import { cn } from "@/lib/utils";
import type {
  ProtocolWithPhases,
  ProtocolPhase,
  ProtocolStatus,
} from "@/types/protocol";
import type { SubscriptionTier } from "@/lib/tier/gates";

// ── Status badge config ────────────────────────────────────────────

const STATUS_STYLES: Record<
  ProtocolStatus,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Active",
  },
  completed: {
    bg: "bg-[var(--color-brand-600)]/10",
    text: "text-[var(--color-brand-600)]",
    label: "Completed",
  },
  archived: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    label: "Archived",
  },
};

// ── Format date ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Props ──────────────────────────────────────────────────────────

interface ProtocolWorkspaceProps {
  protocol: ProtocolWithPhases;
  patientId: string;
  patientName: string;
  tier: SubscriptionTier;
  isGenerating?: boolean;
  streamText?: string;
  generatedPhasesCount?: number;
}

// ── Component ──────────────────────────────────────────────────────

export function ProtocolWorkspace({
  protocol: initialProtocol,
  patientId,
  patientName,
  tier,
  isGenerating = false,
  streamText = "",
  generatedPhasesCount = 0,
}: ProtocolWorkspaceProps) {
  const router = useRouter();
  const [protocol, setProtocol] = useState(initialProtocol);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const isDraft = protocol.status === "draft";
  const isEditable = isDraft && !isGenerating;
  const status = STATUS_STYLES[protocol.status] || STATUS_STYLES.draft;

  const totalWeeks =
    protocol.total_duration_weeks ||
    protocol.phases.reduce((sum, p) => sum + p.duration_weeks, 0);

  // ── Title edit ───────────────────────────────────────────────

  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setProtocol((prev) => ({ ...prev, title: newTitle }));
      setSaving(true);
      try {
        const res = await fetch(
          `/api/patients/${patientId}/protocols/${protocol.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          }
        );
        if (!res.ok) throw new Error("Save failed");
      } catch {
        toast.error("Failed to save title");
      }
      setSaving(false);
    },
    [patientId, protocol.id]
  );

  // ── Phase update ─────────────────────────────────────────────

  const handlePhaseUpdate = useCallback(
    async (phaseId: string, updates: Partial<ProtocolPhase>) => {
      setProtocol((prev) => ({
        ...prev,
        phases: prev.phases.map((p) =>
          p.id === phaseId ? { ...p, ...updates } : p
        ),
      }));

      // Debounced auto-save could be added here; for now, save immediately
      setSaving(true);
      try {
        const res = await fetch(
          `/api/patients/${patientId}/protocols/${protocol.id}/phases/${phaseId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        if (!res.ok) throw new Error("Save failed");
      } catch {
        toast.error("Failed to save phase changes");
      }
      setSaving(false);
    },
    [patientId, protocol.id]
  );

  // ── Advance phase ────────────────────────────────────────────

  const handleAdvancePhase = useCallback(
    async (phaseId: string) => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/patients/${patientId}/protocols/${protocol.id}/phases/${phaseId}/advance`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to advance phase");
        }
        const { phases: updatedPhases } = await res.json();
        setProtocol((prev) => ({ ...prev, phases: updatedPhases }));
        toast.success("Advanced to next phase");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to advance phase"
        );
      }
      setSaving(false);
    },
    [patientId, protocol.id]
  );

  // ── Extend phase ─────────────────────────────────────────────

  const handleExtendPhase = useCallback(
    async (phaseId: string, additionalWeeks: number) => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/patients/${patientId}/protocols/${protocol.id}/phases/${phaseId}/extend`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ additional_weeks: additionalWeeks }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to extend phase");
        }
        const { phase: updatedPhase } = await res.json();
        setProtocol((prev) => ({
          ...prev,
          phases: prev.phases.map((p) =>
            p.id === updatedPhase.id ? updatedPhase : p
          ),
        }));
        toast.success(`Phase extended by ${additionalWeeks} week${additionalWeeks > 1 ? "s" : ""}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to extend phase"
        );
      }
      setSaving(false);
    },
    [patientId, protocol.id]
  );

  // ── Activate protocol ────────────────────────────────────────

  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/protocols/${protocol.id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to activate protocol");
      }
      const { protocol: updated } = await res.json();
      setProtocol((prev) => ({
        ...prev,
        status: updated.status,
        started_at: updated.started_at,
        phases: updated.phases || prev.phases,
      }));
      toast.success("Protocol activated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to activate protocol"
      );
    }
    setActivating(false);
  }, [patientId, protocol.id]);

  // ── Archive protocol ─────────────────────────────────────────

  const handleArchive = useCallback(async () => {
    setArchiving(true);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/protocols/${protocol.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "archived" }),
        }
      );
      if (!res.ok) throw new Error("Archive failed");
      toast.success("Protocol archived");
      router.push(`/patients/${patientId}`);
    } catch {
      toast.error("Failed to archive protocol");
    }
    setArchiving(false);
    setShowArchiveConfirm(false);
  }, [patientId, protocol.id, router]);

  // ── Export PDF ───────────────────────────────────────────────

  const handleExportPdf = useCallback(() => {
    window.open(
      `/api/patients/${patientId}/protocols/${protocol.id}/export`,
      "_blank"
    );
  }, [patientId, protocol.id]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-3">
            <Link
              href={`/patients/${patientId}`}
              className="flex items-center gap-1 hover:text-[var(--color-brand-600)] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              {patientName}
            </Link>
            <span>/</span>
            <span className="text-[var(--color-text-secondary)]">
              Protocols
            </span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isEditable ? (
                  <input
                    value={protocol.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg font-bold text-[var(--color-text-primary)] font-[var(--font-display)] bg-transparent border-b border-dashed border-[var(--color-border)] focus:border-[var(--color-brand-500)] focus:outline-none pb-0.5 min-w-0 flex-1"
                  />
                ) : (
                  <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-[var(--font-display)] truncate">
                    {protocol.title}
                  </h1>
                )}
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                    status.bg,
                    status.text
                  )}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {totalWeeks} weeks total
                </span>
                <span>
                  {protocol.phases.length} phase
                  {protocol.phases.length !== 1 ? "s" : ""}
                </span>
                {protocol.started_at && (
                  <span>Started {formatDate(protocol.started_at)}</span>
                )}
                {saving && (
                  <span className="flex items-center gap-1 text-[var(--color-brand-600)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isDraft && !isGenerating && (
                <Button
                  size="sm"
                  onClick={handleActivate}
                  disabled={activating || protocol.phases.length === 0}
                >
                  {activating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Play className="w-4 h-4 mr-1.5" />
                  )}
                  Activate Protocol
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
              >
                <FileDown className="w-4 h-4 mr-1.5" />
                Export PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
              >
                <Archive className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Streaming indicator during generation */}
        {isGenerating && (
          <div className="mb-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-brand-600)]/20 shadow-[var(--shadow-card)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-600)]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--color-brand-600)] animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Generating Treatment Protocol
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {generatedPhasesCount > 0
                    ? `${generatedPhasesCount} phase${generatedPhasesCount > 1 ? "s" : ""} generated...`
                    : "Analyzing patient data..."}
                </p>
              </div>
            </div>
            {streamText && (
              <div className="bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                  {streamText}
                </pre>
              </div>
            )}
            {/* Phase progress dots */}
            {generatedPhasesCount > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                {Array.from({ length: Math.max(generatedPhasesCount + 1, 4) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i < generatedPhasesCount
                          ? "bg-[var(--color-brand-600)]"
                          : i === generatedPhasesCount
                          ? "bg-[var(--color-brand-600)] animate-pulse"
                          : "bg-[var(--color-surface-tertiary)]"
                      )}
                    />
                  )
                )}
                <span className="text-[10px] text-[var(--color-text-muted)] ml-1">
                  Phase {generatedPhasesCount + 1}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phase timeline */}
        <div className="space-y-3">
          {protocol.phases
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                phaseIndex={index}
                isEditable={isEditable}
                onUpdate={handlePhaseUpdate}
                onAdvance={handleAdvancePhase}
                onExtend={handleExtendPhase}
              />
            ))}
        </div>

        {/* Empty state when no phases yet (and not generating) */}
        {protocol.phases.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4 shadow-[var(--shadow-card)]">
              <Sparkles className="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              No phases generated
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              This protocol was created but has no treatment phases yet.
            </p>
          </div>
        )}

        {/* Protocol summary (when completed) */}
        {protocol.status === "completed" && protocol.completed_at && (
          <div className="mt-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] shadow-[var(--shadow-card)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-[var(--color-brand-600)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Protocol Completed
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Completed on {formatDate(protocol.completed_at)}
            </p>
          </div>
        )}
      </div>

      {/* Archive confirmation */}
      <ConfirmDialog
        open={showArchiveConfirm}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
        title="Archive Protocol"
        description="This protocol will be moved to the archive. You can restore it later if needed."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="warning"
        loading={archiving}
      />
    </div>
  );
}

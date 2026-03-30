"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FocusAreaModal } from "./focus-area-modal";
import { useProtocolStream } from "@/hooks/use-protocol-stream";
import { isFeatureAvailable, type SubscriptionTier } from "@/lib/tier/gates";
import type { FocusAreaKey } from "@/types/protocol";

interface GenerateProtocolButtonProps {
  patientId: string;
  patientName: string;
  tier: SubscriptionTier;
}

export function GenerateProtocolButton({
  patientId,
  patientName,
  tier,
}: GenerateProtocolButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const stream = useProtocolStream();

  const canGenerate = isFeatureAvailable(tier, "protocol_generation");

  const handleGenerate = useCallback(
    async (focusAreas: FocusAreaKey[], customInstructions?: string) => {
      try {
        await stream.generate(patientId, focusAreas, customInstructions);
      } catch {
        // Error state is managed by the hook
      }
    },
    [patientId, stream]
  );

  // Navigate when generation completes
  if (stream.protocolId && !stream.isGenerating) {
    // Use a small delay to ensure state settles
    setTimeout(() => {
      router.push(
        `/patients/${patientId}/protocols/${stream.protocolId}`
      );
    }, 300);
  }

  // Show error
  if (stream.error && !stream.isGenerating) {
    toast.error(stream.error);
  }

  // Locked state for non-pro tiers
  if (!canGenerate) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/settings#subscription")}
        className="text-[var(--color-text-muted)]"
      >
        <Lock className="w-4 h-4 mr-1.5" />
        Generate Protocol
        <span className="ml-1.5 text-[10px] font-bold bg-[var(--color-gold-500)] text-white px-1.5 py-0.5 rounded-full">
          PRO
        </span>
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setModalOpen(true)}
        disabled={stream.isGenerating}
      >
        {stream.isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generate Protocol
          </>
        )}
      </Button>

      <FocusAreaModal
        isOpen={modalOpen && !stream.isGenerating}
        onClose={() => setModalOpen(false)}
        onGenerate={(areas, instructions) => {
          setModalOpen(false);
          handleGenerate(areas, instructions);
        }}
        isGenerating={stream.isGenerating}
      />

      {/* Inline streaming status when modal is closed */}
      {stream.isGenerating && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border-light)] p-4 w-80 animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-600)]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[var(--color-brand-600)] animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Generating Protocol
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                for {patientName}
              </p>
            </div>
          </div>

          {stream.phasesCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: stream.phasesCount + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < stream.phasesCount
                      ? "bg-[var(--color-brand-600)]"
                      : "bg-[var(--color-brand-600)] animate-pulse"
                  }`}
                />
              ))}
              <span className="text-[10px] text-[var(--color-text-muted)] ml-1">
                {stream.phasesCount} phase{stream.phasesCount > 1 ? "s" : ""} built
              </span>
            </div>
          )}

          {stream.streamText && (
            <div className="bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] p-2 max-h-20 overflow-y-auto">
              <p className="text-[10px] text-[var(--color-text-muted)] whitespace-pre-wrap font-mono leading-relaxed line-clamp-4">
                {stream.streamText.slice(-200)}
              </p>
            </div>
          )}

          <button
            onClick={stream.abort}
            className="mt-2 w-full text-center text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
          >
            Cancel generation
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus cancel button when opening
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onCancel();
    },
    [onCancel]
  );

  if (!open) return null;

  const iconBg = variant === "danger" ? "bg-red-50" : "bg-amber-50";
  const iconColor = variant === "danger" ? "text-red-500" : "text-amber-500";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-[fadeIn_150ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--color-border-light)] animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
          </div>

          {/* Text */}
          <h2
            id="confirm-title"
            className="text-base font-semibold text-[var(--color-text-primary)] text-center font-[var(--font-display)] mb-1.5"
          >
            {title}
          </h2>
          <p
            id="confirm-desc"
            className="text-sm text-[var(--color-text-secondary)] text-center leading-relaxed"
          >
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            ref={cancelRef}
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

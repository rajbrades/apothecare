"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { PanelConversations } from "./panel-conversations";
import { PanelVisits } from "./panel-visits";
import { PanelPatients } from "./panel-patients";

const SECTION_TITLES: Record<string, string> = {
  conversations: "Conversations",
  visits: "Recent Visits",
  patients: "Patients",
};

interface ExpandablePanelProps {
  isOpen: boolean;
  activeSection: string | null;
  onClose: () => void;
}

export function ExpandablePanel({
  isOpen,
  activeSection,
  onClose,
}: ExpandablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const title = activeSection ? SECTION_TITLES[activeSection] : "";

  return (
    <div
      ref={panelRef}
      className={`fixed top-0 left-16 z-40 hidden md:flex flex-col w-[280px] h-screen bg-[var(--color-surface)] border-r border-[var(--color-border-light)] shadow-[var(--shadow-elevated)] transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0 pointer-events-none"
      }`}
      role="complementary"
      aria-label={title}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--color-border-light)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 pt-3">
        {activeSection === "conversations" && <PanelConversations />}
        {activeSection === "visits" && <PanelVisits />}
        {activeSection === "patients" && <PanelPatients />}
      </div>
    </div>
  );
}

/**
 * Mobile bottom sheet for panel content.
 * Slides up from bottom when a panel section is active on mobile.
 */
export function MobilePanel({
  isOpen,
  activeSection,
  onClose,
}: ExpandablePanelProps) {
  const title = activeSection ? SECTION_TITLES[activeSection] : "";

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-50 md:hidden bg-[var(--color-surface)] rounded-t-[var(--radius-lg)] shadow-[var(--shadow-modal)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 border-b border-[var(--color-border-light)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="pt-3 overflow-y-auto" style={{ maxHeight: "calc(70vh - 80px)" }}>
          {activeSection === "conversations" && <PanelConversations />}
          {activeSection === "visits" && <PanelVisits />}
          {activeSection === "patients" && <PanelPatients />}
        </div>
      </div>
    </>
  );
}

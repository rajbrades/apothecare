"use client";

import {
  Plus,
  LayoutDashboard,
  MessageSquare,
  Stethoscope,
  FlaskConical,
  Pill,
  Users,
  Settings,
} from "lucide-react";
import { Logomark } from "@/components/ui/logomark";
import { Tooltip } from "./tooltip";
import { MOCK_PRACTITIONER } from "./mock-data";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  hasPanel: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, hasPanel: false },
  { id: "conversations", label: "Conversations", icon: MessageSquare, hasPanel: true },
  { id: "visits", label: "Visits", icon: Stethoscope, hasPanel: false },
  { id: "labs", label: "Labs", icon: FlaskConical, hasPanel: false },
  { id: "supplements", label: "Supplements", icon: Pill, hasPanel: false },
  { id: "patients", label: "Patients", icon: Users, hasPanel: false },
];

interface IconRailProps {
  activePage: string;
  activePanel: string | null;
  onPageChange: (page: string) => void;
  onPanelChange: (panel: string | null) => void;
}

export function IconRail({
  activePage,
  activePanel,
  onPageChange,
  onPanelChange,
}: IconRailProps) {
  const handleNavClick = (item: NavItem) => {
    if (item.hasPanel) {
      // Toggle panel: click same → close, click different → switch
      onPanelChange(activePanel === item.id ? null : item.id);
    } else {
      // Navigate to page and close any open panel
      onPanelChange(null);
      onPageChange(item.id);
    }
  };

  // An icon is "active" if it's the current page OR has its panel open
  const getIsActive = (item: NavItem) => {
    if (item.hasPanel) return activePanel === item.id;
    return activePage === item.id && activePanel === null;
  };

  return (
    <aside className="fixed top-0 left-0 z-50 hidden md:flex flex-col items-center w-16 h-screen bg-[var(--color-surface-secondary)] border-r border-[var(--color-border-light)]">
      {/* Logo — click to go to dashboard */}
      <button
        className="flex items-center justify-center h-14 w-full hover:opacity-80 transition-opacity"
        onClick={() => {
          onPanelChange(null);
          onPageChange("dashboard");
        }}
        aria-label="Home"
      >
        <Logomark size="xs" />
      </button>

      {/* Divider */}
      <div className="w-8 h-px bg-[var(--color-border-light)]" />

      {/* New Chat button */}
      <div className="mt-3 mb-2">
        <Tooltip label="New Conversation">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] transition-colors shadow-sm"
            aria-label="New Conversation"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-[var(--color-border-light)] mb-1" />

      {/* Navigation icons */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;

          return (
            <Tooltip key={item.id} label={item.label}>
              <button
                onClick={() => handleNavClick(item)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-label={item.label}
                aria-pressed={isActive}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--color-brand-600)]" />
                )}
                <Icon size={20} />
              </button>
            </Tooltip>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <div className="mb-1">
        <Tooltip label="Settings">
          <button
            className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </Tooltip>
      </div>

      {/* User avatar */}
      <div className="mb-3">
        <Tooltip label={MOCK_PRACTITIONER.full_name}>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-sm font-semibold hover:ring-2 hover:ring-[var(--color-brand-200)] transition-all"
            aria-label="Account"
          >
            {MOCK_PRACTITIONER.initials}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

/**
 * Mobile bottom tab bar — shown below md breakpoint.
 */
export function MobileTabBar({
  activePage,
  activePanel,
  onPageChange,
  onPanelChange,
}: IconRailProps) {
  const MOBILE_TABS: NavItem[] = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard, hasPanel: false },
    { id: "conversations", label: "Chat", icon: MessageSquare, hasPanel: true },
    { id: "visits", label: "Visits", icon: Stethoscope, hasPanel: false },
    { id: "labs", label: "Labs", icon: FlaskConical, hasPanel: false },
    { id: "patients", label: "Patients", icon: Users, hasPanel: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around h-14 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border-light)]">
      {MOBILE_TABS.map((item) => {
        const isActive = item.hasPanel
          ? activePanel === item.id
          : activePage === item.id && activePanel === null;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.hasPanel) {
                onPanelChange(activePanel === item.id ? null : item.id);
              } else {
                onPanelChange(null);
                onPageChange(item.id);
              }
            }}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
              isActive
                ? "text-[var(--color-brand-600)]"
                : "text-[var(--color-text-muted)]"
            }`}
            aria-label={item.label}
          >
            {isActive && (
              <span className="absolute top-0 w-6 h-0.5 rounded-b-full bg-[var(--color-brand-600)]" />
            )}
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

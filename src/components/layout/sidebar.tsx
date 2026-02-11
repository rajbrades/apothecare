"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Stethoscope,
  FlaskConical,
  Users,
  Star,
  ChevronDown,
  Plus,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  practitioner: {
    full_name: string;
    email: string;
    subscription_tier: string;
  };
  recentConversations?: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
  recentVisits?: Array<{
    id: string;
    visit_date: string;
    chief_complaint: string | null;
  }>;
}

const navItems = [
  { href: "/visits/new", icon: Stethoscope, label: "New Visit" },
  { href: "/labs", icon: FlaskConical, label: "Labs" },
  { href: "/patients", icon: Users, label: "Patients" },
];

export function Sidebar({ practitioner, recentConversations = [], recentVisits = [] }: SidebarProps) {
  const pathname = usePathname();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(true);
  const [conversationsOpen, setConversationsOpen] = useState(true);

  const isPro = practitioner.subscription_tier === "pro";
  const activeConvId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("id")
    : null;

  return (
    <aside className="w-[var(--sidebar-width)] h-screen fixed left-0 top-0 bg-[var(--color-surface-secondary)] border-r border-[var(--color-border-light)] flex flex-col z-40">
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-[var(--color-border-light)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center">
            <span className="text-white font-bold text-xs font-[var(--font-display)]">A</span>
          </div>
          <span className="text-base font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
            Apotheca
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Primary CTA */}
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 mb-4 rounded-lg bg-[var(--color-brand-600)] text-white text-sm font-medium hover:bg-[var(--color-brand-700)] transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2} />
          New Conversation
        </Link>

        {/* Secondary nav */}
        <div className="space-y-0.5 mb-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <item.icon size={17} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="h-px bg-[var(--color-border-light)] mx-2 mb-4" />

        {/* Recent Conversations */}
        <div className="mb-3">
          <button
            onClick={() => setConversationsOpen(!conversationsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider w-full hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <MessageSquare size={12} />
            Conversations
            <ChevronDown
              size={12}
              className={`ml-auto transition-transform ${conversationsOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {conversationsOpen && (
            <div className="mt-1 space-y-0.5">
              {recentConversations.length === 0 ? (
                <p className="px-3 pl-7 py-1.5 text-xs text-[var(--color-text-muted)] italic">
                  No conversations yet
                </p>
              ) : (
                recentConversations.slice(0, 5).map((conv) => {
                  const isActive = activeConvId === conv.id;
                  return (
                    <Link
                      key={conv.id}
                      href={`/chat?id=${conv.id}`}
                      className={`block px-3 pl-7 py-1.5 text-sm rounded-md truncate transition-colors ${
                        isActive
                          ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                      }`}
                    >
                      {conv.title || "Untitled"}
                      <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {formatRelativeTime(conv.updated_at)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="mb-3">
          <button
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider w-full hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <Star size={12} />
            Favorites
            <ChevronDown
              size={12}
              className={`ml-auto transition-transform ${favoritesOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {favoritesOpen && (
            <p className="px-3 pl-7 py-1.5 text-xs text-[var(--color-text-muted)] italic">
              Star responses to save them here
            </p>
          )}
        </div>

        {/* Recent Visits */}
        <div className="mb-3">
          <button
            onClick={() => setVisitsOpen(!visitsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider w-full hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <Stethoscope size={12} />
            Visits
            <ChevronDown
              size={12}
              className={`ml-auto transition-transform ${visitsOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {visitsOpen && (
            <div className="mt-1 space-y-0.5">
              {recentVisits.length === 0 ? (
                <p className="px-3 pl-7 py-1.5 text-xs text-[var(--color-text-muted)] italic">
                  No visits yet
                </p>
              ) : (
                recentVisits.slice(0, 3).map((visit) => (
                  <Link
                    key={visit.id}
                    href={`/visits/${visit.id}`}
                    className="block px-3 pl-7 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-md truncate transition-colors"
                  >
                    {visit.chief_complaint || "Visit"}
                    <span className="block text-[11px] text-[var(--color-text-muted)]">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Upgrade banner for free users */}
      {!isPro && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-[var(--color-gold-50)] to-[var(--color-brand-50)] border border-[var(--color-gold-200)]">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">Unlock unlimited queries</p>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Labs, protocols, SOAP notes & more</p>
          <Link
            href="/pricing"
            className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-[var(--color-gold-500)] text-white rounded-md hover:bg-[var(--color-gold-600)] transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* User profile */}
      <div className="border-t border-[var(--color-border-light)] px-3 py-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center">
            <span className="text-sm font-medium text-[var(--color-brand-700)]">
              {practitioner.full_name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {practitioner.full_name}
              </p>
              {isPro && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-gold-100)] text-[var(--color-gold-700)] rounded">
                  Pro
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">
              {practitioner.email}
            </p>
          </div>
          <Link
            href="/settings"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

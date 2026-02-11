"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

export function Sidebar({ practitioner, recentConversations = [], recentVisits = [] }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeConvId = searchParams.get("id");
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(false);
  const [conversationsOpen, setConversationsOpen] = useState(false);

  const isPro = practitioner.subscription_tier === "pro";

  return (
    <aside className="w-[var(--sidebar-width)] h-screen fixed left-0 top-0 bg-[var(--color-surface-secondary)] border-r border-[var(--color-border-light)] flex flex-col z-40">
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-[var(--color-border-light)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-700)] flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-base font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
            Apotheca
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Primary nav — all items equal weight */}
        <div className="space-y-0.5 mb-6">
          {[
            { href: "/chat", icon: MessageSquare, label: "New Conversation", showPlus: true },
            { href: "/visits/new", icon: Stethoscope, label: "New Visit" },
            { href: "/labs", icon: FlaskConical, label: "Labs" },
            { href: "/patients", icon: Users, label: "Patients" },
          ].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]"
                }`}
              >
                <item.icon size={17} strokeWidth={1.5} />
                {item.label}
                {"showPlus" in item && item.showPlus && (
                  <Plus size={14} className="ml-auto text-[var(--color-text-tertiary)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--color-border-light)] mx-2 mb-4" />

        {/* Favorites */}
        <div className="mb-1">
          <button
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors w-full"
          >
            <Star size={17} strokeWidth={1.5} />
            Favorites
            <ChevronDown
              size={14}
              className={`ml-auto text-[var(--color-text-tertiary)] transition-transform ${favoritesOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {favoritesOpen && (
            <p className="px-3 pl-11 py-1.5 text-xs text-[var(--color-text-tertiary)] italic">
              Add questions to your favorites to reference them easily.
            </p>
          )}
        </div>

        {/* Recent Visits */}
        <div className="mb-1">
          <button
            onClick={() => setVisitsOpen(!visitsOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors w-full"
          >
            <Stethoscope size={17} strokeWidth={1.5} />
            Visits
            <ChevronDown
              size={14}
              className={`ml-auto text-[var(--color-text-tertiary)] transition-transform ${visitsOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {visitsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {recentVisits.length === 0 ? (
                <p className="px-3 pl-11 py-1.5 text-xs text-[var(--color-text-tertiary)] italic">
                  No visits yet
                </p>
              ) : (
                <>
                  {recentVisits.slice(0, 3).map((visit) => (
                    <Link
                      key={visit.id}
                      href={`/visits/${visit.id}`}
                      className="block px-3 pl-11 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-md truncate transition-colors"
                    >
                      {visit.chief_complaint || "No information available"}
                      <span className="block text-[11px] text-[var(--color-text-tertiary)]">
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/visits"
                    className="block px-3 pl-11 py-1.5 text-xs text-[var(--color-brand-700)] font-medium hover:underline"
                  >
                    See all
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="mb-1">
          <button
            onClick={() => setConversationsOpen(!conversationsOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors w-full"
          >
            <MessageSquare size={17} strokeWidth={1.5} />
            Conversations
            <ChevronDown
              size={14}
              className={`ml-auto text-[var(--color-text-tertiary)] transition-transform ${conversationsOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {conversationsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {recentConversations.length === 0 ? (
                <p className="px-3 pl-11 py-1.5 text-xs text-[var(--color-text-tertiary)] italic">
                  No conversations yet
                </p>
              ) : (
                <>
                  {recentConversations.slice(0, 5).map((conv) => {
                    const isActive = activeConvId === conv.id;
                    return (
                      <Link
                        key={conv.id}
                        href={`/chat?id=${conv.id}`}
                        className={`block px-3 pl-11 py-1.5 text-sm rounded-md truncate transition-colors ${
                          isActive
                            ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                        }`}
                      >
                        {conv.title || "Untitled conversation"}
                        <span className="block text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                          {formatRelativeTime(conv.updated_at)}
                        </span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/chat/history"
                    className="block px-3 pl-11 py-1.5 text-xs text-[var(--color-brand-700)] font-medium hover:underline"
                  >
                    See all
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

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
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-accent-100)] text-[var(--color-accent-700)] rounded">
                  Pro
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
              {practitioner.email}
            </p>
          </div>
          <Link
            href="/settings"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Stethoscope,
  FlaskConical,
  Users,
  Star,
  ChevronDown,
  Plus,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  Check,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Logomark } from "@/components/ui/logomark";
import { createClient } from "@/lib/supabase/client";

interface ConversationItem {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  practitioner: {
    full_name: string;
    email: string;
    subscription_tier: string;
  };
  recentConversations?: ConversationItem[];
  recentVisits?: Array<{
    id: string;
    visit_date: string;
    chief_complaint: string | null;
  }>;
}

const navItems = [
  { href: "/visits", icon: Stethoscope, label: "Visits" },
  { href: "/labs", icon: FlaskConical, label: "Labs" },
  { href: "/patients", icon: Users, label: "Patients" },
];

// ─── Conversation Item with Actions ────────────────────────────────
function ConversationEntry({
  conv,
  isActive,
  onRename,
  onArchive,
  onDelete,
}: {
  conv: ConversationItem;
  isActive: boolean;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conv.title || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === (conv.title || "")) {
      setIsRenaming(false);
      setRenameValue(conv.title || "");
      return;
    }
    setLoading(true);
    try {
      await onRename(conv.id, trimmed);
    } finally {
      setLoading(false);
      setIsRenaming(false);
    }
  }, [renameValue, conv.id, conv.title, onRename]);

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(conv.title || "");
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    setMenuOpen(false);
    try {
      await onArchive(conv.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setLoading(true);
    setMenuOpen(false);
    setConfirmingDelete(false);
    try {
      await onDelete(conv.id);
    } finally {
      setLoading(false);
    }
  };

  // ── Renaming mode ──
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-3 pl-6 py-1">
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          disabled={loading}
          className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-white border border-[var(--color-border-light)] rounded text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] focus:ring-1 focus:ring-[var(--color-brand-200)]"
          maxLength={100}
        />
        <button
          onClick={handleRenameSubmit}
          disabled={loading}
          className="p-0.5 text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
          title="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => {
            setIsRenaming(false);
            setRenameValue(conv.title || "");
          }}
          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── Normal mode ──
  return (
    <div
      className={`group relative flex items-center rounded-md transition-colors ${
        isActive
          ? "bg-[var(--color-brand-50)]"
          : "hover:bg-[var(--color-surface-tertiary)]"
      } ${loading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <Link
        href={`/chat?id=${conv.id}`}
        className={`flex-1 min-w-0 block px-3 pl-7 py-1.5 text-sm truncate transition-colors ${
          isActive
            ? "text-[var(--color-brand-700)] font-medium"
            : "text-[var(--color-text-secondary)]"
        }`}
      >
        {conv.title || "Untitled"}
        <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
          {formatRelativeTime(conv.updated_at)}
        </span>
      </Link>

      {/* Three-dot menu trigger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
            setConfirmingDelete(false);
          }}
          className={`p-1 mr-1.5 rounded transition-colors ${
            menuOpen
              ? "text-[var(--color-text-primary)] bg-[var(--color-surface-tertiary)]"
              : "text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-primary)]"
          }`}
          title="Conversation actions"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-white rounded-lg shadow-lg border border-[var(--color-border-light)] z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setRenameValue(conv.title || "");
                setIsRenaming(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleArchive();
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Archive size={14} />
              Archive
            </button>
            <div className="h-px bg-[var(--color-border-light)] my-1 mx-2" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors ${
                confirmingDelete
                  ? "text-red-600 bg-red-50 hover:bg-red-100 font-medium"
                  : "text-red-500 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <Trash2 size={14} />
              {confirmingDelete ? "Confirm delete?" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Sidebar ──────────────────────────────────────────────────
export function Sidebar({ practitioner, recentConversations = [], recentVisits = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(true);
  const [conversationsOpen, setConversationsOpen] = useState(true);

  // Optimistic local state for conversations
  const [conversations, setConversations] = useState<ConversationItem[]>(recentConversations);

  // Keep in sync if server data changes (e.g. revalidation)
  useEffect(() => {
    setConversations(recentConversations);
  }, [recentConversations]);

  const isPro = practitioner.subscription_tier === "pro";
  const activeConvId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("id")
    : null;

  // ── Supabase mutations ──
  const handleRename = useCallback(async (id: string, newTitle: string) => {
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      // Revert on failure
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: recentConversations.find((r) => r.id === id)?.title || c.title } : c))
      );
      console.error("Failed to rename conversation:", error.message);
    }
  }, [recentConversations]);

  const handleArchive = useCallback(async (id: string) => {
    // Optimistic removal from list
    setConversations((prev) => prev.filter((c) => c.id !== id));

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      // Revert on failure
      setConversations(recentConversations);
      console.error("Failed to archive conversation:", error.message);
    } else {
      // If we're viewing the archived conversation, navigate away
      if (activeConvId === id) {
        router.push("/chat");
      }
      router.refresh();
    }
  }, [recentConversations, activeConvId, router]);

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic removal from list
    setConversations((prev) => prev.filter((c) => c.id !== id));

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      // Revert on failure
      setConversations(recentConversations);
      console.error("Failed to delete conversation:", error.message);
    } else {
      // If we're viewing the deleted conversation, navigate away
      if (activeConvId === id) {
        router.push("/chat");
      }
      router.refresh();
    }
  }, [recentConversations, activeConvId, router]);

  return (
    <aside className="w-[var(--sidebar-width)] h-screen fixed left-0 top-0 bg-[var(--color-surface-secondary)] border-r border-[var(--color-border-light)] flex flex-col z-40">
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-[var(--color-border-light)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logomark size="xs" withText />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Primary CTA */}
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 mb-4 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white text-sm font-medium hover:bg-[var(--color-brand-700)] transition-colors shadow-sm"
        >
          <Plus className="icon-inline" strokeWidth={2} />
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
                <item.icon className="icon-nav" strokeWidth={1.5} />
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
              {conversations.length === 0 ? (
                <p className="px-3 pl-7 py-1.5 text-xs text-[var(--color-text-muted)] italic">
                  No conversations yet
                </p>
              ) : (
                conversations.slice(0, 5).map((conv) => (
                  <ConversationEntry
                    key={conv.id}
                    conv={conv}
                    isActive={activeConvId === conv.id}
                    onRename={handleRename}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))
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
                recentVisits.slice(0, 3).map((visit) => {
                  const isVisitActive = pathname === `/visits/${visit.id}`;
                  return (
                  <Link
                    key={visit.id}
                    href={`/visits/${visit.id}`}
                    className={`block px-3 pl-7 py-1.5 text-sm rounded-md truncate transition-colors ${
                      isVisitActive
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] font-medium"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                    }`}
                  >
                    {visit.chief_complaint || "Visit"}
                    <span className="block text-[11px] text-[var(--color-text-muted)]">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </span>
                  </Link>
                  );
                })
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
            <Settings className="icon-inline" />
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

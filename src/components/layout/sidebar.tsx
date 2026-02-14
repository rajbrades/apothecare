"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Stethoscope,
  FlaskConical,
  Users,
  Star,
  ChevronDown,
  Plus,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Logomark } from "@/components/ui/logomark";
import { createClient } from "@/lib/supabase/client";
import { ConversationEntry, type ConversationItem } from "./sidebar-conversation";

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



// ─── Main Sidebar ──────────────────────────────────────────────────
export function Sidebar({ practitioner, recentConversations = [], recentVisits = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(true);
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      toast.error("Failed to rename conversation");
    } else {
      toast.success("Conversation renamed");
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
      toast.error("Failed to archive conversation");
    } else {
      toast.success("Conversation archived");
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
      toast.error("Failed to delete conversation");
    } else {
      toast.success("Conversation deleted");
      // If we're viewing the deleted conversation, navigate away
      if (activeConvId === id) {
        router.push("/chat");
      }
      router.refresh();
    }
  }, [recentConversations, activeConvId, router]);

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[var(--header-height)] bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] flex items-center px-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="icon-nav" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 ml-3">
          <Logomark size="xs" withText />
        </Link>
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`w-[var(--sidebar-width)] h-screen fixed left-0 top-0 bg-[var(--color-surface-secondary)] border-r border-[var(--color-border-light)] flex flex-col z-50 transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      {/* Logo + mobile close */}
      <div className="h-[var(--header-height)] flex items-center justify-between px-5 border-b border-[var(--color-border-light)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logomark size="xs" withText />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 -mr-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
          aria-label="Close navigation menu"
        >
          <X className="icon-inline" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Primary CTA */}
        <Button asChild className="w-full mb-4 gap-2 shadow-sm" size="sm">
          <Link href="/chat">
            <Plus className="icon-inline" strokeWidth={2} />
            New Conversation
          </Link>
        </Button>

        {/* Secondary nav */}
        <div className="space-y-0.5 mb-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
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
                      className={`block px-3 pl-7 py-1.5 text-sm rounded-md truncate transition-colors ${isVisitActive
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
          <Button asChild variant="gold" size="xs" className="mt-2">
            <Link href="/pricing">
              Upgrade to Pro
            </Link>
          </Button>
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
    </>
  );
}



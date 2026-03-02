"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Calendar,
  ChevronRight,
  Loader2,
  Search,
  X,
  Archive,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationListItem {
  id: string;
  title: string | null;
  patient_id: string | null;
  is_favorited: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  patients: { first_name: string | null; last_name: string | null } | null;
}

interface ConversationListClientProps {
  initialConversations: ConversationListItem[];
  initialCursor: string | null;
}

type FilterMode = "active" | "archived" | "favorites";

export function ConversationListClient({
  initialConversations,
  initialCursor,
}: ConversationListClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("active");

  // ── Inline rename state ──
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Delete confirmation state ──
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // ── Fetch helpers ──
  const fetchConversations = useCallback(async (term: string, mode: FilterMode, pageCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.set("search", term);
      params.set("filter", mode);
      if (pageCursor) params.set("cursor", pageCursor);
      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    const data = await fetchConversations(search, filter, cursor);
    setConversations((prev) => [...prev, ...data.conversations]);
    setCursor(data.nextCursor);
  }, [cursor, loading, search, filter, fetchConversations]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (term: string, mode: FilterMode = filter) => {
    const data = await fetchConversations(term, mode);
    setConversations(data.conversations);
    setCursor(data.nextCursor);
  }, [filter, fetchConversations]);

  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilter(mode);
    handleSearch(search, mode);
  }, [search, handleSearch]);

  // Debounced search on typing (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(search);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search, handleSearch]);

  // ── Mutations ──
  const handleRename = useCallback(async (id: string) => {
    const trimmed = renameValue.trim();
    const conv = conversations.find((c) => c.id === id);
    if (!trimmed || trimmed === (conv?.title || "")) {
      setRenamingId(null);
      return;
    }

    setRenameLoading(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: conv?.title || c.title } : c))
      );
      toast.error("Failed to rename conversation");
    } else {
      toast.success("Conversation renamed");
    }
    setRenameLoading(false);
    setRenamingId(null);
  }, [renameValue, conversations]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    const newVal = !conv.is_favorited;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_favorited: newVal } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ is_favorited: newVal })
      .eq("id", id);

    if (error) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_favorited: conv.is_favorited } : c))
      );
      toast.error("Failed to update favorite");
    } else {
      toast.success(newVal ? "Added to favorites" : "Removed from favorites");
      // If on favorites tab and un-favorited, remove from list
      if (filter === "favorites" && !newVal) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    }
  }, [conversations, filter]);

  const handleArchive = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      handleSearch(search, filter);
      toast.error("Failed to archive conversation");
    } else {
      toast.success("Conversation archived");
      router.refresh();
    }
  }, [search, filter, handleSearch, router]);

  const handleUnarchive = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      handleSearch(search, filter);
      toast.error("Failed to unarchive conversation");
    } else {
      toast.success("Conversation restored");
      router.refresh();
    }
  }, [search, filter, handleSearch, router]);

  const handleDelete = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setConfirmingDeleteId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      handleSearch(search, filter);
      toast.error("Failed to delete conversation");
    } else {
      toast.success("Conversation deleted");
      router.refresh();
    }
  }, [search, filter, handleSearch, router]);

  const getPatientName = (conv: ConversationListItem) => {
    if (!conv.patients) return null;
    const parts = [conv.patients.first_name, conv.patients.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-8 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 p-0.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] w-fit">
        <button
          onClick={() => filter !== "active" && handleFilterChange("active")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
            filter === "active"
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => filter !== "archived" && handleFilterChange("archived")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
            filter === "archived"
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Archive className="w-3 h-3" />
          Archived
        </button>
        <button
          onClick={() => filter !== "favorites" && handleFilterChange("favorites")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
            filter === "favorites"
              ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Star className="w-3 h-3" />
          Favorites
        </button>
      </div>

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.map((conv) => {
          const title = conv.title || "Untitled conversation";
          const patientName = getPatientName(conv);

          // Inline rename mode
          if (renamingId === conv.id) {
            return (
              <div
                key={conv.id}
                className="flex items-center gap-2 p-4 rounded-[var(--radius-md)] border border-[var(--color-brand-300)] bg-[var(--color-surface)]"
              >
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRename(conv.id);
                    } else if (e.key === "Escape") {
                      setRenamingId(null);
                    }
                  }}
                  disabled={renameLoading}
                  className="flex-1 min-w-0 px-2 py-1 text-sm bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] focus:ring-1 focus:ring-[var(--color-brand-200)]"
                  maxLength={100}
                />
                <button
                  onClick={() => handleRename(conv.id)}
                  disabled={renameLoading}
                  className="p-1 text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)]"
                  title="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setRenamingId(null)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={conv.id}
              className="group relative flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <Link
                href={`/chat?id=${conv.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4.5 h-4.5 text-[var(--color-brand-600)]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{title}</p>
                    {conv.is_favorited && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span>{formatRelativeTime(conv.updated_at)}</span>
                    {patientName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {patientName}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Actions dropdown */}
                <DropdownMenu onOpenChange={(open) => { if (!open) setConfirmingDeleteId(null); }}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded transition-colors text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] data-[state=open]:opacity-100 data-[state=open]:bg-[var(--color-surface-tertiary)]"
                      title="Conversation actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameValue(conv.title || "");
                        setRenamingId(conv.id);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleFavorite(conv.id)}>
                      <Star className={`mr-2 h-3.5 w-3.5 ${conv.is_favorited ? "fill-amber-500 text-amber-500" : ""}`} />
                      {conv.is_favorited ? "Unfavorite" : "Favorite"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => filter === "archived" ? handleUnarchive(conv.id) : handleArchive(conv.id)}>
                      <Archive className="mr-2 h-3.5 w-3.5" />
                      {filter === "archived" ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        if (confirmingDeleteId !== conv.id) {
                          e.preventDefault();
                          setConfirmingDeleteId(conv.id);
                          return;
                        }
                        handleDelete(conv.id);
                      }}
                      className={confirmingDeleteId === conv.id ? "text-red-600 bg-red-50 focus:bg-red-50" : "text-red-600 focus:text-red-700"}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      {confirmingDeleteId === conv.id ? "Confirm delete?" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {cursor && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)]"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Load More
          </button>
        </div>
      )}

      {conversations.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            {filter === "archived"
              ? "No archived conversations"
              : filter === "favorites"
                ? "No favorite conversations"
                : "No conversations found"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-[var(--color-brand-600)] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

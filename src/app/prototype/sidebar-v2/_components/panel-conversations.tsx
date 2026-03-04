"use client";

import { useState, useMemo } from "react";
import { Search, Star, MessageSquare, Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { MOCK_CONVERSATIONS } from "./mock-data";

export function PanelConversations() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CONVERSATIONS;
    const q = search.toLowerCase();
    return MOCK_CONVERSATIONS.filter((c) =>
      c.title.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredFavorites = useMemo(
    () => filtered.filter((c) => c.is_favorited),
    [filtered]
  );

  const recent = useMemo(
    () => filtered.filter((c) => !c.is_favorited),
    [filtered]
  );

  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="px-3 pb-2">
        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-50)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-100)] transition-colors">
          <Plus size={15} strokeWidth={2.5} />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--color-surface-tertiary)] border border-transparent rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] focus:bg-[var(--color-surface)] transition-colors"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {/* Favorites section */}
        {filteredFavorites.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 px-2 mb-1">
              <Star size={11} className="text-[var(--color-gold-500)] fill-[var(--color-gold-500)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Favorites
              </span>
            </div>
            {filteredFavorites.map((conv) => (
              <ConversationRow key={conv.id} conv={conv} />
            ))}
          </div>
        )}

        {/* Recent section */}
        <div>
          <div className="flex items-center gap-1.5 px-2 mb-1">
            <MessageSquare size={11} className="text-[var(--color-text-muted)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Recent
            </span>
          </div>
          {recent.length > 0 ? (
            recent.map((conv) => (
              <ConversationRow key={conv.id} conv={conv} />
            ))
          ) : (
            <p className="px-2 py-4 text-xs text-[var(--color-text-muted)] text-center">
              No conversations found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationRow({ conv }: { conv: (typeof MOCK_CONVERSATIONS)[0] }) {
  return (
    <button
      className="w-full text-left px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-tertiary)] transition-colors group"
      title={conv.title}
    >
      <p className="text-sm text-[var(--color-text-primary)] leading-snug line-clamp-2">
        {conv.title}
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
        {formatRelativeTime(conv.updated_at)}
      </p>
    </button>
  );
}

"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Archive,
    Check,
    X,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";

export { formatRelativeTime } from "@/lib/utils";

export interface ConversationItem {
    id: string;
    title: string;
    updated_at: string;
}

interface ConversationEntryProps {
    conv: ConversationItem;
    isActive: boolean;
    onRename: (id: string, newTitle: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function ConversationEntry({
    conv,
    isActive,
    onRename,
    onArchive,
    onDelete,
}: ConversationEntryProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(conv.title || "");
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
        try {
            await onArchive(conv.id);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: Event) => {
        if (!confirmingDelete) {
            e.preventDefault(); // Keep menu open
            setConfirmingDelete(true);
            return;
        }
        setLoading(true);
        // Menu closes automatically here
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
                    className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-400)] focus:ring-1 focus:ring-[var(--color-brand-200)]"
                    maxLength={100}
                />
                <button
                    onClick={handleRenameSubmit}
                    disabled={loading}
                    className="p-0.5 text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
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
            className={`group relative flex items-center rounded-md transition-colors ${isActive
                    ? "bg-[var(--color-brand-50)]"
                    : "hover:bg-[var(--color-surface-tertiary)]"
                } ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
            <Link
                href={`/chat?id=${conv.id}`}
                className={`flex-1 min-w-0 block px-3 pl-7 py-1.5 text-sm truncate transition-colors ${isActive
                        ? "text-[var(--color-brand-700)] font-medium"
                        : "text-[var(--color-text-secondary)]"
                    }`}
            >
                {conv.title || "Untitled"}
                <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {formatRelativeTime(conv.updated_at)}
                </span>
            </Link>

            {/* Dropdown Menu */}
            <DropdownMenu onOpenChange={(open) => !open && setConfirmingDelete(false)}>
                <DropdownMenuTrigger asChild>
                    <button
                        className={`p-1 mr-1.5 rounded transition-colors text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] data-[state=open]:opacity-100 data-[state=open]:bg-[var(--color-surface-tertiary)]`}
                        title="Conversation actions"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                        onClick={() => {
                            setRenameValue(conv.title || "");
                            setIsRenaming(true);
                        }}
                    >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleArchive}>
                        <Archive className="mr-2 h-3.5 w-3.5" />
                        Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={handleDelete}
                        className={confirmingDelete ? "text-red-600 bg-red-50 focus:bg-red-50" : "text-red-600 focus:text-red-700"}
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        {confirmingDelete ? "Confirm delete?" : "Delete"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

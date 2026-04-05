"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Archive, ArchiveRestore, Loader2, CheckCircle2, MoreVertical, Copy } from "lucide-react";
import { toast } from "sonner";

interface ProtocolActionsProps {
  protocolId: string;
  status: string;
}

export function ProtocolActions({ protocolId, status }: ProtocolActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/corporate/admin/protocols/${protocolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update protocol");
        return;
      }
      toast.success(`Protocol ${newStatus === "active" ? "published" : newStatus === "archived" ? "archived" : "moved to drafts"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update protocol");
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  async function createNewVersion() {
    setLoading(true);
    try {
      const res = await fetch(`/api/corporate/admin/protocols/${protocolId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create new version");
        return;
      }
      const data = await res.json();
      toast.success(`Version ${data.version} created`);
      router.push(`/corporate/admin/protocols/${data.id}/edit`);
    } catch {
      toast.error("Failed to create new version");
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />;
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={() => router.push(`/corporate/admin/protocols/${protocolId}/edit`)}
        className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
      </button>

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] py-1">
            {status === "draft" && (
              <button
                onClick={() => updateStatus("active")}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Publish
              </button>
            )}
            {status === "active" && (
              <>
                <button
                  onClick={createNewVersion}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Create New Version
                </button>
                <button
                  onClick={() => updateStatus("archived")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              </>
            )}
            {status === "archived" && (
              <button
                onClick={() => updateStatus("draft")}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
                Restore to Draft
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

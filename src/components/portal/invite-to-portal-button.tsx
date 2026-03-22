"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Send, Check } from "lucide-react";

interface InviteToPortalButtonProps {
  patientId: string;
  patientEmail?: string | null;
  portalStatus?: string | null;
}

export function InviteToPortalButton({ patientId, patientEmail, portalStatus }: InviteToPortalButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(patientEmail || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const alreadyActive = portalStatus === "active";
  const alreadyInvited = portalStatus === "invited";

  async function handleSend() {
    if (!email.trim() || loading) return;
    setLoading(true);

    const res = await fetch("/api/patient-portal/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, email: email.trim() }),
    });

    if (res.ok) {
      toast.success("Portal invitation sent");
      setSent(true);
      setShowForm(false);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to send invitation");
    }
    setLoading(false);
  }

  if (alreadyActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
        <Check className="w-3.5 h-3.5" />
        Portal active
      </span>
    );
  }

  if (sent || alreadyInvited) {
    return (
      <button
        onClick={() => { setSent(false); setShowForm(true); }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors"
        title="Resend portal invitation"
      >
        <Send className="w-3.5 h-3.5" />
        Resend invite
      </button>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="email"
          placeholder="patient@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
            if (e.key === "Escape") setShowForm(false);
          }}
          autoFocus
          className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)]/20 w-44"
        />
        <button
          onClick={handleSend}
          disabled={loading || !email.trim()}
          className="h-7 px-2.5 rounded-md bg-[var(--color-text-primary)] text-[var(--color-surface)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "Sending…" : "Send"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="h-7 px-2 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-secondary)] transition-colors"
    >
      <UserPlus className="w-3.5 h-3.5" />
      Invite to portal
    </button>
  );
}

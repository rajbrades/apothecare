"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Practitioner } from "@/types/database";

interface ProfileSectionProps {
  practitioner: Practitioner;
}

export function ProfileSection({ practitioner }: ProfileSectionProps) {
  const [fullName, setFullName] = useState(practitioner.full_name);
  const [saving, setSaving] = useState(false);

  const hasChanges = fullName.trim() !== practitioner.full_name;

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/practitioners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
        Profile
      </h2>

      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-semibold text-[var(--color-brand-700)]">
            {initials || "?"}
          </span>
        </div>

        <div className="flex-1 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Email
            </label>
            <p className="text-sm text-[var(--color-text-secondary)] px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)] max-w-sm">
              {practitioner.email}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Managed by your login provider
            </p>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end mt-6 pt-4 border-t border-[var(--color-border-light)]">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

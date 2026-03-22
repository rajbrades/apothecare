"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

interface ShareWithPatientToggleProps {
  resourceType: "lab" | "visit";
  resourceId: string;
  initialShared: boolean;
  patientName?: string | null;
}

export function ShareWithPatientToggle({
  resourceType,
  resourceId,
  initialShared,
  patientName,
}: ShareWithPatientToggleProps) {
  const [shared, setShared] = useState(initialShared);
  const [loading, setLoading] = useState(false);

  const endpoint = resourceType === "lab"
    ? `/api/labs/${resourceId}/share`
    : `/api/visits/${resourceId}/share`;

  const label = resourceType === "lab" ? "lab report" : "encounter note";

  async function toggle() {
    if (loading) return;
    const newValue = !shared;
    setLoading(true);

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: newValue }),
    });

    if (res.ok) {
      setShared(newValue);
      toast.success(
        newValue
          ? `${label.charAt(0).toUpperCase() + label.slice(1)} shared with patient`
          : `${label.charAt(0).toUpperCase() + label.slice(1)} hidden from patient`
      );
    } else {
      toast.error("Failed to update sharing settings");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={shared ? `Hide from patient portal` : `Share with patient portal`}
      className={[
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors border",
        shared
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
        loading ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Share2 className="h-3.5 w-3.5" />
      {shared
        ? (patientName ? `Shared with ${patientName.split(" ")[0]}` : "Shared with patient")
        : "Share with patient"}
    </button>
  );
}

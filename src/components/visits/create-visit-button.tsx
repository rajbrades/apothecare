"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CreateVisitButtonProps {
  patientId?: string;
  children: React.ReactNode;
  className?: string;
}

export function CreateVisitButton({ patientId, children, className }: CreateVisitButtonProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleClick = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_type: "soap",
          patient_id: patientId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create visit");
      }

      const { visit } = await res.json();
      router.push(`/visits/${visit.id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={creating} className={className}>
      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

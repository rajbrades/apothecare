"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";

interface PatientInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface AssignPatientButtonProps {
  labId: string;
  currentPatient: PatientInfo | null;
  onAssigned: (patient: PatientInfo | null) => void;
  variant?: "icon" | "button";
}

export function AssignPatientButton({
  labId,
  currentPatient,
  onAssigned,
  variant = "button",
}: AssignPatientButtonProps) {
  const [saving, setSaving] = useState(false);
  const [showCombobox, setShowCombobox] = useState(false);

  const selectedName = currentPatient
    ? [currentPatient.first_name, currentPatient.last_name].filter(Boolean).join(" ") || "Unnamed"
    : "";

  const handleChange = async (patientId: string, patientName: string) => {
    if (patientId === (currentPatient?.id ?? "")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/labs/${labId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId || null }),
      });
      if (!res.ok) throw new Error("Failed to assign patient");
      const newPatient = patientId
        ? { id: patientId, first_name: patientName.split(" ")[0] || null, last_name: patientName.split(" ").slice(1).join(" ") || null }
        : null;
      onAssigned(newPatient);
      toast.success(patientId ? `Assigned to ${patientName}` : "Patient unlinked");
      setShowCombobox(false);
    } catch {
      toast.error("Failed to assign patient");
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        {variant === "button" && "Saving..."}
      </div>
    );
  }

  if (showCombobox || variant === "button") {
    return (
      <PatientSearchCombobox
        value={currentPatient?.id ?? ""}
        onChange={handleChange}
        placeholder={currentPatient ? selectedName : "Assign Patient"}
        selectedName={selectedName}
      />
    );
  }

  // Icon-only variant for card hover row
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCombobox(true); }}
      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
      title={currentPatient ? `Reassign (${selectedName})` : "Assign Patient"}
    >
      {currentPatient ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
    </button>
  );
}

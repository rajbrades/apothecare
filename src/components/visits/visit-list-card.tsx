"use client";

import Link from "next/link";
import { Stethoscope, RefreshCcw, Calendar, User, MoreHorizontal, Trash2, Archive, UserPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";

interface PatientInfo {
  first_name: string | null;
  last_name: string | null;
}

interface VisitListCardProps {
  visit: {
    id: string;
    visit_date: string;
    visit_type: string;
    status: string;
    chief_complaint: string | null;
    patient_id: string | null;
    patients?: PatientInfo | null;
  };
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAssigned?: (visitId: string, patientId: string | null, patient: PatientInfo | null) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VisitListCard({ visit, onArchive, onDelete, onAssigned }: VisitListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(visit.patient_id);
  const [currentPatient, setCurrentPatient] = useState<PatientInfo | null>(visit.patients ?? null);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const patientName = currentPatient
    ? [currentPatient.first_name, currentPatient.last_name].filter(Boolean).join(" ")
    : null;

  const isFollowUp = visit.visit_type === "follow_up";
  const isDraft = visit.status === "draft";

  const handleAssign = async (patientId: string, name: string) => {
    if (patientId === (currentPatientId ?? "")) {
      setShowAssign(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId || null }),
      });
      if (!res.ok) throw new Error("Failed to assign patient");

      const newPatientId = patientId || null;
      const newPatient = patientId
        ? { first_name: name.split(" ")[0] || null, last_name: name.split(" ").slice(1).join(" ") || null }
        : null;

      setCurrentPatientId(newPatientId);
      setCurrentPatient(newPatient);
      onAssigned?.(visit.id, newPatientId, newPatient);
      toast.success(patientId ? `Assigned to ${name}` : "Patient unlinked");
      setShowAssign(false);
    } catch {
      toast.error("Failed to assign patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group relative flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-card)] transition-all">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        isFollowUp
          ? "bg-[var(--color-gold-50)] border border-[var(--color-gold-200)]"
          : "bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]"
      }`}>
        {isFollowUp ? (
          <RefreshCcw className="w-5 h-5 text-[var(--color-gold-600)]" strokeWidth={1.5} />
        ) : (
          <Stethoscope className="w-5 h-5 text-[var(--color-brand-600)]" strokeWidth={1.5} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/visits/${visit.id}`} className="block">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {visit.chief_complaint || "No chief complaint"}
            </h3>
            {isDraft && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--color-gold-50)] text-[var(--color-gold-700)] border border-[var(--color-gold-200)] rounded">
                Draft
              </span>
            )}
            {!isDraft && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)] rounded">
                Complete
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(visit.visit_date)} at {formatTime(visit.visit_date)}
            </span>
            {patientName && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {patientName}
              </span>
            )}
            {!currentPatientId && (
              <span className="text-[var(--color-gold-600)] font-medium">No patient</span>
            )}
            <span className="capitalize">
              {isFollowUp ? "Follow-up" : "SOAP"}
            </span>
          </div>
        </Link>

        {/* Patient assign combobox (shown on demand) */}
        {showAssign && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <PatientSearchCombobox
              value={currentPatientId ?? ""}
              onChange={handleAssign}
              placeholder="Search patients…"
              selectedName={patientName ?? ""}
            />
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Assign patient button */}
        {!showAssign && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAssign(true); }}
            disabled={saving}
            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-brand-600)] transition-colors"
            title={currentPatientId ? `Reassign patient (${patientName})` : "Assign patient"}
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 py-1 rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)]">
              {onArchive && (
                <button
                  onClick={() => { onArchive(visit.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <Archive size={13} />
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(visit.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Stethoscope, RefreshCcw, Calendar, User, MoreHorizontal, Trash2, Archive } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VisitListCardProps {
  visit: {
    id: string;
    visit_date: string;
    visit_type: string;
    status: string;
    chief_complaint: string | null;
    patients?: { first_name: string | null; last_name: string | null } | null;
  };
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
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

export function VisitListCard({ visit, onArchive, onDelete }: VisitListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const patientName = visit.patients
    ? [visit.patients.first_name, visit.patients.last_name].filter(Boolean).join(" ")
    : null;

  const isFollowUp = visit.visit_type === "follow_up";
  const isDraft = visit.status === "draft";

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
      <Link href={`/visits/${visit.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {visit.chief_complaint || "No chief complaint"}
          </h3>
          {isDraft && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded">
              Draft
            </span>
          )}
          {!isDraft && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
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
          <span className="capitalize">
            {isFollowUp ? "Follow-up" : "SOAP"}
          </span>
        </div>
      </Link>

      {/* Actions menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-secondary)] transition-all"
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
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, User, Building2, Stethoscope, ClipboardList, Activity, ListChecks, Download } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { generateNotePdf } from "@/lib/portal/generate-note-pdf";

interface EncounterNote {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  practitioners: { full_name: string; practice_name: string | null } | null;
}

/** Parse numbered lists (1. foo\n2. bar) and bullet-style text into structured content */
function formatNoteContent(content: string): React.ReactNode[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="space-y-2 pl-0">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
      listItems = [];
    }
  }

  for (const line of lines) {
    const numberedMatch = line.match(/^\d+\.\s*(.+)/);
    const bulletMatch = line.match(/^[-•]\s*(.+)/);
    if (numberedMatch) {
      listItems.push(numberedMatch[1]);
    } else if (bulletMatch) {
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      nodes.push(
        <p key={`p-${nodes.length}`} className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{line}</p>
      );
    }
  }
  flushList();
  return nodes;
}

const SECTION_CONFIG = {
  subjective: {
    label: "History & Symptoms",
    sublabel: "Patient-reported information",
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-50",
  },
  objective: {
    label: "Examination Findings",
    sublabel: "Clinical observations",
    icon: Activity,
    color: "text-emerald-600 bg-emerald-50",
  },
  assessment: {
    label: "Clinical Assessment",
    sublabel: "Provider analysis",
    icon: Stethoscope,
    color: "text-amber-600 bg-amber-50",
  },
  plan: {
    label: "Treatment Plan",
    sublabel: "Recommended next steps",
    icon: ListChecks,
    color: "text-[var(--color-brand-700)] bg-[var(--color-brand-50)]",
  },
} as const;

function NoteSection({ sectionKey, content }: { sectionKey: keyof typeof SECTION_CONFIG; content: string | null }) {
  if (!content?.trim()) return null;
  const config = SECTION_CONFIG[sectionKey];
  const Icon = config.icon;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{config.label}</h3>
          <p className="text-[11px] text-[var(--color-text-muted)]">{config.sublabel}</p>
        </div>
      </div>
      <div className="pl-11 space-y-3">
        {formatNoteContent(content)}
      </div>
    </section>
  );
}

export default function PatientNoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<EncounterNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/patient-portal/me/notes/${params.id}`)
      .then(async (r) => {
        if (r.status === 401) { router.replace("/portal/login"); return; }
        if (!r.ok) { setError("Note not found."); setLoading(false); return; }
        const data = await r.json();
        setNote(data.note);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load note."); setLoading(false); });
  }, [params.id, router]);

  if (loading) {
    return <PortalShell><p className="text-sm text-[var(--color-text-muted)]">Loading note…</p></PortalShell>;
  }

  if (error || !note) {
    return (
      <PortalShell>
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">{error || "Note not found."}</p>
          <Link href="/portal/dashboard" className="text-xs text-[var(--color-brand-600)] hover:underline">Back to dashboard</Link>
        </div>
      </PortalShell>
    );
  }

  const visitDate = new Date(note.visit_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const visitType = note.visit_type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const hasContent = note.subjective || note.objective || note.assessment || note.plan;

  async function handleDownload() {
    if (downloading || !note) return;
    setDownloading(true);
    try {
      const bytes = await generateNotePdf({
        visitDate,
        visitType,
        chiefComplaint: note.chief_complaint,
        providerName: note.practitioners?.full_name ?? null,
        practiceName: note.practitioners?.practice_name ?? null,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateSlug = note.visit_date?.slice(0, 10) ?? "note";
      a.download = `encounter-note-${dateSlug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <Link href="/portal/dashboard" className="text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] hover:underline transition-colors">
          &larr; Back to dashboard
        </Link>

        {/* Document header — styled like a professional encounter note */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Branded header strip */}
          <div className="bg-[var(--color-brand-600)] px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Encounter Note
                </h1>
                <p className="text-sm text-white/80 mt-0.5">
                  {visitType} Visit{note.chief_complaint ? ` — ${note.chief_complaint}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-white/90 bg-white/20 hover:bg-white/30 rounded px-2.5 py-1 backdrop-blur transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading ? "Generating…" : "Download PDF"}
                </button>
                <span className="text-[10px] uppercase tracking-wide font-medium text-white/90 bg-white/20 rounded px-2 py-1 backdrop-blur">
                  Read only
                </span>
              </div>
            </div>
          </div>

          {/* Visit metadata */}
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span>{visitDate}</span>
              </div>
              {note.practitioners?.full_name && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <User className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  <span>{note.practitioners.full_name}</span>
                </div>
              )}
              {note.practitioners?.practice_name && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Building2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  <span>{note.practitioners.practice_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Note content */}
          <div className="px-6 py-6 space-y-8">
            {hasContent ? (
              <>
                <NoteSection sectionKey="subjective" content={note.subjective} />
                <NoteSection sectionKey="objective" content={note.objective} />
                <NoteSection sectionKey="assessment" content={note.assessment} />
                <NoteSection sectionKey="plan" content={note.plan} />
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">Note content is not available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <p className="text-[11px] text-[var(--color-text-muted)] text-center">
              This document is a read-only copy shared by your provider. For questions about your care plan, contact your provider directly.
            </p>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}


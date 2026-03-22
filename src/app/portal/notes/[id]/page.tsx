"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";

interface EncounterNote {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string | null;
  soap_subjective: string | null;
  soap_objective: string | null;
  soap_assessment: string | null;
  soap_plan: string | null;
  practitioners: { full_name: string; practice_name: string | null } | null;
}

function SoapSection({ title, content }: { title: string; content: string | null }) {
  if (!content?.trim()) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</h3>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3">
        {content}
      </div>
    </div>
  );
}

export default function PatientNoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<EncounterNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <Link href="/portal/dashboard" className="text-xs underline text-[var(--color-text-muted)]">Back to dashboard</Link>
        </div>
      </PortalShell>
    );
  }

  const visitDate = new Date(note.visit_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const visitType = note.visit_type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/portal/dashboard" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
          &larr; Back to dashboard
        </Link>

        {/* Header */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-4 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
              {visitType} Visit{note.chief_complaint ? ` — ${note.chief_complaint}` : ""}
            </h1>
            <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] rounded px-1.5 py-0.5">
              Read only
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {visitDate}
            {note.practitioners?.full_name ? ` · ${note.practitioners.full_name}` : ""}
            {note.practitioners?.practice_name ? ` · ${note.practitioners.practice_name}` : ""}
          </p>
        </div>

        {/* SOAP sections */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-5 space-y-6">
          <SoapSection title="Subjective" content={note.soap_subjective} />
          <SoapSection title="Objective" content={note.soap_objective} />
          <SoapSection title="Assessment" content={note.soap_assessment} />
          <SoapSection title="Plan" content={note.soap_plan} />
          {!note.soap_subjective && !note.soap_objective && !note.soap_assessment && !note.soap_plan && (
            <p className="text-sm text-[var(--color-text-muted)]">Note content is not available.</p>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logomark className="h-6 w-6" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Patient Portal</span>
          </div>
          <Link href="/portal/dashboard" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
            Dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}

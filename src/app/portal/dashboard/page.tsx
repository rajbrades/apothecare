"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logomark } from "@/components/ui/logomark";
import { createClient } from "@/lib/supabase/client";
import { FlaskConical, FileText, Shield } from "lucide-react";

interface LabReport {
  id: string;
  collection_date: string;
  lab_vendor: string;
  test_type: string;
  test_name: string | null;
  status: string;
}

interface EncounterNote {
  id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string | null;
  practitioners: { full_name: string } | null;
}

interface Patient {
  first_name: string | null;
  last_name: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatVendor(vendor: string) {
  return vendor.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labs, setLabs] = useState<LabReport[]>([]);
  const [notes, setNotes] = useState<EncounterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Verify auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/portal/login");
        return;
      }
      loadData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [meRes, labsRes, notesRes] = await Promise.all([
        fetch("/api/patient-portal/me"),
        fetch("/api/patient-portal/me/labs"),
        fetch("/api/patient-portal/me/notes"),
      ]);

      if (meRes.status === 401) { router.replace("/portal/login"); return; }

      const [meData, labsData, notesData] = await Promise.all([
        meRes.json(), labsRes.json(), notesRes.json(),
      ]);

      if (!meData.onboarding?.complete) {
        setOnboardingComplete(false);
        const { consents_complete } = meData.onboarding || {};
        router.replace(consents_complete ? "/portal/onboarding/intake" : "/portal/onboarding/consents");
        return;
      }

      setPatient(meData.patient);
      setLabs(labsData.labs || []);
      setNotes(notesData.notes || []);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/portal/login");
  }

  if (loading || !onboardingComplete) {
    return (
      <PortalShell onSignOut={signOut}>
        <p className="text-sm text-[var(--color-text-muted)]">Loading your dashboard…</p>
      </PortalShell>
    );
  }

  const firstName = patient?.first_name || "there";

  return (
    <PortalShell onSignOut={signOut}>
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Your shared records are shown below. All content is read-only.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)]">
          <Shield className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs leading-relaxed">Your records are securely encrypted and HIPAA compliant. Only your provider controls what is shared here.</p>
        </div>

        {/* Lab reports */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            Lab Reports
          </h2>
          {labs.length === 0 ? (
            <EmptyState icon={<FlaskConical className="h-6 w-6" />} message="No lab reports have been shared with you yet." hint="Your provider will share results here after your labs are processed." />
          ) : (
            <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
              {labs.map((lab) => (
                <Link
                  key={lab.id}
                  href={`/portal/labs/${lab.id}`}
                  className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-secondary)] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {lab.test_name || `${formatVendor(lab.lab_vendor)} — ${lab.test_type?.replace(/_/g, " ")}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatDate(lab.collection_date)}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors">
                    View &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Encounter notes */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            Encounter Notes
          </h2>
          {notes.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} message="No encounter notes have been shared with you yet." hint="Visit notes will appear here after your provider shares them." />
          ) : (
            <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/portal/notes/${note.id}`}
                  className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-secondary)] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {note.visit_type?.replace(/_/g, " ")} Visit
                      {note.chief_complaint ? ` — ${note.chief_complaint}` : ""}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDate(note.visit_date)}
                      {note.practitioners?.full_name ? ` · ${note.practitioners.full_name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors">
                    View &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

function EmptyState({ icon, message, hint }: { icon: React.ReactNode; message: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-6 py-10 flex flex-col items-center text-center gap-3">
      <div className="text-[var(--color-text-muted)]">{icon}</div>
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

function PortalShell({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logomark className="h-6 w-6" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Patient Portal</span>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-surface-secondary)]"
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-[var(--color-text-secondary)] transition-colors">Security</Link>
          <Link href="/telehealth" className="hover:text-[var(--color-text-secondary)] transition-colors">Telehealth</Link>
        </nav>
      </footer>
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Syringe, Pill, Activity, AlertTriangle, Beaker, Clock, ChevronRight, BookOpen } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/api/audit";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProtocolDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  // Fetch full protocol (RLS handles membership check)
  const [
    { data: protocol },
    { data: steps },
    { data: monitoring },
    { data: evidenceConflicts },
  ] = await Promise.all([
    supabase
      .from("corporate_protocols")
      .select("*, corporate_accounts(name, slug, logo_url)")
      .eq("id", id)
      .single(),
    supabase
      .from("corporate_protocol_steps")
      .select("*")
      .eq("protocol_id", id)
      .order("step_order"),
    supabase
      .from("corporate_protocol_monitoring")
      .select("*")
      .eq("protocol_id", id)
      .order("sort_order"),
    supabase
      .from("corporate_protocol_evidence_conflicts")
      .select("*")
      .eq("protocol_id", id),
  ]);

  if (!protocol) notFound();

  const corp = protocol.corporate_accounts as { name: string; slug: string; logo_url: string | null } | null;
  const stepsList = (steps || []) as { id: string; step_order: number; step_type: string; name: string; dosage: string | null; frequency: string | null; duration: string | null; cycle_on_days: number | null; cycle_off_days: number | null; clinical_justification: string; contraindications: string[]; phase_label: string | null }[];
  const monitoringList = (monitoring || []) as { id: string; lab_test: string; timing: string; target_range: string | null; escalation: string | null }[];
  const conflicts = (evidenceConflicts || []) as { id: string; conflict_description: string; org_justification: string; evidence_refs: string[] }[];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/protocols/library"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Protocol Library
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {corp && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] text-[var(--color-text-muted)]">
              {corp.name}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]">
            {protocol.category.toUpperCase()}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">v{protocol.version}</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mt-2">
          {protocol.title}
        </h1>
        {protocol.description && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            {protocol.description}
          </p>
        )}
      </div>

      {/* Evidence Conflicts */}
      {conflicts.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Evidence Notes</h2>
          </div>
          {conflicts.map((c) => (
            <div key={c.id} className="space-y-1">
              <p className="text-xs text-amber-700 font-medium">{c.conflict_description}</p>
              <p className="text-xs text-amber-600">{c.org_justification}</p>
              {c.evidence_refs.length > 0 && (
                <p className="text-[10px] text-amber-500">
                  Refs: {c.evidence_refs.join("; ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Protocol Steps */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Protocol Steps
        </h2>
        {stepsList.map((step, i) => {
          const isMed = step.step_type === "medication";
          const StepIcon = isMed ? Syringe : step.step_type === "supplement" ? Pill : Activity;
          const typeBadge = isMed
            ? "text-blue-700 bg-blue-50 border-blue-200"
            : step.step_type === "supplement"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-gray-700 bg-gray-50 border-gray-200";

          return (
            <div
              key={step.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {step.name}
                    </h3>
                    {step.phase_label && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">{step.phase_label}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeBadge}`}>
                  <StepIcon className="w-3 h-3 inline mr-1" />
                  {step.step_type}
                </span>
              </div>

              {/* Dosing details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {step.dosage && (
                  <div>
                    <span className="text-[var(--color-text-muted)] block mb-0.5">Dosage</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{step.dosage}</span>
                  </div>
                )}
                {step.frequency && (
                  <div>
                    <span className="text-[var(--color-text-muted)] block mb-0.5">Frequency</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{step.frequency}</span>
                  </div>
                )}
                {step.duration && (
                  <div>
                    <span className="text-[var(--color-text-muted)] block mb-0.5">Duration</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{step.duration}</span>
                  </div>
                )}
                {(step.cycle_on_days || step.cycle_off_days) && (
                  <div>
                    <span className="text-[var(--color-text-muted)] block mb-0.5">Cycle</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {step.cycle_on_days}d on / {step.cycle_off_days}d off
                    </span>
                  </div>
                )}
              </div>

              {/* Clinical justification */}
              <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] p-3">
                <BookOpen className="w-3 h-3 inline mr-1 text-[var(--color-text-muted)]" />
                {step.clinical_justification}
              </div>

              {/* Contraindications */}
              {step.contraindications.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Contraindications:</strong> {step.contraindications.join("; ")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Monitoring Schedule */}
      {monitoringList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Beaker className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Monitoring Schedule
            </h2>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-light)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">Lab Test</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">Timing</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">Target</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-secondary)]">Escalation</th>
                </tr>
              </thead>
              <tbody>
                {monitoringList.map((m) => (
                  <tr key={m.id} className="border-t border-[var(--color-border-light)]">
                    <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">{m.lab_test}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {m.timing}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{m.target_range ?? "—"}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{m.escalation ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-light)]">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {corp?.name} · Powered by Apothecare
        </p>
        {protocol.authored_by && (
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Authored by {protocol.authored_by}
          </p>
        )}
      </div>
    </div>
  );
}

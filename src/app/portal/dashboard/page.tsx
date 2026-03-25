"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  FileText,
  Shield,
  ScrollText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";

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

interface SignedConsent {
  id: string;
  title: string;
  signed_at: string;
}

interface Patient {
  first_name: string | null;
  last_name: string | null;
}

interface TrendItem {
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  unit: string;
  latest_value: number;
  previous_value: number;
  change: number;
  change_pct: number;
  latest_date: string;
  previous_date: string;
  latest_flag: string | null;
  data_points: { date: string; value: number }[];
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
  const [signedConsents, setSignedConsents] = useState<SignedConsent[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [meRes, labsRes, notesRes, consentsRes, trendsRes] = await Promise.all([
        fetch("/api/patient-portal/me"),
        fetch("/api/patient-portal/me/labs"),
        fetch("/api/patient-portal/me/notes"),
        fetch("/api/patient-portal/me/consents"),
        fetch("/api/patient-portal/me/biomarkers/timeline?mode=overview"),
      ]);

      if (meRes.status === 401) { router.replace("/portal/login"); return; }

      const [meData, labsData, notesData, consentsData, trendsData] = await Promise.all([
        meRes.json(), labsRes.json(), notesRes.json(), consentsRes.json(), trendsRes.json(),
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
      setTrends(trendsData.trends || []);
      // Show only signed consents
      setSignedConsents(
        (consentsData.consents || []).filter((c: SignedConsent & { signed: boolean }) => c.signed)
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading || !onboardingComplete) {
    return (
      <PortalShell>
        <p className="text-sm text-[var(--color-text-muted)]">Loading your dashboard…</p>
      </PortalShell>
    );
  }

  const firstName = patient?.first_name || "there";

  return (
    <PortalShell>
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

        {/* Biomarker Trends — only shown when 2+ labs have overlapping biomarkers */}
        {trends.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Biomarker Trends
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {trends.length} biomarker{trends.length !== 1 ? "s" : ""} tracked across your lab reports
              </p>
            </div>
            <PortalTrendsGrid trends={trends} />
          </section>
        )}

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

        {/* Signed consents */}
        {signedConsents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
              Signed Documents
            </h2>
            <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
              {signedConsents.map((consent) => (
                <div
                  key={consent.id}
                  className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)]"
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {consent.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Signed {formatDate(consent.signed_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Signed</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PortalShell>
  );
}

// ── Biomarker trend helpers ───────────────────────────────────────────

type BiomarkerFlag = "optimal" | "normal" | "borderline" | "out-of-range" | "critical";

function mapFlag(dbFlag: string | null): BiomarkerFlag {
  if (!dbFlag) return "normal";
  switch (dbFlag) {
    case "optimal": return "optimal";
    case "normal": return "normal";
    case "borderline_low":
    case "borderline_high": return "borderline";
    case "low":
    case "high": return "out-of-range";
    case "critical": return "critical";
    default: return "normal";
  }
}

const FLAG_COLORS: Record<BiomarkerFlag, string> = {
  optimal: "var(--color-biomarker-optimal)",
  normal: "var(--color-text-muted)",
  borderline: "var(--color-biomarker-borderline)",
  "out-of-range": "var(--color-biomarker-out-of-range)",
  critical: "var(--color-biomarker-critical)",
};

const FLAG_LABELS: Record<BiomarkerFlag, string> = {
  optimal: "Optimal",
  normal: "Normal",
  borderline: "Borderline",
  "out-of-range": "Out of Range",
  critical: "Critical",
};

function PortalSparkline({
  data,
  color,
  width = 80,
  height = 32,
}: {
  data: { date: string; value: number }[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;

  const points = data
    .map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const lastIdx = data.length - 1;
  const lx = pad + (lastIdx / (data.length - 1)) * (width - pad * 2);
  const ly = height - pad - ((data[lastIdx].value - min) / range) * (height - pad * 2);

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2} fill={color} />
    </svg>
  );
}

function formatCategory(cat: string): string {
  return cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function PortalTrendsGrid({ trends }: { trends: TrendItem[] }) {
  // Group by category
  const grouped = trends.reduce<Record<string, TrendItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            {formatCategory(cat)}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[cat].map((trend) => {
              const flag = mapFlag(trend.latest_flag);
              const color = FLAG_COLORS[flag];
              const sparkColor = flag === "optimal" || flag === "normal" ? "var(--color-brand-600)" : color;
              const ChangeIcon = trend.change > 0 ? ArrowUpRight : trend.change < 0 ? ArrowDownRight : Minus;

              return (
                <div
                  key={trend.biomarker_code}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                        {trend.biomarker_name}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {trend.latest_value}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">{trend.unit}</span>
                      </div>
                    </div>
                    <PortalSparkline data={trend.data_points} color={sparkColor} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-light)]">
                    <div className="flex items-center gap-1">
                      <ChangeIcon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-xs font-medium" style={{ color }}>
                        {trend.change > 0 ? "+" : ""}{trend.change_pct}%
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-1">
                        from {formatDate(trend.previous_date)}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        color,
                        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                      }}
                    >
                      {FLAG_LABELS[flag]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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

"use client";

import { useEffect, useState, useRef } from "react";
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
  Eye,
  FileEdit,
  Upload,
  Loader2,
  CheckCircle2,
  FileUp,
  ExternalLink,
  Activity,
} from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalLoader } from "@/components/portal/portal-loader";
import { generateConsentPdf } from "@/lib/portal/generate-consent-pdf";

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
  content_markdown?: string;
}

interface PatientDocument {
  id: string;
  title: string;
  document_type: string;
  status: string;
  file_name: string;
  uploaded_at: string;
}

interface Patient {
  first_name: string | null;
  last_name: string | null;
}

interface SymptomTrendItem {
  symptom_key: string;
  symptom_name: string;
  group: string;
  group_label: string;
  latest_value: number;
  previous_value: number;
  change: number;
  change_pct: number;
  latest_date: string;
  previous_date: string;
  data_points: { date: string; value: number }[];
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
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrendItem[]>([]);
  const [lastCheckinAt, setLastCheckinAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Fire all 7 fetches in parallel; each completion increments real progress
    const TOTAL = 7;
    const step = 100 / TOTAL;
    let completed = 0;
    const tick = () => {
      completed += 1;
      setLoadProgress(Math.round(Math.min((completed / TOTAL) * 100, 95)));
    };

    try {
      const [meRes, labsRes, notesRes, consentsRes, trendsRes, docsRes, symptomRes] = await Promise.all([
        fetch("/api/patient-portal/me").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/labs").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/notes").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/consents").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/biomarkers/timeline?mode=overview").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/documents").then((r) => { tick(); return r; }),
        fetch("/api/patient-portal/me/symptom-checkin/history?mode=overview").then((r) => { tick(); return r; }),
      ]);

      if (meRes.status === 401) { router.replace("/portal/login"); return; }

      const [meData, labsData, notesData, consentsData, trendsData, docsData, symptomData] = await Promise.all([
        meRes.json(), labsRes.json(), notesRes.json(), consentsRes.json(), trendsRes.json(), docsRes.json(), symptomRes.ok ? symptomRes.json() : { trends: [], last_checkin_at: null },
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
      setDocuments(docsData.documents || []);
      setSymptomTrends(symptomData.trends || []);
      setLastCheckinAt(symptomData.last_checkin_at || null);
      setSignedConsents(
        (consentsData.consents || []).filter((c: SignedConsent & { signed: boolean }) => c.signed)
      );
      setLoadProgress(100);
    } finally {
      // Brief pause at 100% before revealing content
      setTimeout(() => setLoading(false), 200);
    }
  }

  if (loading || !onboardingComplete) {
    return (
      <PortalShell>
        <PortalLoader progress={loadProgress} label="Loading your dashboard…" />
      </PortalShell>
    );
  }

  const firstName = patient?.first_name || "there";

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
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

        {/* Symptom check-in prompt — show if no check-in in last 14 days */}
        {(() => {
          const daysSince = lastCheckinAt
            ? Math.floor((Date.now() - new Date(lastCheckinAt).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          if (daysSince === null || daysSince >= 14) {
            return (
              <Link
                href="/portal/checkin"
                className="flex items-center gap-4 px-5 py-4 rounded-lg border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] transition-colors group"
              >
                <Activity className="h-5 w-5 text-[var(--color-brand-600)] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-brand-800)]">
                    {lastCheckinAt ? "Time for a symptom check-in" : "Complete your first symptom check-in"}
                  </p>
                  <p className="text-xs text-[var(--color-brand-600)] mt-0.5">
                    {lastCheckinAt
                      ? `Last check-in was ${daysSince} days ago. Your provider would like to hear how you're feeling.`
                      : "Rate your symptoms so your provider can track your progress over time."}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--color-brand-600)] group-hover:text-[var(--color-brand-800)] transition-colors">
                  Start &rarr;
                </span>
              </Link>
            );
          }
          return null;
        })()}

        {/* Symptom trends — only shown when 2+ check-ins have overlapping symptoms */}
        {symptomTrends.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Symptom Trends
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {symptomTrends.length} symptom{symptomTrends.length !== 1 ? "s" : ""} tracked across your check-ins
              </p>
            </div>
            <PortalSymptomTrendsGrid trends={symptomTrends} />
          </section>
        )}

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
                <ConsentRow key={consent.id} consent={consent} />
              ))}
            </div>
          </section>
        )}
        {/* Upload documents */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            Upload Documents
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Share lab results, imaging reports, or other health documents with your provider.
          </p>
          <PatientDocumentUpload onUploadComplete={(doc) => setDocuments((prev) => [doc, ...prev])} />
          {documents.length > 0 && (
            <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden mt-3">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>

        {/* Your Rights — HIPAA access links */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            Your Rights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/portal/disclosures"
              className="flex items-center gap-3 px-5 py-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-secondary)] transition-colors group"
            >
              <Eye className="h-5 w-5 text-[var(--color-text-muted)] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)]">
                  Access Disclosure Log
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  See who accessed your records
                </p>
              </div>
            </Link>
            <Link
              href="/portal/amendments"
              className="flex items-center gap-3 px-5 py-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-secondary)] transition-colors group"
            >
              <FileEdit className="h-5 w-5 text-[var(--color-text-muted)] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)]">
                  Request Correction
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Amend your health information
                </p>
              </div>
            </Link>
          </div>
        </section>
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

function PortalSymptomTrendsGrid({ trends }: { trends: SymptomTrendItem[] }) {
  // Group by body system
  const grouped = trends.reduce<Record<string, SymptomTrendItem[]>>((acc, item) => {
    const cat = item.group_label || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  function severityColor(value: number): string {
    if (value >= 7) return "var(--color-brand-800)";
    if (value >= 4) return "var(--color-brand-500)";
    return "var(--color-brand-300)";
  }

  function severityLabel(value: number): string {
    if (value >= 7) return "Significant";
    if (value >= 4) return "Moderate";
    return "Mild";
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            {cat}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[cat].map((trend) => {
              const color = severityColor(trend.latest_value);
              const ChangeIcon = trend.change > 0 ? ArrowUpRight : trend.change < 0 ? ArrowDownRight : Minus;
              const changeColor = trend.change > 0 ? "var(--color-brand-800)" : trend.change < 0 ? "var(--color-brand-400)" : "var(--color-text-muted)";

              return (
                <div
                  key={trend.symptom_key}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                        {trend.symptom_name}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {trend.latest_value}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">/10</span>
                      </div>
                    </div>
                    <PortalSparkline data={trend.data_points} color={color} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-light)]">
                    <div className="flex items-center gap-1">
                      <ChangeIcon className="w-3.5 h-3.5" style={{ color: changeColor }} />
                      <span className="text-xs font-medium" style={{ color: changeColor }}>
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
                      {severityLabel(trend.latest_value)}
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

const UPLOAD_DOCUMENT_TYPES = [
  { value: "lab_report", label: "Lab Report" },
  { value: "imaging", label: "Imaging / Radiology" },
  { value: "outside_encounter_note", label: "Outside Provider Notes" },
  { value: "insurance", label: "Insurance Document" },
  { value: "other", label: "Other" },
];

function UploadRing({ pct, label }: { pct: number; label: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-brand-100)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.25s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-text-primary)" fontFamily="inherit">
          {Math.round(pct)}%
        </text>
      </svg>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}

function PatientDocumentUpload({ onUploadComplete }: { onUploadComplete: (doc: PatientDocument) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [docType, setDocType] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");
    setSuccess(false);
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !docType) return;
    setUploading(true);
    setUploadPct(0);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);
      if (title.trim()) formData.append("title", title.trim());

      const responseText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
          else reject(new Error((() => { try { return JSON.parse(xhr.responseText).error; } catch { return "Upload failed"; } })()));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed. Please check your connection.")));
        xhr.open("POST", "/api/patient-portal/me/documents");
        xhr.send(formData);
      });

      const data = JSON.parse(responseText);
      setSuccess(true);
      setFile(null);
      setDocType("");
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadComplete(data.document);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
            Document Type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%237a7a7a%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] pr-9"
          >
            <option value="">Select type...</option>
            {UPLOAD_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
            Title <span className="font-normal italic normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quest Blood Panel March 2026"
            className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:border-[var(--color-brand-400)] transition-all"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-[var(--color-brand-400)] bg-[var(--color-brand-50)]"
            : file
            ? "border-emerald-300 bg-emerald-50"
            : "border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{file.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-brand-600)]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">PDF only, max 10MB</p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-[var(--color-brand-600)]">Document uploaded successfully. Your provider will be notified.</p>}

      {file && docType && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2 ${
            uploading
              ? "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] cursor-wait"
              : "text-white bg-[var(--color-brand-900)] hover:bg-[var(--color-brand-700)] hover:-translate-y-px hover:shadow-lg"
          }`}
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> {uploadPct < 100 ? `Uploading ${uploadPct}%` : "Processing…"}</> : "Upload Document"}
        </button>
      )}
    </div>
  );
}

function ConsentRow({ consent }: { consent: SignedConsent }) {
  const [generating, setGenerating] = useState(false);

  async function handleOpen() {
    if (!consent.content_markdown) return;
    setGenerating(true);
    try {
      const pdfBytes = await generateConsentPdf({
        title: consent.title,
        signedAt: formatDate(consent.signed_at),
        contentMarkdown: consent.content_markdown,
      });
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch { /* silent */ } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={generating}
      className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-secondary)] transition-colors w-full text-left group"
    >
      <div className="flex items-center gap-3">
        <ScrollText className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)]">
            {consent.title}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Signed {formatDate(consent.signed_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-brand-600)] font-medium">Signed</span>
        {generating
          ? <Loader2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] animate-spin" />
          : <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        }
      </div>
    </button>
  );
}

function DocumentRow({ doc }: { doc: PatientDocument }) {
  const [opening, setOpening] = useState(false);

  async function handleOpen() {
    if (doc.document_type === "intake_form") return;
    setOpening(true);
    try {
      const res = await fetch(`/api/patient-portal/me/documents/${doc.id}/url`);
      if (!res.ok) return;
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch { /* silent */ } finally {
      setOpening(false);
    }
  }

  const isClickable = doc.document_type !== "intake_form";

  return (
    <button
      type="button"
      onClick={isClickable ? handleOpen : undefined}
      disabled={opening}
      className={`flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-elevated)] w-full text-left group ${
        isClickable
          ? "hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center gap-3">
        <FileUp className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
        <div>
          <p className={`text-sm font-medium text-[var(--color-text-primary)] ${isClickable ? "group-hover:text-[var(--color-brand-600)]" : ""}`}>
            {doc.title}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {doc.document_type.replace(/_/g, " ")} · Uploaded {formatDate(doc.uploaded_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${doc.status === "extracted" || doc.status === "uploaded" ? "text-[var(--color-brand-600)]" : doc.status === "error" ? "text-[var(--color-destructive-500)]" : "text-[var(--color-warning-500)]"}`}>
          {doc.status === "extracted" ? "Processed" : doc.status === "uploaded" ? "Received" : doc.status === "error" ? "Error" : "Processing..."}
        </span>
        {isClickable && (
          opening
            ? <Loader2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] animate-spin" />
            : <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </button>
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BiomarkerPanel } from "@/components/chat/biomarker-range-bar";
import { Info, FlaskConical, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalLoader } from "@/components/portal/portal-loader";
import { mapDbFlagToComponentFlag } from "@/lib/labs/flag-mapping";
import type { BiomarkerData, BiomarkerPanelData } from "@/components/chat/biomarker-range-bar";
import type { BiomarkerFlag as DbFlag } from "@/types/database";

interface BiomarkerRow {
  id: string;
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  subcategory: string | null;
  value: number;
  unit: string;
  conventional_low: number | null;
  conventional_high: number | null;
  conventional_flag: DbFlag | null;
  functional_low: number | null;
  functional_high: number | null;
  functional_flag: DbFlag | null;
  interpretation: string | null;
}

interface LabReport {
  id: string;
  test_name: string | null;
  collection_date: string;
  lab_vendor: string;
  test_type: string;
  status: string;
  biomarker_results: BiomarkerRow[];
}

const VENDOR_LABELS: Record<string, string> = {
  quest: "Quest Diagnostics",
  labcorp: "LabCorp",
  diagnostic_solutions: "Diagnostic Solutions",
  genova: "Genova Diagnostics",
  precision_analytical: "Precision Analytical",
  mosaic: "Mosaic Diagnostics",
  vibrant: "Vibrant Wellness",
  spectracell: "SpectraCell",
  realtime_labs: "RealTime Labs",
  zrt: "ZRT Laboratory",
  other: "Other Lab",
};

function groupBiomarkers(rows: BiomarkerRow[]): BiomarkerPanelData[] {
  const categoryMap = new Map<string, BiomarkerRow[]>();
  for (const row of rows) {
    const cat = row.category || "Other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(row);
  }

  return Array.from(categoryMap.entries()).map(([category, biomarkers]) => ({
    title: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    biomarkers: biomarkers.map((b): BiomarkerData => ({
      name: b.biomarker_name,
      value: b.value,
      unit: b.unit,
      conventionalLow: b.conventional_low ?? 0,
      conventionalHigh: b.conventional_high ?? b.value * 2,
      functionalLow: b.functional_low ?? b.conventional_low ?? 0,
      functionalHigh: b.functional_high ?? b.conventional_high ?? b.value * 2,
      flag: b.functional_flag
        ? mapDbFlagToComponentFlag(b.functional_flag)
        : b.conventional_flag
        ? mapDbFlagToComponentFlag(b.conventional_flag)
        : "normal",
      note: b.interpretation ?? undefined,
    })),
  }));
}

export default function PatientLabDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lab, setLab] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/patient-portal/me/labs/${params.id}`)
      .then(async (r) => {
        if (r.status === 401) { router.replace("/portal/login"); return; }
        if (!r.ok) { setError("Lab report not found."); setLoading(false); return; }
        const data = await r.json();
        setLab(data.lab);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load lab report."); setLoading(false); });
  }, [params.id, router]);

  if (loading) {
    return <PortalShell><PortalLoader label="Loading lab report…" /></PortalShell>;
  }

  if (error || !lab) {
    return (
      <PortalShell>
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">{error || "Lab report not found."}</p>
          <Link href="/portal/dashboard" className="text-xs underline text-[var(--color-text-muted)]">Back to dashboard</Link>
        </div>
      </PortalShell>
    );
  }

  const panels = groupBiomarkers(lab.biomarker_results || []);
  const vendorLabel = VENDOR_LABELS[lab.lab_vendor] || lab.lab_vendor;
  const testDate = new Date(lab.collection_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <PortalShell>
      <div className="w-full max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] transition-colors mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)] px-4 sm:px-6 py-4 space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {lab.test_name || `${vendorLabel} — ${lab.test_type?.replace(/_/g, " ")}`}
            </h1>
            <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded px-2 py-0.5" title="You can view this, but only your provider can edit or share it.">
              Read only
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{vendorLabel} &middot; {testDate}</p>
        </div>

        {/* Health literacy banner */}
        {panels.length > 0 && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] text-[var(--color-brand-700)] mb-6">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Results show both <strong>conventional</strong> (standard medical) and <strong>optimal</strong> (functional medicine) ranges. Your provider uses optimal ranges as more precise health targets. Discuss any questions with your provider.
            </p>
          </div>
        )}

        {/* Biomarker panels */}
        {panels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-6 py-10 flex flex-col items-center text-center gap-3">
            <FlaskConical className="h-6 w-6 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No biomarker data available for this report.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {panels.map((panel, i) => (
              <BiomarkerPanel key={i} panel={panel} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}


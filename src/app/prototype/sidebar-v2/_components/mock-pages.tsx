"use client";

import {
  Search,
  Plus,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  ChevronRight,
  RefreshCcw,
  ClipboardList,
  Shield,
  Package,
  Upload,
} from "lucide-react";
import {
  MOCK_PATIENTS,
  MOCK_VISITS,
  VISIT_TYPE_LABELS,
} from "./mock-data";
import type { MockVisit } from "./mock-data";

/* ──────────────────────────────────────────────
   Shared Helpers
   ────────────────────────────────────────────── */

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; icon: React.ElementType };
}) {
  const Icon = action?.icon;
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {subtitle}
        </p>
      </div>
      {action && Icon && (
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-500)] transition-colors">
          <Icon size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
}

function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative mb-4">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-400)] focus:ring-1 focus:ring-[var(--color-brand-200)] transition-colors"
        readOnly
      />
    </div>
  );
}

function FilterPills({
  options,
  active,
}: {
  options: string[];
  active: number;
}) {
  return (
    <div className="flex gap-1 mb-4">
      {options.map((opt, i) => (
        <button
          key={opt}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            i === active
              ? "bg-[var(--color-brand-600)] text-white"
              : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-600)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Mock Patients Page
   ────────────────────────────────────────────── */

export function MockPatientsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <PageHeader
        title="Patients"
        subtitle="Manage your patient roster and clinical records"
        action={{ label: "New Patient", icon: Plus }}
      />

      <SearchBar placeholder="Search patients by name..." />
      <FilterPills options={["Active", "Archived"]} active={0} />

      <div className="space-y-2">
        {MOCK_PATIENTS.map((pt) => (
          <div
            key={pt.id}
            className="flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all cursor-pointer group"
          >
            {/* Avatar */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)] text-sm font-semibold">
              {pt.first_name[0]}
              {pt.last_name[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {pt.first_name} {pt.last_name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                DOB{" "}
                {new Date(pt.date_of_birth).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {pt.last_visit_date && (
                  <>
                    {" "}
                    · Last visit{" "}
                    {new Date(pt.last_visit_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </>
                )}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight
              size={16}
              className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button className="px-4 py-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
          Load More
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Mock Visits Page
   ────────────────────────────────────────────── */

const VISIT_TYPE_COLORS: Record<MockVisit["visit_type"], string> = {
  soap: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
  follow_up: "bg-blue-50 text-blue-700",
  history_physical: "bg-amber-50 text-amber-700",
  consult: "bg-purple-50 text-purple-700",
};

export function MockVisitsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <PageHeader
        title="Visit Notes"
        subtitle="AI-assisted clinical documentation with SOAP notes and IFM mapping"
        action={{ label: "New Visit", icon: Plus }}
      />

      <SearchBar placeholder="Filter by patient..." />

      <div className="space-y-3">
        {MOCK_VISITS.map((visit) => {
          const isFollowUp = visit.visit_type === "follow_up";
          return (
            <div
              key={visit.id}
              className="flex items-start gap-4 px-4 py-3.5 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all cursor-pointer group"
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${
                  isFollowUp
                    ? "bg-[var(--color-gold-50)] text-[var(--color-gold-600)]"
                    : "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
                }`}
              >
                {isFollowUp ? (
                  <RefreshCcw size={18} />
                ) : (
                  <Stethoscope size={18} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {visit.chief_complaint || "No chief complaint"}
                  </p>
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700">
                    Complete
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {new Date(visit.visit_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {visit.patient_name}
                  {" · "}
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${VISIT_TYPE_COLORS[visit.visit_type]}`}
                  >
                    {VISIT_TYPE_LABELS[visit.visit_type]}
                  </span>
                </p>
              </div>

              <ChevronRight
                size={16}
                className="mt-1 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Mock Labs Page
   ────────────────────────────────────────────── */

const MOCK_LABS = [
  { id: "lab-1", test_name: "Comprehensive Metabolic Panel", test_type: "blood_panel", patient: "Maria Santos", vendor: "Quest Diagnostics", date: "2026-03-01", status: "complete" },
  { id: "lab-2", test_name: "GI-MAP Stool Analysis", test_type: "stool_analysis", patient: "David Nguyen", vendor: "Diagnostic Solutions", date: "2026-02-27", status: "complete" },
  { id: "lab-3", test_name: "DUTCH Complete Hormone Panel", test_type: "saliva_hormone", patient: "Emily Johansson", vendor: "Precision Analytical", date: "2026-02-25", status: "complete" },
  { id: "lab-4", test_name: "Organic Acids Test (OAT)", test_type: "organic_acids", patient: "Priya Patel", vendor: "Mosaic Diagnostics", date: "2026-02-22", status: "parsing" },
  { id: "lab-5", test_name: "Thyroid Panel with Antibodies", test_type: "blood_panel", patient: "James Mitchell", vendor: "LabCorp", date: "2026-02-20", status: "complete" },
  { id: "lab-6", test_name: "NutrEval FMV", test_type: "micronutrient", patient: "Robert Kim", vendor: "Genova Diagnostics", date: "2026-02-18", status: "complete" },
];

const LAB_TYPE_COLORS: Record<string, string> = {
  blood_panel: "bg-rose-50 text-rose-600 border-rose-200",
  stool_analysis: "bg-teal-50 text-teal-600 border-teal-200",
  saliva_hormone: "bg-violet-50 text-violet-600 border-violet-200",
  organic_acids: "bg-amber-50 text-amber-600 border-amber-200",
  micronutrient: "bg-amber-50 text-amber-600 border-amber-200",
};

const LAB_TYPE_ICONS: Record<string, string> = {
  blood_panel: "B",
  stool_analysis: "S",
  saliva_hormone: "H",
  organic_acids: "O",
  micronutrient: "N",
};

const STATUS_BADGES: Record<string, string> = {
  complete: "bg-emerald-50 text-emerald-700",
  parsing: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  uploading: "bg-blue-50 text-blue-700",
};

export function MockLabsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <PageHeader
        title="Lab Results"
        subtitle="Upload PDFs for AI-powered extraction, biomarker tracking, and clinical insights"
      />

      {/* Upload area */}
      <div className="flex items-center justify-center gap-3 px-6 py-8 mb-6 border-2 border-dashed border-[var(--color-border-light)] rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)] transition-colors cursor-pointer">
        <Upload size={20} />
        <span className="text-sm font-medium">
          Drop lab PDF here or click to upload
        </span>
      </div>

      {/* View toggle + filters */}
      <div className="flex items-center gap-3 mb-4">
        <FilterPills options={["List View", "By Patient"]} active={0} />
        <div className="flex-1" />
        <select className="px-3 py-1.5 text-xs border border-[var(--color-border-light)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] outline-none">
          <option>All Statuses</option>
          <option>Complete</option>
          <option>Parsing</option>
          <option>Error</option>
        </select>
        <select className="px-3 py-1.5 text-xs border border-[var(--color-border-light)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] outline-none">
          <option>All Test Types</option>
          <option>Blood Panel</option>
          <option>Stool Analysis</option>
          <option>Hormone Panel</option>
          <option>Organic Acids</option>
        </select>
      </div>

      {/* Lab list */}
      <div className="space-y-2">
        {MOCK_LABS.map((lab) => (
          <div
            key={lab.id}
            className="flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all cursor-pointer group"
          >
            {/* Type icon */}
            <div
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-bold ${
                LAB_TYPE_COLORS[lab.test_type] || "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {LAB_TYPE_ICONS[lab.test_type] || "?"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {lab.test_name}
                </p>
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded capitalize ${
                    STATUS_BADGES[lab.status]
                  }`}
                >
                  {lab.status}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {lab.vendor} ·{" "}
                {new Date(lab.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {lab.patient}
              </p>
            </div>

            <ChevronRight
              size={16}
              className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Mock Supplements Page
   ────────────────────────────────────────────── */

export function MockSupplementsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <PageHeader
        title="Supplement Intelligence"
        subtitle="Evidence-based supplement reviews, interaction checking, and brand formulary"
      />

      {/* Tab navigation */}
      <div className="flex gap-6 border-b border-[var(--color-border-light)] mb-6">
        {[
          { label: "Reviews", icon: ClipboardList, active: true },
          { label: "Interaction Checker", icon: Shield, active: false },
          { label: "Brand Formulary", icon: Package, active: false },
        ].map((tab) => (
          <button
            key={tab.label}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab.active
                ? "border-[var(--color-brand-600)] text-[var(--color-brand-600)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mock reviews content */}
      <SearchBar placeholder="Search supplements..." />

      <div className="space-y-3">
        {[
          { name: "Berberine HCl 500mg", patient: "Maria Santos", date: "Mar 1, 2026", status: "complete", evidence: "Strong" },
          { name: "Magnesium Glycinate 400mg", patient: "Emily Johansson", date: "Feb 28, 2026", status: "complete", evidence: "Strong" },
          { name: "Omega-3 Fish Oil 2000mg EPA/DHA", patient: "James Mitchell", date: "Feb 25, 2026", status: "complete", evidence: "Moderate" },
          { name: "Ashwagandha KSM-66 600mg", patient: "Robert Kim", date: "Feb 22, 2026", status: "complete", evidence: "Moderate" },
          { name: "NAC 600mg", patient: "Priya Patel", date: "Feb 20, 2026", status: "pending", evidence: "—" },
        ].map((review) => (
          <div
            key={review.name}
            className="flex items-center gap-4 px-4 py-3.5 rounded-[var(--radius-md)] border border-[var(--color-border-light)] hover:border-[var(--color-brand-300)] hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Pill size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {review.name}
                </p>
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    review.status === "complete"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {review.status === "complete" ? "Reviewed" : "Pending"}
                </span>
                {review.evidence !== "—" && (
                  <span
                    className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      review.evidence === "Strong"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {review.evidence}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {review.patient} · {review.date}
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

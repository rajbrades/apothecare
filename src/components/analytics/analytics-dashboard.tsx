"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Dna,
  ClipboardList,
  BarChart3,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────

interface AnalyticsData {
  summary: {
    total_patients: number;
    total_visits: number;
    total_biomarkers: number;
    total_protocols: number;
    active_supplements: number;
  };
  topConditions: { name: string; count: number }[];
  visitVolume: {
    month: string;
    total: number;
    soap: number;
    follow_up: number;
    consult: number;
    h_and_p: number;
  }[];
  flagDistribution: Record<string, number>;
  topFlaggedBiomarkers: { name: string; count: number }[];
  biomarkerCategories: { category: string; count: number }[];
  topSupplements: { name: string; count: number }[];
  supplementStats: { active: number; discontinued: number };
  protocolStats: { draft: number; active: number; completed: number; archived: number };
  topFocusAreas: { area: string; count: number }[];
  labVendors: { vendor: string; count: number }[];
}

interface AnalyticsDashboardProps {
  subscriptionTier: string;
}

// ── Chart color palette ────────────────────────────────────────────────

const SAGE = ["#2d7a6e", "#4a9e8f", "#7bc4b5", "#a5ddd0", "#d1f0e9"];

const FLAG_COLORS: Record<string, string> = {
  optimal: "#059669",
  normal: "#6b8a83",
  borderline_low: "#d97706",
  borderline_high: "#d97706",
  low: "#ea580c",
  high: "#ea580c",
  critical: "#dc2626",
};

const VISIT_TYPE_COLORS: Record<string, string> = {
  soap: "#2d7a6e",
  follow_up: "#4a9e8f",
  consult: "#7bc4b5",
  h_and_p: "#a5ddd0",
};

// ── Helpers ────────────────────────────────────────────────────────────

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatVendor(vendor: string): string {
  return vendor
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatFocusArea(area: string): string {
  return area
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Custom tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] text-sm">
      {label && (
        <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-[var(--color-text-secondary)]">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] text-sm">
      <p className="text-xs text-[var(--color-text-secondary)]">
        <span
          className="inline-block w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: entry.payload.fill }}
        />
        {entry.name}: <span className="font-semibold">{entry.value}</span>
      </p>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 animate-pulse ${className}`}
    >
      <div className="h-4 w-24 bg-[var(--color-surface-tertiary)] rounded mb-4" />
      <div className="h-32 bg-[var(--color-surface-tertiary)] rounded" />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 animate-pulse">
      <div className="h-3 w-20 bg-[var(--color-surface-tertiary)] rounded mb-3" />
      <div className="h-8 w-16 bg-[var(--color-surface-tertiary)] rounded" />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <BarChart3 className="w-6 h-6 text-[var(--color-text-muted)] mb-2" />
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

// ── Chart card wrapper ─────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </span>
        <Icon className="w-4 h-4 text-[var(--color-brand-500)]" />
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ── Pro gate overlay ───────────────────────────────────────────────────

function ProGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 text-center">
      <div className="rounded-xl border border-[var(--color-gold-200)] bg-gradient-to-b from-[var(--color-gold-50)] to-[var(--color-surface)] p-10 max-w-md">
        <Lock className="w-8 h-8 text-[var(--color-gold-600)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Clinical Insights is a Pro feature
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Upgrade to Pro to unlock practice-level analytics, including condition
          trends, biomarker distributions, supplement usage, and more.
        </p>
        <Link
          href="/settings#subscription"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function AnalyticsDashboard({ subscriptionTier }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFree = subscriptionTier === "free";

  useEffect(() => {
    if (isFree) {
      setLoading(false);
      return;
    }

    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Analytics]", err);
        setError("Failed to load analytics data. Please try again.");
        setLoading(false);
      });
  }, [isFree]);

  // Pro gate
  if (isFree) {
    return <ProGate />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-7 w-48 bg-[var(--color-surface-tertiary)] rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-[var(--color-surface-tertiary)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 text-center">
        <BarChart3 className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {error || "No data available"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-medium text-[var(--color-brand-600)] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Prepare chart data ──

  // Flag distribution for donut chart
  const flagPieData = Object.entries(data.flagDistribution)
    .filter(([, count]) => count > 0)
    .map(([flag, count]) => ({
      name: flag
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      value: count,
      fill: FLAG_COLORS[flag] || "#94a3b8",
    }));

  // Visit volume with formatted months
  const visitVolumeData = data.visitVolume.map((v) => ({
    ...v,
    label: formatMonth(v.month),
  }));

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Clinical Insights
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Practice-level analytics across patients, visits, labs, and protocols
        </p>
      </div>

      {/* Row 1: Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Patients"
          value={data.summary.total_patients}
          icon={Users}
        />
        <StatCard
          label="Visits (12 mo)"
          value={data.summary.total_visits}
          icon={Stethoscope}
        />
        <StatCard
          label="Biomarkers Analyzed"
          value={data.summary.total_biomarkers}
          icon={Dna}
        />
        <StatCard
          label="Active Protocols"
          value={data.protocolStats.active}
          icon={ClipboardList}
        />
      </div>

      {/* Row 2: Top Conditions + Visit Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Top Conditions"
          subtitle="Most frequent chief complaints and diagnoses"
        >
          {data.topConditions.length === 0 ? (
            <EmptyChart message="No conditions recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={data.topConditions.slice(0, 10)}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)" }} />
                <Bar
                  dataKey="count"
                  name="Patients"
                  fill={SAGE[0]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Visit Volume"
          subtitle="Monthly visits over the last 12 months"
        >
          {visitVolumeData.length === 0 ? (
            <EmptyChart message="No visits in the last 12 months" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={visitVolumeData}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="soap"
                  name="SOAP"
                  stackId="visits"
                  fill={VISIT_TYPE_COLORS.soap}
                  stroke={VISIT_TYPE_COLORS.soap}
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="follow_up"
                  name="Follow-up"
                  stackId="visits"
                  fill={VISIT_TYPE_COLORS.follow_up}
                  stroke={VISIT_TYPE_COLORS.follow_up}
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="consult"
                  name="Consult"
                  stackId="visits"
                  fill={VISIT_TYPE_COLORS.consult}
                  stroke={VISIT_TYPE_COLORS.consult}
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="h_and_p"
                  name="H&P"
                  stackId="visits"
                  fill={VISIT_TYPE_COLORS.h_and_p}
                  stroke={VISIT_TYPE_COLORS.h_and_p}
                  fillOpacity={0.7}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          {visitVolumeData.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border-light)]">
              {[
                { key: "soap", label: "SOAP" },
                { key: "follow_up", label: "Follow-up" },
                { key: "consult", label: "Consult" },
                { key: "h_and_p", label: "H&P" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: VISIT_TYPE_COLORS[key] }}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Flag Distribution + Most Flagged Biomarkers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Biomarker Flag Distribution"
          subtitle="Functional flag breakdown (last 6 months)"
        >
          {flagPieData.length === 0 ? (
            <EmptyChart message="No biomarker data available" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={260}>
                <PieChart>
                  <Pie
                    data={flagPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    {flagPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {flagPieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Most Flagged Biomarkers"
          subtitle="Biomarkers with non-optimal flags (last 6 months)"
        >
          {data.topFlaggedBiomarkers.length === 0 ? (
            <EmptyChart message="No flagged biomarkers" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={data.topFlaggedBiomarkers}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)" }} />
                <Bar
                  dataKey="count"
                  name="Flags"
                  fill={SAGE[1]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Top Supplements + Protocol Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Top Supplements"
          subtitle="Most prescribed active supplements"
        >
          {data.topSupplements.length === 0 ? (
            <EmptyChart message="No supplement data available" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={data.topSupplements}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)" }} />
                <Bar
                  dataKey="count"
                  name="Patients"
                  fill={SAGE[2]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Protocol Focus Areas"
          subtitle="Most targeted clinical areas across protocols"
        >
          {data.topFocusAreas.length === 0 ? (
            <EmptyChart message="No protocol data available" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={data.topFocusAreas.map((fa) => ({
                  name: formatFocusArea(fa.area),
                  count: fa.count,
                }))}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)" }} />
                <Bar
                  dataKey="count"
                  name="Protocols"
                  fill={SAGE[3]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 5: Lab Vendor Distribution */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <ChartCard
          title="Lab Vendor Distribution"
          subtitle="Which lab vendors are most used across your practice"
        >
          {data.labVendors.length === 0 ? (
            <EmptyChart message="No lab reports uploaded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, data.labVendors.length * 40)}>
              <BarChart
                layout="vertical"
                data={data.labVendors.map((lv) => ({
                  name: formatVendor(lv.vendor),
                  count: lv.count,
                }))}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-light)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={{ stroke: "var(--color-border-light)" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-secondary)" }} />
                <Bar
                  dataKey="count"
                  name="Reports"
                  fill={SAGE[0]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

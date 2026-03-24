"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { BiomarkerFlag } from "@/components/chat/biomarker-range-bar";

// ── Types ─────────────────────────────────────────────────────────────

interface BiomarkerListItem {
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  data_points: number;
}

interface TimelineDataPoint {
  date: string;
  value: number;
  lab_report_id: string;
  functional_flag: string | null;
  conventional_flag: string | null;
}

interface TimelineResponse {
  biomarker_code: string;
  biomarker_name: string;
  category: string | null;
  unit: string;
  functional_low: number | null;
  functional_high: number | null;
  conventional_low: number | null;
  conventional_high: number | null;
  data_points: TimelineDataPoint[];
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
  functional_low: number | null;
  functional_high: number | null;
  conventional_low: number | null;
  conventional_high: number | null;
  data_points: { date: string; value: number }[];
}

interface BiomarkerTimelineProps {
  patientId: string;
  initialBiomarkerCode?: string;
}

// ── Flag mapping ──────────────────────────────────────────────────────

const FLAG_COLORS: Record<BiomarkerFlag, string> = {
  optimal: "var(--color-biomarker-optimal)",
  normal: "var(--color-biomarker-normal)",
  borderline: "var(--color-biomarker-borderline)",
  "out-of-range": "var(--color-biomarker-out-of-range)",
  critical: "var(--color-biomarker-critical)",
};

function mapFlag(dbFlag: string | null): BiomarkerFlag {
  if (!dbFlag) return "normal";
  switch (dbFlag) {
    case "optimal":
      return "optimal";
    case "normal":
      return "normal";
    case "borderline_low":
    case "borderline_high":
      return "borderline";
    case "low":
    case "high":
      return "out-of-range";
    case "critical":
      return "critical";
    default:
      return "normal";
  }
}

const FLAG_LABELS: Record<BiomarkerFlag, string> = {
  optimal: "Optimal",
  normal: "Normal",
  borderline: "Borderline",
  "out-of-range": "Out of Range",
  critical: "Critical",
};

// ── Helpers ───────────────────────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getChangeColor(change: number, flag: string | null): string {
  // For certain biomarkers, "going up" might be bad — but for simplicity
  // we use the flag-based approach: optimal/normal = good color, otherwise warning
  const mapped = mapFlag(flag);
  if (mapped === "optimal") return "var(--color-biomarker-optimal)";
  if (mapped === "normal") return "var(--color-text-muted)";
  if (mapped === "borderline") return "var(--color-biomarker-borderline)";
  if (mapped === "out-of-range") return "var(--color-biomarker-out-of-range)";
  if (mapped === "critical") return "var(--color-biomarker-critical)";
  return "var(--color-text-muted)";
}

// ── Custom chart elements ─────────────────────────────────────────────

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const flag = mapFlag(payload.functionalFlag || payload.conventionalFlag);
  const color = FLAG_COLORS[flag] || "var(--color-brand-600)";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="var(--color-surface)"
      strokeWidth={2}
      style={{ cursor: "pointer" }}
    />
  );
}

function CustomTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const flag = mapFlag(data.functionalFlag || data.conventionalFlag);

  return (
    <div className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] text-sm">
      <p className="font-medium text-[var(--color-text-primary)]">
        {data.value}{" "}
        <span className="text-[var(--color-text-muted)] text-xs">{unit}</span>
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
        {new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <span
        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1"
        style={{
          color: FLAG_COLORS[flag],
          backgroundColor: `color-mix(in srgb, ${FLAG_COLORS[flag]} 12%, transparent)`,
        }}
      >
        {FLAG_LABELS[flag]}
      </span>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
        Click dot to view lab report
      </p>
    </div>
  );
}

// ── Sparkline component ──────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 100,
  height = 36,
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
  const padding = 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((d.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {(() => {
        const lastIdx = data.length - 1;
        const x =
          padding + (lastIdx / (data.length - 1)) * (width - padding * 2);
        const y =
          height -
          padding -
          ((data[lastIdx].value - min) / range) * (height - padding * 2);
        return <circle cx={x} cy={y} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

// ── Trend Card ───────────────────────────────────────────────────────

function TrendCard({
  trend,
  onClick,
}: {
  trend: TrendItem;
  onClick: () => void;
}) {
  const flagColor = getChangeColor(trend.change, trend.latest_flag);
  const sparklineColor =
    mapFlag(trend.latest_flag) === "optimal" ||
    mapFlag(trend.latest_flag) === "normal"
      ? "var(--color-brand-600)"
      : flagColor;

  const ChangeIcon =
    trend.change > 0 ? ArrowUpRight : trend.change < 0 ? ArrowDownRight : Minus;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-sm transition-all group"
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
            <span className="text-xs text-[var(--color-text-muted)]">
              {trend.unit}
            </span>
          </div>
        </div>
        <Sparkline data={trend.data_points} color={sparklineColor} />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-light)]">
        <div className="flex items-center gap-1">
          <ChangeIcon
            className="w-3.5 h-3.5"
            style={{ color: flagColor }}
          />
          <span className="text-xs font-medium" style={{ color: flagColor }}>
            {trend.change > 0 ? "+" : ""}
            {trend.change_pct}%
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] ml-1">
            from {formatDate(trend.previous_date)}
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{
            color: flagColor,
            backgroundColor: `color-mix(in srgb, ${flagColor} 12%, transparent)`,
          }}
        >
          {FLAG_LABELS[mapFlag(trend.latest_flag)]}
        </span>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function BiomarkerTimeline({
  patientId,
  initialBiomarkerCode,
}: BiomarkerTimelineProps) {
  const router = useRouter();

  // Overview state
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Detail state
  const [selectedCode, setSelectedCode] = useState<string | null>(
    initialBiomarkerCode || null
  );
  const [biomarkerList, setBiomarkerList] = useState<BiomarkerListItem[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(
    null
  );
  const [loadingList, setLoadingList] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // View mode: "overview" shows trend cards, "detail" shows single chart
  const [view, setView] = useState<"overview" | "detail">(
    initialBiomarkerCode ? "detail" : "overview"
  );

  const [error, setError] = useState<string | null>(null);

  // Fetch trends overview on mount
  useEffect(() => {
    setLoadingOverview(true);
    fetch(`/api/patients/${patientId}/biomarkers/timeline?mode=overview`)
      .then((res) => res.json())
      .then((data) => {
        setTrends(data.trends || []);
        setLoadingOverview(false);
      })
      .catch(() => {
        setError("Failed to load biomarker trends");
        setLoadingOverview(false);
      });
  }, [patientId]);

  // Fetch biomarker list when entering detail view
  useEffect(() => {
    if (view !== "detail") return;
    if (biomarkerList.length > 0) return;
    setLoadingList(true);
    fetch(`/api/patients/${patientId}/biomarkers/timeline`)
      .then((res) => res.json())
      .then((data) => {
        const items: BiomarkerListItem[] = data.biomarkers || [];
        setBiomarkerList(items);
        if (!selectedCode) {
          const first = items.find((b) => b.data_points >= 2) || items[0];
          if (first) setSelectedCode(first.biomarker_code);
        }
        setLoadingList(false);
      })
      .catch(() => {
        setError("Failed to load biomarkers");
        setLoadingList(false);
      });
  }, [patientId, view, biomarkerList.length, selectedCode]);

  // Fetch timeline when selection changes
  useEffect(() => {
    if (view !== "detail" || !selectedCode) return;
    setLoadingTimeline(true);
    fetch(
      `/api/patients/${patientId}/biomarkers/timeline?biomarker_code=${encodeURIComponent(selectedCode)}`
    )
      .then((res) => res.json())
      .then((data) => {
        setTimelineData(data);
        setLoadingTimeline(false);
      })
      .catch(() => {
        setError("Failed to load timeline data");
        setLoadingTimeline(false);
      });
  }, [patientId, selectedCode, view]);

  // Deep-link to a specific biomarker
  useEffect(() => {
    if (!initialBiomarkerCode) return;
    setSelectedCode(initialBiomarkerCode);
    setView("detail");
  }, [initialBiomarkerCode]);

  const handleCardClick = useCallback((code: string) => {
    setSelectedCode(code);
    setView("detail");
  }, []);

  const handleBackToOverview = useCallback(() => {
    setView("overview");
    setTimelineData(null);
  }, []);

  // Group biomarkers by category for the selector
  const grouped = biomarkerList.reduce<Record<string, BiomarkerListItem[]>>(
    (acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  // Transform data for recharts
  const chartData = timelineData?.data_points.map((dp) => ({
    date: dp.date,
    value: dp.value,
    labReportId: dp.lab_report_id,
    functionalFlag: dp.functional_flag,
    conventionalFlag: dp.conventional_flag,
    displayDate: new Date(dp.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  }));

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.labReportId) {
      router.push(`/labs/${data.activePayload[0].payload.labReportId}`);
    }
  };

  // Group trends by category for overview
  const trendsByCategory = trends.reduce<Record<string, TrendItem[]>>(
    (acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const trendCategories = Object.keys(trendsByCategory).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  // ── Loading / Empty states ──

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-sm text-[var(--color-biomarker-out-of-range)] py-8">
        {error}
      </p>
    );
  }

  // ── Overview: Trend cards grid ──

  if (view === "overview") {
    if (trends.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">
            No biomarker data available. Upload lab reports to see trends.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Trends appear when the same biomarker is found in 2 or more lab
            uploads.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Historical Trends
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {trends.length} biomarker{trends.length !== 1 ? "s" : ""} tracked
              across multiple labs
            </p>
          </div>
        </div>

        {trendCategories.map((cat) => (
          <div key={cat}>
            <h4 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              {formatCategory(cat)}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendsByCategory[cat].map((trend) => (
                <TrendCard
                  key={trend.biomarker_code}
                  trend={trend}
                  onClick={() => handleCardClick(trend.biomarker_code)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Detail: Single biomarker chart ──

  return (
    <div className="space-y-4">
      {/* Back button + selector row */}
      <div className="flex items-center gap-3">
        {trends.length > 0 && (
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Trends
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <label
            htmlFor="biomarker-select"
            className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
          >
            Biomarker
          </label>
          {loadingList ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
          ) : (
            <select
              id="biomarker-select"
              value={selectedCode || ""}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-400)] focus:outline-none"
            >
              {sortedCategories.map((cat) => (
                <optgroup
                  key={cat}
                  label={cat.split("_").join(" ").toUpperCase()}
                >
                  {grouped[cat].map((item) => (
                    <option
                      key={item.biomarker_code}
                      value={item.biomarker_code}
                    >
                      {item.biomarker_name} ({item.data_points}{" "}
                      {item.data_points === 1 ? "result" : "results"})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart area */}
      {loadingTimeline ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
        </div>
      ) : timelineData && chartData && chartData.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {/* Chart header */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {timelineData.biomarker_name}
              </h3>
              {timelineData.unit && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {timelineData.unit}
                </p>
              )}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {chartData.length} data point{chartData.length !== 1 ? "s" : ""}
            </span>
          </div>

          {chartData.length === 1 ? (
            <div className="text-center py-6">
              <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {chartData[0].value}{" "}
                <span className="text-sm text-[var(--color-text-muted)]">
                  {timelineData.unit}
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Only one data point. Upload more labs to see trends over time.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  onClick={handleChartClick}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-light)"
                  />

                  {/* Conventional range band (lighter) */}
                  {timelineData.conventional_low != null &&
                    timelineData.conventional_high != null && (
                      <ReferenceArea
                        y1={timelineData.conventional_low}
                        y2={timelineData.conventional_high}
                        fill="var(--color-biomarker-normal)"
                        fillOpacity={0.08}
                        strokeOpacity={0}
                      />
                    )}

                  {/* Functional range band (stronger) */}
                  {timelineData.functional_low != null &&
                    timelineData.functional_high != null && (
                      <ReferenceArea
                        y1={timelineData.functional_low}
                        y2={timelineData.functional_high}
                        fill="var(--color-brand-200)"
                        fillOpacity={0.25}
                        strokeOpacity={0}
                      />
                    )}

                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    width={50}
                  />

                  <Tooltip
                    content={<CustomTooltip unit={timelineData.unit} />}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-brand-600)"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{
                      r: 7,
                      strokeWidth: 2,
                      stroke: "var(--color-brand-600)",
                      fill: "var(--color-surface)",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border-light)]">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                  Legend:
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-3 rounded-sm"
                    style={{
                      backgroundColor: "var(--color-brand-200)",
                      opacity: 0.5,
                    }}
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Functional range
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-3 rounded-sm"
                    style={{
                      backgroundColor: "var(--color-biomarker-normal)",
                      opacity: 0.15,
                    }}
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Conventional range
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-brand-600)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Your value (click to view lab)
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

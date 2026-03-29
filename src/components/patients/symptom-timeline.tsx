"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Activity,
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

interface SymptomTrend {
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

interface SymptomDetail {
  symptom_key: string;
  label: string;
  group: string;
  data_points: { date: string; value: number; source: string; notes: string | null }[];
}

interface SymptomTimelineProps {
  patientId: string;
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SymptomTimeline({ patientId }: SymptomTimelineProps) {
  const [trends, setTrends] = useState<SymptomTrend[]>([]);
  const [detail, setDetail] = useState<SymptomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [lastCheckinAt, setLastCheckinAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/symptom-checkin/timeline?mode=overview`);
        if (!res.ok) return;
        const data = await res.json();
        setTrends(data.trends || []);
        setTotalCheckins(data.total_checkins || 0);
        setLastCheckinAt(data.last_checkin_at || null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  const loadDetail = useCallback(async (symptomKey: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/symptom-checkin/timeline?symptom_key=${symptomKey}`);
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 gap-3">
        <Activity className="h-6 w-6 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          {totalCheckins === 0
            ? "No symptom check-ins yet. The patient can submit check-ins from their portal."
            : "Only one check-in recorded. Trends will appear after the next check-in."}
        </p>
      </div>
    );
  }

  // Detail view
  if (detail && !detailLoading) {
    const chartData = detail.data_points.map((dp) => ({
      date: formatShortDate(dp.date),
      value: dp.value,
      fullDate: dp.date,
      source: dp.source,
      notes: dp.notes,
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetail(null)}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{detail.label}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{detail.data_points.length} data points</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              {/* Severity zones */}
              <ReferenceArea y1={0} y2={3} fill="var(--color-brand-100)" fillOpacity={0.3} />
              <ReferenceArea y1={4} y2={6} fill="var(--color-brand-200)" fillOpacity={0.3} />
              <ReferenceArea y1={7} y2={10} fill="var(--color-brand-300)" fillOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}/10`, "Severity"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-brand-600)"
                strokeWidth={2}
                dot={{ fill: "var(--color-brand-600)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4 text-[10px] text-[var(--color-text-muted)] justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[var(--color-brand-100)]" /> Mild (0-3)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[var(--color-brand-200)]" /> Moderate (4-6)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[var(--color-brand-300)]" /> Significant (7-10)</span>
        </div>
      </div>
    );
  }

  // Overview: trend cards grouped by body system
  const grouped = trends.reduce<Record<string, SymptomTrend[]>>((acc, t) => {
    const cat = t.group_label || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">
          {totalCheckins} check-in{totalCheckins !== 1 ? "s" : ""}
          {lastCheckinAt && ` · Last: ${formatDate(lastCheckinAt)}`}
        </p>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 px-1">
            {group}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {items.map((trend) => {
              const color = severityColor(trend.latest_value);
              const ChangeIcon = trend.change > 0 ? ArrowUpRight : trend.change < 0 ? ArrowDownRight : Minus;
              const changeColor = trend.change > 0 ? "var(--color-brand-800)" : trend.change < 0 ? "var(--color-brand-400)" : "var(--color-text-muted)";

              return (
                <button
                  key={trend.symptom_key}
                  onClick={() => loadDetail(trend.symptom_key)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-left hover:border-[var(--color-brand-300)] transition-colors"
                >
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">
                    {trend.symptom_name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {trend.latest_value}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">/10</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      <ChangeIcon className="w-3 h-3" style={{ color: changeColor }} />
                      <span className="text-[10px] font-medium" style={{ color: changeColor }}>
                        {trend.change > 0 ? "+" : ""}{trend.change_pct}%
                      </span>
                    </div>
                  </div>
                  <span
                    className="mt-1 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      color,
                      backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                    }}
                  >
                    {severityLabel(trend.latest_value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

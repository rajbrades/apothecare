"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ReferenceLine,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────

interface VitalPoint {
  date: string;
  weight_kg?: number;
  height_cm?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate_bpm?: number;
}

interface RatingPoint {
  date: string;
  sleep?: number;
  stress?: number;
  movement?: number;
  nutrition?: number;
  digestion?: number;
  energy?: number;
  mood?: number;
  hydration?: number;
}

interface VitalsData {
  vitals: VitalPoint[];
  ratings: RatingPoint[];
}

interface VitalsTimelineProps {
  patientId: string;
}

const PILLAR_KEYS = [
  "sleep", "stress", "movement", "nutrition",
  "digestion", "energy", "mood", "hydration",
] as const;

const PILLAR_COLORS: Record<string, string> = {
  sleep: "#6366f1",
  stress: "#ef4444",
  movement: "#22c55e",
  nutrition: "#84cc16",
  digestion: "#f97316",
  energy: "#eab308",
  mood: "#ec4899",
  hydration: "#3b82f6",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function bmi(w?: number, h?: number): number | null {
  if (!w || !h) return null;
  return parseFloat((w / ((h / 100) ** 2)).toFixed(1));
}

// Build weight data with BMI and delta
function buildWeightData(vitals: VitalPoint[]) {
  return vitals
    .filter((v) => v.weight_kg != null)
    .map((v, i, arr) => {
      const prev = i > 0 ? arr[i - 1].weight_kg : undefined;
      const delta = prev != null && v.weight_kg != null ? +(v.weight_kg - prev).toFixed(1) : null;
      return {
        date: formatDate(v.date),
        weight: v.weight_kg,
        bmi: bmi(v.weight_kg, v.height_cm),
        delta,
      };
    });
}

// Build BP data
function buildBpData(vitals: VitalPoint[]) {
  return vitals
    .filter((v) => v.bp_systolic != null || v.bp_diastolic != null)
    .map((v) => ({
      date: formatDate(v.date),
      systolic: v.bp_systolic,
      diastolic: v.bp_diastolic,
    }));
}

// Build HR data
function buildHrData(vitals: VitalPoint[]) {
  return vitals
    .filter((v) => v.heart_rate_bpm != null)
    .map((v) => ({
      date: formatDate(v.date),
      hr: v.heart_rate_bpm,
    }));
}

// Build radar data from most recent rating
function buildRadarData(ratings: RatingPoint[]) {
  if (ratings.length === 0) return [];
  const latest = ratings[ratings.length - 1];
  return PILLAR_KEYS.map((key) => ({
    pillar: key.charAt(0).toUpperCase() + key.slice(1),
    value: latest[key] ?? 0,
    fullMark: 10,
  }));
}

// Build line data for all pillar trends
function buildPillarTrendData(ratings: RatingPoint[]) {
  return ratings.map((r) => ({
    date: formatDate(r.date),
    ...Object.fromEntries(PILLAR_KEYS.map((k) => [k, r[k]])),
  }));
}

// ── Custom delta label for weight bars ────────────────────────────────

interface DeltaLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number | null;
}

function DeltaLabel({ x = 0, y = 0, width = 0, value }: DeltaLabelProps) {
  if (value == null) return null;
  const color = value > 0 ? "#ef4444" : value < 0 ? "#22c55e" : "#94a3b8";
  const text = value > 0 ? `+${value}` : `${value}`;
  return (
    <text x={x + width / 2} y={y - 4} fill={color} textAnchor="middle" fontSize={10}>
      {text}
    </text>
  );
}

// ── Recharts tooltip formatters (cast to any to satisfy strict generic) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtWeight: any = (val: number, name: string) => [name === "weight" ? `${val} kg` : val, name === "weight" ? "Weight" : name];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtBp: any = (v: number, n: string) => [`${v} mmHg`, n === "systolic" ? "Systolic" : "Diastolic"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtHr: any = (v: number) => [`${v} bpm`, "Heart Rate"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtRating: any = (v: number) => [`${v}/10`];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtPillar: any = (v: number, n: string) => [`${v}/10`, n.charAt(0).toUpperCase() + n.slice(1)];

// ── Section wrapper ───────────────────────────────────────────────────

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function VitalsTimeline({ patientId }: VitalsTimelineProps) {
  const [data, setData] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pillarsView, setPillarsView] = useState<"radar" | "trends">("radar");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/patients/${patientId}/vitals`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  const hasVitals = (data?.vitals ?? []).length > 0;
  const hasRatings = (data?.ratings ?? []).length > 0;

  if (!hasVitals && !hasRatings) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-4">
          <TrendingUp className="w-7 h-7 text-[var(--color-brand-600)]" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No vitals recorded yet</h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
          Record biometrics and health ratings in the Intake tab during visits to see trends here.
        </p>
      </div>
    );
  }

  const vitals = data!.vitals;
  const ratings = data!.ratings;

  const weightData = buildWeightData(vitals);
  const bpData = buildBpData(vitals);
  const hrData = buildHrData(vitals);
  const radarData = buildRadarData(ratings);
  const pillarTrendData = buildPillarTrendData(ratings);

  const tooltipStyle = {
    fontSize: 11,
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: 6,
  };

  return (
    <div>
      {/* ── Weight ── */}
      {weightData.length > 0 && (
        <ChartSection title="Weight">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={weightData} margin={{ top: 20, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
                unit=" kg"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={fmtWeight}
              />
              <Bar dataKey="weight" fill="var(--color-brand-400)" radius={[3, 3, 0, 0]} label={<DeltaLabel />} />
              <Line type="monotone" dataKey="weight" stroke="var(--color-brand-600)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* ── Blood Pressure ── */}
      {bpData.length > 0 && (
        <ChartSection title="Blood Pressure">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 160]} tick={{ fontSize: 11 }} unit=" mmHg" />
              <Tooltip contentStyle={tooltipStyle} formatter={fmtBp} />
              <Legend formatter={(v) => v === "systolic" ? "Systolic" : "Diastolic" as any} />
              {/* Normal systolic range (90–120) */}
              <ReferenceArea y1={90} y2={120} fill="#22c55e" fillOpacity={0.07} />
              {/* Normal diastolic range (60–80) */}
              <ReferenceArea y1={60} y2={80} fill="#3b82f6" fillOpacity={0.07} />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
              <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* ── Heart Rate ── */}
      {hrData.length > 0 && (
        <ChartSection title="Resting Heart Rate">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hrData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 120]} tick={{ fontSize: 11 }} unit=" bpm" />
              <Tooltip contentStyle={tooltipStyle} formatter={fmtHr} />
              {/* Normal resting HR (60–100) */}
              <ReferenceArea y1={60} y2={100} fill="#22c55e" fillOpacity={0.08} />
              <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="hr" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: "#f97316" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* ── Pillars of Health ── */}
      {hasRatings && (
        <ChartSection title="Pillars of Health">
          {/* View toggle */}
          <div className="flex items-center gap-1 mb-4">
            {(["radar", "trends"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPillarsView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  pillarsView === v
                    ? "bg-[var(--color-brand-600)] text-white"
                    : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {v === "radar" ? "Snapshot" : "Trends"}
              </button>
            ))}
            {pillarsView === "radar" && ratings.length > 0 && (
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                Most recent · {formatDate(ratings[ratings.length - 1].date)}
              </span>
            )}
          </div>

          {pillarsView === "radar" ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                <PolarGrid stroke="var(--color-border-light)" />
                <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11 }} />
                <Radar
                  name="Pillars"
                  dataKey="value"
                  stroke="var(--color-brand-600)"
                  fill="var(--color-brand-600)"
                  fillOpacity={0.25}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={fmtRating} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={pillarTrendData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={fmtPillar} />
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1) as any} />
                {PILLAR_KEYS.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={PILLAR_COLORS[key]}
                    strokeWidth={1.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartSection>
      )}
    </div>
  );
}

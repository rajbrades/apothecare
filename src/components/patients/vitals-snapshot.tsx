"use client";

import { useState, useEffect } from "react";
import { Activity, Heart, Weight, TrendingUp, Moon, Zap, Dumbbell, Leaf, Waves, Battery, Smile, Droplets } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

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

const PILLAR_META: {
  key: keyof RatingPoint;
  label: string;
  icon: typeof Moon;
}[] = [
  { key: "sleep", label: "Sleep", icon: Moon },
  { key: "stress", label: "Stress", icon: Zap },
  { key: "movement", label: "Movement", icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", icon: Leaf },
  { key: "digestion", label: "Digestion", icon: Waves },
  { key: "energy", label: "Energy", icon: Battery },
  { key: "mood", label: "Mood", icon: Smile },
  { key: "hydration", label: "Hydration", icon: Droplets },
];

function ratingColor(value: number): string {
  if (value <= 4) return "text-red-600";
  if (value <= 7) return "text-amber-600";
  return "text-emerald-600";
}

function ratingBarBg(value: number): string {
  if (value <= 4) return "bg-red-500";
  if (value <= 7) return "bg-amber-500";
  return "bg-emerald-500";
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

function bmiCalc(weight_kg?: number, height_cm?: number): number | null {
  if (!weight_kg || !height_cm || height_cm === 0) return null;
  const h = height_cm / 100;
  return weight_kg / (h * h);
}

function bmiLabel(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-amber-600 bg-amber-50" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-700 bg-emerald-50" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600 bg-amber-50" };
  return { label: "Obese", color: "text-red-600 bg-red-50" };
}

// ── Sparkline ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (data.length < 2) return null;
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────

interface VitalsSnapshotProps {
  patientId: string;
  onViewTrends?: () => void;
}

export function VitalsSnapshot({ patientId, onViewTrends }: VitalsSnapshotProps) {
  const [vitals, setVitals] = useState<VitalPoint[]>([]);
  const [ratings, setRatings] = useState<RatingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/vitals`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setVitals(data.vitals || []);
        setRatings(data.ratings || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) {
    return (
      <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
        <div className="h-20 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[var(--color-brand-300)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const hasVitals = vitals.length > 0;
  const hasRatings = ratings.length > 0;

  if (!hasVitals && !hasRatings) {
    return (
      <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-[var(--color-brand-600)]" />
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Vitals & Health
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          No vitals recorded — capture vitals during a visit to see data here.
        </p>
      </div>
    );
  }

  const latest = vitals[vitals.length - 1];
  const latestRating = ratings[ratings.length - 1];
  const spark = vitals.slice(-5);
  const bmi = latest ? bmiCalc(latest.weight_kg, latest.height_cm) : null;

  return (
    <div className="border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--color-brand-600)]" />
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Vitals & Health
          </h3>
        </div>
        {onViewTrends && (
          <button
            onClick={onViewTrends}
            className="text-xs text-[var(--color-brand-600)] hover:underline flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            View trends
          </button>
        )}
      </div>

      {/* Biometrics row */}
      {hasVitals && latest && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Weight */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Weight className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase">Weight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-mono)]">
                {latest.weight_kg != null ? kgToLbs(latest.weight_kg) : "—"}
              </span>
              {latest.weight_kg != null && (
                <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
              )}
              <Sparkline
                data={spark.filter((v) => v.weight_kg != null)}
                dataKey="weight_kg"
                color="var(--color-brand-500)"
              />
            </div>
            {bmi != null && (
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${bmiLabel(bmi).color}`}>
                BMI {bmi.toFixed(1)} · {bmiLabel(bmi).label}
              </span>
            )}
          </div>

          {/* Blood Pressure */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase">BP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-mono)]">
                {latest.bp_systolic != null && latest.bp_diastolic != null
                  ? `${latest.bp_systolic}/${latest.bp_diastolic}`
                  : "—"}
              </span>
              {latest.bp_systolic != null && (
                <span className="text-xs text-[var(--color-text-muted)]">mmHg</span>
              )}
              <Sparkline
                data={spark.filter((v) => v.bp_systolic != null)}
                dataKey="bp_systolic"
                color="#ef4444"
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase">HR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-mono)]">
                {latest.heart_rate_bpm != null ? latest.heart_rate_bpm : "—"}
              </span>
              {latest.heart_rate_bpm != null && (
                <span className="text-xs text-[var(--color-text-muted)]">bpm</span>
              )}
              <Sparkline
                data={spark.filter((v) => v.heart_rate_bpm != null)}
                dataKey="heart_rate_bpm"
                color="#f97316"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pillars mini-bars */}
      {hasRatings && latestRating && (
        <div>
          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            {PILLAR_META.map(({ key, label, icon: Icon }) => {
              const val = latestRating[key] as number | undefined;
              if (val == null) return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
                      <span className={`text-[10px] font-semibold ${ratingColor(val)}`}>{val}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${ratingBarBg(val)}`}
                        style={{ width: `${(val / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

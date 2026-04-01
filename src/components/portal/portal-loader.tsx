"use client";

import { useEffect, useState } from "react";

interface PortalLoaderProps {
  /** 0–100. When undefined, auto-simulates progress (for single-fetch pages). */
  progress?: number;
  label?: string;
}

/**
 * Centered full-screen loading indicator with circular progress ring.
 * Pass a real `progress` value (0–100) for multi-fetch pages, or omit it
 * to get a smooth auto-simulated progress bar for single-fetch pages.
 */
export function PortalLoader({ progress: controlledProgress, label = "Loading your records…" }: PortalLoaderProps) {
  const [simulated, setSimulated] = useState(0);

  // Auto-simulate progress when no real value is provided
  useEffect(() => {
    if (controlledProgress !== undefined) return;

    const timer = setInterval(() => {
      setSimulated((p) => {
        if (p >= 85) { clearInterval(timer); return p; }
        // Ease out — fast at start, slows near 85%
        return p + Math.max(1, (85 - p) * 0.12);
      });
    }, 60);
    return () => clearInterval(timer);
  }, [controlledProgress]);

  const pct = controlledProgress !== undefined ? controlledProgress : simulated;
  const display = Math.round(pct);

  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)]">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-label={`Loading ${display}%`}>
        {/* Track ring */}
        <circle
          cx="52" cy="52" r={r}
          fill="none"
          stroke="var(--color-brand-100)"
          strokeWidth="5"
        />
        {/* Progress ring */}
        <circle
          cx="52" cy="52" r={r}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 52 52)"
          style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Percentage label */}
        <text
          x="52" y="49"
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill="var(--color-text-primary)"
          fontFamily="inherit"
        >
          {display}%
        </text>
        {/* Sub-label */}
        <text
          x="52" y="66"
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-text-muted)"
          fontFamily="inherit"
          style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          LOADING
        </text>
      </svg>
      <p className="text-xs text-[var(--color-text-muted)] tracking-wide">{label}</p>
    </div>
  );
}

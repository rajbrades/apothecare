"use client";

import { useState, useEffect } from "react";

/**
 * Calculates the time remaining until midnight UTC (daily query reset).
 * Returns { hours, minutes } or null if calculation fails.
 */
function getTimeUntilMidnightUTC(): { hours: number; minutes: number } {
  const now = new Date();
  const midnightUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const diffMs = midnightUTC.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

interface ResetCountdownProps {
  className?: string;
}

export function ResetCountdown({ className = "" }: ResetCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number }>(
    getTimeUntilMidnightUTC
  );

  useEffect(() => {
    // Update immediately, then every 60 seconds
    setTimeLeft(getTimeUntilMidnightUTC());
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightUTC());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      Resets in{" "}
      <span className="font-[var(--font-mono)] tabular-nums">
        {timeLeft.hours}h {timeLeft.minutes.toString().padStart(2, "0")}m
      </span>
    </span>
  );
}

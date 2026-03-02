"use client";

interface TooltipProps {
  label: string;
  side?: "right" | "top";
  children: React.ReactNode;
}

/**
 * Lightweight CSS-only tooltip. Shows on hover with a short delay.
 * No external dependencies — purely positional via group-hover.
 */
export function Tooltip({ label, side = "right", children }: TooltipProps) {
  const positionClasses =
    side === "right"
      ? "left-full ml-3 top-1/2 -translate-y-1/2"
      : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <div className="relative group/tooltip">
      {children}
      <span
        className={`absolute ${positionClasses} z-[60] px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--color-text-primary)] text-white whitespace-nowrap opacity-0 pointer-events-none scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 delay-200`}
        role="tooltip"
      >
        {label}
      </span>
    </div>
  );
}

import type { BiomarkerFlag as DbFlag } from "@/types/database";
import type { BiomarkerFlag as ComponentFlag } from "@/components/chat/biomarker-range-bar";

/**
 * Map the 7-value database flag to the 5-value component flag.
 *
 * DB:        optimal | normal | borderline_low | borderline_high | low | high | critical
 * Component: optimal | normal | borderline      | out-of-range    | critical
 */
export function mapDbFlagToComponentFlag(dbFlag: DbFlag): ComponentFlag {
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
  }
}

/** Human-readable label for a DB biomarker flag */
export function flagLabel(dbFlag: DbFlag): string {
  switch (dbFlag) {
    case "optimal":
      return "Optimal";
    case "normal":
      return "Normal";
    case "borderline_low":
      return "Borderline Low";
    case "borderline_high":
      return "Borderline High";
    case "low":
      return "Low";
    case "high":
      return "High";
    case "critical":
      return "Critical";
  }
}

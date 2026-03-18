/**
 * Lab report PDF export template.
 * Renders biomarker results grouped by category with flags and trend indicators.
 */

import type { BiomarkerResult } from "@/types/database";
import { escapeHtml } from "./shared";

function flagClass(flag: string | null): string {
  if (!flag) return "";
  if (flag === "critical") return "flag-critical";
  if (flag === "high" || flag === "borderline_high") return "flag-high";
  if (flag === "low" || flag === "borderline_low") return "flag-low";
  if (flag === "optimal") return "flag-optimal";
  return "";
}

function flagLabel(flag: string | null): string {
  if (!flag) return "";
  const labels: Record<string, string> = {
    optimal: "OPT",
    normal: "",
    borderline_low: "▼ BL",
    borderline_high: "▲ BH",
    low: "▼ L",
    high: "▲ H",
    critical: "!! C",
  };
  return labels[flag] || "";
}

function formatRange(low: number | null, high: number | null): string {
  if (low !== null && high !== null) return `${low} - ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return "—";
}

/**
 * Build the biomarker results HTML grouped by category.
 */
export function buildLabReportBody(
  biomarkers: BiomarkerResult[],
  labMeta: {
    test_name?: string | null;
    lab_vendor?: string;
    collection_date?: string | null;
  }
): string {
  // Group by category
  const groups = new Map<string, BiomarkerResult[]>();
  for (const bm of biomarkers) {
    const cat = bm.category || "Other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(bm);
  }

  // Sort each group by biomarker name
  for (const [, items] of groups) {
    items.sort((a, b) => a.biomarker_name.localeCompare(b.biomarker_name));
  }

  const flaggedCount = biomarkers.filter(
    (b) =>
      b.functional_flag &&
      b.functional_flag !== "normal" &&
      b.functional_flag !== "optimal"
  ).length;

  const collectionDate = labMeta.collection_date
    ? new Date(labMeta.collection_date + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : null;

  const vendorLabels: Record<string, string> = {
    quest: "Quest Diagnostics",
    labcorp: "LabCorp",
    diagnostic_solutions: "Diagnostic Solutions",
    genova: "Genova Diagnostics",
    precision_analytical: "Precision Analytical",
    mosaic: "Mosaic Diagnostics",
    vibrant: "Vibrant Wellness",
    spectracell: "SpectraCell",
    realtime_labs: "RealTime Labs",
    zrt: "ZRT Laboratory",
  };

  // Lab summary header
  let html = `
  <div style="margin-bottom: 20px;">
    <div style="font-size: 10pt; color: #4a6660;">
      ${labMeta.test_name ? `<strong>${escapeHtml(labMeta.test_name)}</strong>` : ""}
      ${labMeta.lab_vendor && labMeta.lab_vendor !== "other" ? ` · ${vendorLabels[labMeta.lab_vendor] || labMeta.lab_vendor}` : ""}
    </div>
    <div style="font-size: 9pt; color: #7a9690; margin-top: 4px;">
      ${collectionDate ? `Collected: ${collectionDate} · ` : ""}${biomarkers.length} biomarker${biomarkers.length !== 1 ? "s" : ""}${flaggedCount > 0 ? `, ${flaggedCount} flagged` : ""}
    </div>
  </div>`;

  // Render each category panel
  for (const [category, items] of groups) {
    html += `
  <div class="section">
    <div class="section-label">${escapeHtml(category)}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 30%">Biomarker</th>
          <th style="width: 12%">Result</th>
          <th style="width: 10%">Unit</th>
          <th style="width: 18%">Functional Range</th>
          <th style="width: 18%">Conv. Range</th>
          <th style="width: 6%">Flag</th>
        </tr>
      </thead>
      <tbody>`;

    for (const bm of items) {
      const fFlag = flagLabel(bm.functional_flag);
      const fClass = flagClass(bm.functional_flag);

      html += `
        <tr>
          <td>${escapeHtml(bm.biomarker_name)}</td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: 500;" class="${fClass}">${bm.value}</td>
          <td>${escapeHtml(bm.unit || "")}</td>
          <td>${formatRange(bm.functional_low, bm.functional_high)}</td>
          <td>${formatRange(bm.conventional_low, bm.conventional_high)}</td>
          <td class="${fClass}">${fFlag}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>`;
  }

  // Flagged summary
  const flagged = biomarkers.filter(
    (b) =>
      b.functional_flag &&
      b.functional_flag !== "normal" &&
      b.functional_flag !== "optimal"
  );

  if (flagged.length > 0) {
    html += `
  <div class="section">
    <div class="section-label">Flagged Summary</div>
    <div style="font-size: 9pt; color: #4a6660; margin-bottom: 8px;">
      ${flagged.length} biomarker${flagged.length !== 1 ? "s" : ""} outside functional range:
    </div>
    <ul style="list-style: none; padding: 0; font-size: 9pt;">`;

    for (const bm of flagged) {
      const direction =
        bm.functional_flag === "high" || bm.functional_flag === "borderline_high"
          ? "elevated"
          : "low";
      html += `
      <li style="margin-bottom: 4px;">
        <span class="${flagClass(bm.functional_flag)}" style="margin-right: 6px;">\u2022</span>
        <strong>${escapeHtml(bm.biomarker_name)}</strong> ${direction} (${bm.value} ${bm.unit || ""})${bm.interpretation ? ` — ${escapeHtml(bm.interpretation)}` : ""}
      </li>`;
    }

    html += `
    </ul>
  </div>`;
  }

  return html;
}

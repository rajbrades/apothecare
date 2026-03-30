/**
 * Lab report PDF export template.
 * Renders biomarker results grouped by category with flag badges and trend indicators.
 */

import type { BiomarkerResult } from "@/types/database";
import { escapeHtml } from "./shared";

function flagBadge(flag: string | null): string {
  if (!flag || flag === "normal") return "";

  const labels: Record<string, string> = {
    optimal: "✓ Optimal",
    borderline_low: "↓ Suboptimal",
    borderline_high: "↑ Suboptimal",
    low: "↓ Suboptimal",
    high: "↑ Suboptimal",
    critical: "‼ Critical",
  };

  const badgeClass: Record<string, string> = {
    optimal: "flag-badge-optimal",
    borderline_low: "flag-badge-suboptimal",
    borderline_high: "flag-badge-suboptimal",
    low: "flag-badge-suboptimal",
    high: "flag-badge-suboptimal",
    critical: "flag-badge-critical",
  };

  const label = labels[flag];
  if (!label) return "";

  return `<span class="flag-badge ${badgeClass[flag] || ""}">${label}</span>`;
}

function resultClass(flag: string | null): string {
  if (!flag || flag === "normal" || flag === "optimal") return "";
  if (flag === "critical") return "result-critical";
  return "result-suboptimal";
}

function formatRange(low: number | null, high: number | null): string {
  if (low !== null && high !== null) return `${low} – ${high}`;
  if (low !== null) return `≥ ${low}`;
  if (high !== null) return `≤ ${high}`;
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

  const vendorDisplay =
    labMeta.lab_vendor && labMeta.lab_vendor !== "other"
      ? vendorLabels[labMeta.lab_vendor] || labMeta.lab_vendor
      : null;

  // Lab summary header
  let html = `
  <div class="lab-summary">
    <div class="lab-summary-title">
      ${labMeta.test_name ? escapeHtml(labMeta.test_name) : "Laboratory Results"}${vendorDisplay ? ` <span class="lab-summary-vendor">· ${escapeHtml(vendorDisplay)}</span>` : ""}
    </div>
    <div class="lab-summary-meta">
      ${collectionDate ? `<span>Collected ${collectionDate}</span><span class="dot"></span>` : ""}
      <span>${biomarkers.length} biomarker${biomarkers.length !== 1 ? "s" : ""} analyzed</span>
      ${flaggedCount > 0 ? `<span class="dot"></span><span class="lab-summary-flagged-count">${flaggedCount} flagged</span>` : ""}
    </div>
  </div>`;

  // Render each category panel
  for (const [category, items] of groups) {
    html += `
  <div class="section">
    <div class="section-label">${escapeHtml(category).toUpperCase()}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 30%">Biomarker</th>
          <th style="width: 11%">Result</th>
          <th style="width: 9%">Unit</th>
          <th style="width: 16%">Functional Range</th>
          <th style="width: 16%">Conv. Range</th>
          <th style="width: 12%; text-align: center;">Flag</th>
        </tr>
      </thead>
      <tbody>`;

    for (const bm of items) {
      const badge = flagBadge(bm.functional_flag);
      const rClass = resultClass(bm.functional_flag);

      html += `
        <tr>
          <td>${escapeHtml(bm.biomarker_name)}</td>
          <td class="result-cell ${rClass}">${bm.value}</td>
          <td>${escapeHtml(bm.unit || "")}</td>
          <td class="range-cell">${formatRange(bm.functional_low, bm.functional_high)}</td>
          <td class="range-cell">${formatRange(bm.conventional_low, bm.conventional_high)}</td>
          <td style="text-align: center;">${badge}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>`;
  }

  // Flagged summary as card grid
  const flagged = biomarkers.filter(
    (b) =>
      b.functional_flag &&
      b.functional_flag !== "normal" &&
      b.functional_flag !== "optimal"
  );

  if (flagged.length > 0) {
    html += `
  <div class="flagged-summary">
    <div class="flagged-summary-header">Flagged Results — ${flagged.length} Biomarker${flagged.length !== 1 ? "s" : ""} Outside Functional Range</div>
    <div class="flagged-grid">`;

    for (const bm of flagged) {
      const direction =
        bm.functional_flag === "high" || bm.functional_flag === "borderline_high"
          ? "Elevated"
          : bm.functional_flag === "critical"
          ? "Critical"
          : "Low";

      const rangeStr =
        bm.functional_low !== null && bm.functional_high !== null
          ? `range ${bm.functional_low}–${bm.functional_high}`
          : "";

      const cardClass = bm.functional_flag === "critical" ? "flagged-card-critical" : "flagged-card-suboptimal";

      html += `
      <div class="flagged-card ${cardClass}">
        <div class="flagged-card-name">${escapeHtml(bm.biomarker_name)}</div>
        <div class="flagged-card-detail">
          ${direction} at <span class="flagged-value">${bm.value} ${escapeHtml(bm.unit || "")}</span>${rangeStr ? ` · ${rangeStr}` : ""}${bm.interpretation ? ` — ${escapeHtml(bm.interpretation)}` : ""}
        </div>
      </div>`;
    }

    html += `
    </div>
  </div>`;
  }

  return html;
}

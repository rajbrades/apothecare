/**
 * Supplement protocol PDF export template.
 * Renders review items grouped by action with evidence citations and interaction warnings.
 */

import type {
  SupplementReviewData,
  SupplementReviewItem,
  VerifiedCitation,
} from "@/types/database";
import { escapeHtml } from "./shared";

const ACTION_CONFIG: Record<string, { label: string; cssClass: string; icon: string }> = {
  keep: { label: "KEEP", cssClass: "action-keep", icon: "\u2713" },
  modify: { label: "MODIFY", cssClass: "action-modify", icon: "\u26A0" },
  discontinue: { label: "DISCONTINUE", cssClass: "action-discontinue", icon: "\u2717" },
  add: { label: "ADD", cssClass: "action-add", icon: "+" },
};

function buildCitationHtml(citation: VerifiedCitation, index: number): string {
  const authors = citation.authors?.length
    ? citation.authors.length <= 2
      ? citation.authors.join(" & ")
      : `${citation.authors[0]} et al.`
    : "";

  const doiLink = citation.doi
    ? citation.doi.startsWith("http")
      ? citation.doi
      : `https://doi.org/${citation.doi}`
    : null;

  return `<div style="font-size: 8pt; color: #7a9690; margin-top: 4px;">
    [${index}] ${authors}${citation.year ? ` (${citation.year})` : ""}. "${escapeHtml(citation.title)}"${citation.source ? `. <em>${escapeHtml(citation.source)}</em>` : ""}${doiLink ? ` <a href="${doiLink}" style="color: #2d7a6e;">DOI</a>` : ""}
  </div>`;
}

function buildItemCard(item: SupplementReviewItem, citations: Map<number, VerifiedCitation>): string {
  const config = ACTION_CONFIG[item.action] || ACTION_CONFIG.keep;

  const details: string[] = [];
  if (item.recommended_dosage) details.push(`<strong>Dose:</strong> ${escapeHtml(item.recommended_dosage)}`);
  if (item.recommended_form) details.push(`<strong>Form:</strong> ${escapeHtml(item.recommended_form)}`);
  if (item.recommended_timing) details.push(`<strong>Timing:</strong> ${escapeHtml(item.recommended_timing)}`);
  if (item.recommended_duration) details.push(`<strong>Duration:</strong> ${escapeHtml(item.recommended_duration)}`);
  if (item.recommended_brand) details.push(`<strong>Brand:</strong> ${escapeHtml(item.recommended_brand)}`);

  let html = `
  <div class="card">
    <div class="card-header">
      <span class="action-badge ${config.cssClass}">${config.icon} ${config.label}</span>
      <strong style="font-size: 11pt; color: #1a2e2a;">${escapeHtml(item.name)}</strong>
      ${item.current_dosage ? `<span style="font-size: 9pt; color: #7a9690;">(current: ${escapeHtml(item.current_dosage)})</span>` : ""}
    </div>
    <div class="card-detail">
      ${details.length ? `<div style="margin-bottom: 6px;">${details.join(" · ")}</div>` : ""}
      ${item.rationale ? `<div style="margin-bottom: 6px;">${escapeHtml(item.rationale)}</div>` : ""}`;

  // Citations
  if (item.verified_citations?.length) {
    for (const vc of item.verified_citations) {
      const idx = citations.size + 1;
      citations.set(idx, vc);
      html += buildCitationHtml(vc, idx);
    }
  }

  html += `
    </div>
  </div>`;

  return html;
}

/**
 * Build the supplement protocol HTML body.
 */
export function buildSupplementProtocolBody(
  reviewData: SupplementReviewData
): string {
  const allCitations = new Map<number, VerifiedCitation>();
  let html = "";

  // Summary
  if (reviewData.summary) {
    html += `
  <div class="section">
    <div class="section-label">Summary</div>
    <div class="section-content" style="font-size: 10pt; margin-bottom: 16px;">${escapeHtml(reviewData.summary)}</div>
  </div>`;
  }

  // Group current items by action
  const groups: Record<string, SupplementReviewItem[]> = {
    keep: [],
    modify: [],
    discontinue: [],
  };

  for (const item of reviewData.items || []) {
    const key = item.action || "keep";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Current protocol modifications
  const hasCurrentItems = Object.values(groups).some((g) => g.length > 0);
  if (hasCurrentItems) {
    html += `<div class="section"><div class="section-label">Current Protocol</div></div>`;
    for (const [action, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      for (const item of items) {
        html += buildItemCard({ ...item, action: action as typeof item.action }, allCitations);
      }
    }
  }

  // New additions
  if (reviewData.additions?.length) {
    html += `<div class="section" style="margin-top: 24px;"><div class="section-label">New Additions</div></div>`;
    for (const item of reviewData.additions) {
      html += buildItemCard({ ...item, action: "add" }, allCitations);
    }
  }

  // Interaction warnings (collect from all items)
  const allItems = [...(reviewData.items || []), ...(reviewData.additions || [])];
  const interactions = allItems.flatMap((item) =>
    (item.interactions || []).filter((i) => i.severity !== "safe")
  );

  if (interactions.length > 0) {
    html += `<div class="section" style="margin-top: 24px;"><div class="section-label">Interaction Warnings</div></div>`;
    for (const ix of interactions) {
      html += `
  <div class="interaction-warning">
    <strong>\u26A0 ${escapeHtml(ix.severity.toUpperCase())}: ${escapeHtml(ix.substance_a)} + ${escapeHtml(ix.substance_b)}</strong>
    <div style="margin-top: 4px;">${escapeHtml(ix.mechanism)}</div>
    ${ix.recommendation ? `<div style="margin-top: 2px; font-style: italic;">${escapeHtml(ix.recommendation)}</div>` : ""}
  </div>`;
    }
  }

  // Numbered references
  if (allCitations.size > 0) {
    html += `
  <div class="section" style="margin-top: 24px;">
    <div class="section-label">References</div>
    <ol style="font-size: 8pt; color: #7a9690; padding-left: 16px; margin-top: 8px;">`;

    for (const [idx, vc] of allCitations) {
      const authors = vc.authors?.length
        ? vc.authors.length <= 2
          ? vc.authors.join(" & ")
          : `${vc.authors[0]} et al.`
        : "";
      html += `
      <li value="${idx}" style="margin-bottom: 4px;">
        ${authors}${vc.year ? ` (${vc.year})` : ""}. "${escapeHtml(vc.title)}"${vc.source ? `. <em>${escapeHtml(vc.source)}</em>` : ""}${vc.doi ? `. DOI: ${escapeHtml(vc.doi)}` : ""}
      </li>`;
    }

    html += `
    </ol>
  </div>`;
  }

  return html;
}

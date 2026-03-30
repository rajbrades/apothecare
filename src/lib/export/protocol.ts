/**
 * Protocol PDF export template.
 * Renders multi-phase treatment protocols with supplements, diet, lifestyle,
 * labs, and conditional logic per phase.
 */

import type { ProtocolPhase, PhaseSupplementItem, PhaseLabItem, PhaseConditionalRule } from "@/types/protocol";
import { escapeHtml } from "./shared";

function actionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    start: "action-add",
    continue: "action-keep",
    increase: "action-modify",
    decrease: "action-modify",
    discontinue: "action-discontinue",
  };
  return map[action] || "";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    active: "Active",
    completed: "Completed",
    extended: "Extended",
    skipped: "Skipped",
  };
  return map[status] || status;
}

/**
 * Build the protocol body HTML with all phases.
 */
export function buildProtocolBody(
  phases: ProtocolPhase[],
  protocolMeta: {
    title: string;
    focus_areas: string[];
    total_duration_weeks: number | null;
    status: string;
  }
): string {
  let html = `
  <div class="protocol-summary">
    <div class="protocol-title">${escapeHtml(protocolMeta.title)}</div>
    <div class="protocol-meta">
      ${protocolMeta.focus_areas.length ? `<span>${protocolMeta.focus_areas.map(f => escapeHtml(f)).join(" · ")}</span>` : ""}
      ${protocolMeta.total_duration_weeks ? `<span class="dot"></span><span>${protocolMeta.total_duration_weeks} weeks total</span>` : ""}
      <span class="dot"></span>
      <span>${phases.length} phase${phases.length !== 1 ? "s" : ""}</span>
    </div>
  </div>`;

  for (const phase of phases) {
    html += `
  <div class="protocol-phase">
    <div class="phase-header">
      <div class="phase-number">Phase ${phase.phase_number}</div>
      <div class="phase-title">${escapeHtml(phase.title)}</div>
      <div class="phase-duration">${phase.duration_weeks} weeks · ${statusLabel(phase.status)}</div>
    </div>
    <div class="phase-goal">${escapeHtml(phase.goal)}</div>`;

    // Supplements
    const supplements = (phase.supplements || []) as PhaseSupplementItem[];
    if (supplements.length > 0) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">SUPPLEMENTS</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%">Product</th>
            <th style="width: 12%">Dosage</th>
            <th style="width: 12%">Frequency</th>
            <th style="width: 12%">Timing</th>
            <th style="width: 10%">Action</th>
            <th style="width: 29%">Rationale</th>
          </tr>
        </thead>
        <tbody>`;

      for (const supp of supplements) {
        html += `
          <tr>
            <td><strong>${escapeHtml(supp.name)}</strong></td>
            <td>${escapeHtml(supp.dosage)}</td>
            <td>${escapeHtml(supp.frequency)}</td>
            <td>${supp.timing ? escapeHtml(supp.timing) : "—"}</td>
            <td><span class="action-badge ${actionBadgeClass(supp.action)}">${supp.action}</span></td>
            <td class="range-cell">${escapeHtml(supp.rationale)}</td>
          </tr>`;
      }

      html += `
        </tbody>
      </table>
    </div>`;
    }

    // Diet
    const diet = (phase.diet || []) as string[];
    if (diet.length > 0) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">DIETARY RECOMMENDATIONS</div>
      <ul class="phase-list">
        ${diet.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
      </ul>
    </div>`;
    }

    // Lifestyle
    const lifestyle = (phase.lifestyle || []) as string[];
    if (lifestyle.length > 0) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">LIFESTYLE RECOMMENDATIONS</div>
      <ul class="phase-list">
        ${lifestyle.map(l => `<li>${escapeHtml(l)}</li>`).join("")}
      </ul>
    </div>`;
    }

    // Labs to order
    const labs = (phase.labs_to_order || []) as PhaseLabItem[];
    if (labs.length > 0) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">LABS TO ORDER AT PHASE END</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30%">Lab Test</th>
            <th style="width: 20%">Target Range</th>
            <th style="width: 50%">Rationale</th>
          </tr>
        </thead>
        <tbody>
          ${labs.map(l => `
          <tr>
            <td><strong>${escapeHtml(l.name)}</strong></td>
            <td>${l.target_range ? escapeHtml(l.target_range) : "—"}</td>
            <td class="range-cell">${escapeHtml(l.rationale)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
    }

    // Conditional logic
    const conditions = (phase.conditional_logic || []) as PhaseConditionalRule[];
    if (conditions.length > 0) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">PHASE TRANSITION CRITERIA</div>
      ${conditions.map(c => `
      <div class="conditional-card">
        <div class="conditional-if"><strong>IF</strong> ${escapeHtml(c.condition)}</div>
        <div class="conditional-then"><strong>THEN</strong> ${escapeHtml(c.action)}</div>
        <div class="conditional-else"><strong>ELSE</strong> ${escapeHtml(c.fallback)}</div>
      </div>`).join("")}
    </div>`;
    }

    // Practitioner notes
    if (phase.practitioner_notes) {
      html += `
    <div class="phase-section">
      <div class="phase-section-title">PRACTITIONER NOTES</div>
      <div class="phase-notes">${escapeHtml(phase.practitioner_notes)}</div>
    </div>`;
    }

    html += `
  </div>`;
  }

  return html;
}

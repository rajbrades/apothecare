/**
 * Shared print CSS for all Apothecare PDF exports.
 * Design: "Clinical Editorial" — authoritative medical document aesthetic.
 * Typography: Newsreader (display/headings), DM Sans (body), JetBrains Mono (data).
 * Palette: sage-green (#2d7a6e) accent, warm whites, clinical grays.
 */

export const EXPORT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --ink: #1a2e2a;
    --ink-secondary: #3d5a54;
    --ink-muted: #6b8a83;
    --ink-faint: #95b0a9;
    --sage: #2d7a6e;
    --sage-light: #e8f0ee;
    --sage-lighter: #f4f8f7;
    --rule: #c8d9d5;
    --rule-light: #e2ece9;
    --surface: #ffffff;
    --flag-high: #b91c1c;
    --flag-high-bg: #fef2f2;
    --flag-low: #1d4ed8;
    --flag-low-bg: #eff6ff;
    --flag-critical: #991b1b;
    --flag-critical-bg: #fef2f2;
    --flag-optimal: #047857;
    --flag-optimal-bg: #ecfdf5;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: var(--ink);
    max-width: 7.5in;
    margin: 0.5in auto;
    padding: 0 0.4in;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Letterhead ─────────────────────────────── */
  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 0;
    border-bottom: 2px solid var(--sage);
  }
  .letterhead-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .letterhead-logo {
    max-height: 44px;
    max-width: 160px;
    object-fit: contain;
  }
  .letterhead-practice {
    line-height: 1.3;
  }
  .letterhead-practice-name {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 13pt;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .letterhead-credentials {
    font-size: 8pt;
    color: var(--ink-muted);
    margin-top: 1px;
  }
  .letterhead .meta {
    text-align: right;
    font-size: 8pt;
    color: var(--ink-secondary);
    line-height: 1.6;
  }

  /* ── Report Title ──────────────────────────── */
  .report-title {
    padding: 16px 0 14px;
    margin-bottom: 4px;
  }
  .report-title h1 {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 22pt;
    font-weight: 500;
    color: var(--sage);
    letter-spacing: -0.01em;
    line-height: 1.1;
  }
  .report-subtitle {
    font-size: 9.5pt;
    color: var(--ink-muted);
    margin-top: 3px;
  }

  /* ── Patient Bar ────────────────────────────── */
  .patient-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    background: var(--sage-lighter);
    border: 1px solid var(--rule-light);
    border-radius: 4px;
    padding: 10px 18px;
    margin: 14px 0 22px 0;
    font-size: 9pt;
    color: var(--ink-secondary);
  }
  .patient-bar strong {
    color: var(--ink);
    font-weight: 600;
    margin-right: 2px;
  }

  /* ── Section Category Headers ──────────────── */
  .section {
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .section-label {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 11pt;
    font-weight: 500;
    color: var(--sage);
    letter-spacing: 0.01em;
    padding-bottom: 5px;
    margin-bottom: 10px;
    border-bottom: 1.5px solid var(--rule);
  }

  /* ── Lab Summary Header ────────────────────── */
  .lab-summary {
    margin-bottom: 24px;
  }
  .lab-summary-title {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 12pt;
    font-weight: 500;
    color: var(--ink);
  }
  .lab-summary-vendor {
    color: var(--ink-muted);
    font-weight: 400;
  }
  .lab-summary-meta {
    font-size: 8.5pt;
    color: var(--ink-muted);
    margin-top: 3px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .lab-summary-meta .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ink-faint);
    display: inline-block;
  }
  .lab-summary-flagged-count {
    color: var(--flag-high);
    font-weight: 600;
  }

  /* ── Tables ─────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 4px;
  }
  thead {
    border-bottom: 1.5px solid var(--sage);
  }
  th {
    color: var(--ink-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 7pt;
    text-align: left;
    padding: 6px 8px 7px;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid var(--rule-light);
    vertical-align: middle;
  }
  tr:nth-child(even) td {
    background: var(--sage-lighter);
  }
  /* Result values in mono */
  td.result-cell {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    font-weight: 500;
  }
  /* Range cells slightly muted */
  td.range-cell {
    font-size: 8pt;
    color: var(--ink-muted);
  }

  /* ── Flag Badges ────────────────────────────── */
  .flag-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 3px;
    line-height: 1.3;
    white-space: nowrap;
  }
  .flag-badge-high, .flag-badge-borderline_high {
    color: var(--flag-high);
    background: var(--flag-high-bg);
  }
  .flag-badge-low, .flag-badge-borderline_low {
    color: var(--flag-low);
    background: var(--flag-low-bg);
  }
  .flag-badge-critical {
    color: var(--flag-critical);
    background: var(--flag-critical-bg);
    font-weight: 800;
  }
  .flag-badge-optimal {
    color: var(--flag-optimal);
    background: var(--flag-optimal-bg);
  }
  /* Flagged result values get colored too */
  .result-high, .result-borderline_high { color: var(--flag-high); }
  .result-low, .result-borderline_low { color: var(--flag-low); }
  .result-critical { color: var(--flag-critical); }

  /* ── Flagged Summary ────────────────────────── */
  .flagged-summary {
    margin-top: 8px;
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .flagged-summary-header {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 11pt;
    font-weight: 500;
    color: var(--sage);
    padding-bottom: 5px;
    margin-bottom: 10px;
    border-bottom: 1.5px solid var(--rule);
  }
  .flagged-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .flagged-card {
    border-left: 3px solid var(--rule);
    padding: 7px 10px;
    border-radius: 0 4px 4px 0;
    background: var(--sage-lighter);
    page-break-inside: avoid;
  }
  .flagged-card-high, .flagged-card-borderline_high {
    border-left-color: var(--flag-high);
    background: var(--flag-high-bg);
  }
  .flagged-card-low, .flagged-card-borderline_low {
    border-left-color: var(--flag-low);
    background: var(--flag-low-bg);
  }
  .flagged-card-critical {
    border-left-color: var(--flag-critical);
    background: var(--flag-critical-bg);
  }
  .flagged-card-name {
    font-weight: 600;
    font-size: 8.5pt;
    color: var(--ink);
  }
  .flagged-card-detail {
    font-size: 8pt;
    color: var(--ink-secondary);
    margin-top: 1px;
  }
  .flagged-card-detail .flagged-value {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
  }

  /* ── Cards (supplement protocol) ────────────── */
  .card {
    border: 1px solid var(--rule-light);
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .action-badge {
    display: inline-block;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 3px;
  }
  .action-keep { background: #d1fae5; color: #065f46; }
  .action-modify { background: #fef3c7; color: #92400e; }
  .action-discontinue { background: #fee2e2; color: #991b1b; }
  .action-add { background: #dbeafe; color: #1e40af; }
  .card-detail {
    font-size: 9pt;
    color: var(--ink-secondary);
    line-height: 1.5;
  }
  .card-detail strong { color: var(--ink); }
  .interaction-warning {
    border: 1px dashed #f59e0b;
    border-radius: 4px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 9pt;
    background: #fffbeb;
    page-break-inside: avoid;
  }
  .interaction-warning strong { color: #92400e; }
  .section-content {
    padding-left: 4px;
    white-space: pre-wrap;
  }

  /* ── Footer ─────────────────────────────────── */
  .footer {
    margin-top: 28px;
    padding-top: 10px;
    border-top: 1px solid var(--rule);
    font-size: 7.5pt;
    color: var(--ink-faint);
    display: flex;
    justify-content: space-between;
  }
  .watermark {
    margin-top: 6px;
    text-align: center;
    font-size: 6.5pt;
    color: var(--ink-faint);
    letter-spacing: 0.03em;
    opacity: 0.7;
  }

  /* ── Print Banner ───────────────────────────── */
  .no-print {
    text-align: center;
    padding: 10px 16px;
    background: var(--sage-lighter);
    border: 1px solid var(--rule-light);
    border-radius: 4px;
    margin-bottom: 24px;
    font-size: 9pt;
    color: var(--ink-secondary);
  }

  /* ── Print Rules ────────────────────────────── */
  @page {
    size: letter;
    margin: 0.65in 0.7in 0.85in 0.7in;
  }
  @media print {
    body { margin: 0; padding: 0.15in; }
    .no-print { display: none !important; }
    .section { page-break-inside: avoid; }
    .card { page-break-inside: avoid; }
    .flagged-summary { page-break-inside: avoid; }
  }
`;

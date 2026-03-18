/**
 * Shared print CSS for all Apothecare PDF exports.
 * Typography: Newsreader (display), DM Sans (body), JetBrains Mono (data).
 * Colors: sage-green brand accent (#2d7a6e).
 */

export const EXPORT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a2e2a;
    max-width: 7.5in;
    margin: 0.5in auto;
    padding: 0 0.5in;
  }

  /* ── Letterhead ─────────────────────────────── */
  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #2d7a6e;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .letterhead-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .letterhead-logo {
    max-height: 56px;
    max-width: 200px;
    object-fit: contain;
  }
  .letterhead h1 {
    font-family: 'Newsreader', serif;
    font-size: 18pt;
    color: #2d7a6e;
  }
  .letterhead .subtitle {
    font-size: 10pt;
    color: #4a6660;
    margin-top: 4px;
  }
  .letterhead .meta {
    text-align: right;
    font-size: 9pt;
    color: #4a6660;
  }
  .letterhead .meta strong {
    color: #1a2e2a;
  }

  /* ── Patient Bar ────────────────────────────── */
  .patient-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    background: #f8fafb;
    border: 1px solid #e2ece9;
    border-radius: 6px;
    padding: 10px 16px;
    margin-bottom: 20px;
    font-size: 9pt;
  }
  .patient-bar strong { color: #1a2e2a; }

  /* ── Section Labels ─────────────────────────── */
  .section { margin-bottom: 20px; }
  .section-label {
    display: inline-block;
    background: #2d7a6e;
    color: white;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 3px;
    margin-bottom: 8px;
  }
  .section-content {
    padding-left: 4px;
    white-space: pre-wrap;
  }

  /* ── Tables ─────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin-bottom: 16px;
  }
  th {
    background: #f0f5f3;
    color: #4a6660;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 8pt;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 2px solid #d1e0db;
  }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid #e8eeec;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #fafcfb;
  }
  .flag-high { color: #dc2626; font-weight: 700; }
  .flag-low { color: #2563eb; font-weight: 700; }
  .flag-critical { color: #dc2626; font-weight: 700; text-decoration: underline; }
  .flag-optimal { color: #059669; }

  /* ── Cards (supplement protocol) ────────────── */
  .card {
    border: 1px solid #e2ece9;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 12px;
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
    font-size: 8pt;
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
    color: #4a6660;
    line-height: 1.5;
  }
  .card-detail strong { color: #1a2e2a; }

  .interaction-warning {
    border: 1px dashed #f59e0b;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 9pt;
    background: #fffbeb;
    page-break-inside: avoid;
  }
  .interaction-warning strong { color: #92400e; }

  /* ── Footer ─────────────────────────────────── */
  .footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e2ece9;
    font-size: 8pt;
    color: #7a9690;
    display: flex;
    justify-content: space-between;
  }
  .watermark {
    margin-top: 8px;
    text-align: center;
    font-size: 7pt;
    color: #b0b0b0;
    letter-spacing: 0.02em;
  }

  /* ── Print Banner ───────────────────────────── */
  .no-print {
    text-align: center;
    padding: 12px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 10pt;
  }

  /* ── Print Rules ────────────────────────────── */
  @page {
    size: letter;
    margin: 0.75in 0.75in 1in 0.75in;
  }
  @media print {
    body { margin: 0; padding: 0.25in; }
    .no-print { display: none !important; }
    .section { page-break-inside: avoid; }
    .card { page-break-inside: avoid; }
  }
`;

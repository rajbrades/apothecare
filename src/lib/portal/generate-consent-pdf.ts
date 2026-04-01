import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ConsentData {
  title: string;
  /** Full ISO timestamp from DB e.g. "2026-03-27T18:45:00.000Z" */
  signedAt: string;
  /** The name the patient typed in the signature field */
  signedName?: string;
  contentMarkdown: string;
}

const MARGIN = 50;
const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Apothecare brand: #3d8b6e → rgb(0.239, 0.545, 0.431)
const COLORS = {
  brand:         rgb(0.239, 0.545, 0.431),
  brandLight:    rgb(0.188, 0.431, 0.341),   // darker for badge bg
  brandBadgeBg:  rgb(0.278, 0.612, 0.482),   // slightly lighter for badge
  brandSubtext:  rgb(0.80, 0.918, 0.859),    // header subtext tint
  text:          rgb(0.07, 0.09, 0.15),
  textSecondary: rgb(0.29, 0.33, 0.39),
  textMuted:     rgb(0.42, 0.44, 0.50),
  border:        rgb(0.88, 0.88, 0.88),
  signatureBg:   rgb(0.965, 0.980, 0.973),   // very light sage tint
  white:         rgb(1, 1, 1),
};

type ParsedLine =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "text"; text: string }
  | { type: "bullet"; text: string }
  | { type: "hr" }
  | { type: "blank" };

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

function stripMarkdown(text: string): { lines: ParsedLine[] } {
  const lines: ParsedLine[] = [];
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (/^---+$/.test(trimmed)) { lines.push({ type: "hr" }); continue; }
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { lines.push({ type: "heading", text: h2[1] }); continue; }
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { lines.push({ type: "subheading", text: h3[1] }); continue; }
    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) { lines.push({ type: "heading", text: h1[1] }); continue; }
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) { lines.push({ type: "bullet", text: stripInlineMarkdown(bullet[1]) }); continue; }
    if (!trimmed) { lines.push({ type: "blank" }); continue; }
    lines.push({ type: "text", text: stripInlineMarkdown(trimmed) });
  }
  return { lines };
}

function formatSignedAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return { date, time };
}

export async function generateConsentPdf(consent: ConsentData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica    = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesItalic  = await doc.embedFont(StandardFonts.TimesRomanItalic);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function addPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 30) addPage();
  }

  function wrapText(text: string, font: typeof helvetica, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const allLines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        allLines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) allLines.push(line);
    return allLines;
  }

  function drawWrappedText(
    text: string, x: number, font: typeof helvetica,
    size: number, color: ReturnType<typeof rgb>, maxWidth: number, lineHeight: number
  ) {
    for (const l of wrapText(text, font, size, maxWidth)) {
      ensureSpace(lineHeight);
      page.drawText(l, { x, y, size, font, color });
      y -= lineHeight;
    }
  }

  // ── Header bar ─────────────────────────────────────────────────────────────
  const HEADER_H = 56;
  page.drawRectangle({
    x: 0, y: PAGE_HEIGHT - HEADER_H,
    width: PAGE_WIDTH, height: HEADER_H,
    color: COLORS.brand,
  });

  // "A" circle logo
  const LOGO_R = 14;
  const LOGO_CX = MARGIN + LOGO_R;
  const LOGO_CY = PAGE_HEIGHT - HEADER_H / 2;
  page.drawCircle({ x: LOGO_CX, y: LOGO_CY, size: LOGO_R, color: COLORS.white, opacity: 0.18 });
  page.drawText("A", {
    x: LOGO_CX - 5, y: LOGO_CY - 6,
    size: 14, font: helveticaBold, color: COLORS.white,
  });

  // Title + subtitle
  const textX = MARGIN + LOGO_R * 2 + 10;
  page.drawText(consent.title, {
    x: textX, y: PAGE_HEIGHT - 20,
    size: 12, font: helveticaBold, color: COLORS.white,
  });
  page.drawText("Signed Agreement — Apothecare Patient Portal", {
    x: textX, y: PAGE_HEIGHT - 34,
    size: 8, font: helvetica, color: COLORS.brandSubtext,
  });

  // SIGNED badge (top-right)
  const badgeText = "SIGNED";
  const badgeW = helveticaBold.widthOfTextAtSize(badgeText, 7) + 14;
  const badgeX = PAGE_WIDTH - MARGIN - badgeW;
  const badgeY = PAGE_HEIGHT - HEADER_H / 2 - 8;
  page.drawRectangle({
    x: badgeX, y: badgeY,
    width: badgeW, height: 16,
    color: COLORS.brandBadgeBg,
    borderColor: COLORS.white,
    borderWidth: 0.5,
    borderOpacity: 0.4,
  });
  page.drawText(badgeText, {
    x: badgeX + 7, y: badgeY + 5,
    size: 7, font: helveticaBold, color: COLORS.white,
  });

  y = PAGE_HEIGHT - HEADER_H - 22;

  // ── Signed date line ────────────────────────────────────────────────────────
  const { date, time } = formatSignedAt(consent.signedAt);
  page.drawText(`Signed: ${date} at ${time}`, {
    x: MARGIN, y, size: 9, font: helvetica, color: COLORS.textMuted,
  });
  y -= 12;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: COLORS.border });
  y -= 20;

  // ── Document content ────────────────────────────────────────────────────────
  const { lines } = stripMarkdown(consent.contentMarkdown);

  for (const line of lines) {
    switch (line.type) {
      case "heading":
        ensureSpace(30);
        y -= 6;
        page.drawRectangle({ x: MARGIN, y: y - 2, width: 3, height: 14, color: COLORS.brand });
        page.drawText(line.text, { x: MARGIN + 10, y, size: 11, font: helveticaBold, color: COLORS.text });
        y -= 20;
        break;
      case "subheading":
        ensureSpace(24);
        y -= 4;
        page.drawText(line.text, { x: MARGIN, y, size: 10, font: helveticaBold, color: COLORS.text });
        y -= 18;
        break;
      case "bullet":
        ensureSpace(14);
        page.drawText("•", { x: MARGIN + 8, y, size: 9.5, font: helvetica, color: COLORS.textSecondary });
        drawWrappedText(line.text, MARGIN + 20, helvetica, 9.5, COLORS.textSecondary, CONTENT_WIDTH - 20, 14);
        break;
      case "hr":
        ensureSpace(16);
        y -= 4;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: COLORS.border });
        y -= 12;
        break;
      case "blank":
        y -= 8;
        break;
      case "text":
        drawWrappedText(line.text, MARGIN, helvetica, 9.5, COLORS.textSecondary, CONTENT_WIDTH, 14);
        break;
    }
  }

  // ── Signature block ─────────────────────────────────────────────────────────
  const SIG_BLOCK_H = consent.signedName ? 88 : 60;
  ensureSpace(SIG_BLOCK_H + 20);
  y -= 16;

  // Light sage background
  page.drawRectangle({
    x: MARGIN, y: y - SIG_BLOCK_H + 16,
    width: CONTENT_WIDTH, height: SIG_BLOCK_H,
    color: COLORS.signatureBg,
    borderColor: COLORS.brand,
    borderWidth: 0.75,
    borderOpacity: 0.4,
  });

  // Left brand accent stripe
  page.drawRectangle({ x: MARGIN, y: y - SIG_BLOCK_H + 16, width: 3, height: SIG_BLOCK_H, color: COLORS.brand });

  const sigX = MARGIN + 16;
  page.drawText("Electronic Signature", { x: sigX, y: y, size: 7.5, font: helveticaBold, color: COLORS.brand });
  y -= 14;

  if (consent.signedName) {
    // Typed name in italic serif — mimics a handwritten signature
    page.drawText(consent.signedName, {
      x: sigX, y,
      size: 20, font: timesItalic, color: COLORS.text,
    });
    y -= 26;

    // Underline
    const nameWidth = Math.min(timesItalic.widthOfTextAtSize(consent.signedName, 20), CONTENT_WIDTH - 32);
    page.drawLine({
      start: { x: sigX, y: y + 4 }, end: { x: sigX + nameWidth, y: y + 4 },
      thickness: 0.5, color: COLORS.textMuted,
    });
    y -= 4;

    page.drawText("Signed by:", { x: sigX, y, size: 7.5, font: helvetica, color: COLORS.textMuted });
    page.drawText(consent.signedName, { x: sigX + 45, y, size: 7.5, font: helveticaBold, color: COLORS.textSecondary });
    y -= 12;
  }

  page.drawText("Date:", { x: sigX, y, size: 7.5, font: helvetica, color: COLORS.textMuted });
  page.drawText(`${date} at ${time}`, { x: sigX + 28, y, size: 7.5, font: helveticaBold, color: COLORS.textSecondary });
  y -= 12;

  page.drawText("Method:", { x: sigX, y, size: 7.5, font: helvetica, color: COLORS.textMuted });
  page.drawText("Typed acknowledgement (E-SIGN Act)", { x: sigX + 40, y, size: 7.5, font: helvetica, color: COLORS.textSecondary });

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];

    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 16 }, end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 16 },
      thickness: 0.5, color: COLORS.border,
    });

    p.drawText(
      "This document is a read-only copy. For questions contact your provider. Secured by Apothecare · HIPAA Compliant",
      { x: MARGIN, y: MARGIN + 6, size: 6.5, font: helvetica, color: COLORS.textMuted }
    );

    const pageNum = `Page ${i + 1} of ${pages.length}`;
    const pw = helvetica.widthOfTextAtSize(pageNum, 7);
    p.drawText(pageNum, {
      x: PAGE_WIDTH - MARGIN - pw, y: MARGIN - 16,
      size: 7, font: helvetica, color: COLORS.textMuted,
    });
  }

  return doc.save();
}

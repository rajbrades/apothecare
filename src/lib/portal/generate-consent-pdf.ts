import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ConsentData {
  title: string;
  signedAt: string;
  contentMarkdown: string;
}

const MARGIN = 50;
const PAGE_WIDTH = 612; // Letter
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  brand: rgb(0.32, 0.64, 0.52),
  text: rgb(0.07, 0.09, 0.15),
  textSecondary: rgb(0.29, 0.33, 0.39),
  textMuted: rgb(0.42, 0.44, 0.50),
  border: rgb(0.88, 0.88, 0.88),
  white: rgb(1, 1, 1),
};

/**
 * Strip basic markdown syntax for plain-text PDF rendering:
 * headings (## / ###), bold (**), italic (*), horizontal rules (---), bullets (- / *)
 */
function stripMarkdown(text: string): { lines: ParsedLine[] } {
  const lines: ParsedLine[] = [];

  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      lines.push({ type: "hr" });
      continue;
    }

    // Headings
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { lines.push({ type: "heading", text: h2[1] }); continue; }

    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { lines.push({ type: "subheading", text: h3[1] }); continue; }

    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) { lines.push({ type: "heading", text: h1[1] }); continue; }

    // Bullet points
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      lines.push({ type: "bullet", text: stripInlineMarkdown(bullet[1]) });
      continue;
    }

    // Empty lines
    if (!trimmed) {
      lines.push({ type: "blank" });
      continue;
    }

    // Regular text
    lines.push({ type: "text", text: stripInlineMarkdown(trimmed) });
  }

  return { lines };
}

type ParsedLine =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "text"; text: string }
  | { type: "bullet"; text: string }
  | { type: "hr" }
  | { type: "blank" };

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1")     // italic
    .replace(/__(.+?)__/g, "$1")     // bold alt
    .replace(/_(.+?)_/g, "$1");      // italic alt
}

export async function generateConsentPdf(consent: ConsentData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function addPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) addPage();
  }

  function wrapText(text: string, font: typeof helvetica, size: number, maxWidth: number): string[] {
    const allLines: string[] = [];
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
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
    text: string,
    x: number,
    font: typeof helvetica,
    size: number,
    color: typeof COLORS.text,
    maxWidth: number,
    lineHeight: number
  ) {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
    }
  }

  // ── Header bar ──
  const headerHeight = 50;
  page.drawRectangle({
    x: 0, y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH, height: headerHeight,
    color: COLORS.brand,
  });

  page.drawText(consent.title, {
    x: MARGIN, y: PAGE_HEIGHT - 22,
    size: 13, font: helveticaBold, color: COLORS.white,
  });

  page.drawText("Signed Agreement", {
    x: MARGIN, y: PAGE_HEIGHT - 38,
    size: 9, font: helvetica, color: rgb(0.85, 0.92, 0.88),
  });

  // Signed badge
  const badgeText = "SIGNED";
  const badgeW = helveticaBold.widthOfTextAtSize(badgeText, 7) + 12;
  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - badgeW, y: PAGE_HEIGHT - 34,
    width: badgeW, height: 16,
    color: rgb(0.45, 0.72, 0.60),
    borderColor: rgb(0.55, 0.78, 0.66),
    borderWidth: 0.5,
  });
  page.drawText(badgeText, {
    x: PAGE_WIDTH - MARGIN - badgeW + 6, y: PAGE_HEIGHT - 29,
    size: 7, font: helveticaBold, color: COLORS.white,
  });

  y = PAGE_HEIGHT - headerHeight - 20;

  // ── Signed date ──
  page.drawText(`Signed: ${consent.signedAt}`, {
    x: MARGIN, y, size: 9, font: helvetica, color: COLORS.textMuted,
  });
  y -= 12;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5, color: COLORS.border,
  });
  y -= 20;

  // ── Content ──
  const { lines } = stripMarkdown(consent.contentMarkdown);

  for (const line of lines) {
    switch (line.type) {
      case "heading":
        ensureSpace(30);
        y -= 6;
        page.drawRectangle({
          x: MARGIN, y: y - 2,
          width: 3, height: 14,
          color: COLORS.brand,
        });
        page.drawText(line.text, {
          x: MARGIN + 10, y, size: 11, font: helveticaBold, color: COLORS.text,
        });
        y -= 20;
        break;

      case "subheading":
        ensureSpace(24);
        y -= 4;
        page.drawText(line.text, {
          x: MARGIN, y, size: 10, font: helveticaBold, color: COLORS.text,
        });
        y -= 18;
        break;

      case "bullet":
        ensureSpace(14);
        page.drawText("•", {
          x: MARGIN + 8, y, size: 9.5, font: helvetica, color: COLORS.textSecondary,
        });
        drawWrappedText(line.text, MARGIN + 20, helvetica, 9.5, COLORS.textSecondary, CONTENT_WIDTH - 20, 14);
        break;

      case "hr":
        ensureSpace(16);
        y -= 4;
        page.drawLine({
          start: { x: MARGIN, y },
          end: { x: PAGE_WIDTH - MARGIN, y },
          thickness: 0.5, color: COLORS.border,
        });
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

  // ── Footer ──
  ensureSpace(40);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5, color: COLORS.border,
  });
  y -= 14;

  const footerText = "This document is a read-only copy shared via Apothecare Patient Portal. For questions, contact your provider.";
  page.drawText(footerText, {
    x: MARGIN, y, size: 7.5, font: helvetica, color: COLORS.textMuted,
  });

  // Page numbers
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const pageNum = `Page ${i + 1} of ${pages.length}`;
    const pw = helvetica.widthOfTextAtSize(pageNum, 7.5);
    p.drawText(pageNum, {
      x: PAGE_WIDTH - MARGIN - pw, y: MARGIN - 20,
      size: 7.5, font: helvetica, color: COLORS.textMuted,
    });
  }

  return doc.save();
}

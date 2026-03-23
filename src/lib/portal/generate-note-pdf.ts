import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface NoteData {
  visitDate: string;
  visitType: string;
  chiefComplaint: string | null;
  providerName: string | null;
  practiceName: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

const MARGIN = 50;
const PAGE_WIDTH = 612; // Letter
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  brand: rgb(0.32, 0.64, 0.52), // sage green
  brandLight: rgb(0.92, 0.97, 0.94),
  text: rgb(0.07, 0.09, 0.15),
  textSecondary: rgb(0.29, 0.33, 0.39),
  textMuted: rgb(0.42, 0.44, 0.50),
  border: rgb(0.88, 0.88, 0.88),
  white: rgb(1, 1, 1),
};

const SECTION_LABELS: Record<string, string> = {
  subjective: "History & Symptoms",
  objective: "Examination Findings",
  assessment: "Clinical Assessment",
  plan: "Treatment Plan",
};

export async function generateNotePdf(note: NoteData): Promise<Uint8Array> {
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

  /** Word-wrap text and return lines */
  function wrapText(text: string, font: typeof helvetica, size: number, maxWidth: number): string[] {
    const allLines: string[] = [];
    // Split on explicit newlines first
    for (const paragraph of text.split("\n")) {
      if (!paragraph.trim()) {
        allLines.push("");
        continue;
      }
      const words = paragraph.split(/\s+/);
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
    }
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
      if (line) {
        page.drawText(line, { x, y, size, font, color });
      }
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

  page.drawText("Encounter Note", {
    x: MARGIN, y: PAGE_HEIGHT - 22,
    size: 14, font: helveticaBold, color: COLORS.white,
  });

  const subtitle = `${note.visitType}${note.chiefComplaint ? ` — ${note.chiefComplaint}` : ""}`;
  page.drawText(subtitle, {
    x: MARGIN, y: PAGE_HEIGHT - 38,
    size: 9, font: helvetica, color: rgb(0.85, 0.92, 0.88),
  });

  // Read only badge
  const badgeText = "READ ONLY";
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

  // ── Metadata ──
  const metaItems: string[] = [];
  metaItems.push(note.visitDate);
  if (note.providerName) metaItems.push(note.providerName);
  if (note.practiceName) metaItems.push(note.practiceName);
  const metaLine = metaItems.join("  ·  ");

  page.drawText(metaLine, {
    x: MARGIN, y, size: 9, font: helvetica, color: COLORS.textMuted,
  });
  y -= 12;

  // Separator
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5, color: COLORS.border,
  });
  y -= 20;

  // ── Sections ──
  const sections: [string, string | null][] = [
    ["subjective", note.subjective],
    ["objective", note.objective],
    ["assessment", note.assessment],
    ["plan", note.plan],
  ];

  for (const [key, content] of sections) {
    if (!content?.trim()) continue;

    const label = SECTION_LABELS[key];

    // Section heading
    ensureSpace(40);
    page.drawRectangle({
      x: MARGIN, y: y - 2,
      width: 3, height: 14,
      color: COLORS.brand,
    });
    page.drawText(label, {
      x: MARGIN + 10, y, size: 11, font: helveticaBold, color: COLORS.text,
    });
    y -= 22;

    // Section content
    drawWrappedText(content, MARGIN + 10, helvetica, 9.5, COLORS.textSecondary, CONTENT_WIDTH - 10, 14);
    y -= 12;
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

  // Add footer to all pages
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

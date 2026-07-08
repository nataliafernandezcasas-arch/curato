import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Builds a one-page, branded PDF record of a maison's signed commitment.
// Returns the PDF as a base64 string, ready to attach to a Resend email.
// Pure pdf-lib (no headless browser), so it runs fine on Vercel serverless.

const CHARCOAL = rgb(0.11, 0.102, 0.094); // #1C1A18
const CHAMPAGNE = rgb(0.796, 0.717, 0.561); // #CBB78F
const MUTED = rgb(0.42, 0.4, 0.37);
const CREAM = rgb(0.969, 0.957, 0.937); // #F7F4EF

export async function buildCommitmentPdf(input: {
  maisonName: string;
  signatory: string;
  acceptedAtIso: string;
  title: string;
  intro: string;
  terms: string[];
  acceptance: string;
  labels: { signedBy: string; date: string; footer: string };
  lang: string;
}): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const W = 595;
  const M = 64;
  const maxW = W - M * 2;

  // Cream background
  page.drawRectangle({ x: 0, y: 0, width: W, height: 842, color: CREAM });

  let y = 842 - 80;

  const drawCentered = (text: string, font: typeof serif, size: number, color = CHARCOAL, spacing = 0) => {
    const t = spacing ? text.split("").join(" ") : text;
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (W - w) / 2, y, size, font, color });
  };

  // Wordmark
  drawCentered("C U R A T O", serif, 24, CHARCOAL);
  y -= 20;
  drawCentered("PARIS  ·  INVITATION ONLY", serif, 8, MUTED);
  y -= 44;

  // Champagne rule
  page.drawRectangle({ x: (W - 60) / 2, y, width: 60, height: 1, color: CHAMPAGNE });
  y -= 40;

  // Title
  drawCentered(input.title.toUpperCase(), serifBold, 20, CHARCOAL);
  y -= 30;
  if (input.maisonName) {
    drawCentered(input.maisonName, serif, 13, CHAMPAGNE);
    y -= 34;
  } else {
    y -= 4;
  }

  // Word-wrap helper for left-aligned paragraphs.
  const drawWrapped = (text: string, font: typeof serif, size: number, x: number, color = CHARCOAL, lineH = size * 1.5, width = maxW - (x - M)) => {
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        page.drawText(line, { x, y, size, font, color });
        y -= lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x, y, size, font, color });
      y -= lineH;
    }
  };

  // Intro
  drawWrapped(input.intro, serif, 11, M, MUTED, 17);
  y -= 20;

  // Terms
  input.terms.forEach((term, i) => {
    const num = String(i + 1).padStart(2, "0");
    page.drawText(num, { x: M, y, size: 11, font: serifBold, color: CHAMPAGNE });
    drawWrapped(term, serif, 12, M + 30, CHARCOAL, 18);
    y -= 12;
  });

  y -= 18;
  // Divider
  page.drawRectangle({ x: M, y, width: maxW, height: 0.75, color: rgb(0.85, 0.83, 0.8) });
  y -= 34;

  // Signature
  page.drawText(input.labels.signedBy, { x: M, y, size: 9, font: serif, color: MUTED });
  y -= 22;
  page.drawText(input.signatory, { x: M, y, size: 20, font: serifBold, color: CHARCOAL });
  y -= 34;

  const when = new Date(input.acceptedAtIso).toLocaleDateString(input.lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  page.drawText(`${input.labels.date}: ${when}`, { x: M, y, size: 10, font: serif, color: MUTED });

  // Acceptance note (terms of engagement + T&C + privacy)
  y -= 30;
  page.drawRectangle({ x: M, y: y + 14, width: maxW, height: 0.5, color: rgb(0.85, 0.83, 0.8) });
  drawWrapped(input.acceptance, serif, 9, M, MUTED, 13, maxW);

  // Footer
  const footer = input.labels.footer;
  const fw = serif.widthOfTextAtSize(footer, 8);
  page.drawText(footer, { x: (W - fw) / 2, y: 48, size: 8, font: serif, color: MUTED });

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

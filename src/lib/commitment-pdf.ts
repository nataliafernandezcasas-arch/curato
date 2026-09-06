import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildCommitmentPdfGenerated } from "./commitment-pdf-legacy";

// Builds the PDF record of a maison's signed commitment, ready to attach to a
// Resend email as base64.
//
// French maisons get the designed template (Centaur, floral ground) shipped in
// assets/engagement-template-fr.pdf. The template is a fixed document: the only
// things that change per maison are the house name, who signed, and when, so we
// load it and draw those three on top rather than regenerating the page.
//
// EN and ES have no export of that design yet, so they keep the fully generated
// layout in commitment-pdf-legacy.ts. Sending a French document to a maison that
// chose English would be worse than a plainer one in its own language.

const CHARCOAL = rgb(0.11, 0.102, 0.094); // #1C1A18
const COPPER = rgb(0.443, 0.267, 0.153); // matches the template's ink

// Where the template leaves room. Origin is bottom-left, page is 595.5 x 842.25.
// `track` is extra letter-spacing in points: the template letterspaces every
// line, so untracked text reads as pasted on from another document.
// Calibrated against the 6-term template: "Signé par :" and "Date:" now sit
// side by side on one line, not stacked.
const SLOT = {
  maison: { y: 676, size: 13, track: 1.4 }, // centred, between the wordmark and the intro
  signatory: { x: 150, y: 187, size: 12, track: 1.1 }, // right of "Signé par :"
  date: { x: 400, y: 187, size: 12, track: 1.1 }, // right of "Date:"
};

let templateCache: Buffer | null = null;

async function loadTemplate(): Promise<Buffer> {
  if (templateCache) return templateCache;
  // Literal path so Next's output file tracing bundles the asset into the lambda.
  templateCache = await readFile(
    path.join(process.cwd(), "src/lib/assets/engagement-template-fr.pdf")
  );
  return templateCache;
}

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
  if (!input.lang.startsWith("fr")) return buildCommitmentPdfGenerated(input);

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(await loadTemplate());
  } catch {
    // A missing or unreadable template must never cost the maison its record.
    return buildCommitmentPdfGenerated(input);
  }

  const page = doc.getPage(0);
  const { width } = page.getSize();

  // Times is the closest standard serif to the template's Centaur. It is not a
  // match. Swap it for the real face once the licence is confirmed to allow
  // embedding in generated PDFs.
  const serif = await doc.embedFont(StandardFonts.TimesRoman);

  // pdf-lib has no letter-spacing, so advance glyph by glyph.
  const trackedWidth = (t: string, size: number, track: number) =>
    serif.widthOfTextAtSize(t, size) + track * Math.max(t.length - 1, 0);

  const draw = (t: string, x: number, y: number, size: number, track: number, color = CHARCOAL) => {
    let cx = x;
    for (const ch of t) {
      page.drawText(ch, { x: cx, y, size, font: serif, color });
      cx += serif.widthOfTextAtSize(ch, size) + track;
    }
  };

  if (input.maisonName) {
    const w = trackedWidth(input.maisonName, SLOT.maison.size, SLOT.maison.track);
    draw(input.maisonName, (width - w) / 2, SLOT.maison.y, SLOT.maison.size, SLOT.maison.track, COPPER);
  }

  if (input.signatory) {
    draw(input.signatory, SLOT.signatory.x, SLOT.signatory.y, SLOT.signatory.size, SLOT.signatory.track);
  }

  const when = new Date(input.acceptedAtIso).toLocaleDateString(input.lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  draw(when, SLOT.date.x, SLOT.date.y, SLOT.date.size, SLOT.date.track);

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

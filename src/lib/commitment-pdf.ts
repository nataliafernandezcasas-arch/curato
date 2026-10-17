import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

// El PDF del compromiso firmado de una casa, en base64 para adjuntarlo con
// Resend.
//
// Diseño «Nuit florale» (Natalia, 2026-10-17): fondo carbón, las flores claras
// arriba fundiéndose con el fondo, el logotipo en champán y las seis
// condiciones en dos columnas, cada una con su etiqueta. Se dibuja entero aquí,
// así que los tres idiomas salen con el mismo diseño; antes solo el francés
// tenía la plantilla y el inglés y el español salían en Times.
//
// Las letras son Cormorant Garamond (licencia OFL, se puede incrustar), la de
// los títulos de la app.

const CARBON = rgb(0.118, 0.118, 0.118); // #1E1E1E
const CREMA = rgb(0.949, 0.929, 0.894); // #F2EDE4
const CHAMPAN = rgb(0.796, 0.718, 0.561); // #CBB78F

const W = 595.28;
const H = 841.89;
const M = 69; // margen lateral
const ANCHO = W - M * 2;
const HUECO = 25.5; // entre las dos columnas

const ASSETS = "src/lib/assets";

const cache = new Map<string, Buffer>();
async function asset(nombre: string): Promise<Buffer> {
  const hecho = cache.get(nombre);
  if (hecho) return hecho;
  const datos = await readFile(path.join(process.cwd(), ASSETS, nombre));
  cache.set(nombre, datos);
  return datos;
}

export type CommitmentPdfInput = {
  maisonName: string;
  signatory: string;
  acceptedAtIso: string;
  /** Lo pequeño en capitales encima del título: «Conditions d'engagement». */
  eyebrow: string;
  title: string;
  intro: string;
  terms: string[];
  /** Una por condición: Essai, Abonnement, Durée… */
  termLabels: string[];
  acceptance: string;
  labels: { signedBy: string; date: string; footer: string };
  lang: string;
};

/** Corta un texto en líneas que caben en `ancho`. */
function lineas(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const salida: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && fuente.widthOfTextAtSize(prueba, tamano) > ancho) {
      salida.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) salida.push(actual);
  return salida;
}

export async function buildCommitmentPdf(input: CommitmentPdfInput): Promise<string> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(input.title);
  doc.setAuthor("Curato");

  const [ligera, normal, media, cursiva, flores, logo] = await Promise.all([
    asset("fonts/CormorantGaramond-Light.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Regular.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Medium.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Italic.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("engagement-flores.jpg").then((b) => doc.embedJpg(b)),
    asset("logo-curato-champagne.png").then((b) => doc.embedPng(b)),
  ]);

  const page: PDFPage = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CARBON });

  // Las flores, arriba; la imagen ya trae el fundido hacia el carbón.
  const altoFlores = (W * flores.height) / flores.width;
  page.drawImage(flores, { x: 0, y: H - altoFlores, width: W, height: altoFlores });

  const anchoLogo = 150;
  const altoLogo = (anchoLogo * logo.height) / logo.width;
  page.drawImage(logo, { x: (W - anchoLogo) / 2, y: H - 42 - altoLogo, width: anchoLogo, height: altoLogo });

  // `top` se mide desde arriba, como en el diseño; pdf-lib cuenta desde abajo.
  const texto = (t: string, x: number, top: number, fuente: PDFFont, tamano: number, color = CREMA, opacity = 1) =>
    page.drawText(t, { x, y: H - top, size: tamano, font: fuente, color, opacity });

  // Capitales espaciadas: pdf-lib no espacia letras, así que van una a una.
  const capitales = (t: string, x: number, top: number, tamano: number, color = CHAMPAN, opacity = 1) => {
    const espacio = tamano * 0.32;
    let cx = x;
    for (const ch of t.toUpperCase()) {
      texto(ch, cx, top, media, tamano, color, opacity);
      cx += media.widthOfTextAtSize(ch, tamano) + espacio;
    }
    return cx - espacio - x;
  };

  let top = 225;
  capitales(input.eyebrow, M, top, 8.25);
  top += 38;
  texto(input.title, M, top, ligera, 34.5);
  top += 24;
  if (input.maisonName) {
    texto(input.maisonName, M, top, cursiva, 16.5, CHAMPAN);
    top += 26;
  }
  for (const l of lineas(input.intro, normal, 12.4, 390)) {
    texto(l, M, top, normal, 12.4, CREMA, 0.7);
    top += 18.6;
  }

  // Las condiciones, de dos en dos.
  top += 16;
  const col = (ANCHO - HUECO) / 2;
  for (let i = 0; i < input.terms.length; i += 2) {
    let alto = 0;
    for (let j = 0; j < 2 && i + j < input.terms.length; j++) {
      const n = i + j;
      const x = M + j * (col + HUECO);
      page.drawLine({
        start: { x, y: H - top },
        end: { x: x + col, y: H - top },
        thickness: 0.6,
        color: CHAMPAN,
        opacity: 0.4,
      });
      const etiqueta = input.termLabels[n] ? `${String(n + 1).padStart(2, "0")} · ${input.termLabels[n]}` : String(n + 1).padStart(2, "0");
      capitales(etiqueta, x, top + 19, 8.25);
      let y = top + 37;
      for (const l of lineas(input.terms[n], normal, 12.4, col)) {
        texto(l, x, y, normal, 12.4);
        y += 18.6;
      }
      alto = Math.max(alto, y - top);
    }
    top += alto + 12;
  }

  top += 6;
  for (const l of lineas(input.acceptance, cursiva, 10.1, ANCHO)) {
    texto(l, M, top, cursiva, 10.1, CREMA, 0.6);
    top += 15;
  }

  // La firma y la fecha.
  top += 26;
  const fecha = new Date(input.acceptedAtIso).toLocaleDateString(input.lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  const firma: Array<[string, string]> = [
    [input.labels.signedBy, input.signatory],
    [input.labels.date, fecha],
  ];
  firma.forEach(([etiqueta, valor], j) => {
    const x = M + j * (col + HUECO);
    capitales(etiqueta, x, top, 8.25);
    texto(valor, x, top + 25, normal, 14.3);
    page.drawLine({
      start: { x, y: H - top - 33 },
      end: { x: x + col, y: H - top - 33 },
      thickness: 0.6,
      color: CHAMPAN,
      opacity: 0.6,
    });
  });

  // El pie, centrado.
  const anchoPie = (() => {
    const espacio = 8.25 * 0.32;
    let w = 0;
    for (const ch of input.labels.footer.toUpperCase()) w += media.widthOfTextAtSize(ch, 8.25) + espacio;
    return w - espacio;
  })();
  capitales(input.labels.footer, (W - anchoPie) / 2, H - 30, 8.25, CREMA, 0.4);

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

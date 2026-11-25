import {
  PDFDocument,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

// El informe mensual de una casa en PDF, para reenviarlo al dueño o al equipo.
//
// Mismo mundo que el PDF del compromiso («Nuit florale», src/lib/commitment-pdf.ts):
// fondo carbón, flores arriba, logotipo champán y Cormorant Garamond. Página 1,
// las cifras del mes y los storytellers recibidos; página 2, las fotos (solo las
// que siguen en su exclusividad de 90 días).

const CARBON = rgb(0.118, 0.118, 0.118);
const CREMA = rgb(0.949, 0.929, 0.894);
const CHAMPAN = rgb(0.796, 0.718, 0.561);
const COBRE = rgb(0.902, 0.643, 0.333); // copper-vif

const W = 595.28;
const H = 841.89;
const M = 56;
const ANCHO = W - M * 2;

const ASSETS = "src/lib/assets";
const cache = new Map<string, Buffer>();
async function asset(nombre: string): Promise<Buffer> {
  const hecho = cache.get(nombre);
  if (hecho) return hecho;
  const datos = await readFile(path.join(process.cwd(), ASSETS, nombre));
  cache.set(nombre, datos);
  return datos;
}

export type InformePdfInput = {
  maison: string;
  /** «novembre 2026» */
  mes: string;
  visitas: number;
  garantizadas: number;
  debajo: boolean;
  cifras: { etiqueta: string; valor: string }[];
  storytellers: { nombre: string; detalle: string; cifras: string }[];
  /** Las fotos ya descargadas (JPEG o PNG). */
  fotos: { bytes: Uint8Array; autor: string }[];
  textos: {
    eyebrow: string;
    visitasDe: string;
    debajo: string;
    storytellers: string;
    fotos: string;
    fotosNota: string;
    pie: string;
  };
};

/** Las cifras francesas traen espacios finos que Cormorant no tiene. */
const limpio = (t: string) => t.replace(/[  ]/g, " ");

function lineas(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const salida: string[] = [];
  let actual = "";
  for (const palabra of limpio(texto).split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && fuente.widthOfTextAtSize(prueba, tamano) > ancho) {
      salida.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) salida.push(actual);
  return salida;
}

export async function buildInformePdf(input: InformePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Curato · ${input.maison} · ${input.mes}`);
  doc.setAuthor("Curato");

  const [ligera, normal, media, cursiva, flores, logo] = await Promise.all([
    asset("fonts/CormorantGaramond-Light.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Regular.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Medium.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("fonts/CormorantGaramond-Italic.ttf").then((b) => doc.embedFont(b, { subset: true })),
    asset("engagement-flores.jpg").then((b) => doc.embedJpg(b)),
    asset("logo-curato-champagne.png").then((b) => doc.embedPng(b)),
  ]);

  const pagina = (conFlores: boolean): PDFPage => {
    const p = doc.addPage([W, H]);
    p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CARBON });
    if (conFlores) {
      const alto = (W * flores.height) / flores.width;
      p.drawImage(flores, { x: 0, y: H - alto, width: W, height: alto, opacity: 0.85 });
    }
    const anchoLogo = 120;
    const altoLogo = (anchoLogo * logo.height) / logo.width;
    p.drawImage(logo, { x: (W - anchoLogo) / 2, y: H - 40 - altoLogo, width: anchoLogo, height: altoLogo });
    return p;
  };

  const escribir = (p: PDFPage) => {
    const texto = (t: string, x: number, top: number, fuente: PDFFont, tamano: number, color = CREMA, opacity = 1) =>
      p.drawText(limpio(t), { x, y: H - top, size: tamano, font: fuente, color, opacity });
    const capitales = (t: string, x: number, top: number, tamano: number, color = CHAMPAN, opacity = 1) => {
      const espacio = tamano * 0.32;
      let cx = x;
      for (const ch of limpio(t).toUpperCase()) {
        texto(ch, cx, top, media, tamano, color, opacity);
        cx += media.widthOfTextAtSize(ch, tamano) + espacio;
      }
      return cx - espacio - x;
    };
    const anchoCapitales = (t: string, tamano: number) => {
      const espacio = tamano * 0.32;
      let w = 0;
      for (const ch of limpio(t).toUpperCase()) w += media.widthOfTextAtSize(ch, tamano) + espacio;
      return w - espacio;
    };
    const linea = (top: number, opacity = 0.35) =>
      p.drawLine({ start: { x: M, y: H - top }, end: { x: W - M, y: H - top }, thickness: 0.6, color: CHAMPAN, opacity });
    const pie = () => capitales(input.textos.pie, (W - anchoCapitales(input.textos.pie, 7.5)) / 2, H - 28, 7.5, CREMA, 0.4);
    return { texto, capitales, linea, pie };
  };

  // ── Página 1: las cifras ─────────────────────────────────────────────────
  const p1 = pagina(true);
  const e1 = escribir(p1);
  let top = 215;
  e1.capitales(input.textos.eyebrow, M, top, 8.25);
  top += 36;
  e1.texto(input.mes.charAt(0).toUpperCase() + input.mes.slice(1), M, top, ligera, 32);
  top += 24;
  e1.texto(input.maison, M, top, cursiva, 16, CHAMPAN);

  top += 52;
  const cifra = String(input.visitas);
  e1.texto(cifra, M, top, ligera, 56, input.debajo ? COBRE : CHAMPAN);
  e1.texto(input.textos.visitasDe, M + ligera.widthOfTextAtSize(cifra, 56) + 12, top - 4, normal, 13, CREMA, 0.75);
  if (input.debajo) {
    top += 24;
    for (const l of lineas(input.textos.debajo, normal, 11.5, ANCHO)) {
      e1.texto(l, M, top, normal, 11.5, COBRE);
      top += 16;
    }
  }

  // Las cuatro cifras de alcance, en una fila.
  if (input.cifras.length) {
    top += 30;
    e1.linea(top);
    const col = ANCHO / input.cifras.length;
    input.cifras.forEach((c, i) => {
      const x = M + i * col;
      e1.texto(c.valor, x, top + 34, ligera, 24);
      e1.capitales(c.etiqueta, x, top + 52, 6.5, CHAMPAN, 0.9);
    });
    top += 70;
    e1.linea(top);
  }

  // Los storytellers recibidos.
  if (input.storytellers.length) {
    top += 34;
    e1.capitales(input.textos.storytellers, M, top, 8.25);
    top += 10;
    for (const s of input.storytellers) {
      if (top > H - 90) break;
      top += 26;
      e1.texto(s.nombre, M, top, media, 15);
      top += 16;
      e1.texto(s.detalle, M, top, normal, 10.5, CREMA, 0.6);
      if (s.cifras) {
        top += 15;
        e1.texto(s.cifras, M, top, normal, 10.5, CREMA, 0.85);
      }
      top += 12;
      p1.drawLine({ start: { x: M, y: H - top }, end: { x: W - M, y: H - top }, thickness: 0.4, color: CHAMPAN, opacity: 0.2 });
    }
  }
  e1.pie();

  // ── Página 2: las fotos ──────────────────────────────────────────────────
  const imagenes: { img: PDFImage; autor: string }[] = [];
  for (const f of input.fotos.slice(0, 4)) {
    try {
      const esPng = f.bytes[0] === 0x89 && f.bytes[1] === 0x50;
      const esJpg = f.bytes[0] === 0xff && f.bytes[1] === 0xd8;
      if (!esPng && !esJpg) continue;
      imagenes.push({ img: esPng ? await doc.embedPng(f.bytes) : await doc.embedJpg(f.bytes), autor: f.autor });
    } catch {
      // Una foto que no se puede incrustar no impide el informe.
    }
  }
  if (imagenes.length) {
    const p2 = pagina(false);
    const e2 = escribir(p2);
    let t2 = 120;
    e2.capitales(input.textos.fotos, M, t2, 8.25);
    t2 += 18;
    for (const l of lineas(input.textos.fotosNota, cursiva, 11, ANCHO)) {
      e2.texto(l, M, t2, cursiva, 11, CREMA, 0.65);
      t2 += 15;
    }
    t2 += 14;
    const hueco = 12;
    const lado = (ANCHO - hueco) / 2;
    const alto = lado * 1.15;
    imagenes.forEach(({ img, autor }, i) => {
      const x = M + (i % 2) * (lado + hueco);
      const fila = Math.floor(i / 2);
      const yTop = t2 + fila * (alto + 30);
      if (yTop + alto > H - 40) return;
      // Recorte «cover»: la foto llena el hueco sin deformarse.
      const escala = Math.max(lado / img.width, alto / img.height);
      const w = img.width * escala;
      const h = img.height * escala;
      p2.pushOperators(pushGraphicsState(), rectangle(x, H - yTop - alto, lado, alto), clip(), endPath());
      p2.drawImage(img, { x: x - (w - lado) / 2, y: H - yTop - alto - (h - alto) / 2, width: w, height: h });
      p2.pushOperators(popGraphicsState());
      e2.texto(autor, x, yTop + alto + 14, cursiva, 9.5, CREMA, 0.6);
    });
    e2.pie();
  }

  return doc.save();
}

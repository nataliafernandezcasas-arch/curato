import { NextRequest, NextResponse } from "next/server";
import { GET as informeJson } from "../route";
import { buildInformePdf } from "@/lib/informe-pdf";

type Lang = "fr" | "en" | "es";

const T: Record<Lang, {
  eyebrow: string;
  visitasDe: (n: number) => string;
  debajo: (n: number) => string;
  cuentas: string;
  vistas: string;
  interacciones: string;
  tasa: string;
  storytellers: string;
  seguidores: (x: string) => string;
  cifras: (c: string, v: string) => string;
  fotos: string;
  fotosNota: string;
  pie: string;
  archivo: string;
}> = {
  fr: {
    eyebrow: "Rapport mensuel",
    visitasDe: (n) => `visites sur les ${n} garanties`,
    debajo: (n) => `Ce mois-ci est en dessous des ${n} visites garanties : le mois suivant vous est offert.`,
    cuentas: "Comptes atteints",
    vistas: "Vues",
    interacciones: "Interactions",
    tasa: "Taux d'interaction",
    storytellers: "Les storytellers reçus",
    seguidores: (x) => `${x} abonnés`,
    cifras: (c, v) => `${c} comptes atteints · ${v} vues`,
    fotos: "Les photos du mois",
    fotosNota: "En haute définition dans votre espace Curato. Exclusives 90 jours après chaque visite.",
    pie: "Curato · Jamais une campagne, toujours une histoire",
    archivo: "rapport",
  },
  en: {
    eyebrow: "Monthly report",
    visitasDe: (n) => `visits of the ${n} guaranteed`,
    debajo: (n) => `This month is below the ${n} guaranteed visits: the next one is on us.`,
    cuentas: "Accounts reached",
    vistas: "Views",
    interacciones: "Interactions",
    tasa: "Engagement rate",
    storytellers: "Storytellers you hosted",
    seguidores: (x) => `${x} followers`,
    cifras: (c, v) => `${c} accounts reached · ${v} views`,
    fotos: "This month's photos",
    fotosNota: "In high definition in your Curato space. Exclusive for 90 days after each visit.",
    pie: "Curato · Never a campaign, always a story",
    archivo: "report",
  },
  es: {
    eyebrow: "Informe mensual",
    visitasDe: (n) => `visitas de las ${n} garantizadas`,
    debajo: (n) => `Este mes está por debajo de las ${n} visitas garantizadas: el siguiente es gratis.`,
    cuentas: "Cuentas alcanzadas",
    vistas: "Vistas",
    interacciones: "Interacciones",
    tasa: "Tasa de interacción",
    storytellers: "Los storytellers recibidos",
    seguidores: (x) => `${x} seguidores`,
    cifras: (c, v) => `${c} cuentas alcanzadas · ${v} vistas`,
    fotos: "Las fotos del mes",
    fotosNota: "En alta definición en tu espacio Curato. Exclusivas durante 90 días tras cada visita.",
    pie: "Curato · Nunca una campaña, siempre una historia",
    archivo: "informe",
  },
};

type Informe = {
  maison: string;
  month: string;
  visits: number;
  guaranteed: number;
  belowMinimum: boolean;
  reach: { accounts: number; views: number; interactions: number; engagement: number | null; declared: number };
  storytellers: { name: string; handle: string | null; followers: number | null; date: string; accounts: number | null; views: number | null }[];
  gallery: { url: string; name: string }[];
};

/**
 * El informe del mes en PDF, para reenviarlo. Reutiliza el informe de la
 * pantalla (misma sesión, mismas reglas de acceso) y lo dibuja con
 * src/lib/informe-pdf.ts.
 */
export async function GET(request: NextRequest) {
  const lang = (["fr", "en", "es"].includes(request.nextUrl.searchParams.get("lang") ?? "")
    ? request.nextUrl.searchParams.get("lang")
    : "fr") as Lang;
  const t = T[lang];
  const mes = request.nextUrl.searchParams.get("month");

  const url = new URL("/api/maison/report", request.url);
  if (mes) url.searchParams.set("month", mes);
  const respuesta = await informeJson(new NextRequest(url, { headers: request.headers }));
  if (!respuesta.ok) return respuesta;
  const d = (await respuesta.json()) as Informe;

  const n = (v: number | null) => (v == null ? "—" : v.toLocaleString(lang));
  const [anio, num] = d.month.split("-").map(Number);
  const nombreMes = new Date(Date.UTC(anio, num - 1, 15)).toLocaleDateString(lang, { month: "long", year: "numeric", timeZone: "Europe/Paris" });

  // Las fotos, como mucho cuatro, con un tiempo máximo por foto.
  const fotos: { bytes: Uint8Array; autor: string }[] = [];
  for (const f of d.gallery.slice(0, 6)) {
    if (fotos.length >= 4) break;
    try {
      const r = await fetch(f.url, { signal: AbortSignal.timeout(8000) });
      if (r.ok) fotos.push({ bytes: new Uint8Array(await r.arrayBuffer()), autor: f.name });
    } catch {
      // Sin esa foto.
    }
  }

  const bytes = await buildInformePdf({
    maison: d.maison,
    mes: nombreMes,
    visitas: d.visits,
    garantizadas: d.guaranteed,
    debajo: d.belowMinimum,
    cifras:
      d.visits > 0
        ? [
            { etiqueta: t.cuentas, valor: n(d.reach.accounts) },
            { etiqueta: t.vistas, valor: n(d.reach.views) },
            { etiqueta: t.interacciones, valor: n(d.reach.interactions) },
            { etiqueta: t.tasa, valor: d.reach.engagement == null ? "—" : `${d.reach.engagement.toLocaleString(lang)} %` },
          ]
        : [],
    storytellers: d.storytellers.map((s) => ({
      nombre: s.name,
      detalle: [
        s.handle ? `@${s.handle}` : null,
        s.followers != null ? t.seguidores(s.followers.toLocaleString(lang)) : null,
        new Date(s.date).toLocaleDateString(lang, { day: "numeric", month: "long", timeZone: "Europe/Paris" }),
      ]
        .filter(Boolean)
        .join(" · "),
      cifras: s.accounts != null || s.views != null ? t.cifras(n(s.accounts), n(s.views)) : "",
    })),
    fotos,
    textos: {
      eyebrow: t.eyebrow,
      visitasDe: t.visitasDe(d.guaranteed),
      debajo: t.debajo(d.guaranteed),
      storytellers: t.storytellers,
      fotos: t.fotos,
      fotosNota: t.fotosNota,
      pie: t.pie,
    },
  });

  const nombre = `curato-${t.archivo}-${d.month}-${d.maison.toLowerCase().replace(/[^\w]+/g, "-")}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      // inline: en el iPhone se abre la vista del PDF, con su botón de compartir.
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

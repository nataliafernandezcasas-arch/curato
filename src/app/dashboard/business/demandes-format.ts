import type { Lang } from "@/lib/i18n/translations";

// Números pequeños en letra y en femenino, porque todo lo que se cuenta aquí lo
// es: personnes, visites, photographies. "Trois personnes attendent" se lee
// como una frase; "3 personnes attendent", como un contador.
const PALABRAS: Record<Lang, string[]> = {
  fr: ["aucune", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"],
  en: ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
  es: ["ninguna", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"],
};

export function enLetra(n: number, lang: Lang, mayuscula = false): string {
  const p = (PALABRAS[lang] ?? PALABRAS.fr)[n] ?? String(n);
  return mayuscula ? capitalizar(p) : p;
}

export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 142 K, 1,2 M. */
export function compacto(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 })
    .format(n)
    .replace(/ ?k$/i, " K");
}

/** 4,2 % en francés y en español, 4.2% en inglés. */
export function porcentaje(n: number, lang: Lang): string {
  return lang === "en" ? `${n}%` : `${n.toLocaleString(lang)} %`;
}

/** El nombre de pila, para las frases que hablan de la persona. */
export function nombrePila(name: string): string {
  const s = name.replace(/^@/, "").trim();
  return s.split(/\s+/)[0] || s;
}

const PARIS = "Europe/Paris";

/** "Jeudi 22" en la lista, "Jeudi 22 octobre" en la cabecera del dossier. */
export function dia(iso: string, lang: Lang, conMes: boolean): string {
  // Por piezas y no con un solo formato: en inglés, pedir día de la semana y
  // número sin mes da "13 Sunday".
  const d = new Date(iso);
  const semana = d.toLocaleDateString(lang, { weekday: "long", timeZone: PARIS });
  const num = d.toLocaleDateString(lang, { day: "numeric", timeZone: PARIS });
  if (!conMes) return capitalizar(`${semana} ${num}`);
  const mes = d.toLocaleDateString(lang, { month: "long", timeZone: PARIS });
  return capitalizar(
    lang === "en" ? `${semana}, ${mes} ${num}` : lang === "es" ? `${semana} ${num} de ${mes}` : `${semana} ${num} ${mes}`
  );
}

export function hora(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang, {
    hour: lang === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
    timeZone: PARIS,
  });
}

/** El día de la semana solo, en minúscula: "vendredi". */
export function diaSemana(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(lang, { weekday: "long", timeZone: PARIS });
}

/** La fecha en París, para saber si dos personas piden el mismo día. */
export function claveDia(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: PARIS });
}

/** "il y a 2 jours", "hier", "aujourd'hui". */
export function haceCuanto(iso: string, lang: Lang): string {
  const dias = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(-dias, "day");
}

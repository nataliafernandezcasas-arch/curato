import type { Lang } from "./translations";

// El orden de reserva cuando falta la traducción pedida: el francés es la
// lengua de referencia de Curato, luego el inglés y, al final, el español.
const RESERVA: Lang[] = ["fr", "en", "es"];

/**
 * El texto en el idioma pedido o, si está vacío, en el primero que exista
 * siguiendo fr → en → es. Sirve para columnas de la base con una versión por
 * idioma (preguntas del cuestionario, descripciones de las casas…).
 */
export function pickLang(
  textos: Partial<Record<Lang, string | null | undefined>>,
  lang: Lang
): string {
  for (const l of [lang, ...RESERVA]) {
    const t = textos[l];
    if (typeof t === "string" && t.trim()) return t;
  }
  return "";
}

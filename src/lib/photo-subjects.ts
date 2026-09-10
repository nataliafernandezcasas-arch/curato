import type { Lang } from "@/lib/i18n/translations";

/**
 * Qué fotografía cada storyteller.
 *
 * Sustituye a la pregunta "Quel type de contenu créez-vous ?" del cuestionario
 * de bienvenida (decisión de Natalia, 2026-09-11): la lista de la 16b dice cómo
 * mira una persona, no de qué habla. Se guarda en el mismo sitio que antes,
 * creator_survey_responses con question_slug "content_type", así que el
 * cuestionario, la 16b, el roster y el dossier leen y escriben lo mismo.
 *
 * Dos al más: con seis marcadas, la casa no sabe qué hace nadie.
 */
export const SUBJECT_QUESTION = "content_type";
export const SUBJECT_MAX = 2;

export const SUBJECTS = [
  { slug: "tables", fr: "Tables et cuisines", en: "Tables and kitchens", es: "Mesas y cocinas" },
  { slug: "interieurs", fr: "Intérieurs et matières", en: "Interiors and materials", es: "Interiores y materias" },
  { slug: "portraits", fr: "Portraits et gestes", en: "Portraits and gestures", es: "Retratos y gestos" },
  { slug: "soins", fr: "Soins et bien-être", en: "Care and wellness", es: "Cuidados y bienestar" },
] as const;

export type SubjectSlug = (typeof SUBJECTS)[number]["slug"];

// Las respuestas de antes de la migración 033, por si se lee alguna sin
// traducir: se enseñan con la etiqueta que tenían.
const ANTIGUAS: Record<string, string> = {
  food: "Food",
  hotel_reviews: "Hôtels",
  wellness: "Bien-être",
  fashion_adjacent: "Mode",
  lifestyle: "Lifestyle",
  travel: "Voyage",
};

export function subjectLabel(slug: string, lang: Lang = "fr"): string {
  const s = SUBJECTS.find((x) => x.slug === slug);
  return s ? s[lang] : ANTIGUAS[slug] ?? slug;
}

export function isSubject(value: unknown): value is SubjectSlug {
  return SUBJECTS.some((s) => s.slug === value);
}

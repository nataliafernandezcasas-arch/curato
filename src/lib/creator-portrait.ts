import type { createAdminClient } from "@/lib/supabase/admin";
import { PORTFOLIO_BUCKET, PORTFOLIO_SIGNED_URL_SECONDS } from "@/lib/candidature-portfolio";

// Las reglas del retrato y la frase que cada storyteller elige (pantalla 16b).
// El formulario, la API y quien los enseña leen de aquí.

export const PORTRAIT_BUCKET = "creator-portraits";

/** Dos al más: un retrato y una segunda foto, no una galería. */
export const PORTRAIT_MAX = 2;

/** La frase sobre cómo fotografía. Lo que la casa lee antes de mirar. */
export const BIO_MAX = 240;

/** Las fotografías de su perfil: seis, como la candidatura. */
export const ESTILO_MAX = 6;

/**
 * Una foto de la candidatura dentro de la lista del perfil (migración 036).
 * Las demás entradas son fotos subidas al bucket de retratos.
 */
export const CANDIDATURA = "candidature:";

/** Cuánto vale un enlace firmado. Minutos, no meses: es la cara de alguien. */
export const PORTRAIT_SIGNED_URL_SECONDS = 60 * 60;

// Formatos y peso, los mismos que la candidatura: dos reglas de subida en el
// mismo producto es cómo se acumulan las excepciones.
export { PORTFOLIO_ACCEPT as PORTRAIT_ACCEPT, PORTFOLIO_MAX_BYTES as PORTRAIT_MAX_BYTES, isAllowedImage } from "@/lib/candidature-portfolio";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Enlaces firmados para varias rutas del bucket, en una sola llamada. El orden
 * de la respuesta es el de la entrada; una ruta que falla se queda en null.
 */
export async function signPortraits(admin: Admin, paths: string[]): Promise<(string | null)[]> {
  if (paths.length === 0) return [];
  const { data } = await admin.storage.from(PORTRAIT_BUCKET).createSignedUrls(paths, PORTRAIT_SIGNED_URL_SECONDS);
  return paths.map((_, i) => data?.[i]?.signedUrl ?? null);
}

/**
 * Las fotos que ve la casa: las que la persona eligió en su perfil o, mientras
 * no las haya tocado (null), las de su candidatura.
 */
export function fotosElegidas(elegidas: string[] | null | undefined, candidatura: string[]): string[] {
  return (elegidas ?? candidatura.map((p) => CANDIDATURA + p)).slice(0, ESTILO_MAX);
}

/** Firma una lista mezclada, cada foto en su bucket, sin cambiar el orden. */
export async function firmarFotos(admin: Admin, claves: string[]): Promise<(string | null)[]> {
  const deCandidatura = claves.filter((k) => k.startsWith(CANDIDATURA)).map((k) => k.slice(CANDIDATURA.length));
  const propias = claves.filter((k) => !k.startsWith(CANDIDATURA));
  const [firmadasCandidatura, firmadasPropias] = await Promise.all([
    deCandidatura.length
      ? admin.storage
          .from(PORTFOLIO_BUCKET)
          .createSignedUrls(deCandidatura, PORTFOLIO_SIGNED_URL_SECONDS)
          .then((r) => deCandidatura.map((_, i) => r.data?.[i]?.signedUrl ?? null))
      : Promise.resolve([] as (string | null)[]),
    signPortraits(admin, propias),
  ]);
  let i = 0;
  let j = 0;
  return claves.map((k) => (k.startsWith(CANDIDATURA) ? firmadasCandidatura[i++] : firmadasPropias[j++]) ?? null);
}

import type { createAdminClient } from "@/lib/supabase/admin";

// Las reglas del retrato y la frase que cada storyteller elige (pantalla 16b).
// El formulario, la API y quien los enseña leen de aquí.

export const PORTRAIT_BUCKET = "creator-portraits";

/** Dos al más: un retrato y una segunda foto, no una galería. */
export const PORTRAIT_MAX = 2;

/** La frase sobre cómo fotografía. Lo que la casa lee antes de mirar. */
export const BIO_MAX = 240;

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

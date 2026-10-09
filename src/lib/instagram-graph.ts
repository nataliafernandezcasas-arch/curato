/**
 * La API oficial de Instagram (Graph API, Business Discovery).
 *
 * Con la cuenta profesional de Curato se leen los datos públicos de otra
 * cuenta profesional (de creador o de empresa) por su @: seguidores y últimas
 * publicaciones. Es gratis y el storyteller no tiene que conectar nada. Una
 * cuenta personal no se puede leer: Instagram no la expone.
 *
 * La app de Meta («Curato», caso de uso de Instagram con Facebook Login)
 * necesita los permisos instagram_basic, instagram_manage_insights,
 * pages_show_list, pages_read_engagement y business_management. Sin
 * instagram_manage_insights, Instagram responde «(#10) Application does not
 * have permission for this action» aunque los demás estén.
 *
 * Hacen falta dos variables en Vercel:
 *   META_IG_USER_ID      el id de la cuenta de Instagram de Curato;
 *   META_ACCESS_TOKEN    un token de página (no caduca si se saca de un token
 *                        de usuario de larga duración).
 */
const VERSION = process.env.META_GRAPH_VERSION || "v23.0";

export function graphConfigurado(): boolean {
  return Boolean(process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN);
}

export type PostPublico = { url: string | null; imagen: string | null; publishedAt: string | null };
export type PerfilPublico =
  | { ok: true; followers: number | null; posts: PostPublico[] }
  | { ok: false; error: "personal" | "no-existe" | "limite" | "token" | "otro"; detalle: string };

/** El @ tal como lo pide Instagram: sin arroba, sin enlace, en minúsculas. */
export function limpiarHandle(handle: string): string {
  return handle
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
}

/** Seguidores y últimas publicaciones de una cuenta profesional. */
export async function perfilPublico(handle: string, cuantas = 12): Promise<PerfilPublico> {
  const usuario = limpiarHandle(handle);
  if (!/^[a-z0-9._]{1,30}$/.test(usuario)) return { ok: false, error: "no-existe", detalle: `@${usuario}` };

  const campos = `business_discovery.username(${usuario}){followers_count,media.limit(${cuantas}){permalink,media_type,media_url,thumbnail_url,timestamp}}`;
  const url = `https://graph.facebook.com/${VERSION}/${process.env.META_IG_USER_ID}?fields=${encodeURIComponent(campos)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
    cache: "no-store",
  }).catch(() => null);
  if (!res) return { ok: false, error: "otro", detalle: "sin respuesta" };

  const body = (await res.json().catch(() => ({}))) as {
    business_discovery?: {
      followers_count?: number;
      media?: { data?: { permalink?: string; media_type?: string; media_url?: string; thumbnail_url?: string; timestamp?: string }[] };
    };
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (body.error) {
    const { code, error_subcode, message = "" } = body.error;
    // 110 / 2207013: la cuenta no es profesional o no existe con ese nombre.
    if (code === 110 || error_subcode === 2207013 || /cannot be found|not.*business/i.test(message)) {
      return { ok: false, error: "personal", detalle: message };
    }
    if (code === 4 || code === 17 || code === 32 || code === 613) return { ok: false, error: "limite", detalle: message };
    if (code === 190) return { ok: false, error: "token", detalle: message };
    return { ok: false, error: "otro", detalle: message };
  }

  const bd = body.business_discovery;
  if (!bd) return { ok: false, error: "otro", detalle: "respuesta vacía" };
  const posts = (bd.media?.data ?? []).map((m) => ({
    url: m.permalink ?? null,
    // Un vídeo trae su portada en thumbnail_url; una foto o un carrusel, en media_url.
    imagen: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? m.thumbnail_url ?? null,
    publishedAt: m.timestamp ?? null,
  }));
  return { ok: true, followers: bd.followers_count ?? null, posts };
}

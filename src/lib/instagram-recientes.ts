import type { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloFeedContents, getPhylloProfile, summarizeMetrics } from "@/lib/phyllo/client";
import { PORTRAIT_BUCKET, signPortraits } from "@/lib/creator-portrait";
import { graphConfigurado, perfilPublico, type PostPublico } from "@/lib/instagram-graph";

type Admin = ReturnType<typeof createAdminClient>;

/** Una publicación guardada: el enlace al post y su foto en nuestro bucket. */
export type PublicacionGuardada = { url: string | null; path: string; publishedAt: string | null };

export const RECIENTES = 6;
// Pasado este tiempo, la tarea de cada hora vuelve a mirar la cuenta.
export const REFRESCO_MS = 20 * 3600 * 1000;
const MAX_BYTES = 8 * 1024 * 1024;

/** Las guardadas, con un enlace firmado a cada foto, en orden. */
export async function firmarRecientes(
  admin: Admin,
  guardadas: PublicacionGuardada[]
): Promise<{ url: string | null; thumbnail: string | null }[]> {
  const firmadas = await signPortraits(admin, guardadas.map((p) => p.path));
  return guardadas.map((p, i) => ({ url: p.url, thumbnail: firmadas[i] })).filter((p) => p.thumbnail);
}

/**
 * Copia las fotos al bucket y guarda la lista. Se copian porque los enlaces
 * de Instagram caducan en pocos días. Devuelve cuántas se guardaron; con
 * ninguna, se quedan las anteriores.
 */
async function guardarPublicaciones(admin: Admin, creatorId: string, posts: PostPublico[]): Promise<number> {
  const sello = Date.now();
  const guardadas: PublicacionGuardada[] = [];
  for (const [i, post] of posts.filter((p) => p.imagen).entries()) {
    if (guardadas.length >= RECIENTES) break;
    const res = await fetch(post.imagen!).catch(() => null);
    const tipo = res?.headers.get("content-type") ?? "";
    if (!res?.ok || !tipo.startsWith("image/")) continue;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) continue;
    const ext = tipo.includes("png") ? "png" : tipo.includes("webp") ? "webp" : "jpg";
    const path = `instagram/${creatorId}/${sello}-${i}.${ext}`;
    const { error } = await admin.storage.from(PORTRAIT_BUCKET).upload(path, bytes, { contentType: tipo, upsert: true });
    if (!error) guardadas.push({ url: post.url, path, publishedAt: post.publishedAt });
  }
  if (guardadas.length === 0) return 0;

  const { error } = await admin
    .from("creators")
    .update({ instagram_posts: guardadas, instagram_posts_at: new Date().toISOString() })
    .eq("id", creatorId);
  if (error) {
    console.error("[curato] no se guardaron las publicaciones de Instagram:", error.message);
    return 0;
  }

  // Las fotos de la vez anterior ya no las usa nadie.
  const { data: viejas } = await admin.storage.from(PORTRAIT_BUCKET).list(`instagram/${creatorId}`, { limit: 100 });
  const enUso = new Set(guardadas.map((g) => g.path));
  const sobran = (viejas ?? []).map((f) => `instagram/${creatorId}/${f.name}`).filter((p) => !enUso.has(p));
  if (sobran.length) await admin.storage.from(PORTRAIT_BUCKET).remove(sobran);
  return guardadas.length;
}

export type Resultado = "ok" | "personal" | "no-existe" | "limite" | "token" | "otro" | "sin-fuente";

/**
 * Pone al día a un storyteller: seguidores y últimas publicaciones.
 *
 * La fuente es la API oficial de Instagram por su @ (instagram-graph.ts); si
 * no está configurada, Phyllo, solo para las fotos. Nunca lanza.
 */
export async function actualizarInstagram(
  admin: Admin,
  c: { id: string; handle: string | null; phyllo_account_id?: string | null }
): Promise<Resultado> {
  try {
    if (graphConfigurado() && c.handle) {
      const perfil = await perfilPublico(c.handle);
      const ahora = new Date().toISOString();
      if (!perfil.ok) {
        // Un límite de la API o un token caducado no son culpa de la cuenta:
        // no se marca como mirada, y la siguiente hora se vuelve a intentar.
        const reintentar = perfil.error === "limite" || perfil.error === "token";
        await admin
          .from("creators")
          .update({ instagram_error: perfil.error, ...(reintentar ? {} : { instagram_synced_at: ahora }) })
          .eq("id", c.id);
        if (perfil.error === "token") console.error("[curato] el token de Meta no vale:", perfil.detalle);
        return perfil.error;
      }
      await admin
        .from("creators")
        .update({
          instagram_followers: perfil.followers,
          instagram_synced_at: ahora,
          instagram_error: null,
        })
        .eq("id", c.id);
      await guardarPublicaciones(admin, c.id, perfil.posts);
      return "ok";
    }

    if (c.phyllo_account_id) {
      await refrescarConPhyllo(admin, c.id, c.phyllo_account_id);
      return "ok";
    }
    return "sin-fuente";
  } catch (err) {
    console.error("[curato] Instagram no actualizado:", err);
    return "otro";
  }
}

/** Las últimas publicaciones según Phyllo, al conectar Instagram con Phyllo. */
export async function refrescarConPhyllo(admin: Admin, creatorId: string, phylloUserId: string): Promise<void> {
  try {
    const accounts = await getPhylloAccounts(phylloUserId);
    const account = accounts?.data?.[0];
    if (!account?.id) return;
    const [profileRes, contentsRes] = await Promise.all([
      getPhylloProfile(account.id),
      getPhylloFeedContents(account.id, RECIENTES),
    ]);
    const { metrics } = summarizeMetrics(profileRes?.data?.[0] ?? profileRes, contentsRes?.data ?? [], new Date().toISOString());
    await guardarPublicaciones(
      admin,
      creatorId,
      metrics.recentPosts.map((p) => ({ url: p.url, imagen: p.thumbnail, publishedAt: p.publishedAt }))
    );
  } catch (err) {
    console.error("[curato] publicaciones de Phyllo no refrescadas:", err);
  }
}

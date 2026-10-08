import type { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloFeedContents, getPhylloProfile, summarizeMetrics } from "@/lib/phyllo/client";
import { PORTRAIT_BUCKET, signPortraits } from "@/lib/creator-portrait";

type Admin = ReturnType<typeof createAdminClient>;

/** Una publicación guardada: el enlace al post y su foto en nuestro bucket. */
export type PublicacionGuardada = { url: string | null; path: string; publishedAt: string | null };

export const RECIENTES = 6;
// Más de un día y se vuelven a pedir: se publica a menudo, pero no cada hora.
const CADUCAN_MS = 24 * 3600 * 1000;
const MAX_BYTES = 8 * 1024 * 1024;

export function caducadas(at: string | null | undefined): boolean {
  return !at || Date.now() - new Date(at).getTime() > CADUCAN_MS;
}

/** Las guardadas, con un enlace firmado a cada foto, en orden. */
export async function firmarRecientes(
  admin: Admin,
  guardadas: PublicacionGuardada[]
): Promise<{ url: string | null; thumbnail: string | null }[]> {
  const firmadas = await signPortraits(admin, guardadas.map((p) => p.path));
  return guardadas.map((p, i) => ({ url: p.url, thumbnail: firmadas[i] })).filter((p) => p.thumbnail);
}

/**
 * Pide a Phyllo las últimas publicaciones del feed, copia sus fotos al bucket
 * y guarda la lista. Las fotos se copian porque los enlaces de Instagram
 * caducan a los pocos días. No lanza: si algo falla, quedan las anteriores.
 */
export async function refrescarRecientes(admin: Admin, creatorId: string, phylloUserId: string): Promise<void> {
  try {
    const accounts = await getPhylloAccounts(phylloUserId);
    const account = accounts?.data?.[0];
    if (!account?.id) return;
    const [profileRes, contentsRes] = await Promise.all([
      getPhylloProfile(account.id),
      getPhylloFeedContents(account.id, RECIENTES),
    ]);
    const { metrics } = summarizeMetrics(profileRes?.data?.[0] ?? profileRes, contentsRes?.data ?? [], new Date().toISOString());
    const posts = metrics.recentPosts.filter((p) => p.thumbnail).slice(0, RECIENTES);
    if (posts.length === 0) {
      console.info(`[curato] Phyllo no devolvió fotos del feed para ${creatorId}.`);
      return;
    }

    const sello = Date.now();
    const guardadas: PublicacionGuardada[] = [];
    for (const [i, post] of posts.entries()) {
      const res = await fetch(post.thumbnail!).catch(() => null);
      const tipo = res?.headers.get("content-type") ?? "";
      if (!res?.ok || !tipo.startsWith("image/")) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) continue;
      const path = `instagram/${creatorId}/${sello}-${i}.${tipo.includes("png") ? "png" : tipo.includes("webp") ? "webp" : "jpg"}`;
      const { error } = await admin.storage.from(PORTRAIT_BUCKET).upload(path, bytes, { contentType: tipo, upsert: true });
      if (!error) guardadas.push({ url: post.url, path, publishedAt: post.publishedAt });
    }
    if (guardadas.length === 0) return;

    const { error } = await admin
      .from("creators")
      .update({ instagram_posts: guardadas, instagram_posts_at: new Date().toISOString() })
      .eq("id", creatorId);
    if (error) {
      console.error("[curato] no se guardaron las publicaciones de Instagram:", error.message);
      return;
    }

    // Las fotos de la vez anterior ya no las usa nadie.
    const { data: viejas } = await admin.storage.from(PORTRAIT_BUCKET).list(`instagram/${creatorId}`, { limit: 100 });
    const enUso = new Set(guardadas.map((g) => g.path));
    const sobran = (viejas ?? []).map((f) => `instagram/${creatorId}/${f.name}`).filter((p) => !enUso.has(p));
    if (sobran.length) await admin.storage.from(PORTRAIT_BUCKET).remove(sobran);
  } catch (err) {
    console.error("[curato] publicaciones de Instagram no refrescadas:", err);
  }
}

import type { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloProfile, getPhylloFeedContents, summarizeMetrics } from "@/lib/phyllo/client";
import { PORTFOLIO_BUCKET, PORTFOLIO_SIGNED_URL_SECONDS } from "@/lib/candidature-portfolio";
import { ESTILO_MAX, signPortraits } from "@/lib/creator-portrait";
import { SUBJECT_QUESTION, subjectLabel } from "@/lib/photo-subjects";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Todo lo que una maison puede saber de un storyteller, en el orden en que lo
 * lee: quién es, cómo fotografía, qué hizo en otras casas del club y, al final,
 * sus cifras.
 *
 * Lo usan el dossier de una demanda y la ficha del roster, que son la misma
 * pieza (entrega 4, 10 duodecies): si cada una armara lo suyo, en seis meses
 * una tendría el portafolio y la otra no.
 */
export type Dossier = {
  id: string;
  name: string;
  handle: string | null;
  categories: string[];
  /** El retrato que eligió el creador; si no eligió ninguno, el de Instagram. */
  portrait: string | null;
  /** Su frase sobre cómo fotografía: la bio propia, o la de su candidatura. */
  phrase: string | null;
  /**
   * Las fotografías de su candidatura, firmadas por una hora. Se enseñan con la
   * licencia del artículo 15 de las CGU: la casa las mira, no las descarga.
   */
  portfolio: string[];
  /**
   * Las fotografías que el storyteller sube a su perfil para enseñar cómo
   * mira (16b, migración 036), firmadas por una hora. Van antes que las de la
   * candidatura.
   */
  estilo: string[];
  /**
   * Su recorrido en el club, **agregado y sin nombres de casas**: las CGU
   * tratan como confidencial lo que pasa en otro miembro.
   */
  club: { visits: number; avgReach: number | null };
  /** null si no conectó Instagram: sin Phyllo no hay cifras que enseñar. */
  audience: { followers: number | null; avgReach: number | null; engagement: number | null } | null;
  recentPosts: { url: string | null; thumbnail: string | null }[];
};

// Phyllo es lento a veces. Una lista de demandas no puede esperar a la cuenta
// más lenta de Instagram: pasado este tiempo, esa persona sale sin cifras.
const PHYLLO_TIMEOUT_MS = 6000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

type PhylloExtra = {
  imageUrl: string | null;
  followers: number | null;
  avgReach: number | null;
  engagement: number | null;
  recentPosts: { url: string | null; thumbnail: string | null }[];
};

async function phylloExtra(phylloAccountId: string): Promise<PhylloExtra | null> {
  try {
    const accounts = await getPhylloAccounts(phylloAccountId);
    const account = accounts?.data?.[0];
    if (!account?.id) return null;
    const [profileRes, contentsRes] = await Promise.all([
      getPhylloProfile(account.id),
      getPhylloFeedContents(account.id, 6),
    ]);
    const { metrics } = summarizeMetrics(profileRes?.data?.[0] ?? profileRes, contentsRes?.data ?? [], new Date().toISOString());
    return {
      imageUrl: metrics.imageUrl,
      followers: metrics.followers,
      avgReach: metrics.avgReach,
      engagement: metrics.engagementPct,
      recentPosts: metrics.recentPosts.slice(0, 6).map((p) => ({ url: p.url, thumbnail: p.thumbnail })),
    };
  } catch {
    return null;
  }
}

/** Los dossiers de varios storytellers a la vez, para no hacer una ronda por persona. */
export async function buildDossiers(admin: Admin, creatorIds: string[]): Promise<Map<string, Dossier>> {
  const out = new Map<string, Dossier>();
  const ids = [...new Set(creatorIds)].filter(Boolean);
  if (ids.length === 0) return out;

  const COLUMNAS =
    "id, full_name, handle, email, followers, followers_count, engagement_rate, instagram_connected, phyllo_account_id, portrait_urls, own_bio";
  // style_paths llega con la migración 036: sin ella, el dossier sigue sin las
  // fotos de estilo en vez de romperse.
  const conEstilo = await admin.from("creators").select(`${COLUMNAS}, style_paths`).in("id", ids);
  const { data: creators } = conEstilo.error ? await admin.from("creators").select(COLUMNAS).in("id", ids) : conEstilo;
  const rows = (creators ?? []) as Array<Record<string, unknown> & { id: string }>;

  const [survey, visits, applications, phyllo] = await Promise.all([
    admin
      .from("creator_survey_responses")
      .select("creator_id, answer")
      .eq("question_slug", SUBJECT_QUESTION)
      .in("creator_id", ids),
    // Solo visitas terminadas, y solo la cifra: nada que diga en qué casa fue.
    admin.from("reservations").select("creator_id, reach_accounts").eq("status", "completed").in("creator_id", ids),
    // La candidatura se enlaza por el correo: es lo único que comparten.
    admin
      .from("applications")
      .select("email, portfolio_paths, photo_style, created_at")
      .not("portfolio_paths", "is", null)
      .order("created_at", { ascending: false }),
    Promise.all(
      rows.map(async (c) => {
        if (!c.instagram_connected || !c.phyllo_account_id) return [c.id as string, null] as const;
        return [c.id as string, await withTimeout(phylloExtra(c.phyllo_account_id as string), PHYLLO_TIMEOUT_MS)] as const;
      })
    ),
  ]);

  const categoriesById = new Map<string, string[]>();
  for (const r of survey.data ?? []) {
    const slugs = Array.isArray(r.answer) ? (r.answer as string[]) : [];
    categoriesById.set(r.creator_id, slugs.map((s) => subjectLabel(s)).filter(Boolean));
  }

  const clubById = new Map<string, { visits: number; reachSum: number; reachCount: number }>();
  for (const v of visits.data ?? []) {
    const acc = clubById.get(v.creator_id) ?? { visits: 0, reachSum: 0, reachCount: 0 };
    acc.visits += 1;
    if (v.reach_accounts != null) {
      acc.reachSum += v.reach_accounts;
      acc.reachCount += 1;
    }
    clubById.set(v.creator_id, acc);
  }

  // La candidatura más reciente de cada correo.
  const appByEmail = new Map<string, { paths: string[]; style: string | null }>();
  for (const a of applications.data ?? []) {
    const key = (a.email || "").trim().toLowerCase();
    if (!key || appByEmail.has(key)) continue;
    appByEmail.set(key, { paths: (a.portfolio_paths as string[] | null) ?? [], style: a.photo_style ?? null });
  }

  const phylloById = new Map(phyllo);

  await Promise.all(
    rows.map(async (c) => {
      const id = c.id as string;
      const app = appByEmail.get(((c.email as string | null) || "").trim().toLowerCase());
      let portfolio: string[] = [];
      if (app && app.paths.length > 0) {
        const { data: signed } = await admin.storage
          .from(PORTFOLIO_BUCKET)
          .createSignedUrls(app.paths, PORTFOLIO_SIGNED_URL_SECONDS);
        portfolio = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
      }

      const x = phylloById.get(id) ?? null;
      const connected = Boolean(c.instagram_connected && c.phyllo_account_id);
      const er = c.engagement_rate as number | null;
      const club = clubById.get(id);
      const portraits = (c.portrait_urls as string[] | null) ?? [];
      const ownBio = ((c.own_bio as string | null) ?? "").trim();
      // El retrato propio (16b) vive en un bucket privado: se firma cada vez
      // que se enseña. Si falla, la casa ve la foto de Instagram.
      const [retrato] = portraits[0] ? await signPortraits(admin, [portraits[0]]) : [null];
      const estiloPaths = ((c.style_paths as string[] | null | undefined) ?? []).slice(0, ESTILO_MAX);
      const estiloFirmado = (estiloPaths.length ? await signPortraits(admin, estiloPaths) : []).filter(
        (u): u is string => Boolean(u)
      );

      out.set(id, {
        id,
        name: (c.full_name as string | null)?.trim() || (c.handle ? `@${c.handle}` : ""),
        handle: (c.handle as string | null) ?? null,
        categories: categoriesById.get(id) ?? [],
        portrait: retrato ?? x?.imageUrl ?? null,
        phrase: ownBio || app?.style?.trim() || null,
        portfolio,
        estilo: estiloFirmado,
        club: {
          visits: club?.visits ?? 0,
          avgReach: club && club.reachCount > 0 ? Math.round(club.reachSum / club.reachCount) : null,
        },
        audience: connected
          ? {
              followers: x?.followers ?? (c.followers_count as number | null) ?? (c.followers as number | null) ?? null,
              avgReach: x?.avgReach ?? null,
              // engagement_rate se guarda como fracción (0.05 = 5 %).
              engagement: x?.engagement ?? (er != null ? Math.round(er * 1000) / 10 : null),
            }
          : null,
        recentPosts: x?.recentPosts ?? [],
      });
    })
  );

  return out;
}

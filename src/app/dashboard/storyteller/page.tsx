"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RoleSwitch from "../role-switch";
import DashboardNav from "../dashboard-nav";
import { STORYTELLER_LINKS } from "./nav-links";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT, canBypassLaunchGate } from "@/lib/launch";
import ConnectInstagram from "./connect-instagram";
import SuggestVenue from "./suggest-venue";
import { Rise, Photo } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Tabs } from "@/components/member/tabs";

// A maison = a signed venue from `comercios` (is_reservable = true).
type Maison = {
  id: string;
  name: string;
  arrondissement: string | null;
  address: string | null;
  description: string | null;
  photos: string[] | null;
  website_url: string | null;
  signed_at: string | null;
  category_id: string | null;
};

// Canonical category UUIDs are fixed in migration 009 — map them directly to
// their slug instead of embedding the `categories` relation. The display label
// is resolved per-language from the slug.
const CATEGORY_BY_ID: Record<string, string> = {
  "00000000-0000-0000-0000-0000000ca701": "hoteles",
  "00000000-0000-0000-0000-0000000ca702": "gastronomia",
  "00000000-0000-0000-0000-0000000ca703": "wellness",
  "00000000-0000-0000-0000-0000000ca704": "belleza",
};

const SLUG_LABEL_KEY = {
  gastronomia: "catGastronomy",
  hoteles: "catHotels",
  wellness: "catWellness",
  belleza: "catBeauty",
} as const;

function slugOf(maison: Maison): string | null {
  return maison.category_id ? CATEGORY_BY_ID[maison.category_id] ?? null : null;
}

type Profile = {
  full_name: string | null;
  handle: string | null;
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
  followers: number | null;
  instagram_connected: boolean | null;
};

// Category filter buttons: slug + the translation key for its label.
const FILTERS = [
  { slug: "all", key: "catAll" },
  { slug: "gastronomia", key: "catGastronomy" },
  { slug: "hoteles", key: "catHotels" },
  { slug: "wellness", key: "catWellness" },
  { slug: "belleza", key: "catBeauty" },
] as const;

// A maison is flagged "Nouveau" if it was signed within the last 45 days.
function isNew(signedAt: string | null): boolean {
  if (!signedAt) return false;
  const signed = new Date(signedAt).getTime();
  return Date.now() - signed < 45 * 24 * 60 * 60 * 1000;
}

export default function InfluencerDashboard() {
  const { lang } = useLang();
  const t = translations[lang].dashboard;

  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [maisonsLoading, setMaisonsLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  // Before launch, accepted storytellers see a "coming soon" screen instead of
  // the catalogue. ?preview=1 and the native app both bypass it, so the
  // TestFlight cohort can browse while the website stays shut.
  useEffect(() => {
    setPreview(canBypassLaunchGate());
  }, []);
  const gated = isBeforeLaunch() && !preview;
  const launchDateLabel = LAUNCH_AT?.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  function catLabel(slug: string | null): string {
    if (!slug) return "";
    const key = SLUG_LABEL_KEY[slug as keyof typeof SLUG_LABEL_KEY];
    return key ? t[key] : "";
  }

  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfileLoading(false); return; }

      // Find the creator by the auth link (owner_id) first, then email. Using
      // owner_id keeps the profile working even if the creator's email differs
      // from the login email.
      const { data: creator } = await supabase
        .from("creators")
        .select("full_name, handle, monthly_credit_cop, credit_used_cop, followers, instagram_connected")
        .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
        .maybeSingle();

      setProfile(creator);
      setProfileLoading(false);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadMaisons() {
      setMaisonsLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // RLS ("comercios public catalog") already restricts a storyteller to
      // is_reservable = true rows; the explicit filter keeps it unambiguous.
      // Category filtering is done client-side — the catalogue is small and it
      // avoids filtering the joined `categories` rows instead of the parent.
      const { data, error } = await supabase
        .from("comercios")
        .select(
          "id, name, arrondissement, address, description, photos, website_url, signed_at, category_id"
        )
        .eq("is_reservable", true)
        .order("signed_at", { ascending: false, nullsFirst: false });

      if (error) console.error("Maisons query failed:", error);

      // Las maisons de prueba solo las ve un creador de prueba. Van en
      // consultas aparte y tolerantes: si la columna is_test aún no existe
      // (migración 031 sin aplicar), no se esconde nada y el carnet sigue
      // exactamente como estaba. Así el orden entre merge y migración deja de
      // poder romper el carnet.
      let visibles = (data || []) as unknown as Maison[];
      const pruebas = await supabase.from("comercios").select("id").eq("is_test", true);
      if (!pruebas.error && pruebas.data && pruebas.data.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const yo = user
          ? await supabase
              .from("creators")
              .select("is_test")
              .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
              .maybeSingle()
          : null;
        const soyDePrueba = Boolean(yo && !yo.error && (yo.data as { is_test?: boolean } | null)?.is_test);
        if (!soyDePrueba) {
          const ocultas = new Set(pruebas.data.map((r) => r.id as string));
          visibles = visibles.filter((m) => !ocultas.has(m.id));
        }
      }

      setMaisons(visibles);
      setMaisonsLoading(false);
    }
    loadMaisons();
  }, []);

  const filteredMaisons =
    catFilter === "all"
      ? maisons
      : maisons.filter((m) => slugOf(m) === catFilter);


  const monthlyCredit = profile?.monthly_credit_cop ?? 0;
  const usedCredit = profile?.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const usedPercent = monthlyCredit > 0 ? Math.min((usedCredit / monthlyCredit) * 100, 100) : 0;

  const skeleton = "bg-border animate-pulse [animation-duration:1.6s]";

  return (
    <div className="min-h-[100dvh]">

      <DashboardNav
        links={STORYTELLER_LINKS(t, "addresses")}
        roleSwitch={<RoleSwitch current="storyteller" />}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={t.navSettings}
      />

      <div className="mx-auto max-w-[1200px] px-pagina py-seccion">

        {/* ── Quién eres y cuánto te queda ─────────────────────────────────
            Sin línea debajo: lo que separa esta cabecera de las direcciones
            son 48 px de aire. Los abonnés se han ido al perfil; el carnet
            trata de las direcciones y del crédito que las paga. */}
        {profileLoading ? (
          <div className="mb-seccion space-y-bloque">
            <div className={`h-3 w-24 ${skeleton}`} />
            <div className={`h-8 w-64 ${skeleton}`} />
          </div>
        ) : (
          <div className="mb-seccion">
            <Rise>
              <p className="text-capitale uppercase tracking-capitale text-accent">{t.greeting}</p>
            </Rise>

            <Rise index={1}>
              <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
                {profile?.full_name || profile?.handle || t.defaultName}
              </h1>
            </Rise>

            {profile?.handle && (
              <Rise index={2}>
                <a
                  href={`https://instagram.com/${profile.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-etiqueta inline-block text-legende text-accent transition-colors hover:text-text-primary"
                >
                  @{profile.handle}
                </a>
              </Rise>
            )}

            {/* El crédito. Su barra es una de las tres líneas que quedan en
                todo el producto, y está porque es un dato, no un adorno. */}
            <Rise index={3} className="mt-rango">
              <Row
                label={
                  <span className="text-capitale uppercase tracking-capitale text-text-secondary">
                    {t.creditAvailable}
                  </span>
                }
                aside={
                  monthlyCredit > 0 ? (
                    <span className="text-legende text-text-muted">
                      {t.creditOf.replace("{total}", String(monthlyCredit))}
                    </span>
                  ) : undefined
                }
                value={<span className="text-sous-titre text-accent">{remaining} €</span>}
              />
              {monthlyCredit > 0 && (
                <div className="mt-bloque h-px bg-border">
                  <div
                    className="h-full bg-accent transition-[width] duration-700 ease-curato"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              )}
            </Rise>
          </div>
        )}

        {!profileLoading && profile && <ConnectInstagram connected={!!profile.instagram_connected} />}

        {gated ? (
          <div className="py-respiro text-center">
            <p className="text-capitale uppercase tracking-capitale text-accent">{t.comingSoonKicker}</p>
            <h2 className="mt-fila text-titre tracking-titre text-text-primary">{t.comingSoonTitle}</h2>
            <p className="mx-auto mt-fila max-w-[46ch] text-corps text-text-secondary">
              {launchDateLabel
                ? t.comingSoonBody.replace("{date}", launchDateLabel)
                : t.comingSoonBodyNoDate}
            </p>
            <div className="mx-auto mt-seccion max-w-[460px]">
              <SuggestVenue />
            </div>
          </div>
        ) : (
          <>
            {/* Las categorías envuelven a dos líneas. La activa se marca en
                champagne: sin fondo, sin subrayado y sin recuadro. */}
            <Tabs
              className="mb-rango"
              tabs={FILTERS.map((f) => ({
                label: t[f.key],
                active: catFilter === f.slug,
                onClick: () => setCatFilter(f.slug),
              }))}
            />

            <Section title={t.selectedAddresses}>
              {maisonsLoading ? (
                <div className="grid grid-cols-1 gap-rango md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className={`aspect-[4/3] ${skeleton}`} />
                      <div className={`mt-fila h-3 w-3/4 ${skeleton}`} />
                      <div className={`mt-bloque h-3 w-1/2 ${skeleton}`} />
                    </div>
                  ))}
                </div>
              ) : filteredMaisons.length === 0 ? (
                <div className="py-respiro text-center">
                  <p className="text-corps text-text-secondary">{t.emptyTitle}</p>
                  <p className="mt-bloque text-legende text-text-muted">{t.emptySubtitle}</p>
                  <div className="mx-auto mt-seccion max-w-[460px]">
                    <SuggestVenue />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-rango md:grid-cols-2 lg:grid-cols-3">
                  {filteredMaisons.map((maison, i) => {
                    const label = catLabel(slugOf(maison));
                    return (
                      <Rise key={maison.id} index={i}>
                        <Link href={`/dashboard/storyteller/maison/${maison.id}`} className="group block">
                          {maison.photos?.[0] ? (
                            <Photo
                              src={maison.photos[0]}
                              alt={maison.name}
                              className="aspect-[4/3] bg-surface-raised"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center bg-surface-raised">
                              <p className="text-capitale uppercase tracking-capitale text-text-muted">{label}</p>
                            </div>
                          )}

                          <div className="mt-fila">
                            <Row
                              name
                              label={
                                <h3 className="text-sous-titre text-text-primary transition-colors group-hover:text-accent">
                                  {maison.name}
                                </h3>
                              }
                              value={
                                maison.arrondissement ? (
                                  <span className="text-capitale uppercase tracking-capitale text-brume">
                                    Paris {maison.arrondissement}
                                  </span>
                                ) : undefined
                              }
                            />

                            <p className="mt-etiqueta text-legende text-text-secondary">
                              {label}
                              {isNew(maison.signed_at) && (
                                <span className="ml-fila text-capitale uppercase tracking-capitale text-accent">
                                  {t.badgeNew}
                                </span>
                              )}
                            </p>

                            {maison.description && (
                              <p className="mt-bloque line-clamp-3 text-corps text-text-secondary">
                                {maison.description}
                              </p>
                            )}

                            {maison.address && (
                              <p className="mt-bloque text-legende text-text-muted">{maison.address}</p>
                            )}
                          </div>
                        </Link>
                      </Rise>
                    );
                  })}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

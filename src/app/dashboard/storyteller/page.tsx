"use client";

import { useState, useEffect } from "react";
import RoleSwitch from "../role-switch";
import DashboardNav from "../dashboard-nav";
import { STORYTELLER_LINKS } from "./nav-links";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT, canBypassLaunchGate } from "@/lib/launch";
import ConnectInstagram from "./connect-instagram";
import SuggestVenue from "./suggest-venue";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Tabs } from "@/components/member/tabs";
import { filtroDeUsuario } from "@/lib/identidad";
import { TarjetaCasa, esNueva, etiquetaDeCategoria } from "@/components/member/tarjeta-casa";
import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/translations";

// El buscador y la fila de las nuevas.
const BUSCAR: Record<Lang, { placeholder: string; nuevas: string; nada: (q: string) => string }> = {
  fr: {
    placeholder: "Rechercher une maison",
    nuevas: "Nouvelles adresses",
    nada: (q) => `Aucune maison ne correspond à « ${q} ». Proposez-la : nous la contactons.`,
  },
  en: {
    placeholder: "Search for a house",
    nuevas: "New addresses",
    nada: (q) => `No house matches "${q}". Suggest it: we'll get in touch with them.`,
  },
  es: {
    placeholder: "Buscar una casa",
    nuevas: "Nuevas direcciones",
    nada: (q) => `Ninguna casa coincide con «${q}». Proponla: nos pondremos en contacto.`,
  },
};

// A maison = a signed venue from `comercios` (is_reservable = true).
type Maison = {
  id: string;
  name: string;
  arrondissement: string | null;
  address: string | null;
  description: string | null;
  description_en: string | null;
  description_es: string | null;
  photos: string[] | null;
  website_url: string | null;
  signed_at: string | null;
  category_id: string | null;
  offer_eur?: number | null;
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

// Los dos requisitos de publicación de una ficha (pantalla 19). Se comprueban
// aquí además de en el formulario de la maison, porque lo que decide si una
// casa se enseña es su ficha, no su intención.
const MIN_FOTOS = 5;
const MIN_DESCRIPCION = 200;

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
        .or(filtroDeUsuario(user))
        .maybeSingle();

      // Lo gastado sale de las visitas del mes (src/lib/credito.ts), no de un
      // contador que nadie actualizaba.
      const credito = await fetch("/api/storyteller/credito", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      setProfile(creator && credito ? { ...creator, monthly_credit_cop: credito.mensual, credit_used_cop: credito.usado } : creator);
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
          "id, name, arrondissement, address, description, description_en, description_es, photos, website_url, signed_at, category_id"
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
              .or(filtroDeUsuario(user))
              .maybeSingle()
          : null;
        const soyDePrueba = Boolean(yo && !yo.error && (yo.data as { is_test?: boolean } | null)?.is_test);
        if (!soyDePrueba) {
          const ocultas = new Set(pruebas.data.map((r) => r.id as string));
          visibles = visibles.filter((m) => !ocultas.has(m.id));
        }
      }

      // Una casa aparece cuando su ficha está terminada: cinco fotografías y
      // doscientos caracteres de descripción, los dos requisitos que su propia
      // pantalla le pide. Sin esto, firmar la hacía visible con la ficha a
      // medio hacer, y lo primero que veía un storyteller era un hueco.
      // La oferta de cada casa (migración 043), en una consulta aparte y
      // tolerante: sin la columna, las tarjetas enseñan el distrito.
      const ofertas = await supabase
        .from("comercios")
        .select("id, offer_eur")
        .in("id", visibles.map((m) => m.id));
      if (!ofertas.error) {
        const ofertaDe = new Map((ofertas.data ?? []).map((o) => [o.id as string, (o.offer_eur as number | null) ?? null]));
        visibles = visibles.map((m) => ({ ...m, offer_eur: ofertaDe.get(m.id) ?? null }));
      }
      setMaisons(visibles.filter((m) => (m.photos?.length ?? 0) >= MIN_FOTOS && (m.description ?? "").trim().length >= MIN_DESCRIPCION));
      setMaisonsLoading(false);
    }
    loadMaisons();
  }, []);

  // El buscador: por nombre, distrito, dirección o descripción, sin acentos
  // ni mayúsculas.
  const [busqueda, setBusqueda] = useState("");
  const plano = (x: string | null | undefined) =>
    (x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const termino = plano(busqueda.trim());
  const filteredMaisons = maisons
    .filter((m) => catFilter === "all" || slugOf(m) === catFilter)
    .filter(
      (m) =>
        !termino ||
        [m.name, m.arrondissement, m.address, m.description, m.description_en, m.description_es].some((campo) =>
          plano(campo).includes(termino)
        )
    );
  // Las nuevas, deslizándose de lado antes de la lista (sin búsqueda en curso).
  const nuevas = maisons.filter((m) => esNueva(m.signed_at)).slice(0, 10);
  const tb = BUSCAR[lang] ?? BUSCAR.fr;


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
            {/* Buscar una casa por su nombre. */}
            <div className="relative mb-fila">
              <MagnifyingGlass
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tb.placeholder}
                aria-label={tb.placeholder}
                className="campo-cristal !pl-11 font-serif text-[15px] font-light"
              />
            </div>

            {/* Las nuevas, en una fila que se desliza de lado. */}
            {!termino && !maisonsLoading && nuevas.length > 0 && (
              <section className="mb-seccion">
                <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{tb.nuevas}</p>
                <div className="-mx-pagina flex snap-x gap-fila overflow-x-auto px-pagina pb-bloque [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {nuevas.map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/storyteller/maison/${m.id}`}
                      className="caja-cristal group w-[230px] shrink-0 snap-start overflow-hidden !p-0"
                    >
                      {m.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photos[0]} alt="" className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="aspect-[4/3] w-full bg-surface-raised" />
                      )}
                      <div className="p-4">
                        <p className="truncate text-corps text-text-primary transition-colors group-hover:text-accent">{m.name}</p>
                        <p className="mt-etiqueta text-legende tabular-nums text-text-secondary">
                          {m.offer_eur ? <span className="text-accent">{m.offer_eur.toLocaleString(lang)} €</span> : null}
                          {m.offer_eur && etiquetaDeCategoria(m.category_id, lang) ? " · " : ""}
                          {etiquetaDeCategoria(m.category_id, lang)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Las categorías envuelven a dos líneas. La activa se marca en
                champagne: sin fondo, sin subrayado y sin recuadro. */}
            <div className="mb-rango">
              <Tabs
                tabs={FILTERS.map((f) => ({
                  label: t[f.key],
                  active: catFilter === f.slug,
                  onClick: () => setCatFilter(f.slug),
                }))}
              />
            </div>

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
                  {/* Si la casa buscada no está, se puede pedir: así sabemos a
                      qué casas escribir, porque a los storytellers les
                      interesan. */}
                  <p className="text-corps text-text-secondary">{termino ? tb.nada(busqueda.trim()) : t.emptyTitle}</p>
                  {!termino && <p className="mt-bloque text-legende text-text-muted">{t.emptySubtitle}</p>}
                  <div className="mx-auto mt-seccion max-w-[460px]">
                    <SuggestVenue key={busqueda.trim()} inicial={busqueda.trim()} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-rango md:grid-cols-2 lg:grid-cols-3">
                  {filteredMaisons.map((maison, i) => {
                    return (
                      <Rise key={maison.id} index={i}>
                        <TarjetaCasa casa={maison} lang={lang} href={`/dashboard/storyteller/maison/${maison.id}`} />
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

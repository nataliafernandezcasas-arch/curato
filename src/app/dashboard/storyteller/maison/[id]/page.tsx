"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import DashboardNav from "../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../nav-links";
import { MAISON_LINKS } from "../../../business/nav-links";
import { MapPin, ArrowLeft, GlobeSimple, X, CheckCircle } from "@/components/member/iconos";
import { useRouter } from "next/navigation";
import { pickLang } from "@/lib/i18n/pick-lang";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT, canBypassLaunchGate } from "@/lib/launch";
import { parisParts, AvailWindow } from "@/lib/availability";
import { Row } from "@/components/member/row";
import { ButtonLink } from "@/components/member/button";
import { Gallery } from "@/components/member/gallery";
import { Viewer } from "@/components/member/viewer";
import { Carta } from "@/components/member/carta";

type MaisonService = { name: string; description: string; price: string };
type MaisonAvail = {
  agenda?: { modo: "horaires" | "dates"; llegadas: number[]; minNoches: number; maxNoches: number };
  availability: AvailWindow[];
  blocked: { date: string }[];
  taken: string[];
  services: MaisonService[];
  menuUrls?: string[];
  offerEur?: number | null;
  note?: string | null;
};

// La oferta de la casa en su ficha. Solo se veía en la pantalla de reserva, así
// que nadie sabía qué ofrecía una casa antes de empezar a pedir mesa.
const OFERTA = {
  fr: { title: "L'offre", perVisit: "par visite", spend: "À dépenser librement sur la carte.", menu: "Menu / brochure", note: "Infos pratiques" },
  en: { title: "The offer", perVisit: "per visit", spend: "To spend freely on the menu.", menu: "Menu / brochure", note: "Practical info" },
  es: { title: "La oferta", perVisit: "por visita", spend: "Para gastar libremente en la carta.", menu: "Carta / folleto", note: "Información práctica" },
};

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
  category_id: string | null;
};

// Category label keys live in the `dashboard` translation section.
const SLUG_LABEL_KEY = {
  gastronomia: "catGastronomy",
  hoteles: "catHotels",
  wellness: "catWellness",
  belleza: "catBeauty",
} as const;

// Canonical category UUIDs (migration 009) → slug + credit cost. The label is
// resolved per-language from the slug.
// Solo la categoría y si se cuenta por noches. El coste ya no vive aquí: lo
// pone cada maison en sus servicios, en euros, que es lo que el creador recibe.
const CATEGORY: Record<string, { slug: keyof typeof SLUG_LABEL_KEY; unit: string }> = {
  "00000000-0000-0000-0000-0000000ca701": { slug: "hoteles", unit: "night" },
  "00000000-0000-0000-0000-0000000ca702": { slug: "gastronomia", unit: "booking" },
  "00000000-0000-0000-0000-0000000ca703": { slug: "wellness", unit: "booking" },
  "00000000-0000-0000-0000-0000000ca704": { slug: "belleza", unit: "booking" },
};

const APERCU: Record<Lang, { volver: string; nota: string }> = {
  fr: { volver: "Ma maison", nota: "Aperçu : votre fiche telle que la voit un storyteller. Les modifications se font dans Ma maison." },
  en: { volver: "My house", nota: "Preview: your page as a storyteller sees it. Make changes in My house." },
  es: { volver: "Mi casa", nota: "Vista previa: tu ficha tal como la ve un storyteller. Los cambios se hacen en Mi casa." },
};

export default function MaisonProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [loading, setLoading] = useState(true);
  const [oferta, setOferta] = useState<{ services: MaisonService[]; menuUrls: string[]; eur: number | null; note: string | null } | null>(null);
  const [horario, setHorario] = useState<Pick<MaisonAvail, "agenda" | "availability"> | null>(null);

  const router = useRouter();
  const [preview, setPreview] = useState(false);
  // ?apercu=1: la casa mirando su propia ficha (Ma maison → Aperçu). Se ve
  // igual que la ve un storyteller, aunque aún no esté publicada, y sin poder
  // reservar.
  const [apercu, setApercu] = useState(false);
  const [visor, setVisor] = useState<number | null>(null);

  // A "?slot=" param (from a proposed-créneaux email) pre-fills + opens the form.
  // "?preview=1" and the native app both bypass the pre-launch gate.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setPreview(canBypassLaunchGate() || sp.get("apercu") === "1");
    setApercu(sp.get("apercu") === "1");
    // Un "?slot=" viene de un correo con créneaux propuestos: ahora lleva
    // directo a la pantalla de reserva con ese día ya elegido.
    const slot = sp.get("slot");
    if (slot) router.replace(`/dashboard/storyteller/maison/${id}/reserver?slot=${encodeURIComponent(slot)}`);
  }, [id, router]);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // En vista previa, también una casa sin publicar: la política de
      // comercios deja a la dueña leer la suya (owner_id = auth.uid()).
      const enVistaPrevia = new URLSearchParams(window.location.search).get("apercu") === "1";
      let consulta = supabase
        .from("comercios")
        .select("id, name, arrondissement, address, description, description_en, description_es, photos, website_url, category_id")
        .eq("id", id);
      if (!enVistaPrevia) consulta = consulta.eq("is_reservable", true);
      const { data } = await consulta.maybeSingle();
      setMaison((data as Maison) ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    fetch(`/api/maison/${id}/availability`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MaisonAvail | null) => {
        if (!d) return;
        setOferta({ services: (d.services ?? []).filter((s) => s.name?.trim()), menuUrls: d.menuUrls ?? [], eur: d.offerEur ?? null, note: d.note ?? null });
        setHorario({ agenda: d.agenda, availability: d.availability ?? [] });
      })
      .catch(() => {});
  }, [id]);


  const { lang } = useLang();
  const td = translations[lang].dashboard;
  const t = translations[lang].maison;
  const cat = maison?.category_id ? CATEGORY[maison.category_id] : null;
  const catLabelText = cat ? td[SLUG_LABEL_KEY[cat.slug]] : "";
  // La descripción en su idioma; si no, en el que la casa la tenga.
  const desc = maison
    ? pickLang({ fr: maison.description, en: maison.description_en, es: maison.description_es }, lang) || null
    : null;
  const gated = isBeforeLaunch() && !preview;
  const launchDateLabel = LAUNCH_AT?.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  return (
    <div className="min-h-[100dvh] bg-surface">
      {/* Nav */}
      {apercu ? (
        <DashboardNav
          eyebrow="Maison"
          links={MAISON_LINKS(translations[lang].business, "profile")}
          settingsHref="/dashboard/business/reglages"
          settingsLabel={td.navSettings}
        />
      ) : (
        <DashboardNav
          links={STORYTELLER_LINKS(td, "addresses")}
          settingsHref="/dashboard/storyteller/reglages"
          settingsLabel={td.navSettings}
        />
      )}

      <div className="max-w-[1000px] mx-auto px-pagina py-10">
        {apercu ? (
          <div className="mb-8">
            <Link href="/dashboard/business" className="inline-flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-secondary transition-colors hover:text-accent">
              <ArrowLeft size={14} />
              {APERCU[lang].volver}
            </Link>
            <p className="caja-cristal mt-fila px-5 py-4 text-legende text-text-secondary">{APERCU[lang].nota}</p>
          </div>
        ) : (
          <Link href="/dashboard/storyteller" className="inline-flex items-center gap-2 font-serif text-capitale tracking-[0.2em] uppercase text-text-secondary hover:text-accent transition-colors mb-8">
            <ArrowLeft size={14} />
            {t.backToAll}
          </Link>
        )}

        {gated ? (
          <div className="py-respiro text-center">
            <p className="font-serif text-capitale tracking-[0.4em] uppercase text-accent mb-6">
              {td.comingSoonKicker}
            </p>
            <h2 className="font-serif text-grande md:text-cifra font-light tracking-[0.1em] text-text-primary mb-6">
              {td.comingSoonTitle}
            </h2>
            <p className="font-serif text-corps md:text-corps font-light text-text-secondary leading-relaxed max-w-[440px] mx-auto px-6">
              {launchDateLabel
                ? td.comingSoonBody.replace("{date}", launchDateLabel)
                : td.comingSoonBodyNoDate}
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            <div className="aspect-[4/5] bg-border animate-pulse [animation-duration:1.6s] sm:aspect-[16/9]" />
            <div className="h-6 bg-border animate-pulse w-1/3" />
          </div>
        ) : !maison ? (
          <div className="py-respiro text-center">
            <p className="font-serif text-corps font-light text-text-secondary">{t.notFound}</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            {/* Todas las fotografías, no solo la primera. Las demás estaban
                cargadas y no se veían nunca. */}
            <div className="mb-rango">
              {maison.photos && maison.photos.length > 0 ? (
                <Gallery
                  photos={maison.photos}
                  alt={maison.name}
                  aspect="aspect-[4/5] sm:aspect-[16/9]"
                  onOpen={setVisor}
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-surface-raised sm:aspect-[16/9]">
                  <p className="text-capitale uppercase tracking-capitale text-text-muted">{catLabelText}</p>
                </div>
              )}
            </div>

            <Viewer
              photos={maison.photos ?? []}
              index={visor}
              onClose={() => setVisor(null)}
              caption={maison.name}
            />

            <div className="grid md:grid-cols-3 gap-10">
              {/* Left: info */}
              <div className="md:col-span-2">
                {cat && (
                  <span className="font-serif text-capitale tracking-[0.3em] uppercase text-accent">
                    {catLabelText}
                  </span>
                )}
                <h1 className="font-titulo text-cifra font-light text-text-primary leading-tight mt-2 mb-1">
                  {maison.name}
                </h1>
                {maison.arrondissement && (
                  <p className="font-serif text-legende text-text-secondary tracking-wide mb-6">Paris {maison.arrondissement}</p>
                )}

                {desc && (
                  <p className="font-serif text-corps font-light text-text-secondary leading-relaxed mb-8">
                    {desc}
                  </p>
                )}

                {oferta && (oferta.eur || oferta.menuUrls.length > 0) && (
                  <div className="mb-8">
                    <p className="font-serif text-capitale tracking-[0.25em] uppercase text-accent mb-3">{OFERTA[lang].title}</p>
                    {/* El importe que la casa ofrece. La lista de servicios con
                        precio de antes ya no se enseña: no es lo que se gasta. */}
                    {oferta.eur ? (
                      // El importe y «par visite» juntos, y debajo en qué se
                      // gasta (revisión de diseño, 2026-10-20).
                      <div>
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-titre tabular-nums text-text-primary">{oferta.eur.toLocaleString(lang)} €</span>
                          <span className="text-corps text-text-primary">{OFERTA[lang].perVisit}</span>
                        </p>
                        <p className="mt-etiqueta text-corps text-text-secondary">{OFERTA[lang].spend}</p>
                      </div>
                    ) : null}
                    {oferta.menuUrls.length > 0 && (
                      <div className="mt-fila">
                        <p className="text-capitale uppercase tracking-capitale text-text-secondary">{OFERTA[lang].menu}</p>
                        <div className="mt-bloque">
                          <Carta urls={oferta.menuUrls} lang={lang} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {oferta?.note && (
                  <div className="mb-8">
                    <p className="mb-3 text-capitale uppercase tracking-capitale text-accent">{OFERTA[lang].note}</p>
                    <p className="whitespace-pre-line text-corps text-text-secondary">{oferta.note}</p>
                  </div>
                )}

                {/* Cuándo se puede ir: antes solo se veía al pedir la visita. */}
                {horario && <Horarios horario={horario} lang={lang} />}

                {/* Map */}
                {maison.address && (
                  <div className="mb-8">
                    <p className="font-serif text-capitale tracking-[0.25em] uppercase text-accent mb-3">{t.location}</p>
                    <div className="h-[180px] overflow-hidden">
                      <iframe
                        title={t.location}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(maison.address)}&z=15&output=embed`}
                        className="w-full h-full"
                        style={{ border: 0, filter: "grayscale(0.4) contrast(0.9)" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div className="md:col-span-1">
                <div className="sticky top-20 space-y-fila">
                  {maison.address && (
                    <Row
                      label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.location}</span>}
                      aside={<span className="text-legende text-text-primary">{maison.address}</span>}
                    />
                  )}
                  {maison.website_url && (
                    <Row
                      label={
                        <a
                          href={maison.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-legende text-accent transition-colors hover:text-text-primary"
                        >
                          {maison.website_url.replace(/^https?:\/\//, "")}
                        </a>
                      }
                    />
                  )}

                  {apercu ? (
                    // En la vista previa el botón se ve, pero no reserva.
                    <span className="boton-cristal pointer-events-none w-full opacity-60">{t.requestReservation}</span>
                  ) : (
                    <ButtonLink href={`/dashboard/storyteller/maison/${maison.id}/reserver`} full>
                      {t.requestReservation}
                    </ButtonLink>
                  )}
                  <p className="text-center text-legende text-text-muted">{t.willBeConfirmed}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

const HORARIOS: Record<Lang, { titulo: string; cerrado: string; llegadas: string; noches: (a: number, b: number) => string; dias: string[] }> = {
  fr: {
    titulo: "Horaires",
    cerrado: "Fermé",
    llegadas: "Arrivées possibles",
    noches: (a, b) => (a === b ? `${a} nuit${a > 1 ? "s" : ""}` : `De ${a} à ${b} nuits`),
    dias: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  },
  en: {
    titulo: "Opening hours",
    cerrado: "Closed",
    llegadas: "Possible arrivals",
    noches: (a, b) => (a === b ? `${a} night${a > 1 ? "s" : ""}` : `${a} to ${b} nights`),
    dias: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  es: {
    titulo: "Horarios",
    cerrado: "Cerrado",
    llegadas: "Llegadas posibles",
    noches: (a, b) => (a === b ? `${a} noche${a > 1 ? "s" : ""}` : `De ${a} a ${b} noches`),
    dias: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  },
};
// La semana empieza el lunes.
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

/** Los horarios de la casa: cada día con sus franjas, o, un hotel, sus llegadas y noches. */
function Horarios({ horario, lang }: { horario: Pick<MaisonAvail, "agenda" | "availability">; lang: Lang }) {
  const t = HORARIOS[lang] ?? HORARIOS.fr;
  const fila = "flex items-baseline justify-between gap-fila border-b border-border py-bloque last:border-0";
  if (horario.agenda?.modo === "dates") {
    const a = horario.agenda;
    return (
      <div className="mb-8">
        <p className="mb-3 font-serif text-capitale uppercase tracking-[0.25em] text-accent">{t.titulo}</p>
        <div className={fila}>
          <span className="text-legende text-text-secondary">{t.llegadas}</span>
          <span className="text-right text-legende text-text-primary">{ORDEN.filter((d) => a.llegadas.includes(d)).map((d) => t.dias[d]).join(", ")}</span>
        </div>
        <div className={fila}>
          <span className="text-legende text-text-secondary">{t.noches(a.minNoches, a.maxNoches)}</span>
        </div>
      </div>
    );
  }
  if (horario.availability.length === 0) return null;
  return (
    <div className="mb-8">
      <p className="mb-3 font-serif text-capitale uppercase tracking-[0.25em] text-accent">{t.titulo}</p>
      {ORDEN.map((d) => {
        const franjas = horario.availability
          .filter((w) => w.day === d)
          .sort((x, y) => x.start.localeCompare(y.start))
          .map((w) => `${w.start}–${w.end}`);
        return (
          <div key={d} className={fila}>
            <span className="text-legende text-text-secondary">{t.dias[d]}</span>
            <span className={`text-right text-legende tabular-nums ${franjas.length ? "text-text-primary" : "text-text-muted"}`}>
              {franjas.length ? franjas.join(" · ") : t.cerrado}
            </span>
          </div>
        );
      })}
    </div>
  );
}

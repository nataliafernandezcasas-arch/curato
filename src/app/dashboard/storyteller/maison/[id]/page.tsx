"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import DashboardNav from "../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../nav-links";
import { MapPin, ArrowLeft, GlobeSimple, X, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { isBeforeLaunch, LAUNCH_AT, canBypassLaunchGate } from "@/lib/launch";
import { parisParts, AvailWindow } from "@/lib/availability";
import { Row } from "@/components/member/row";
import { ButtonLink } from "@/components/member/button";
import { Gallery } from "@/components/member/gallery";
import { Viewer } from "@/components/member/viewer";

type MaisonService = { name: string; description: string; price: string };
type MaisonAvail = {
  availability: AvailWindow[];
  blocked: { date: string }[];
  taken: string[];
  services: MaisonService[];
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

export default function MaisonProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const [visor, setVisor] = useState<number | null>(null);

  // A "?slot=" param (from a proposed-créneaux email) pre-fills + opens the form.
  // "?preview=1" and the native app both bypass the pre-launch gate.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setPreview(canBypassLaunchGate());
    // Un "?slot=" viene de un correo con créneaux propuestos: ahora lleva
    // directo a la pantalla de reserva con ese día ya elegido.
    const slot = sp.get("slot");
    if (slot) router.replace(`/dashboard/storyteller/maison/${id}/reserver?slot=${encodeURIComponent(slot)}`);
  }, [id, router]);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("comercios")
        .select("id, name, arrondissement, address, description, description_en, description_es, photos, website_url, category_id")
        .eq("id", id)
        .eq("is_reservable", true)
        .maybeSingle();
      setMaison((data as Maison) ?? null);
      setLoading(false);
    }
    load();
  }, [id]);


  const { lang } = useLang();
  const td = translations[lang].dashboard;
  const t = translations[lang].maison;
  const cat = maison?.category_id ? CATEGORY[maison.category_id] : null;
  const catLabelText = cat ? td[SLUG_LABEL_KEY[cat.slug]] : "";
  // Description in the storyteller's language, falling back to French.
  const desc = maison
    ? (lang === "en" ? maison.description_en : lang === "es" ? maison.description_es : null) || maison.description
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
      <DashboardNav
        links={STORYTELLER_LINKS(td, "addresses")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />

      <div className="max-w-[1000px] mx-auto px-5 py-10">
        <Link href="/dashboard/storyteller" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.2em] uppercase text-text-secondary hover:text-accent transition-colors mb-8">
          <ArrowLeft size={14} />
          {t.backToAll}
        </Link>

        {gated ? (
          <div className="py-respiro text-center">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-accent mb-6">
              {td.comingSoonKicker}
            </p>
            <h2 className="font-serif text-[26px] md:text-[34px] font-light tracking-[0.1em] text-text-primary mb-6">
              {td.comingSoonTitle}
            </h2>
            <p className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-relaxed max-w-[440px] mx-auto px-6">
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
            <p className="font-serif text-[15px] font-light text-text-secondary">{t.notFound}</p>
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
              {/* En claro, lo que se lee va sobre vidrio: la acuarela solo toca
                  aire y fotografías. El nombre de una casa toma brume, el rol
                  de lo que es un lugar. */}
              <div className="md:col-span-2 claro:vidrio claro:p-[26px]">
                {cat && (
                  <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-accent">
                    {catLabelText}
                  </span>
                )}
                <h1 className="font-serif text-[34px] font-light text-text-primary leading-tight mt-2 mb-1 claro:text-brume">
                  {maison.name}
                </h1>
                {maison.arrondissement && (
                  <p className="font-serif text-[13px] text-text-secondary tracking-wide mb-6">Paris {maison.arrondissement}</p>
                )}

                {desc && (
                  <p className="font-serif text-[15px] font-light text-text-secondary leading-relaxed mb-8">
                    {desc}
                  </p>
                )}

                {/* Map */}
                {maison.address && (
                  <div className="mb-8">
                    <p className="font-serif text-[11px] tracking-[0.25em] uppercase text-accent mb-3">{t.location}</p>
                    <div className="h-[180px] overflow-hidden">
                      <iframe
                        title="map"
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
                <div className="sticky top-20 space-y-fila claro:vidrio claro:p-[26px]">
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

                  <ButtonLink href={`/dashboard/storyteller/maison/${maison.id}/reserver`} full>
                    {t.requestReservation}
                  </ButtonLink>
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

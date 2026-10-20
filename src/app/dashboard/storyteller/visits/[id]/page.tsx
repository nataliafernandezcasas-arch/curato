"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "@/components/member/iconos";
import DashboardNav from "../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../nav-links";
import { Gallery } from "@/components/member/gallery";
import { Viewer } from "@/components/member/viewer";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { PullToRefresh } from "@/components/member/pull-to-refresh";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/pick-lang";
import { CALENDARIO, PanelVisita, type Visit } from "../visita";

const TEXTOS: Record<
  Lang,
  {
    back: string;
    booking: string;
    date: string;
    time: string;
    party: string;
    nights: (n: number) => string;
    nightsLabel: string;
    note: string;
    house: string;
    visit: string;
    notFound: string;
  }
> = {
  fr: {
    back: "Mes visites",
    booking: "Votre réservation",
    date: "Date",
    time: "Heure",
    party: "Personnes",
    nights: (n) => (n > 1 ? `${n} nuits` : "1 nuit"),
    nightsLabel: "Séjour",
    note: "Votre message à la maison",
    house: "Voir la fiche de la maison",
    visit: "Votre visite",
    notFound: "Cette visite est introuvable.",
  },
  en: {
    back: "My visits",
    booking: "Your booking",
    date: "Date",
    time: "Time",
    party: "Guests",
    nights: (n) => (n > 1 ? `${n} nights` : "1 night"),
    nightsLabel: "Stay",
    note: "Your message to the house",
    house: "See the house's page",
    visit: "Your visit",
    notFound: "This visit can't be found.",
  },
  es: {
    back: "Mis visitas",
    booking: "Tu reserva",
    date: "Fecha",
    time: "Hora",
    party: "Personas",
    nights: (n) => (n > 1 ? `${n} noches` : "1 noche"),
    nightsLabel: "Estancia",
    note: "Tu mensaje a la casa",
    house: "Ver la ficha de la casa",
    visit: "Tu visita",
    notFound: "No se encuentra esta visita.",
  },
};

/**
 * Una visita entera, como la ficha de una casa (Natalia, 2026-10-17): sus
 * fotos, la descripción, lo que se reservó (día, hora, personas, el mensaje
 * escrito al pedirla) y, debajo, lo que toca hacer: el código, subir las
 * fotos y, al día siguiente, las cifras de las stories.
 */
export default function PaginaVisita({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLang();
  const t = translations[lang].visits;
  const td = translations[lang].dashboard;
  const tx = TEXTOS[lang] ?? TEXTOS.fr;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [visor, setVisor] = useState<number | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/reservations/visit", { cache: "no-store" });
      const data = await res.json();
      setVisit(((data.visits ?? []) as Visit[]).find((v) => v.id === id) ?? null);
    } catch {
      setVisit(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const casa = visit?.casa ?? null;
  const fotos = casa?.photos ?? [];
  const desc = casa ? pickLang({ fr: casa.description, en: casa.description_en, es: casa.description_es }, lang) : "";
  const cuando = visit ? new Date(visit.slotStart) : null;

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(td, "visits")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />

      <PullToRefresh onRefresh={load}>
        <div className="mx-auto max-w-[920px] px-pagina py-seccion">
          <Link
            href="/dashboard/storyteller/visits"
            className="mb-rango inline-flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-secondary transition-colors hover:text-accent"
          >
            <ArrowLeft size={14} />
            {tx.back}
          </Link>

          {loading ? (
            <div className="space-y-6">
              <div className="aspect-[4/5] animate-pulse bg-border [animation-duration:1.6s] sm:aspect-[16/9]" />
              <div className="h-6 w-1/3 animate-pulse bg-border" />
            </div>
          ) : !visit || !cuando ? (
            <p className="py-respiro text-center text-corps text-text-secondary">{tx.notFound}</p>
          ) : (
            <>
              {fotos.length > 0 && (
                <div className="mb-rango">
                  <Gallery photos={fotos} alt={visit.maison} aspect="aspect-[4/5] sm:aspect-[16/9]" onOpen={setVisor} />
                  <Viewer photos={fotos} index={visor} onClose={() => setVisor(null)} caption={visit.maison} />
                </div>
              )}

              <h1 className="font-titulo text-cifra font-light leading-tight text-text-primary">{visit.maison}</h1>
              {casa?.arrondissement && <p className="mt-etiqueta text-legende text-text-secondary">Paris {casa.arrondissement}</p>}
              {casa?.address && (
                <p className="mt-bloque flex items-start gap-2 text-legende text-text-secondary">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  {casa.address}
                </p>
              )}
              {desc && <p className="mt-fila text-corps leading-relaxed text-text-secondary">{desc}</p>}
              {casa && (
                <Link
                  href={`/dashboard/storyteller/maison/${casa.id}`}
                  className="mt-bloque inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4"
                >
                  {tx.house}
                </Link>
              )}

              <Section title={tx.booking} className="mt-seccion">
                <Row
                  label={<span className="text-corps text-text-secondary">{tx.date}</span>}
                  value={
                    <span className="text-corps text-text-primary first-letter:uppercase">
                      {cuando.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
                    </span>
                  }
                />
                <Row
                  label={<span className="text-corps text-text-secondary">{tx.time}</span>}
                  value={
                    <span className="text-corps text-text-primary">
                      {cuando.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                    </span>
                  }
                />
                <Row
                  label={<span className="text-corps text-text-secondary">{tx.party}</span>}
                  value={<span className="text-corps text-text-primary">{CALENDARIO[lang].party(visit.partySize ?? 1)}</span>}
                />
                {visit.nights ? (
                  <Row
                    label={<span className="text-corps text-text-secondary">{tx.nightsLabel}</span>}
                    value={<span className="text-corps text-text-primary">{tx.nights(visit.nights)}</span>}
                  />
                ) : null}
                {visit.note && (
                  <div className="mt-fila">
                    <p className="text-capitale uppercase tracking-capitale text-text-secondary">{tx.note}</p>
                    <p className="mt-bloque whitespace-pre-line text-corps text-text-primary">{visit.note}</p>
                  </div>
                )}
              </Section>

              <Section title={tx.visit} className="mt-seccion">
                <PanelVisita visit={visit} t={t} lang={lang} onChanged={load} />
              </Section>
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}

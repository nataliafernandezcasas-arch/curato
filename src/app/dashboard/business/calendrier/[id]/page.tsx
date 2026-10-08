"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import type { Dossier } from "@/lib/storyteller-dossier";
import DashboardNav from "../../../dashboard-nav";
import { MAISON_LINKS } from "../../nav-links";
import { Rise } from "@/components/member/motion";
import { ButtonLink } from "@/components/member/button";
import { DossierInline } from "../../storyteller-dossier";
import { EnlacesDeCalendario } from "../enlaces";

type Visita = {
  id: string;
  storyteller: string;
  slotStart: string;
  nights: number | null;
  partySize: number;
  note: string | null;
  arrived: boolean;
  today: boolean;
  calendar: { google: string; ics: string };
};

const TEXTOS: Record<
  Lang,
  {
    back: string;
    kicker: string;
    party: (n: number) => string;
    nights: (n: number) => string;
    arrived: string;
    scan: string;
    scanNote: string;
    notYet: string;
    profile: string;
    error: string;
  }
> = {
  fr: {
    back: "Calendrier",
    kicker: "La visite",
    party: (n) => (n > 1 ? `${n} personnes` : "1 personne"),
    nights: (n) => (n > 1 ? `${n} nuits` : "1 nuit"),
    arrived: "Arrivée enregistrée",
    scan: "Scanner son code",
    scanNote: "À son arrivée, scannez le code qu'il vous montre : la visite est alors enregistrée.",
    notYet: "Le jour de la visite, vous scannerez ici le code du storyteller pour enregistrer son arrivée.",
    profile: "Son profil",
    error: "Cette visite ne s'est pas chargée. Réessayez dans un instant.",
  },
  en: {
    back: "Calendar",
    kicker: "The visit",
    party: (n) => (n > 1 ? `${n} people` : "1 person"),
    nights: (n) => (n > 1 ? `${n} nights` : "1 night"),
    arrived: "Arrival recorded",
    scan: "Scan their code",
    scanNote: "When they arrive, scan the code they show you: that records the visit.",
    notYet: "On the day of the visit, you'll scan the storyteller's code here to record their arrival.",
    profile: "Their profile",
    error: "This visit didn't load. Try again in a moment.",
  },
  es: {
    back: "Calendario",
    kicker: "La visita",
    party: (n) => (n > 1 ? `${n} personas` : "1 persona"),
    nights: (n) => (n > 1 ? `${n} noches` : "1 noche"),
    arrived: "Llegada registrada",
    scan: "Escanear su código",
    scanNote: "Cuando llegue, escanea el código que te enseña: así queda registrada la visita.",
    notYet: "El día de la visita escanearás aquí el código del storyteller para registrar su llegada.",
    profile: "Su perfil",
    error: "Esta visita no se cargó. Vuelve a intentarlo en un momento.",
  },
};

/**
 * Una visita del calendario: cuándo, cuántos, y el perfil entero de quien
 * viene. El día de la visita, desde aquí se escanea su código: el escáner ya
 * no vive en el menú, vive donde está la visita.
 */
export default function VisitaDeLaCasa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const tb = translations[lang].business;
  const td = translations[lang].dashboard;
  const [datos, setDatos] = useState<{ visita: Visita; dossier: Dossier | null } | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    fetch(`/api/maison/calendrier/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setFallo(true));
  }, [id]);

  const v = datos?.visita;
  const fecha = v
    ? new Date(v.slotStart).toLocaleDateString(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Paris",
      })
    : "";
  const hora = v
    ? new Date(v.slotStart).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : "";

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        eyebrow="Maison"
        links={MAISON_LINKS(tb, "calendrier")}
        settingsHref="/dashboard/business/reglages"
        settingsLabel={td.navSettings}
        maxWidth="1100px"
      />

      <div className="mx-auto max-w-[560px] px-pagina py-seccion">
        <Link
          href="/dashboard/business/calendrier"
          className="inline-flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft size={14} />
          {t.back}
        </Link>

        {fallo ? (
          <p className="mt-rango text-corps text-text-secondary">{t.error}</p>
        ) : !v ? (
          <div aria-hidden className="mt-rango space-y-fila">
            <div className="h-40 animate-pulse rounded-[16px] bg-surface-raised [animation-duration:1.6s]" />
            <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-surface-raised [animation-duration:1.6s]" />
          </div>
        ) : (
          <>
            <Rise>
              <div className="caja-cristal mt-rango p-5 sm:p-6">
                <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
                <h1 className="mt-bloque text-sous-titre text-text-primary">{v.storyteller}</h1>
                <p className="mt-bloque text-corps first-letter:uppercase text-text-primary">
                  {fecha} · <span className="tabular-nums">{hora}</span>
                </p>
                <p className="text-legende text-text-secondary">
                  {t.party(v.partySize)}
                  {v.nights ? ` · ${t.nights(v.nights)}` : ""}
                </p>
                {v.note && <p className="mt-bloque text-legende italic text-text-secondary">« {v.note} »</p>}

                <div className="mt-rango">
                  {v.arrived ? (
                    <p className="text-capitale uppercase tracking-capitale text-sauge-vif">{t.arrived}</p>
                  ) : v.today ? (
                    <>
                      <ButtonLink href={`/dashboard/business/qr?visite=${v.id}`}>{t.scan}</ButtonLink>
                      <p className="mt-fila max-w-[42ch] text-legende text-text-secondary">{t.scanNote}</p>
                    </>
                  ) : (
                    <p className="max-w-[42ch] text-legende text-text-secondary">{t.notYet}</p>
                  )}
                </div>

                <EnlacesDeCalendario calendar={v.calendar} lang={lang} className="mt-fila" />
              </div>
            </Rise>

            {datos?.dossier && (
              <Rise index={1} className="mt-seccion">
                <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{t.profile}</p>
                <DossierInline dossier={datos.dossier} lang={lang} />
              </Rise>
            )}
          </>
        )}
      </div>
    </div>
  );
}

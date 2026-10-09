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
import { Button, ButtonLink } from "@/components/member/button";
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
  noShow?: boolean;
  canNoShow?: boolean;
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
    noShow: string;
    noShowNote: string;
    noShowConfirm: string;
    noShowKeep: string;
    noShowDone: string;
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
    noShow: "Il n'est pas venu",
    noShowNote: "Le storyteller perd le crédit de la visite et Curato est prévenu. Signalez-le seulement s'il n'est pas venu du tout.",
    noShowConfirm: "Oui, il n'est pas venu",
    noShowKeep: "Annuler",
    noShowDone: "Absence signalée. Curato est prévenu.",
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
    noShow: "They didn't come",
    noShowNote: "The storyteller loses the credit for the visit and Curato is told. Only report it if they didn't come at all.",
    noShowConfirm: "Yes, they didn't come",
    noShowKeep: "Cancel",
    noShowDone: "Absence reported. Curato has been told.",
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
    noShow: "No vino",
    noShowNote: "El storyteller pierde el crédito de la visita y Curato queda avisado. Márcalo solo si no vino en absoluto.",
    noShowConfirm: "Sí, no vino",
    noShowKeep: "Cancelar",
    noShowDone: "Ausencia registrada. Curato está avisado.",
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
  const [marcando, setMarcando] = useState<"no" | "preguntar" | "enviando">("no");
  const [errorNoShow, setErrorNoShow] = useState(false);

  // La casa dice que no vino. Se pregunta antes: tiene consecuencias.
  async function marcarNoShow() {
    setMarcando("enviando");
    setErrorNoShow(false);
    const res = await fetch("/api/maison/no-show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (res?.ok) {
      setDatos((d) => (d ? { ...d, visita: { ...d.visita, noShow: true, canNoShow: false } } : d));
      setMarcando("no");
    } else {
      setErrorNoShow(true);
      setMarcando("preguntar");
    }
  }

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
                  {v.noShow ? (
                    <p className="text-capitale uppercase tracking-capitale text-copper-vif">{t.noShowDone}</p>
                  ) : v.arrived ? (
                    <p className="text-capitale uppercase tracking-capitale text-sauge-vif">{t.arrived}</p>
                  ) : v.today && !v.canNoShow ? (
                    <>
                      <ButtonLink href={`/dashboard/business/qr?visite=${v.id}`}>{t.scan}</ButtonLink>
                      <p className="mt-fila max-w-[42ch] text-legende text-text-secondary">{t.scanNote}</p>
                    </>
                  ) : v.canNoShow ? null : (
                    <p className="max-w-[42ch] text-legende text-text-secondary">{t.notYet}</p>
                  )}

                  {/* Pasada media hora sin llegada: escanear (por si llega tarde)
                      o decir que no vino. */}
                  {v.canNoShow && !v.noShow && (
                    <div className="flex flex-col items-start gap-fila">
                      {v.today && <ButtonLink href={`/dashboard/business/qr?visite=${v.id}`}>{t.scan}</ButtonLink>}
                      {marcando === "no" ? (
                        <button
                          type="button"
                          onClick={() => setMarcando("preguntar")}
                          className="min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-copper-vif"
                        >
                          {t.noShow}
                        </button>
                      ) : (
                        <div>
                          <p className="max-w-[42ch] text-legende text-text-primary">{t.noShowNote}</p>
                          <div className="mt-fila flex flex-wrap items-center gap-fila">
                            <Button onClick={marcarNoShow} disabled={marcando === "enviando"}>
                              {t.noShowConfirm}
                            </Button>
                            <button
                              type="button"
                              onClick={() => setMarcando("no")}
                              disabled={marcando === "enviando"}
                              className="min-h-11 text-capitale uppercase tracking-capitale text-text-secondary hover:text-text-primary"
                            >
                              {t.noShowKeep}
                            </button>
                          </div>
                          {errorNoShow && <p className="mt-fila text-legende text-copper-vif">{t.error}</p>}
                        </div>
                      )}
                    </div>
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

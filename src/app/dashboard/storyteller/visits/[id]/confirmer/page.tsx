"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../../nav-links";
import { Rise } from "@/components/member/motion";
import { Button } from "@/components/member/button";
import { TarjetaCasa, type CasaTarjeta } from "@/components/member/tarjeta-casa";

type Datos = {
  casa: CasaTarjeta | null;
  slotStart: string;
  partySize: number;
  status: string;
  cost: number;
  confirmed: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  lateIfCancel: boolean;
};

const TEXTOS: Record<
  Lang,
  {
    back: string;
    kicker: string;
    party: (n: number) => string;
    cost: (n: number) => string;
    rulesTitle: string;
    rules: string[];
    come: string;
    coming: string;
    cancel: string;
    cancelFree: string;
    cancelLate: (n: number) => string;
    cancelConfirm: string;
    keep: string;
    cancelled: string;
    cancelledLate: string;
    error: string;
    gone: string;
  }
> = {
  fr: {
    back: "Mes visites",
    kicker: "Votre visite",
    party: (n) => (n > 1 ? `${n} personnes` : "1 personne"),
    cost: (n) => `${n} € de crédit`,
    rulesTitle: "Avant de confirmer",
    rules: [
      "En cas d'absence (no show), ou d'annulation moins de 24 heures avant la visite, le crédit de la visite est perdu.",
      "Une absence sans prévenir peut entraîner la suspension de votre accès à Curato.",
    ],
    come: "Je viens",
    coming: "Votre venue est confirmée. La maison vous attend.",
    cancel: "Annuler la visite",
    cancelFree: "Vous annulez plus de 24 heures avant : le crédit vous est rendu.",
    cancelLate: (n) => `Vous annulez moins de 24 heures avant : les ${n} € de crédit de cette visite sont perdus.`,
    cancelConfirm: "Confirmer l'annulation",
    keep: "Garder ma visite",
    cancelled: "Visite annulée. La maison est prévenue et votre crédit vous est rendu.",
    cancelledLate: "Visite annulée. La maison est prévenue. Le crédit de cette visite est perdu.",
    error: "Cela n'a pas abouti. Réessayez dans un instant.",
    gone: "Cette visite ne peut plus être confirmée ni annulée.",
  },
  en: {
    back: "My visits",
    kicker: "Your visit",
    party: (n) => (n > 1 ? `${n} people` : "1 person"),
    cost: (n) => `${n} € of credit`,
    rulesTitle: "Before you confirm",
    rules: [
      "If you don't show up, or cancel less than 24 hours before the visit, the credit for the visit is lost.",
      "Not showing up without notice may lead to your Curato access being suspended.",
    ],
    come: "I'm coming",
    coming: "Your visit is confirmed. The maison is expecting you.",
    cancel: "Cancel the visit",
    cancelFree: "You're cancelling more than 24 hours before: your credit is returned.",
    cancelLate: (n) => `You're cancelling less than 24 hours before: the ${n} € of credit for this visit is lost.`,
    cancelConfirm: "Confirm cancellation",
    keep: "Keep my visit",
    cancelled: "Visit cancelled. The maison has been told and your credit is returned.",
    cancelledLate: "Visit cancelled. The maison has been told. The credit for this visit is lost.",
    error: "That didn't go through. Try again in a moment.",
    gone: "This visit can no longer be confirmed or cancelled.",
  },
  es: {
    back: "Mis visitas",
    kicker: "Tu visita",
    party: (n) => (n > 1 ? `${n} personas` : "1 persona"),
    cost: (n) => `${n} € de crédito`,
    rulesTitle: "Antes de confirmar",
    rules: [
      "Si no te presentas (no show), o cancelas con menos de 24 horas de antelación, pierdes el crédito de la visita.",
      "No presentarse sin avisar puede suponer la suspensión de tu acceso a Curato.",
    ],
    come: "Voy",
    coming: "Tu visita está confirmada. La maison te espera.",
    cancel: "Cancelar la visita",
    cancelFree: "Cancelas con más de 24 horas: se te devuelve el crédito.",
    cancelLate: (n) => `Cancelas con menos de 24 horas: pierdes los ${n} € de crédito de esta visita.`,
    cancelConfirm: "Confirmar la cancelación",
    keep: "Mantener mi visita",
    cancelled: "Visita cancelada. La maison está avisada y se te devuelve el crédito.",
    cancelledLate: "Visita cancelada. La maison está avisada. Pierdes el crédito de esta visita.",
    error: "No se pudo. Vuelve a intentarlo en un momento.",
    gone: "Esta visita ya no se puede confirmar ni cancelar.",
  },
};

/**
 * Confirmar que se va, o cancelar (migración 046). Llega aquí desde el aviso
 * de 24 h antes, el recordatorio de 6 h y Mes visites. Las reglas del crédito
 * y de la suspensión se leen antes del botón, no después en un diálogo.
 */
export default function ConfirmarVisita({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ annuler?: string }>;
}) {
  const { id } = use(params);
  // Desde el botón «Annuler» de Mes visites se llega ya al paso de anular.
  const { annuler } = use(searchParams);
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const td = translations[lang].dashboard;
  const [datos, setDatos] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);
  const [paso, setPaso] = useState<"inicio" | "anular" | "anulada" | "anuladaTarde">(annuler ? "anular" : "inicio");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/asistencia?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setFallo(true));
  }, [id]);

  async function enviar(accion: "confirmar" | "cancelar") {
    setEnviando(true);
    setError(false);
    try {
      const res = await fetch("/api/reservations/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accion }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      if (accion === "confirmar") setDatos((x) => (x ? { ...x, confirmed: true } : x));
      else setPaso(d.late ? "anuladaTarde" : "anulada");
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  const fecha = datos
    ? new Date(datos.slotStart).toLocaleString(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })
    : "";

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(td, "visits")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />
      <div className="mx-auto max-w-[560px] px-pagina py-seccion">
        <Link
          href="/dashboard/storyteller/visits"
          className="inline-flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft size={14} />
          {t.back}
        </Link>

        {fallo ? (
          <p className="mt-rango text-corps text-text-secondary">{t.error}</p>
        ) : !datos ? (
          <div aria-hidden className="mt-rango aspect-[4/3] animate-pulse bg-surface-raised [animation-duration:1.6s]" />
        ) : (
          <Rise>
            <p className="mt-rango mb-fila text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
            {datos.casa && <TarjetaCasa casa={datos.casa} lang={lang} />}
            <p className="mt-fila text-corps text-text-primary first-letter:uppercase">{fecha}</p>
            <p className="text-legende text-text-secondary">
              {t.party(datos.partySize)}
            </p>
            {datos.cost ? <p className="mt-fila text-sous-titre tabular-nums text-accent">{t.cost(datos.cost)}</p> : null}

            {paso === "anulada" || paso === "anuladaTarde" ? (
              <p className="mt-rango text-corps text-text-primary">{paso === "anulada" ? t.cancelled : t.cancelledLate}</p>
            ) : !datos.canConfirm && !datos.canCancel ? (
              <p className="mt-rango text-corps text-text-secondary">{t.gone}</p>
            ) : (
              <>
                {/* Las reglas, antes del botón. */}
                <div className="caja-cristal mt-rango p-5">
                  <p className="text-capitale uppercase tracking-capitale text-copper-vif">{t.rulesTitle}</p>
                  {t.rules.map((regla) => (
                    <p key={regla} className="mt-bloque text-legende text-text-primary">
                      {regla}
                    </p>
                  ))}
                </div>

                {paso === "inicio" ? (
                  <div className="mt-rango flex flex-col items-start gap-fila">
                    {datos.canConfirm &&
                      (datos.confirmed ? (
                        <p className="text-corps text-sauge-vif">{t.coming}</p>
                      ) : (
                        <Button onClick={() => enviar("confirmar")} disabled={enviando} className="text-sauge-vif">
                          {t.come}
                        </Button>
                      ))}
                    {datos.canCancel && (
                      <Button onClick={() => setPaso("anular")} className="text-rouge-vif">
                        {t.cancel}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-rango">
                    <p className="text-corps text-text-primary">
                      {datos.lateIfCancel ? t.cancelLate(datos.cost) : t.cancelFree}
                    </p>
                    <div className="mt-fila flex flex-wrap items-center gap-fila">
                      <Button onClick={() => enviar("cancelar")} disabled={enviando} className="text-rouge-vif">
                        {t.cancelConfirm}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPaso("inicio")}
                        disabled={enviando}
                        className="min-h-11 text-capitale uppercase tracking-capitale text-sauge-vif hover:text-text-primary"
                      >
                        {t.keep}
                      </button>
                    </div>
                  </div>
                )}
                {error && <p className="mt-fila text-legende text-copper-vif">{t.error}</p>}
              </>
            )}
          </Rise>
        )}
      </div>
    </div>
  );
}

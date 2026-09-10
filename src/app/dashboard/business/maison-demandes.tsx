"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import type { Dossier } from "@/lib/storyteller-dossier";
import { Section } from "@/components/member/section";
import { Rise } from "@/components/member/motion";
import { Button, ButtonLink } from "@/components/member/button";
import { StateMark } from "@/components/member/state-mark";
import { DossierPane } from "./storyteller-dossier";
import { capitalizar, claveDia, compacto, dia, diaSemana, enLetra, haceCuanto, hora, nombrePila } from "./demandes-format";

type Demanda = {
  id: string;
  slotStart: string;
  partySize: number;
  nights: number | null;
  note: string | null;
  createdAt: string;
  /** La fecha pedida pasó sin respuesta: se cerró sola y no cuenta como rechazo. */
  expired: boolean;
  dossier: Dossier | null;
};

type Datos = {
  maison: string;
  requests: Demanda[];
  visits: number;
  guaranteed: number;
  /** Días abiertos de la casa, con getDay(): 0 es domingo. */
  openDays: number[];
};

type Resultado = { tipo: "acepta" | "rechaza"; demanda: Demanda };

const s = (n: number) => (n > 1 ? "s" : "");

// Los días en el orden de una semana francesa, de lunes a domingo.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const NOMBRES_DIAS: Record<Lang, string[]> = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
};

function unir(items: string[], y: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${y} ${items[items.length - 1]}`;
}

const TEXTOS = {
  fr: {
    title: ["Demandes", "de visite"],
    waiting: (n: number) =>
      n === 1 ? "Une personne attend votre réponse." : `${enLetra(n, "fr", true)} personnes attendent votre réponse.`,
    month: (v: number, g: number) =>
      v === 0
        ? `Aucune visite ce mois-ci sur les ${enLetra(g, "fr")} garanties.`
        : `${enLetra(v, "fr", true)} visite${s(v)} ce mois-ci sur les ${enLetra(g, "fr")} garanties.`,
    people: (n: number) => `${n} personne${s(n)}`,
    nights: (n: number) => `${n} nuit${s(n)}`,
    arrival: (d: string) => `Arrivée ${d.toLowerCase()}`,
    at: " à ",
    requested: (rel: string) => `Demandé ${rel}`,
    followers: (x: string) => `${x} abonnés`,
    reach: (x: string) => `${x} de portée`,
    igOff: "Instagram non connecté",
    club: (v: number, r: string | null) => `${v} visite${s(v)}${r ? ` · ${r} de portée moyenne` : ""}`,
    firstVisit: "Première visite dans le club",
    sameDay: (n: number, jour: string) => `${enLetra(n, "fr", true)} pour le même ${jour}`,
    sameDayText: (n: number): string =>
      n === 2 ? "Vous pouvez accepter les deux, ou l'une des deux." : "Vous pouvez en accepter une, plusieurs ou toutes.",
    expiredTitle: "Expirées",
    expired: (jour: string) =>
      `Le ${jour.toLowerCase()} est passé sans réponse. La demande s'est fermée toute seule. Elle ne compte pas comme un refus.`,
    accept: "Accepter la visite",
    decline: "Refuser",
    working: "Un instant…",
    // La consecuencia se lee antes de pulsar, no en un diálogo después.
    consequence: "Un refus compte comme une visite offerte : {done} sur {min} ce mois-ci.",
    consequenceLast:
      "Attention : un refus compte comme une visite offerte, et il ne vous en reste qu'une avant d'atteindre les {min} garanties.",
    acceptedCap: "Visite acceptée",
    accepted: (p: string, cuando: string) =>
      `Nous avons prévenu ${p}. ${cuando}. Sa visite apparaîtra dans Vos visiteurs une fois faite.`,
    declinedCap: "Demande refusée",
    declined: (p: string, v: number, g: number) =>
      `Nous écrivons à ${p}, sans donner de raison. ${enLetra(v, "fr", true)} visite${s(v)} offerte${s(v)} ce mois-ci sur ${enLetra(g, "fr")}.`,
    emptyTitle: "Rien en attente",
    emptyDays: (dias: string[]) =>
      dias.length === 7
        ? "Les storytellers voient vos créneaux tous les jours."
        : `Les storytellers voient vos créneaux ${unir(dias.map((d) => `du ${d}`), "et")}.`,
    emptyNoDays: "Vous n'avez pas encore ouvert de créneaux : les storytellers ne peuvent rien vous demander.",
    openMore: "Ouvrir d'autres créneaux",
    openFirst: "Ouvrir des créneaux",
    loadFailCap: "Chargement impossible",
    loadFail: "Aucune demande n'a été perdue : elles vous attendent. Réessayez dans un instant.",
    retry: "Réessayer",
    actionError: "Cette demande a déjà été traitée. Rechargez la page.",
    expiredNow: "Cette demande a expiré entre-temps. Elle ne compte pas comme un refus.",
  },
  en: {
    title: ["Visit", "requests"],
    waiting: (n: number) =>
      n === 1 ? "One person is waiting for your answer." : `${enLetra(n, "en", true)} people are waiting for your answer.`,
    month: (v: number, g: number) =>
      v === 0
        ? `No visits this month out of the ${enLetra(g, "en")} guaranteed.`
        : `${enLetra(v, "en", true)} visit${s(v)} this month out of the ${enLetra(g, "en")} guaranteed.`,
    people: (n: number) => `${n} ${n > 1 ? "people" : "person"}`,
    nights: (n: number) => `${n} night${s(n)}`,
    arrival: (d: string) => `Arrival ${d}`,
    at: " at ",
    requested: (rel: string) => `Requested ${rel}`,
    followers: (x: string) => `${x} followers`,
    reach: (x: string) => `${x} reach`,
    igOff: "Instagram not connected",
    club: (v: number, r: string | null) => `${v} visit${s(v)}${r ? ` · ${r} average reach` : ""}`,
    firstVisit: "First visit in the club",
    sameDay: (n: number, jour: string) => `${enLetra(n, "en", true)} for the same ${jour}`,
    sameDayText: (n: number): string =>
      n === 2 ? "You can accept both, or either one." : "You can accept one, several or all of them.",
    expiredTitle: "Expired",
    expired: (jour: string) => `${jour} passed without an answer. The request closed on its own. It doesn't count as a decline.`,
    accept: "Accept the visit",
    decline: "Decline",
    working: "One moment…",
    consequence: "A decline counts as a visit offered: {done} of {min} this month.",
    consequenceLast:
      "Careful: a decline counts as a visit offered, and you have only one left before reaching the {min} guaranteed.",
    acceptedCap: "Visit accepted",
    accepted: (p: string, cuando: string) =>
      `We've let ${p} know. ${cuando}. The visit will appear in Your visitors once it's done.`,
    declinedCap: "Request declined",
    declined: (p: string, v: number, g: number) =>
      `We're writing to ${p}, without giving a reason. ${enLetra(v, "en", true)} visit${s(v)} offered this month out of ${enLetra(g, "en")}.`,
    emptyTitle: "Nothing waiting",
    emptyDays: (dias: string[]) =>
      dias.length === 7
        ? "Storytellers see your slots every day."
        : `Storytellers see your slots on ${unir(dias, "and")}.`,
    emptyNoDays: "You haven't opened any slots yet: storytellers can't request anything.",
    openMore: "Open more slots",
    openFirst: "Open slots",
    loadFailCap: "Couldn't load",
    loadFail: "No request has been lost: they're waiting for you. Try again in a moment.",
    retry: "Try again",
    actionError: "This request has already been handled. Reload the page.",
    expiredNow: "This request expired in the meantime. It doesn't count as a decline.",
  },
  es: {
    title: ["Solicitudes", "de visita"],
    waiting: (n: number) =>
      n === 1 ? "Una persona espera tu respuesta." : `${enLetra(n, "es", true)} personas esperan tu respuesta.`,
    month: (v: number, g: number) =>
      v === 0
        ? `Ninguna visita este mes de las ${enLetra(g, "es")} garantizadas.`
        : `${enLetra(v, "es", true)} visita${s(v)} este mes de las ${enLetra(g, "es")} garantizadas.`,
    people: (n: number) => `${n} persona${s(n)}`,
    nights: (n: number) => `${n} noche${s(n)}`,
    arrival: (d: string) => `Llegada el ${d.toLowerCase()}`,
    at: " a las ",
    requested: (rel: string) => `Pedida ${rel}`,
    followers: (x: string) => `${x} seguidores`,
    reach: (x: string) => `${x} de alcance`,
    igOff: "Instagram no conectado",
    club: (v: number, r: string | null) => `${v} visita${s(v)}${r ? ` · ${r} de alcance medio` : ""}`,
    firstVisit: "Primera visita en el club",
    sameDay: (n: number, jour: string) => `${enLetra(n, "es", true)} para el mismo ${jour}`,
    sameDayText: (n: number): string => (n === 2 ? "Puedes aceptar las dos, o una de las dos." : "Puedes aceptar una, varias o todas."),
    expiredTitle: "Caducadas",
    expired: (jour: string) =>
      `El ${jour.toLowerCase()} pasó sin respuesta. La solicitud se cerró sola. No cuenta como rechazo.`,
    accept: "Aceptar la visita",
    decline: "Rechazar",
    working: "Un momento…",
    consequence: "Un rechazo cuenta como visita ofrecida: {done} de {min} este mes.",
    consequenceLast:
      "Ojo: un rechazo cuenta como visita ofrecida, y solo te queda una para llegar a las {min} garantizadas.",
    acceptedCap: "Visita aceptada",
    accepted: (p: string, cuando: string) =>
      `Hemos avisado a ${p}. ${cuando}. La visita aparecerá en Tus visitantes una vez hecha.`,
    declinedCap: "Solicitud rechazada",
    declined: (p: string, v: number, g: number) =>
      `Le escribimos a ${p}, sin dar razones. ${enLetra(v, "es", true)} visita${s(v)} ofrecida${s(v)} este mes de ${enLetra(g, "es")}.`,
    emptyTitle: "Nada pendiente",
    emptyDays: (dias: string[]) =>
      dias.length === 7
        ? "Los storytellers ven tus franjas todos los días."
        : `Los storytellers ven tus franjas ${unir(dias.map((d) => `del ${d}`), "y")}.`,
    emptyNoDays: "Todavía no has abierto franjas: los storytellers no pueden pedirte nada.",
    openMore: "Abrir más franjas",
    openFirst: "Abrir franjas",
    loadFailCap: "No se pudo cargar",
    loadFail: "No se ha perdido ninguna solicitud: te esperan. Vuelve a intentarlo en un momento.",
    retry: "Reintentar",
    actionError: "Esta solicitud ya fue resuelta. Vuelve a cargar la página.",
    expiredNow: "Esta solicitud caducó mientras tanto. No cuenta como rechazo.",
  },
};

type Textos = (typeof TEXTOS)["fr"];

/** "Jeudi 22 octobre à 19:30, 2 personnes", o la llegada y las noches si es un hotel. */
function cuandoLargo(d: Demanda, t: Textos, lang: Lang): string {
  return d.nights
    ? `${t.arrival(dia(d.slotStart, lang, true))}, ${t.nights(d.nights)}`
    : `${dia(d.slotStart, lang, true)}${t.at}${hora(d.slotStart, lang)}, ${t.people(d.partySize)}`;
}

/**
 * Las demandas de visite, con la persona delante (entrega 4, 10 duodecies).
 *
 * La 22 ya resolvía la decisión: dos acciones y la consecuencia escrita encima.
 * Lo que faltaba era el argumento. Cada demanda es ahora una persona, y al
 * tocarla se abre su dossier: su frase, sus fotos, lo que hizo en otras casas
 * del club y, al final, sus cifras. La fecha se queda fija arriba.
 *
 * Rechazar tiene consecuencia contractual: cuenta como visita ofrecida dentro
 * del mínimo del mes. Eso se lee encima de los botones y antes de pulsar, con
 * el recuento real del mes. Y no hay diálogo: quien pulsa, decide.
 */
export default function MaisonDemandes() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const cargar = useCallback(async () => {
    setFallo(false);
    try {
      const res = await fetch("/api/maison/reservations", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setDatos({
        maison: d.maison ?? "",
        requests: d.requests ?? [],
        visits: d.monthVisits ?? 0,
        guaranteed: d.guaranteed ?? 5,
        openDays: d.openDays ?? [],
      });
    } catch {
      setFallo(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrar = useCallback(() => {
    setAbierta(null);
    setErrorAccion("");
  }, []);

  async function decidir(d: Demanda, action: "confirm" | "decline") {
    setTrabajando(true);
    setErrorAccion("");
    try {
      const res = await fetch("/api/maison/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorAccion(body.expired ? t.expiredNow : t.actionError);
        if (body.expired) await cargar();
        return;
      }
      setResultado({ tipo: action === "confirm" ? "acepta" : "rechaza", demanda: d });
      setAbierta(null);
      await cargar();
      window.scrollTo({ top: 0 });
    } catch {
      setErrorAccion(t.actionError);
    } finally {
      setTrabajando(false);
    }
  }

  const requests = datos?.requests ?? [];
  const abiertas = requests.filter((r) => !r.expired);
  const cerradas = requests.filter((r) => r.expired);
  const visits = datos?.visits ?? 0;
  const guaranteed = datos?.guaranteed ?? 5;

  const faltan = Math.max(0, guaranteed - visits);
  const aviso =
    faltan === 1
      ? t.consequenceLast.replace("{min}", String(guaranteed))
      : t.consequence.replace("{done}", String(visits)).replace("{min}", String(guaranteed));

  // Cuántas personas piden cada día: si son varias, se dicen entre sí.
  const porDia = new Map<string, number>();
  for (const r of abiertas) porDia.set(claveDia(r.slotStart), (porDia.get(claveDia(r.slotStart)) ?? 0) + 1);

  const demanda = requests.find((r) => r.id === abierta) ?? null;
  const nombre = (r: Demanda) => r.dossier?.name || "";

  return (
    <div>
      <header className="mb-seccion">
        {datos?.maison && (
          <p className="mb-bloque text-capitale uppercase tracking-capitale text-text-secondary">{datos.maison}</p>
        )}
        <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
          {t.title[0]}
          <br />
          {t.title[1]}
        </h1>
        {datos && (
          <p className="max-w-[36ch] text-corps text-text-secondary">
            {abiertas.length > 0 && `${t.waiting(abiertas.length)} `}
            {t.month(visits, guaranteed)}
          </p>
        )}
      </header>

      {resultado && (
        <StateMark
          tono="cumplido"
          capital={resultado.tipo === "acepta" ? t.acceptedCap : t.declinedCap}
          className="mb-seccion"
        >
          {resultado.tipo === "acepta"
            ? t.accepted(nombrePila(nombre(resultado.demanda)), cuandoLargo(resultado.demanda, t, lang))
            : t.declined(nombrePila(nombre(resultado.demanda)), visits, guaranteed)}
        </StateMark>
      )}

      {cargando ? (
        <div aria-hidden className="space-y-fila">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[140px] animate-pulse rounded-[20px] [animation-duration:1.6s]"
              style={{ backgroundColor: "rgba(245,239,228,0.05)" }}
            />
          ))}
        </div>
      ) : fallo ? (
        <StateMark
          tono="caido"
          capital={t.loadFailCap}
          accion={<Button onClick={() => cargar()}>{t.retry}</Button>}
        >
          {t.loadFail}
        </StateMark>
      ) : abiertas.length === 0 ? (
        <Section>
          <p className="text-sous-titre text-text-primary">{t.emptyTitle}</p>
          <p className="mt-etiqueta max-w-[46ch] text-corps text-text-secondary">
            {datos && datos.openDays.length > 0
              ? t.emptyDays(
                  ORDEN_DIAS.filter((n) => datos.openDays.includes(n)).map((n) => NOMBRES_DIAS[lang][n])
                )
              : t.emptyNoDays}
          </p>
          <div className="mt-fila">
            <ButtonLink href="/dashboard/business">
              {datos && datos.openDays.length > 0 ? t.openMore : t.openFirst}
            </ButtonLink>
          </div>
        </Section>
      ) : (
        <div className="mb-seccion space-y-fila">
          {abiertas.map((r, i) => {
            const clave = claveDia(r.slotStart);
            const cuantos = porDia.get(clave) ?? 1;
            const primeraDelDia = abiertas.findIndex((x) => claveDia(x.slotStart) === clave) === i;
            const d = r.dossier;
            const cifras = d?.audience
              ? [
                  d.audience.followers != null && t.followers(compacto(d.audience.followers, lang)),
                  d.audience.avgReach != null && t.reach(compacto(d.audience.avgReach, lang)),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : t.igOff;

            return (
              <Rise key={r.id} index={i}>
                {/* Dos personas el mismo día se dicen entre sí, antes de las
                    dos, y se aclara que no son excluyentes. */}
                {cuantos > 1 && primeraDelDia && (
                  <StateMark
                    tono="plazo"
                    capital={t.sameDay(cuantos, diaSemana(r.slotStart, lang))}
                    className="mb-fila mt-bloque"
                  >
                    {t.sameDayText(cuantos)}
                  </StateMark>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAbierta(r.id);
                    setErrorAccion("");
                  }}
                  className="block w-full overflow-hidden rounded-[20px] text-left"
                  style={{
                    backgroundColor: "rgba(245,239,228,0.05)",
                    boxShadow: "inset 0 1px 0 rgba(245,239,228,0.10)",
                  }}
                >
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-fila px-[18px] pb-[14px] pt-fila">
                    {d?.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.portrait} alt="" className="aspect-[4/5] w-24 rounded-[14px] object-cover" />
                    ) : (
                      <span className="flex aspect-[4/5] w-24 items-center justify-center rounded-[14px] bg-surface-raised text-sous-titre text-accent">
                        {nombrePila(nombre(r)).slice(0, 1).toUpperCase() || "·"}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-[7px]">
                      {/* La fecha va en copper solo en la más próxima: con tres
                          avisos en copper el color deja de significar nada. */}
                      <span
                        className={`text-capitale uppercase tracking-capitale ${i === 0 ? "text-copper-vif" : "text-text-secondary"}`}
                      >
                        {dia(r.slotStart, lang, false)} · {r.nights ? t.nights(r.nights) : hora(r.slotStart, lang)}
                      </span>
                      <span className="break-words text-sous-titre text-text-primary">{nombre(r)}</span>
                      {cifras && <span className="text-legende text-text-secondary">{cifras}</span>}
                      <span className="text-legende text-sauge-vif">
                        {d && d.club.visits > 0
                          ? t.club(d.club.visits, d.club.avgReach != null ? compacto(d.club.avgReach, lang) : null)
                          : t.firstVisit}
                      </span>
                    </div>
                  </div>

                  {/* La primera trae además cuatro fotos suyas: en una lista corta
                      cabe enseñar por qué merece que se abra. */}
                  {i === 0 && d && d.portfolio.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 px-[18px] pb-fila">
                      {d.portfolio.slice(0, 4).map((url, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={j}
                          src={url}
                          alt=""
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          className="aspect-square w-full select-none rounded-lg object-cover [-webkit-touch-callout:none]"
                        />
                      ))}
                    </div>
                  )}
                </button>
              </Rise>
            );
          })}
        </div>
      )}

      {!cargando && !fallo && cerradas.length > 0 && (
        <Section title={t.expiredTitle}>
          <div className="space-y-fila">
            {cerradas.map((r) => (
              <div key={r.id}>
                <p className="break-words text-sous-titre text-text-primary">{nombre(r)}</p>
                <p className="mt-etiqueta max-w-[46ch] text-legende text-text-secondary">
                  {t.expired(dia(r.slotStart, lang, false))}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {demanda && (
        <DossierPane
          dossier={demanda.dossier}
          lang={lang}
          onClose={cerrar}
          note={demanda.note}
          header={
            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-fila">
                <span className="text-sous-titre text-text-primary">
                  {demanda.nights
                    ? t.arrival(dia(demanda.slotStart, lang, true))
                    : `${dia(demanda.slotStart, lang, true)} · ${hora(demanda.slotStart, lang)}`}
                </span>
                <span className="whitespace-nowrap text-legende text-text-secondary">
                  {demanda.nights ? t.nights(demanda.nights) : t.people(demanda.partySize)}
                </span>
              </div>
              <p className="mt-etiqueta text-legende text-text-secondary">
                {capitalizar(t.requested(haceCuanto(demanda.createdAt, lang)))}
              </p>
            </div>
          }
          footer={
            demanda.expired ? (
              <p className="max-w-[46ch] text-legende text-text-primary">{t.expired(dia(demanda.slotStart, lang, false))}</p>
            ) : (
              <div className="flex flex-col gap-fila">
                <p className={`max-w-[36ch] text-legende ${faltan === 1 ? "text-copper-vif" : "text-text-primary"}`}>
                  {aviso}
                </p>
                {errorAccion && (
                  <p className="border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{errorAccion}</p>
                )}
                <Button full onClick={() => decidir(demanda, "confirm")} disabled={trabajando}>
                  {trabajando ? t.working : t.accept}
                </Button>
                {/* Dos rangos, no dos botones: dos botones iguales convierten un
                    sí en una moneda al aire. */}
                <button
                  type="button"
                  onClick={() => decidir(demanda, "decline")}
                  disabled={trabajando}
                  className="flex min-h-11 items-center justify-center text-capitale uppercase tracking-capitale text-text-secondary transition-colors duration-200 ease-curato hover:text-copper-vif disabled:pointer-events-none disabled:opacity-45"
                >
                  {t.decline}
                </button>
              </div>
            )
          }
        />
      )}
    </div>
  );
}

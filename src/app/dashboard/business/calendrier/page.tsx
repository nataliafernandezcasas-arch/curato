"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { MAISON_LINKS } from "../nav-links";
import { Rise } from "@/components/member/motion";
import { Section } from "@/components/member/section";
import { Retrato } from "@/components/member/retrato";
import { PullToRefresh } from "@/components/member/pull-to-refresh";

type Visita = {
  id: string;
  storyteller: string;
  handle: string | null;
  portrait: string | null;
  slotStart: string;
  nights: number | null;
  partySize: number;
  note: string | null;
  arrived: boolean;
  calendar: { google: string; ics: string };
};

const TEXTOS: Record<
  Lang,
  {
    kicker: string;
    lead: string;
    empty: string;
    error: string;
    today: string;
    tomorrow: string;
    party: (n: number) => string;
    nights: (n: number) => string;
    arrived: string;
    add: string;
  }
> = {
  fr: {
    kicker: "Qui vient",
    lead: "Les visites confirmées des trois prochains mois : qui, à quelle heure, et combien.",
    empty: "Aucune visite confirmée pour le moment. Elles apparaissent ici dès que vous acceptez une demande.",
    error: "Le calendrier ne s'est pas chargé. Réessayez dans un instant.",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    party: (n) => (n > 1 ? `${n} personnes` : "1 personne"),
    nights: (n) => (n > 1 ? `${n} nuits` : "1 nuit"),
    arrived: "Arrivée enregistrée",
    add: "Ajouter à mon calendrier",
  },
  en: {
    kicker: "Who's coming",
    lead: "Confirmed visits for the next three months: who, at what time, and how many.",
    empty: "No confirmed visits yet. They appear here as soon as you accept a request.",
    error: "The calendar didn't load. Try again in a moment.",
    today: "Today",
    tomorrow: "Tomorrow",
    party: (n) => (n > 1 ? `${n} people` : "1 person"),
    nights: (n) => (n > 1 ? `${n} nights` : "1 night"),
    arrived: "Arrival recorded",
    add: "Add to my calendar",
  },
  es: {
    kicker: "Quién viene",
    lead: "Las visitas confirmadas de los próximos tres meses: quién, a qué hora y cuántos.",
    empty: "Todavía no hay visitas confirmadas. Aparecen aquí en cuanto aceptas una demanda.",
    error: "El calendario no se cargó. Vuelve a intentarlo en un momento.",
    today: "Hoy",
    tomorrow: "Mañana",
    party: (n) => (n > 1 ? `${n} personas` : "1 persona"),
    nights: (n) => (n > 1 ? `${n} noches` : "1 noche"),
    arrived: "Llegada registrada",
    add: "Añadir a mi calendario",
  },
};

// El día de París, como clave: las visitas se agrupan por el día de la casa.
const diaDeParis = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );

/**
 * El calendario de la casa: quién viene, cuándo, a qué hora y cuántos.
 *
 * Es una agenda y no una cuadrícula de mes: en un teléfono, una cuadrícula
 * enseña puntos y obliga a tocar cada día; una lista por días se lee de un
 * vistazo antes del servicio. Cada visita se puede apuntar en el calendario
 * del teléfono, una a una.
 */
export default function CalendrierMaison() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const tb = translations[lang].business;
  const td = translations[lang].dashboard;
  const [visitas, setVisitas] = useState<Visita[] | null>(null);
  const [fallo, setFallo] = useState(false);

  async function cargar() {
    try {
      const res = await fetch("/api/maison/calendrier", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setVisitas((await res.json()).visitas ?? []);
      setFallo(false);
    } catch {
      setFallo(true);
    }
  }
  useEffect(() => {
    void cargar();
  }, []);

  const hoy = diaDeParis(new Date());
  const manana = diaDeParis(new Date(Date.now() + 24 * 3600000));
  const porDia = new Map<string, Visita[]>();
  for (const v of visitas ?? []) {
    const k = diaDeParis(v.slotStart);
    porDia.set(k, [...(porDia.get(k) ?? []), v]);
  }
  const tituloDia = (k: string, ejemplo: string) => {
    const fecha = new Date(ejemplo).toLocaleDateString(lang, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Paris",
    });
    return k === hoy ? `${t.today} · ${fecha}` : k === manana ? `${t.tomorrow} · ${fecha}` : fecha;
  };

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        eyebrow="Maison"
        links={MAISON_LINKS(tb, "calendrier")}
        settingsHref="/dashboard/business/reglages"
        settingsLabel={td.navSettings}
        maxWidth="1100px"
      />

      <PullToRefresh onRefresh={cargar}>
        <div className="mx-auto max-w-[720px] px-pagina py-seccion">
          <Rise>
            <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
            <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary">{tb.navCalendar}</h1>
            <p className="mt-bloque mb-seccion max-w-[46ch] text-legende text-text-secondary">{t.lead}</p>
          </Rise>

          {fallo && !visitas ? (
            <p className="text-corps text-text-secondary">{t.error}</p>
          ) : !visitas ? (
            <div className="space-y-fila">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-border [animation-duration:1.6s]" />
              ))}
            </div>
          ) : visitas.length === 0 ? (
            <p className="py-respiro text-center text-corps text-text-secondary">{t.empty}</p>
          ) : (
            [...porDia.entries()].map(([dia, lista], i) => (
              <Rise key={dia} index={i}>
                <Section title={tituloDia(dia, lista[0].slotStart)}>
                  <div className="space-y-rango">
                    {lista.map((v) => (
                      <div key={v.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-fila">
                        <span className="pt-etiqueta text-sous-titre tabular-nums text-accent">
                          {new Date(v.slotStart).toLocaleTimeString(lang, {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Paris",
                          })}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-fila">
                            <Retrato src={v.portrait} nombre={v.storyteller} />
                            <div className="min-w-0">
                              <p className="truncate text-corps text-text-primary">{v.storyteller}</p>
                              <p className="text-legende text-text-secondary">
                                {v.handle && <>@{v.handle.replace(/^@/, "")} · </>}
                                {t.party(v.partySize)}
                                {v.nights ? ` · ${t.nights(v.nights)}` : ""}
                              </p>
                            </div>
                          </div>
                          {v.note && <p className="mt-bloque text-legende italic text-text-secondary">« {v.note} »</p>}
                          {v.arrived && (
                            <p className="mt-bloque text-capitale uppercase tracking-capitale text-sauge-vif">{t.arrived}</p>
                          )}
                          <div className="mt-bloque flex flex-wrap items-center gap-x-rango">
                            <span className="text-capitale uppercase tracking-capitale text-text-muted">{t.add}</span>
                            {[
                              { href: v.calendar.google, label: "Google" },
                              { href: v.calendar.ics, label: "Apple" },
                            ].map((enlace) => (
                              <a
                                key={enlace.label}
                                href={enlace.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4 transition-colors hover:text-text-primary"
                              >
                                {enlace.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </Rise>
            ))
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}

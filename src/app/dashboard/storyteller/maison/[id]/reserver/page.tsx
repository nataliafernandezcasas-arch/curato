"use client";

import { Suspense, use, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DayPicker, type DayButtonProps, type ChevronProps } from "react-day-picker";
import { enUS, es, fr } from "react-day-picker/locale";
import DashboardNav from "../../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../../nav-links";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { parisParts, parisToIso, type AvailWindow } from "@/lib/availability";
import { Button, ButtonLink } from "@/components/member/button";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Rise } from "@/components/member/motion";
import { StateMark } from "@/components/member/state-mark";
import { enLetra } from "../../../../business/demandes-format";

type Servicio = { name: string; description: string; price: string };
type Disponibilidad = {
  availability: AvailWindow[];
  blocked: { date: string }[];
  taken: string[];
  services: Servicio[];
};
type Casa = { id: string; name: string; category_id: string | null };
type Franja = { hm: string; iso: string; libre: boolean };

// Los hoteles se reservan por noche de llegada; el resto, por franja.
const HOTEL = "00000000-0000-0000-0000-0000000ca701";
// Una casa se reserva con dos o tres semanas de antelación: tres meses sobran.
const HORIZONTE_DIAS = 90;
// La hora a la que se guarda una llegada de hotel.
const LLEGADA_HOTEL = "15:00";
const LOCALES = { fr, es, en: enUS };

const pad = (n: number) => String(n).padStart(2, "0");
const ymdDe = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const desdeYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const TEXTOS = {
  fr: {
    back: "Retour",
    title: "Réserver",
    slots: (n: number): string =>
      n === 0 ? "Aucun créneau libre" : n === 1 ? "Un créneau libre" : `${enLetra(n, "fr", true)} créneaux libres`,
    fullDay: "Aucun créneau ce jour-là.",
    nearest: "Les plus proches",
    people: "Nombre de personnes",
    nights: "Nombre de nuits",
    arrival: "Date d'arrivée",
    time: "Heure",
    note: "Un mot à la maison",
    optional: "Optionnel",
    notePlaceholder: "Occasion, préférences…",
    rates: "Tarifs de la maison",
    pick: "Choisissez un jour et une heure.",
    pickHotel: "Choisissez votre date d'arrivée.",
    send: "Envoyer la demande",
    sending: "Envoi",
    noDebit: "La maison vous répond par e-mail. Rien n'est débité avant.",
    at: " à ",
    arrivalOn: (d: string) => `Arrivée ${d.toLowerCase()}`,
    peopleN: (n: number) => `${n} personne${n > 1 ? "s" : ""}`,
    nightsN: (n: number) => `${n} nuit${n > 1 ? "s" : ""}`,
    sentCap: "Demande envoyée",
    sent: (m: string) => `${m} vous répondra par e-mail. Rien n'est débité avant.`,
    theHouse: "La maison",
    backToMaison: "Revenir à la maison",
    failCap: "Non envoyée",
    fail: "La connexion s'est interrompue. Votre demande est gardée : réessayez.",
    takenCap: "Créneau pris",
    taken: "Ce créneau vient d'être demandé. Choisissez-en un autre.",
    refused: "La maison n'accepte pas ce créneau. Choisissez-en un autre.",
    closedMonth: "Aucun jour libre ce mois-ci.",
    prev: "Mois précédent",
    next: "Mois suivant",
  },
  en: {
    back: "Back",
    title: "Book",
    slots: (n: number): string =>
      n === 0 ? "No free slots" : n === 1 ? "One free slot" : `${enLetra(n, "en", true)} free slots`,
    fullDay: "No slots that day.",
    nearest: "Nearest days",
    people: "Number of people",
    nights: "Number of nights",
    arrival: "Arrival date",
    time: "Time",
    note: "A note for the house",
    optional: "Optional",
    notePlaceholder: "Occasion, preferences…",
    rates: "House rates",
    pick: "Choose a day and a time.",
    pickHotel: "Choose your arrival date.",
    send: "Send the request",
    sending: "Sending",
    noDebit: "The house replies by email. Nothing is charged before then.",
    at: " at ",
    arrivalOn: (d: string) => `Arrival ${d}`,
    peopleN: (n: number) => `${n} ${n > 1 ? "people" : "person"}`,
    nightsN: (n: number) => `${n} night${n > 1 ? "s" : ""}`,
    sentCap: "Request sent",
    sent: (m: string) => `${m} will reply by email. Nothing is charged before then.`,
    theHouse: "The house",
    backToMaison: "Back to the house",
    failCap: "Not sent",
    fail: "The connection dropped. Your request is kept: try again.",
    takenCap: "Slot taken",
    taken: "Someone has just requested this slot. Choose another one.",
    refused: "The house doesn't accept this slot. Choose another one.",
    closedMonth: "No free days this month.",
    prev: "Previous month",
    next: "Next month",
  },
  es: {
    back: "Volver",
    title: "Reservar",
    slots: (n: number): string =>
      n === 0 ? "Ninguna franja libre" : n === 1 ? "Una franja libre" : `${enLetra(n, "es", true)} franjas libres`,
    fullDay: "No hay franjas ese día.",
    nearest: "Los días más cercanos",
    people: "Número de personas",
    nights: "Número de noches",
    arrival: "Fecha de llegada",
    time: "Hora",
    note: "Unas palabras para la maison",
    optional: "Opcional",
    notePlaceholder: "Ocasión, preferencias…",
    rates: "Tarifas de la maison",
    pick: "Elige un día y una hora.",
    pickHotel: "Elige tu fecha de llegada.",
    send: "Enviar la solicitud",
    sending: "Enviando",
    noDebit: "La maison te responde por correo. No se descuenta nada antes.",
    at: " a las ",
    arrivalOn: (d: string) => `Llegada el ${d.toLowerCase()}`,
    peopleN: (n: number) => `${n} persona${n > 1 ? "s" : ""}`,
    nightsN: (n: number) => `${n} noche${n > 1 ? "s" : ""}`,
    sentCap: "Solicitud enviada",
    sent: (m: string) => `${m} te responderá por correo. No se descuenta nada antes.`,
    theHouse: "La maison",
    backToMaison: "Volver a la maison",
    failCap: "No enviada",
    fail: "Se cortó la conexión. Tu solicitud se ha guardado: vuelve a intentarlo.",
    takenCap: "Franja ocupada",
    taken: "Alguien acaba de pedir esta franja. Elige otra.",
    refused: "La maison no acepta esta franja. Elige otra.",
    closedMonth: "Ningún día libre este mes.",
    prev: "Mes anterior",
    next: "Mes siguiente",
  },
};

/** "Jeudi 22 octobre", o "Jeudi 22" sin el mes. */
function nombreDia(d: Date, lang: Lang, conMes = true): string {
  const semana = d.toLocaleDateString(lang, { weekday: "long" });
  const num = d.getDate();
  if (!conMes) return capitalizar(`${semana} ${num}`);
  const mes = d.toLocaleDateString(lang, { month: "long" });
  return capitalizar(lang === "en" ? `${semana}, ${mes} ${num}` : lang === "es" ? `${semana} ${num} de ${mes}` : `${semana} ${num} ${mes}`);
}

function horaLegible(hm: string, lang: Lang): string {
  if (lang !== "en") return hm;
  const [h, m] = hm.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Las flechas del mes son tipográficas, ‹ y ›, como el resto de la navegación,
 * que son palabras. Sin iconos dibujados.
 */
function Flecha({ orientation, className }: ChevronProps) {
  return (
    <span aria-hidden className={className}>
      {orientation === "left" ? "‹" : "›"}
    </span>
  );
}

/**
 * Un día del mes. Sin caja, sin píldora y sin relleno: el día elegido es una
 * cifra en champagne con un filete de 20×2 debajo, la marca de estado del
 * sistema aplicada a un número. Hoy lleva un punto de 3 px. Un día imposible
 * queda al 50 % y sin toque, sin tachar.
 */
function Dia({ day, modifiers, className, children, ...props }: DayButtonProps) {
  void day;
  const elegido = modifiers.selected;
  const apagado = modifiers.disabled;
  return (
    <button
      {...props}
      className={`${className ?? ""} relative mx-auto flex h-11 w-11 items-center justify-center tabular-nums transition-colors duration-200 ease-curato ${
        elegido
          ? "text-sous-titre text-accent"
          : apagado
            ? "text-corps text-text-primary opacity-50"
            : "text-corps text-text-primary hover:text-accent"
      }`}
    >
      {children}
      {elegido && <span aria-hidden className="absolute bottom-1 h-[2px] w-5 bg-accent" />}
      {modifiers.today && !elegido && (
        <span aria-hidden className="absolute bottom-1.5 h-[3px] w-[3px] rounded-full bg-accent" />
      )}
    </button>
  );
}

export default function ReserverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // useSearchParams pide un Suspense por encima para poder prerenderizar.
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" />}>
      <Reserver id={id} />
    </Suspense>
  );
}

/**
 * Réserver (la 12, entrega 4, 10 octies): rejilla de mes y franjas del día.
 *
 * Una casa se reserva con dos o tres semanas de antelación, y una tira de días
 * obligaría a deslizar veinte veces. La rejilla enseña el mes de un golpe. Por
 * debajo va react-day-picker, con su piel de shadcn fuera: sin caja, sin botón
 * relleno para el día y sin tachar los días imposibles.
 *
 * El resumen va pegado abajo y repite día, hora y personas junto al botón: es
 * lo que evita mandar la demanda para el jueves equivocado después de haber
 * navegado dos meses.
 */
function Reserver({ id }: { id: string }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const td = translations[lang].dashboard;

  // Un "?slot=" llega de un correo con créneaux propuestos: la pantalla abre
  // ya con ese día y esa hora elegidos, que es de lo que servía el enlace.
  const slot = useSearchParams().get("slot");
  const inicial = useMemo(() => {
    const d = slot ? new Date(slot) : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return { dia: desdeYmd(parisParts(d).ymd), iso: d.toISOString() };
  }, [slot]);

  const hoy = useMemo(() => inicioDelDia(new Date()), []);
  const ultimo = useMemo(() => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + HORIZONTE_DIAS), [hoy]);

  const [casa, setCasa] = useState<Casa | null>(null);
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [mes, setMes] = useState<Date>(() => inicial?.dia ?? hoy);
  const [dia, setDia] = useState<Date | undefined>(inicial?.dia);
  const [franja, setFranja] = useState(inicial?.iso ?? "");
  const [horaLibre, setHoraLibre] = useState("");
  const [personas, setPersonas] = useState(1);
  const [noches, setNoches] = useState(1);
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  // El aviso se guarda por su tipo, no por su texto: si cambia el idioma,
  // cambia con él.
  const [aviso, setAviso] = useState<"tomada" | "rechazada" | "caida" | null>(null);
  const [hecho, setHecho] = useState(false);
  const notaId = useId();

  useEffect(() => {
    createClient()
      .from("comercios")
      .select("id, name, category_id")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setCasa(data as Casa | null));
    fetch(`/api/maison/${id}/availability`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setDisp)
      .catch(() => {});
  }, [id]);

  const esHotel = casa?.category_id === HOTEL;
  const conAgenda = !esHotel && (disp?.availability?.length ?? 0) > 0;

  const ocupadas = useMemo(
    () =>
      new Set(
        (disp?.taken ?? []).map((iso) => {
          const p = parisParts(iso);
          return `${p.ymd} ${p.hm}`;
        })
      ),
    [disp]
  );
  const cerrados = useMemo(() => new Set((disp?.blocked ?? []).map((b) => b.date)), [disp]);

  /** Las franjas de un día, incluidas las ocupadas: se ven, no se pulsan. */
  function franjasDe(d: Date): Franja[] {
    if (!disp || !conAgenda) return [];
    const ymd = ymdDe(d);
    if (cerrados.has(ymd)) return [];
    const out: Franja[] = [];
    for (const w of disp.availability.filter((x) => x.day === d.getDay())) {
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      for (let m = sh * 60 + sm; m < eh * 60 + em; m += 30) {
        const hm = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        const iso = parisToIso(ymd, hm);
        if (new Date(iso).getTime() <= Date.now()) continue;
        out.push({ hm, iso, libre: !ocupadas.has(`${ymd} ${hm}`) });
      }
    }
    return out;
  }

  /** Un día que no se puede tocar: pasado, fuera del horizonte, cerrado o sin horario. */
  function imposible(d: Date): boolean {
    if (!disp) return true; // cargando: los días en su sitio, apagados
    if (d < hoy || d > ultimo) return true;
    if (cerrados.has(ymdDe(d))) return true;
    if (esHotel) return d <= hoy; // la llegada, a partir de mañana
    if (conAgenda) return !disp.availability.some((w) => w.day === d.getDay());
    return false;
  }

  // Los días con alguna franja libre, para decir adónde ir desde un día lleno.
  const diasLibres = useMemo(() => {
    if (!disp || !conAgenda) return [] as Date[];
    const out: Date[] = [];
    for (let i = 0; i <= HORIZONTE_DIAS; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      if (!imposible(d) && franjasDe(d).some((f) => f.libre)) out.push(d);
    }
    return out;
    // franjasDe e imposible solo dependen de lo que ya está en la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disp, conAgenda, hoy, ocupadas, cerrados]);

  const franjas = dia ? franjasDe(dia) : [];
  const libres = franjas.filter((f) => f.libre).length;
  const cercanos = dia
    ? diasLibres
        .filter((d) => ymdDe(d) !== ymdDe(dia))
        .sort((a, b) => Math.abs(a.getTime() - dia.getTime()) - Math.abs(b.getTime() - dia.getTime()))
        .slice(0, 2)
        .sort((a, b) => a.getTime() - b.getTime())
    : [];

  // El mes entero cerrado: la flecha del siguiente se marca en champagne para
  // que se vea que hay salida.
  const mesCerrado =
    !!disp && conAgenda && !diasLibres.some((d) => d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth());

  // Lo que se va a mandar. En un hotel, la llegada; sin horario, la hora que
  // escribe la persona; con horario, la franja elegida.
  const slotStart = esHotel
    ? dia
      ? parisToIso(ymdDe(dia), LLEGADA_HOTEL)
      : ""
    : conAgenda
      ? franja
      : dia && horaLibre
        ? parisToIso(ymdDe(dia), horaLibre)
        : "";

  const resumen = !dia
    ? null
    : esHotel
      ? `${t.arrivalOn(nombreDia(dia, lang))} · ${t.nightsN(noches)}`
      : slotStart
        ? `${nombreDia(dia, lang)}${t.at}${horaLegible(parisParts(slotStart).hm, lang)}`
        : null;

  function elegirDia(d: Date | undefined) {
    setDia(d);
    // La hora elegida se borra al cambiar de día: una hora de otro día no vale.
    setFranja("");
    setAviso(null);
  }

  async function enviar() {
    if (!slotStart) return;
    setEnviando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/reservations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: id,
          slotStart,
          partySize: personas,
          nights: esHotel ? noches : undefined,
          specialRequests: nota,
        }),
      });
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        setAviso(String(body.error ?? "").includes("déjà") ? "tomada" : "rechazada");
        setFranja("");
        // Lo ocupado ha cambiado: se vuelve a pedir.
        fetch(`/api/maison/${id}/availability`, { cache: "no-store" })
          .then((r) => r.json())
          .then(setDisp)
          .catch(() => {});
        return;
      }
      if (!res.ok) throw new Error();
      setHecho(true);
      window.scrollTo({ top: 0 });
    } catch {
      setAviso("caida");
    } finally {
      setEnviando(false);
    }
  }

  const volver = `/dashboard/storyteller/maison/${id}`;
  // − 2 +, la misma fila para personas y noches.
  const contador = (valor: number, set: (n: number) => void) => (
    <span className="flex items-center">
      <button
        type="button"
        aria-label="−"
        onClick={() => set(Math.max(1, valor - 1))}
        className="flex min-h-11 w-11 items-center justify-center text-sous-titre text-text-secondary transition-colors duration-200 ease-curato hover:text-accent"
      >
        −
      </button>
      <span className="w-8 text-center text-sous-titre tabular-nums text-text-primary">{valor}</span>
      <button
        type="button"
        aria-label="+"
        onClick={() => set(valor + 1)}
        className="flex min-h-11 w-11 items-center justify-center text-sous-titre text-text-secondary transition-colors duration-200 ease-curato hover:text-accent"
      >
        +
      </button>
    </span>
  );

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(td, "addresses")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />

      <div className="mx-auto max-w-[560px] px-pagina pt-fila">
        <Link
          href={volver}
          className="flex min-h-[52px] items-center text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
        >
          {t.back}
        </Link>

        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-text-secondary">{casa?.name ?? ""}</p>
          <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary md:text-[32px]">{t.title}</h1>
        </Rise>

        {/* El éxito no es un diálogo: es esta misma pantalla diciendo que ya
            está, y una salida hacia donde se venía. */}
        {hecho ? (
          <div className="py-respiro">
            <StateMark tono="cumplido" capital={t.sentCap}>
              {t.sent(casa?.name || t.theHouse)}
            </StateMark>
            <div className="mt-seccion">
              <ButtonLink href={volver}>{t.backToMaison}</ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <section className="mt-rango mb-seccion" aria-busy={!disp}>
              {esHotel && (
                <p className="mb-bloque text-capitale uppercase tracking-capitale text-accent">{t.arrival}</p>
              )}
              <DayPicker
                mode="single"
                selected={dia}
                onSelect={elegirDia}
                month={mes}
                onMonthChange={setMes}
                startMonth={hoy}
                endMonth={ultimo}
                disabled={imposible}
                locale={LOCALES[lang] ?? fr}
                weekStartsOn={1}
                showOutsideDays={false}
                formatters={{
                  formatCaption: (m: Date) => capitalizar(m.toLocaleDateString(lang, { month: "long", year: "numeric" })),
                  formatWeekdayName: (d: Date) => d.toLocaleDateString(lang, { weekday: "narrow" }).toUpperCase(),
                }}
                labels={{
                  labelPrevious: () => t.prev,
                  labelNext: () => t.next,
                }}
                components={{ DayButton: Dia, Chevron: Flecha }}
                classNames={{
                  root: "w-full",
                  months: "relative",
                  month: "w-full",
                  month_caption: "flex h-11 items-center justify-center",
                  caption_label: "text-capitale uppercase tracking-capitale text-text-primary",
                  nav: "absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between",
                  button_previous:
                    "flex h-11 w-11 items-center justify-center text-titre font-light text-text-secondary transition-colors duration-200 ease-curato hover:text-accent aria-disabled:pointer-events-none aria-disabled:opacity-30",
                  button_next: `flex h-11 w-11 items-center justify-center text-titre font-light transition-colors duration-200 ease-curato hover:text-accent aria-disabled:pointer-events-none aria-disabled:opacity-30 ${
                    mesCerrado ? "text-accent" : "text-text-secondary"
                  }`,
                  month_grid: "mt-bloque w-full border-collapse",
                  weekday: "h-8 text-center text-capitale font-normal uppercase tracking-capitale text-text-muted",
                  day: "p-0 text-center",
                }}
              />
              {mesCerrado && <p className="mt-bloque text-legende text-text-secondary">{t.closedMonth}</p>}
            </section>

            {/* Las franjas del día elegido, en tres columnas: caben sin
                desplazamiento propio, y una barra de scroll dentro de otra en
                un móvil es una trampa. */}
            {dia && conAgenda && (
              <Section title={nombreDia(dia, lang)} hint={t.slots(libres)}>
                {libres === 0 ? (
                  <div>
                    <p className="text-corps text-text-primary">{t.fullDay}</p>
                    {cercanos.length > 0 && (
                      <>
                        <p className="mt-fila text-capitale uppercase tracking-capitale text-text-secondary">{t.nearest}</p>
                        <div className="mt-etiqueta flex flex-wrap gap-x-fila">
                          {cercanos.map((d) => (
                            <button
                              key={ymdDe(d)}
                              type="button"
                              onClick={() => {
                                elegirDia(d);
                                setMes(d);
                              }}
                              className="flex min-h-11 items-center text-corps text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
                            >
                              {nombreDia(d, lang)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3">
                    {franjas.map((f) => {
                      const elegida = franja === f.iso;
                      return (
                        <button
                          key={f.iso}
                          type="button"
                          disabled={!f.libre}
                          onClick={() => {
                            setFranja(f.iso);
                            setAviso(null);
                          }}
                          className={`relative flex min-h-11 items-center justify-center tabular-nums transition-colors duration-200 ease-curato ${
                            elegida
                              ? "text-sous-titre text-accent"
                              : f.libre
                                ? "text-corps text-text-primary hover:text-accent"
                                : "cursor-not-allowed text-corps text-text-primary opacity-40"
                          }`}
                        >
                          {horaLegible(f.hm, lang)}
                          {elegida && <span aria-hidden className="absolute bottom-1 h-[2px] w-5 bg-accent" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* Una casa sin horario configurado: cualquier hora, la que
                escribe la persona. */}
            {dia && !esHotel && disp && !conAgenda && (
              <Section title={t.time}>
                <input
                  type="time"
                  step={1800}
                  value={horaLibre}
                  onChange={(e) => setHoraLibre(e.target.value)}
                  className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary outline-none transition-colors duration-200 ease-curato focus:border-accent"
                />
              </Section>
            )}

            <Section>
              <Row
                label={<span className="text-corps text-text-secondary">{t.people}</span>}
                value={contador(personas, setPersonas)}
              />
              {/* Las noches solo si es hotel: cinco campos siempre visibles
                  cansan a las casas que no lo son. */}
              {esHotel && (
                <Row
                  label={<span className="text-corps text-text-secondary">{t.nights}</span>}
                  value={contador(noches, setNoches)}
                />
              )}
            </Section>

            <section className="mb-seccion">
              <div className="mb-bloque flex items-baseline justify-between gap-fila">
                <label htmlFor={notaId} className="text-capitale uppercase tracking-capitale text-accent">
                  {t.note}
                </label>
                <span className="text-legende text-text-secondary">{t.optional}</span>
              </div>
              <textarea
                id={notaId}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder={t.notePlaceholder}
                className="w-full min-w-0 resize-none border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary outline-none transition-colors duration-200 ease-curato placeholder:text-text-muted focus:border-accent"
              />
            </section>

            {disp?.services?.some((s) => s.name?.trim()) && (
              <Section title={t.rates}>
                {disp.services
                  .filter((s) => s.name?.trim())
                  .map((s, i) => (
                    <Row
                      key={i}
                      label={<span className="text-legende text-text-primary">{s.name}</span>}
                      value={s.price?.trim() ? <span className="text-legende text-text-primary">{s.price}</span> : undefined}
                    />
                  ))}
              </Section>
            )}

            {aviso && (
              <StateMark
                tono={aviso === "caida" ? "caido" : "plazo"}
                capital={aviso === "tomada" ? t.takenCap : t.failCap}
                className="mb-seccion"
              >
                {aviso === "tomada" ? t.taken : aviso === "rechazada" ? t.refused : t.fail}
              </StateMark>
            )}
          </>
        )}
      </div>

      {/* El resumen pegado abajo, encima de la barra de destinos. */}
      {!hecho && (
        <div
          className="sticky z-30 mt-rango backdrop-blur-md"
          style={{
            bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
            backgroundColor: "rgba(20,20,20,0.92)",
          }}
        >
          <div className="mx-auto flex max-w-[560px] flex-col gap-fila px-pagina py-fila">
            {resumen ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-fila">
                <span className="text-corps text-text-primary">{resumen}</span>
                <span className="whitespace-nowrap text-legende text-text-secondary">{t.peopleN(personas)}</span>
              </div>
            ) : (
              <p className="text-legende text-text-secondary">{esHotel ? t.pickHotel : t.pick}</p>
            )}
            <Button full onClick={enviar} disabled={enviando || !slotStart}>
              {enviando ? t.sending : t.send}
            </Button>
            <p className="text-legende text-text-secondary">{t.noDebit}</p>
          </div>
        </div>
      )}
    </div>
  );
}

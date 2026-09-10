"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardNav from "../../../../dashboard-nav";
import { STORYTELLER_LINKS } from "../../../nav-links";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { parisParts, AvailWindow } from "@/lib/availability";
import { Button, ButtonLink } from "@/components/member/button";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Rise } from "@/components/member/motion";

type Servicio = { name: string; description: string; price: string };
type Disponibilidad = {
  availability: AvailWindow[];
  blocked: { date: string }[];
  taken: string[];
  services: Servicio[];
};
type Casa = { id: string; name: string; category_id: string | null };

// Los hoteles se reservan por noche de llegada; el resto, por franja.
const HOTEL = "00000000-0000-0000-0000-0000000ca701";

/**
 * Demander une visite.
 *
 * Era un diálogo encima de la ficha. Seis campos y una rejilla de horas con el
 * teclado abierto no caben en un modal de 375 px, y encima no había forma de
 * volver: el botón atrás del teléfono cerraba la ficha entera.
 *
 * Como ruta propia, el botón atrás funciona, el gesto de arrastrar desde el
 * borde que da iOS funciona, y el enlace de un correo puede abrir directamente
 * el día elegido.
 */
export default function ReserverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLang();
  const t = translations[lang].maison;
  const td = translations[lang].dashboard;

  const [casa, setCasa] = useState<Casa | null>(null);
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [dia, setDia] = useState("");
  const [franja, setFranja] = useState("");
  const [personas, setPersonas] = useState(1);
  const [noches, setNoches] = useState(1);
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState(false);

  // Un "?slot=" llega de un correo con créneaux propuestos: la pantalla abre
  // ya con ese día y esa hora elegidos, que es de lo que servía el enlace.
  useEffect(() => {
    const slot = new URLSearchParams(window.location.search).get("slot");
    if (!slot) return;
    const d = new Date(slot);
    if (Number.isNaN(d.getTime())) return;
    setFranja(d.toISOString());
    setDia(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    createClient()
      .from("comercios")
      .select("id, name, category_id")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setCasa(data as Casa | null));
    fetch(`/api/maison/${id}/availability`)
      .then((r) => r.json())
      .then(setDisp)
      .catch(() => {});
  }, [id]);

  const esHotel = casa?.category_id === HOTEL;
  const conAgenda = !esHotel && (disp?.availability?.length ?? 0) > 0;

  const dias = useMemo(() => {
    if (!conAgenda || !disp) return [] as { ymd: string; dow: number; d: Date }[];
    const abiertos = new Set(disp.availability.map((w) => w.day));
    const cerrados = new Set(disp.blocked.map((b) => b.date));
    const hoy = new Date();
    const out: { ymd: string; dow: number; d: Date }[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (abiertos.has(d.getDay()) && !cerrados.has(ymd)) out.push({ ymd, dow: d.getDay(), d });
    }
    return out;
  }, [conAgenda, disp]);

  /** Las horas de un día, incluidas las ocupadas: se ven, no se pulsan. */
  function horasDe(ymd: string) {
    if (!disp) return [] as { label: string; iso: string; libre: boolean }[];
    const dd = dias.find((x) => x.ymd === ymd);
    if (!dd) return [];
    const ocupadas = new Set(
      disp.taken.map((iso) => {
        const p = parisParts(iso);
        return `${p.ymd} ${p.hm}`;
      })
    );
    const out: { label: string; iso: string; libre: boolean }[] = [];
    for (const w of disp.availability.filter((x) => x.day === dd.dow)) {
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      for (let m = sh * 60 + sm; m < eh * 60 + em; m += 30) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const dt = new Date(dd.d);
        dt.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (dt.getTime() <= Date.now()) continue;
        out.push({ label: `${hh}:${mm}`, iso: dt.toISOString(), libre: !ocupadas.has(`${ymd} ${hh}:${mm}`) });
      }
    }
    return out;
  }

  const horas = dia ? horasDe(dia) : [];
  const fechaLarga = (d: Date) =>
    d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });

  async function enviar() {
    if (!franja) {
      setError(t.errorDate);
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/reservations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: id,
          slotStart: new Date(franja).toISOString(),
          partySize: personas,
          nights: esHotel ? noches : undefined,
          specialRequests: nota,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorRequest);
        return;
      }
      setHecho(true);
    } catch {
      setError(t.errorConnection);
    } finally {
      setEnviando(false);
    }
  }

  const volver = `/dashboard/storyteller/maison/${id}`;

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(td, "addresses")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />

      <div className="mx-auto max-w-[720px] px-pagina py-seccion">
        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.modalTitle}</p>
          <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
            {casa?.name ?? ""}
          </h1>
        </Rise>

        {/* El éxito no es un diálogo: es esta misma pantalla diciendo que ya
            está, y una salida hacia donde se venía. */}
        {hecho ? (
          <div className="py-respiro">
            <p className="text-capitale uppercase tracking-capitale text-sauge-vif">{t.successTitle}</p>
            <p className="mt-fila max-w-[46ch] text-corps text-text-secondary">{t.successSubtitle}</p>
            <div className="mt-seccion">
              <ButtonLink href={volver}>{t.backToAll}</ButtonLink>
            </div>
          </div>
        ) : (
          <>
            {conAgenda ? (
              <>
                {/* El día es una lista de filas con su recuento, no un
                    desplegable del sistema: así se ve de un vistazo qué días
                    tienen sitio y cuántos. */}
                <Section title={t.chooseDate}>
                  {dias.length === 0 ? (
                    <p className="text-corps text-text-secondary">{t.noSlots}</p>
                  ) : (
                    dias.map((d) => {
                      const libres = horasDe(d.ymd).filter((h) => h.libre).length;
                      const elegido = dia === d.ymd;
                      return (
                        <button
                          key={d.ymd}
                          type="button"
                          onClick={() => {
                            setDia(d.ymd);
                            setFranja("");
                          }}
                          className="group grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-fila text-left"
                        >
                          <span
                            aria-hidden
                            className={`block h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-200 ease-curato ${
                              elegido ? "border-accent bg-accent" : "border-text-muted group-hover:border-accent"
                            }`}
                          />
                          <span className={`truncate text-corps ${elegido ? "text-text-primary" : "text-text-secondary"}`}>
                            {fechaLarga(d.d)}
                          </span>
                          <span className="shrink-0 text-capitale uppercase tracking-capitale tabular-nums text-brume">
                            {libres}
                          </span>
                        </button>
                      );
                    })
                  )}
                </Section>

                {dia && (
                  <Section title={t.dateTime}>
                    {horas.length === 0 ? (
                      <p className="text-corps text-text-secondary">{t.noSlots}</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-bloque">
                        {horas.map((h) => (
                          <button
                            key={h.iso}
                            type="button"
                            disabled={!h.libre}
                            onClick={() => setFranja(h.iso)}
                            className={`min-h-11 text-capitale tabular-nums tracking-capitale transition-colors duration-200 ease-curato ${
                              franja === h.iso
                                ? "text-accent"
                                : h.libre
                                ? "text-text-secondary hover:text-accent"
                                : "cursor-not-allowed text-text-muted opacity-45"
                            }`}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </Section>
                )}
              </>
            ) : (
              <Section title={esHotel ? t.arrivalDate : t.dateTime}>
                <input
                  type="datetime-local"
                  value={franja ? franja.slice(0, 16) : ""}
                  onChange={(e) => setFranja(e.target.value)}
                  className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary transition-colors duration-200 ease-curato outline-none focus:border-accent"
                />
              </Section>
            )}

            <Section title={esHotel ? t.nights : t.people}>
              <Row
                label={
                  <span className="text-corps text-text-secondary">
                    {esHotel ? t.nights : t.people}
                  </span>
                }
                value={
                  <span className="flex items-center gap-fila">
                    <button
                      type="button"
                      onClick={() => (esHotel ? setNoches(Math.max(1, noches - 1)) : setPersonas(Math.max(1, personas - 1)))}
                      className="min-h-11 w-8 text-capitale text-text-muted transition-colors hover:text-accent"
                    >
                      –
                    </button>
                    <span className="w-6 text-center text-sous-titre tabular-nums text-text-primary">
                      {esHotel ? noches : personas}
                    </span>
                    <button
                      type="button"
                      onClick={() => (esHotel ? setNoches(noches + 1) : setPersonas(personas + 1))}
                      className="min-h-11 w-8 text-capitale text-text-muted transition-colors hover:text-accent"
                    >
                      +
                    </button>
                  </span>
                }
              />
            </Section>

            <Section title={`${t.note} ${t.optional}`}>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder={t.notePlaceholder}
                className="w-full min-w-0 resize-none border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted focus:border-accent"
              />
            </Section>

            {disp?.services?.some((s) => s.name?.trim()) && (
              <Section title={t.maisonRates}>
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

            {error && (
              <p className="mb-fila border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{error}</p>
            )}

            {/* Lo elegido se repite aquí, encima del botón: nadie debería
                confirmar algo que dejó de ver tres pantallas más arriba. */}
            {franja && (
              <p className="mb-fila text-legende text-text-secondary">
                {new Date(franja).toLocaleString(lang, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            <div className="flex items-center gap-fila">
              <Button onClick={enviar} disabled={enviando || !franja}>
                {enviando ? t.sending : t.send}
              </Button>
              <Link
                href={volver}
                className="min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-accent"
              >
                {t.close}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

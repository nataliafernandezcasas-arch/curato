"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import type { Lang } from "@/lib/i18n/translations";
import { TRAZO } from "@/components/member/iconos";
import { claveDia, hora } from "./demandes-format";

type Visita = { id: string; storyteller: string; slotStart: string; partySize: number };

const TEXTOS: Record<
  Lang,
  { requests: string; visits: string; all: string; nothing: string; visitsOf: string; prev: string; next: string }
> = {
  fr: {
    requests: "Demandes à traiter",
    visits: "Visites confirmées",
    all: "Voir tous les jours",
    nothing: "Rien ce jour-là.",
    visitsOf: "Confirmées ce jour-là",
    prev: "Mois précédent",
    next: "Mois suivant",
  },
  en: {
    requests: "Requests to answer",
    visits: "Confirmed visits",
    all: "Show every day",
    nothing: "Nothing that day.",
    visitsOf: "Confirmed that day",
    prev: "Previous month",
    next: "Next month",
  },
  es: {
    requests: "Demandas por responder",
    visits: "Visitas confirmadas",
    all: "Ver todos los días",
    nothing: "Nada ese día.",
    visitsOf: "Confirmadas ese día",
    prev: "Mes anterior",
    next: "Mes siguiente",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * El mes de un vistazo, encima de las demandas (revisión de diseño,
 * 2026-10-20): en cobre los días con demandas por responder, en verde los que
 * ya tienen visitas confirmadas. Al tocar un día, la lista de debajo enseña
 * solo ese día, y las visitas confirmadas de ese día se abren desde aquí.
 */
export function CalendarioDemandes({
  demandas,
  lang,
  elegido,
  onElegir,
}: {
  demandas: { slotStart: string }[];
  lang: Lang;
  elegido: string | null;
  onElegir: (dia: string | null) => void;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const hoy = claveDia(new Date().toISOString());
  const [mes, setMes] = useState(() => hoy.slice(0, 7)); // "2026-10"

  useEffect(() => {
    fetch("/api/maison/calendrier", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setVisitas(d.visitas ?? []))
      .catch(() => {});
  }, []);

  const pedidas = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of demandas) m.set(claveDia(d.slotStart), (m.get(claveDia(d.slotStart)) ?? 0) + 1);
    return m;
  }, [demandas]);
  const confirmadas = useMemo(() => {
    const m = new Map<string, Visita[]>();
    for (const v of visitas) {
      const k = claveDia(v.slotStart);
      m.set(k, [...(m.get(k) ?? []), v]);
    }
    return m;
  }, [visitas]);

  const [anio, numMes] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(anio, numMes - 1, 1));
  const diasDelMes = new Date(Date.UTC(anio, numMes, 0)).getUTCDate();
  // La semana empieza el lunes.
  const hueco = (primero.getUTCDay() + 6) % 7;
  const titulo = primero.toLocaleDateString(lang, { month: "long", year: "numeric", timeZone: "UTC" });
  const cabecera = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(lang, { weekday: "narrow", timeZone: "UTC" })
  );
  const mover = (delta: number) => {
    const d = new Date(Date.UTC(anio, numMes - 1 + delta, 1));
    setMes(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  const delDia = elegido ? confirmadas.get(elegido) ?? [] : [];

  return (
    <div className="caja-cristal mb-seccion p-fila">
      <div className="mb-fila flex items-center justify-between">
        <button type="button" onClick={() => mover(-1)} aria-label={t.prev} className="flex h-11 w-11 items-center justify-center text-text-secondary hover:text-accent">
          <NavArrowLeft width={20} height={20} strokeWidth={TRAZO} />
        </button>
        <p className="text-capitale uppercase tracking-capitale text-text-primary first-letter:uppercase">{titulo}</p>
        <button type="button" onClick={() => mover(1)} aria-label={t.next} className="flex h-11 w-11 items-center justify-center text-text-secondary hover:text-accent">
          <NavArrowRight width={20} height={20} strokeWidth={TRAZO} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cabecera.map((d, i) => (
          <span key={i} className="pb-bloque text-[11px] uppercase text-text-muted">{d}</span>
        ))}
        {Array.from({ length: hueco }, (_, i) => (
          <span key={`h${i}`} />
        ))}
        {Array.from({ length: diasDelMes }, (_, i) => {
          const clave = `${mes}-${pad(i + 1)}`;
          const n = pedidas.get(clave) ?? 0;
          const v = confirmadas.get(clave)?.length ?? 0;
          const activo = elegido === clave;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => onElegir(activo ? null : clave)}
              aria-pressed={activo}
              className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-corps tabular-nums transition-colors ${
                activo
                  ? "bg-accent text-surface"
                  : clave === hoy
                    ? "border border-accent/60 text-text-primary"
                    : clave < hoy
                      ? "text-text-muted"
                      : "text-text-primary hover:bg-white/5"
              }`}
            >
              {i + 1}
              <span className="flex h-1.5 gap-0.5">
                {n > 0 && <span className={`h-1.5 w-1.5 rounded-full ${activo ? "bg-surface" : "bg-copper-vif"}`} />}
                {v > 0 && <span className={`h-1.5 w-1.5 rounded-full ${activo ? "bg-surface" : "bg-sauge-vif"}`} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-fila flex flex-wrap gap-x-fila gap-y-bloque text-legende text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-copper-vif" />{t.requests}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sauge-vif" />{t.visits}</span>
      </div>

      {elegido && (
        <div className="mt-fila border-t border-border pt-fila">
          {delDia.length > 0 && (
            <>
              <p className="text-capitale uppercase tracking-capitale text-sauge-vif">{t.visitsOf}</p>
              <ul className="mt-bloque">
                {delDia.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/dashboard/business/calendrier/${v.id}`}
                      className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila text-corps text-text-primary"
                    >
                      <span className="truncate">{v.storyteller}</span>
                      <span className="tabular-nums text-text-secondary">{hora(v.slotStart, lang)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {delDia.length === 0 && !pedidas.get(elegido) && <p className="text-legende text-text-secondary">{t.nothing}</p>}
          <button
            type="button"
            onClick={() => onElegir(null)}
            className="mt-bloque inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4"
          >
            {t.all}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import type { NavLink } from "@/app/dashboard/dashboard-nav";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

const SIN_CONEXION: Record<Lang, string> = { fr: "Hors ligne", en: "Offline", es: "Sin conexión" };

/**
 * La barra de destinos, abajo.
 *
 * Dos cosas hacían que esto pareciese una web y no una app: que todo se
 * recorriese hacia abajo, y que la navegación viviese arriba, detrás de un
 * menú. El pulgar no llega arriba del todo en un teléfono, y abrir un menú para
 * cambiar de sitio son dos gestos donde debería haber uno.
 *
 * Abajo, siempre visible, sin iconos: la palabra del destino en capital y la
 * activa en champagne. Sin caja, sin subrayado y sin píldora. Solo en el
 * teléfono: en un portátil los destinos siguen arriba, que ahí sí se alcanzan.
 *
 * **Tres como máximo.** La maison tiene cinco secciones y en 375 px no caben:
 * la quinta se sale por la derecha y deja de poder tocarse. Las que no entran
 * no desaparecen, bajan al menú, que para eso sigue estando. Aquí quedan las
 * que se usan a diario y allí las de vez en cuando.
 */
export const MAX_DESTINOS = 3;

// Dónde estaba la píldora en la pantalla anterior. Cada pantalla monta su
// propia barra; sin esto la píldora aparecería ya en su sitio, sin viajar.
let ultimoActivo: number | null = null;

// Lo que dura el viaje de la píldora, y cuánto crece por el camino: como la
// barra de pestañas de iOS, una lente de cristal que se hincha al moverse y
// vuelve a su tamaño al llegar (Natalia, 2026-10-09).
const VIAJE = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };
const LENTE = [1, 1.16, 1];

export function TabBar({ links }: { links: NavLink[] }) {
  const [offline, setOffline] = useState(false);
  const { lang } = useLang();

  // Sin conexión se dice aquí, en una palabra, y deja de ser una pantalla
  // entera que tapaba lo que la persona estaba mirando.
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const destinos = links.slice(0, MAX_DESTINOS);
  const activo = destinos.findIndex((l) => l.active);
  const reduce = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([]);
  const [pildora, animar] = useAnimate<HTMLSpanElement>();

  // El hueco de una pestaña dentro de la barra.
  const hueco = (i: number) => {
    const e = etiquetas.current[i];
    return e ? { x: e.offsetLeft, y: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight } : null;
  };

  // Lleva la píldora a una pestaña: de golpe, o viajando y creciendo.
  const llevar = (i: number, viajando: boolean) => {
    const h = hueco(i);
    if (!h || !pildora.current) return;
    if (!viajando || reduce) {
      void animar(pildora.current, { ...h, scale: 1, opacity: 1 }, { duration: 0 });
      return;
    }
    void animar(pildora.current, { ...h, scale: LENTE, opacity: 1 }, VIAJE);
  };

  // Al montar: la píldora sale de donde estaba en la pantalla anterior y viaja
  // hasta la pestaña de esta.
  useLayoutEffect(() => {
    if (activo < 0) return;
    const desde = ultimoActivo;
    ultimoActivo = activo;
    if (desde !== null && desde !== activo && desde < destinos.length) {
      llevar(desde, false);
      requestAnimationFrame(() => llevar(activo, true));
    } else {
      llevar(activo, false);
    }
    const alCambiar = () => llevar(activo, false);
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
    // llevar solo depende de lo que ya está en la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, destinos.length]);

  if (destinos.length === 0) return null;

  return (
    <nav
      className="barra-destinos fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {offline && (
        <p className="py-etiqueta text-center text-capitale uppercase tracking-capitale text-copper-vif">
          {SIN_CONEXION[lang]}
        </p>
      )}
      <div ref={caja} className="relative flex items-stretch justify-around">
        {/* La píldora de cristal: una sola, que viaja de pestaña en pestaña. */}
        {activo >= 0 && (
          <span
            ref={pildora}
            aria-hidden
            className="pestana pestana-activa pointer-events-none absolute left-0 top-0 !p-0"
            style={{ opacity: 0 }}
          />
        )}
        {destinos.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            // Al tocar, la píldora sale ya hacia aquí, sin esperar a la página.
            onClick={() => i !== activo && llevar(i, true)}
            className="flex min-h-14 flex-1 items-center justify-center px-1 py-bloque text-center text-capitale uppercase tracking-capitale"
          >
            <span
              ref={(e) => {
                etiquetas.current[i] = e;
              }}
              className={`pestana relative z-10 text-balance !border-transparent !bg-transparent ${l.active ? "!text-[#F5EFE4]" : ""}`}
              style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
            >
              {l.label}
              {!!l.cifra && <Cifra n={l.cifra} />}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Cuántas cosas esperan en un destino: las demandas por responder. */
export function Cifra({ n }: { n: number }) {
  return (
    <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] translate-y-[-1px] items-center justify-center rounded-full bg-accent px-1 align-middle font-sans text-[11px] font-medium not-italic leading-none tracking-normal tabular-nums text-surface">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/**
 * El hueco que la barra deja debajo del contenido, para que la última fila de
 * una pantalla no quede tapada por ella.
 */
export function TabBarSpacer() {
  return (
    <div
      aria-hidden
      className="sm:hidden"
      style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
    />
  );
}

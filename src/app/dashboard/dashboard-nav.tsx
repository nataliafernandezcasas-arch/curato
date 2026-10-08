"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gear, CaretDown } from "@phosphor-icons/react";
import { TabBar, TabBarSpacer, MAX_DESTINOS, Cifra } from "@/components/member/tab-bar";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { COMUN } from "@/lib/i18n/comun";

export type NavLink = {
  href: string;
  label: string;
  active?: boolean;
  /** Qué se cuenta en este destino. La cifra la pone la barra, no la página. */
  contador?: "demandes";
  cifra?: number;
};

/**
 * Las demandas por responder de la casa, para la cifra de la barra. Se vuelve
 * a pedir al volver a la app. Si la cifra cambió desde la última vez, se pide
 * también que el icono del teléfono la ponga al día: una demanda que caduca
 * sin respuesta no manda ningún aviso que la baje.
 */
function useDemandesPendientes(activo: boolean): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const cargar = async () => {
      const res = await fetch("/api/maison/pendientes", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || !vivo) return;
      const { n: cifra } = (await res.json()) as { n: number };
      setN(cifra);
      let ultima: string | null = null;
      try {
        ultima = localStorage.getItem("curato.icono");
      } catch {}
      if (ultima !== String(cifra)) {
        await fetch("/api/maison/pendientes?icono=1", { cache: "no-store" }).catch(() => null);
        try {
          localStorage.setItem("curato.icono", String(cifra));
        } catch {}
      }
    };
    void cargar();
    const alVolver = () => document.visibilityState === "visible" && void cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [activo]);
  return n;
}

/**
 * The bar across the top of every dashboard.
 *
 * On a laptop everything sits in one row, which is how it has always looked.
 * On a phone that row was wider than the screen: the links, the other spaces,
 * three languages and sign-out could not fit, so the bar scrolled sideways and
 * half of it lived off-screen with nothing to say so.
 *
 * Below `sm` it collapses to the wordmark and one button. Everything that was
 * in the row moves into a panel underneath, stacked, and the page itself never
 * moves horizontally.
 */
export default function DashboardNav({
  links: enlaces = [],
  eyebrow,
  roleSwitch,
  settingsHref,
  settingsLabel: settingsLabelProp,
  maxWidth = "1200px",
}: {
  links?: NavLink[];
  /** A label instead of links, e.g. "Maison" on the maison dashboard. */
  eyebrow?: string;
  roleSwitch?: React.ReactNode;
  /** Where Réglages lives. Language and signing out moved in there. */
  settingsHref?: string;
  settingsLabel?: string;
  maxWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { lang } = useLang();
  const c = COMUN[lang];
  const settingsLabel = settingsLabelProp ?? translations[lang].dashboard.navSettings;
  const demandes = useDemandesPendientes(enlaces.some((l) => l.contador === "demandes"));
  const links = enlaces.map((l) => (l.contador === "demandes" ? { ...l, cifra: demandes } : l));

  // A stale open panel over a new page is worse than no panel, and Escape is
  // what anyone reaches for first.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);


  return (
    <>
    <nav className={`barra-cabecera sticky top-0 z-40 ${open ? "barra-abierta" : ""}`}>
      <div
        className="mx-auto flex h-14 w-full items-center justify-between px-5"
        style={{ maxWidth }}
      >
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          {/* Home for a member is their own space, not the page that explains
              what Curato is. In the app that page should never appear at all.
              En el teléfono el logotipo abre el menú: el botón «Menu» de la
              derecha competía con la barra y nadie lo encontraba. */}
          <Link href="/dashboard" className="hidden shrink-0 sm:block">
            {/* El logotipo en tinta (logo-curato-ink.png) vuelve con la piel
                nueva, cuando el modo claro se rehaga. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "12px", width: "auto", display: "block" }}
            />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? c.close : c.menu}
            className="-ml-2 flex min-h-11 shrink-0 items-center gap-2 px-2 sm:hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "12px", width: "auto", display: "block" }}
            />
            <CaretDown
              size={11}
              className={`text-text-muted transition-transform duration-300 ease-curato ${open ? "rotate-180" : ""}`}
            />
          </button>

          {eyebrow && (
            <>
              <div className="h-3 w-px shrink-0 bg-border" />
              <span className="truncate font-serif text-[10px] uppercase tracking-[0.3em] text-text-muted">
                {eyebrow}
              </span>
            </>
          )}

          {links.length > 0 && (
            <>
              <div className="hidden h-3 w-px bg-border sm:block" />
              <div className="hidden items-center gap-6 sm:flex">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`whitespace-nowrap font-serif text-[12px] tracking-wider transition-colors ${
                      l.active ? "text-accent" : "text-text-secondary hover:text-accent"
                    }`}
                  >
                    {l.label}
                    {!!l.cifra && <Cifra n={l.cifra} />}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden items-center gap-5 sm:flex">
          {roleSwitch}
          {settingsHref && (
            <Link
              href={settingsHref}
              className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-text-secondary transition-colors hover:text-accent"
            >
              <Gear size={14} />
              {settingsLabel}
            </Link>
          )}
        </div>

      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            // Height animates on a wrapper that owns no padding of its own. Put
            // padding here and the first frame jumps by that amount, which is
            // what makes a slide read as a snap.
            className="overflow-hidden sm:hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Sin fondo propio: el de la barra sigue por debajo, al 65 %, y se
                ve la flor detrás. Antes el panel ponía otro casi opaco encima
                y quedaba negro. */}
            <div className="px-pagina py-rango">
              <div className="flex flex-col gap-fila">
                {/* Los destinos que no caben abajo viven aquí. Sin esto, la
                    quinta sección de una maison no se podía alcanzar. */}
                {links.slice(MAX_DESTINOS).map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center text-sous-titre transition-colors duration-200 ease-curato ${
                      l.active ? "text-accent" : "text-text-secondary hover:text-accent"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}

                {roleSwitch && <div className="flex flex-wrap items-center gap-fila">{roleSwitch}</div>}

                {settingsHref && (
                  <Link
                    href={settingsHref}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center gap-2 text-sous-titre text-text-secondary transition-colors duration-200 ease-curato hover:text-accent"
                  >
                    <Gear size={15} />
                    {settingsLabel}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>

    {/* Los destinos viven abajo, donde llega el pulgar. */}
    <TabBar links={links} />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu } from "iconoir-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

// Lo que no estaba en las traducciones del admin.
const EXTRA: Record<Lang, { recruiters: string; overview: string; admins: string; volver: string; cerrar: string; lema: string }> = {
  fr: { recruiters: "Recruiters", overview: "Vue d'ensemble", admins: "Administrateurs", volver: "← Retour à l'app", cerrar: "Fermer", lema: "Paris · Sur invitation" },
  en: { recruiters: "Recruiters", overview: "Overview", admins: "Administrators", volver: "← Back to the app", cerrar: "Close", lema: "Paris · By invitation" },
  es: { recruiters: "Recruiters", overview: "Resumen", admins: "Administradores", volver: "← Volver a la app", cerrar: "Cerrar", lema: "París · Con invitación" },
};

export default function AdminNavClient() {
  const { lang, setLang } = useLang();
  const t = translations[lang].admin;
  const x = EXTRA[lang] ?? EXTRA.fr;
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need document.body, which only exists after mount.
  useEffect(() => setMounted(true), []);

  // Grouped as editorial sections inside a full-screen overlay.
  const groups: { id: string; label: string; items: { href: string; label: string }[] }[] = [
    {
      id: "membres",
      label: t.navMembers,
      items: [
        { href: "/admin/creators", label: t.navCreators },
        { href: "/admin/maisons", label: t.navMaisons },
        { href: "/admin/recruiters", label: x.recruiters },
      ],
    },
    {
      id: "activite",
      label: t.navActivity,
      items: [
        { href: "/admin/overview", label: x.overview },
        { href: "/admin", label: t.navCandidatures },
        { href: "/admin/reservations", label: t.navReservations },
        { href: "/admin/suggestions", label: t.navSuggestions },
      ],
    },
    {
      id: "outils",
      label: t.navTools,
      items: [
        { href: "/admin/nuevo", label: t.navNewMember },
        { href: "/admin/qr", label: t.navQR },
        { href: "/admin/administradores", label: x.admins },
        // De vuelta a la app, para quien entra desde el teléfono.
        { href: "/dashboard", label: x.volver },
      ],
    },
  ];

  // Fade + stagger the overlay in on open; lock body scroll while open.
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setShown(true));
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
    setShown(false);
    document.body.style.overflow = "";
  }, [open]);

  // Flat index used to stagger every link's entrance.
  let idx = 0;

  return (
    <>
      {/* Slim top bar */}
      <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
          <div className="w-px h-3 bg-champagne/20" />
          <span className="font-serif text-[10px] tracking-[0.35em] uppercase text-cream/30">Admin</span>
        </div>

        {/* El menú, con su icono ☰ a la derecha como en el resto de la app
            (revisión de diseño, 2026-10-20). Idioma y salir, dentro. */}
        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-5 sm:flex">
          {LANGS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLang(key)}
              className={`font-serif text-[11px] tracking-[0.25em] transition-colors ${
                lang === key ? "text-champagne" : "text-cream/30 hover:text-cream/60"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-3 bg-champagne/20" />
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="font-serif text-[12px] tracking-[0.15em] text-cream/30 hover:text-champagne transition-colors">
              {t.navSignOut}
            </button>
          </form>
          </div>
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center text-champagne transition-colors hover:text-cream"
          >
            <Menu width={24} height={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Full-screen overlay menu, portaled to body so it escapes the
          admin header's stacking context and covers the page. */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop: warm near-black with a soft burgundy vignette */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${shown ? "opacity-100" : "opacity-0"}`}
            style={{
              background:
                "radial-gradient(120% 90% at 85% 0%, rgba(118,57,67,0.22) 0%, rgba(30,30,30,0) 55%), #1A1A1A",
            }}
          />

          <div className="relative min-h-full flex flex-col">
            {/* Overlay top bar: close + brand signature */}
            {/* Por debajo de la hora y la batería del iPhone. */}
            <div
              className="px-8 md:px-16 pt-9 flex items-center justify-between"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 36px)" }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label={x.cerrar}
                className="group inline-flex items-center gap-3 text-cream/55 hover:text-champagne transition-colors"
              >
                <span className="relative block h-5 w-5">
                  <span className="absolute top-1/2 left-0 h-px w-5 bg-current rotate-45" />
                  <span className="absolute top-1/2 left-0 h-px w-5 bg-current -rotate-45" />
                </span>
                <span className="font-serif text-[11px] tracking-[0.32em] uppercase">{x.cerrar}</span>
              </button>
              {/* El logotipo de verdad, la imagen, no uno dibujado con letras. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "13px", width: "auto", display: "block" }} />
            </div>

            {/* Editorial columns */}
            <div className="flex-1 px-8 md:px-16 py-16 md:py-20 flex items-center">
              <div className="w-full max-w-[820px] mr-auto grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-14">
                {groups.map((g) => (
                  <div key={g.id}>
                    <h3
                      className={`font-serif font-light text-cream/90 text-[13px] leading-tight tracking-[0.03em] mb-6 transition-all duration-700 ${
                        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                      }`}
                      style={{ transitionDelay: `${(idx++) * 55}ms` }}
                    >
                      {g.label}
                    </h3>
                    <ul className="space-y-4">
                      {g.items.map((it) => {
                        const delay = (idx++) * 55;
                        return (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={() => setOpen(false)}
                              className={`group inline-block font-serif text-[13px] tracking-[0.28em] uppercase text-cream/55 hover:text-champagne transition-all duration-700 ${
                                shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                              }`}
                              style={{ transitionDelay: `${delay}ms` }}
                            >
                              <span className="relative">
                                {it.label}
                                <span className="absolute -bottom-1 left-0 h-px w-0 bg-champagne transition-all duration-300 group-hover:w-full" />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlay footer */}
            <div
              className="px-8 md:px-16 pb-11 flex items-center justify-between gap-4 border-t border-champagne/12 pt-6"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
            >
              <span className="font-serif text-[10px] tracking-[0.4em] uppercase text-cream/25">{x.lema}</span>
              <div className="flex items-center gap-6">
                {LANGS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setLang(key)}
                    className={`font-serif text-[10px] tracking-[0.25em] transition-colors ${
                      lang === key ? "text-champagne" : "text-cream/30 hover:text-cream/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <form action="/api/admin/logout" method="post">
                  <button type="submit" className="font-serif text-[11px] tracking-[0.2em] uppercase text-cream/40 hover:text-champagne transition-colors">
                    {t.navSignOut}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

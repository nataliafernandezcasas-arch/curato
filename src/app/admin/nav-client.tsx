"use client";

import { useState } from "react";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

export default function AdminNavClient() {
  const { lang, setLang } = useLang();
  const t = translations[lang].admin;
  const [open, setOpen] = useState<string | null>(null);

  // Grouped into a few dropdowns so the bar stays clean.
  const groups: { id: string; label: string; items: { href: string; label: string }[] }[] = [
    {
      id: "membres",
      label: t.navMembers,
      items: [
        { href: "/admin/creators", label: t.navCreators },
        { href: "/admin/maisons", label: t.navMaisons },
      ],
    },
    {
      id: "activite",
      label: t.navActivity,
      items: [
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
      ],
    },
  ];

  return (
    <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
      {/* Backdrop to close any open dropdown on outside click */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />}

      <div className="flex items-center gap-6">
        <Link href="/">
          <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
        </Link>
        <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30">Admin</span>
        <div className="w-px h-3 bg-white/15" />

        {groups.map((g) => (
          <div key={g.id} className="relative z-50">
            <button
              onClick={() => setOpen(open === g.id ? null : g.id)}
              className={`inline-flex items-center gap-1.5 font-serif text-[12px] tracking-wider transition-colors ${
                open === g.id ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {g.label}
              <CaretDown size={11} weight="bold" className={`transition-transform ${open === g.id ? "rotate-180" : ""}`} />
            </button>
            {open === g.id && (
              <div className="absolute top-full left-0 mt-3 min-w-[190px] bg-charcoal-deep border border-white/12 shadow-xl py-2">
                {g.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(null)}
                    className="block px-5 py-2.5 font-serif text-[13px] tracking-wide text-white/70 hover:text-champagne hover:bg-white/[0.04] transition-colors"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5">
        {LANGS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLang(key)}
            className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
              lang === key ? "text-champagne" : "text-white/30 hover:text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="w-px h-3 bg-white/15" />
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="font-serif text-[12px] tracking-wider text-white/30 hover:text-white transition-colors">
            {t.navSignOut}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
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

  return (
    <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/">
          <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
        </Link>
        <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30">Admin</span>
        <div className="w-px h-3 bg-white/15" />
        <Link href="/admin" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navCandidatures}
        </Link>
        <Link href="/admin/reservations" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navReservations}
        </Link>
        <Link href="/admin/creators" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navCreators}
        </Link>
        <Link href="/admin/suggestions" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navSuggestions}
        </Link>
        <Link href="/admin/qr" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navQR}
        </Link>
        <Link href="/admin/nuevo" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
          {t.navNewMember}
        </Link>
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

"use client";

import { useLang } from "@/lib/i18n/LanguageContext";
import { Lang } from "@/lib/i18n/translations";

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

export default function AdminLangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-3">
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLang();
  const t = translations[lang].nav;

  const links = [
    { href: "/creadores", label: t.creators },
    { href: "/casas", label: t.maisons },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/Logo Curato.png"
          alt=""
          className="w-full h-full object-cover object-center scale-110"
          style={{ filter: "brightness(0.35)" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Curato" className="block">
          <img
            src="/logo-curato-simple.png"
            alt="curato"
            style={{ height: "14px", width: "auto", display: "block" }}
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-serif text-[14px] font-light px-4 py-1.5 tracking-wider transition-all duration-300 ${
                path === l.href ? "text-champagne" : "text-white/90 hover:text-champagne"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-white/25 mx-3" />
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "fr" ? "en" : lang === "en" ? "es" : "fr")}
            className="font-serif text-[12px] font-light tracking-widest text-white/75 hover:text-champagne transition-colors mr-3"
          >
            {lang === "fr" ? "EN" : lang === "en" ? "ES" : "FR"}
          </button>
          <Link
            href="/auth/sign-in"
            className="font-serif text-[13px] font-light tracking-widest text-charcoal-deep bg-champagne px-5 py-1.5 hover:bg-copper transition-all duration-300"
          >
            {t.access}
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : lang === "en" ? "es" : "fr")}
            className="font-serif text-[12px] font-light tracking-widest text-white/75 hover:text-champagne transition-colors"
          >
            {lang === "fr" ? "EN" : lang === "en" ? "ES" : "FR"}
          </button>
          <button onClick={() => setOpen(!open)} className="text-champagne p-1">
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="relative z-10 md:hidden border-t border-white/10 px-5 py-6 space-y-2 bg-black/60 backdrop-blur-md">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block font-serif text-[18px] font-light py-2 tracking-wider transition-all ${
                path === l.href ? "text-champagne" : "text-white/90"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-4">
            <Link
              href="/auth/sign-in"
              onClick={() => setOpen(false)}
              className="inline-block font-serif text-[13px] tracking-widest text-charcoal-deep bg-champagne px-6 py-2 hover:bg-copper transition-all duration-300"
            >
              {t.access}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

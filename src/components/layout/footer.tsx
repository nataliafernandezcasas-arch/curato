"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

export default function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="border-t border-border py-14 px-5 bg-charcoal-deep">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <div>
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "14px", width: "auto", display: "block" }}
            />
            <p className="font-serif text-[13px] text-text-muted mt-2 tracking-wide font-light">
              {t.footer.tagline}
            </p>
          </div>
          <div className="flex gap-8 text-[12px] text-text-muted font-serif font-light tracking-widest">
            <Link href="/creadores" className="hover:text-champagne transition-colors">{t.nav.creators}</Link>
            <Link href="/comercios" className="hover:text-champagne transition-colors">{t.nav.maisons}</Link>
            <Link href="/auth/sign-in" className="hover:text-champagne transition-colors">{t.nav.access}</Link>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-8">
          <p className="font-serif text-[11px] text-text-muted/50 font-light italic leading-relaxed">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

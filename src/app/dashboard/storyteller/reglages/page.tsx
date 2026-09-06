"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";

const LANGS: { key: Lang; label: string; name: string }[] = [
  { key: "fr", label: "FR", name: "Français" },
  { key: "en", label: "EN", name: "English" },
  { key: "es", label: "ES", name: "Español" },
];

export default function ReglagesPage() {
  const { lang, setLang } = useLang();
  const t = translations[lang].dashboard;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  }

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(t, "reglages")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={t.navSettings}
      />

      <div className="mx-auto max-w-[720px] px-5 py-10">
        <h1 className="mb-10 font-serif text-[28px] font-light uppercase leading-none tracking-[0.12em] text-white">
          {t.navSettings}
        </h1>

        <section className="mb-12">
          <p className="mb-5 font-serif text-[11px] uppercase tracking-[0.3em] text-champagne/60">
            {t.settingsLanguage}
          </p>
          <div className="flex flex-col">
            {LANGS.map(({ key, label, name }) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className={`flex items-center justify-between border-b border-white/10 py-4 text-left font-serif text-[15px] font-light transition-colors ${
                  lang === key ? "text-champagne" : "text-white/60 hover:text-white/85"
                }`}
              >
                <span>{name}</span>
                <span className="font-serif text-[11px] tracking-[0.2em]">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <button
            onClick={signOut}
            disabled={busy}
            className="flex items-center gap-2 font-serif text-[13px] tracking-wider text-white/55 transition-colors hover:text-champagne disabled:opacity-40"
          >
            <SignOut size={15} />
            {t.signOut}
          </button>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { MAISON_LINKS } from "../nav-links";
import { Button, ButtonLink } from "@/components/member/button";
import { Row } from "@/components/member/row";

const LANGS: { key: Lang; label: string; name: string }[] = [
  { key: "fr", label: "FR", name: "Français" },
  { key: "en", label: "EN", name: "English" },
  { key: "es", label: "ES", name: "Español" },
];

/** The maison's own réglages, mirroring the storyteller's: language and leaving. */
export default function MaisonReglagesPage() {
  const { lang, setLang } = useLang();
  const t = translations[lang].dashboard;
  const tb = translations[lang].business;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""))
      .catch(() => {});
  }, []);

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  }

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        eyebrow="Maison"
        links={MAISON_LINKS(tb, "reglages")}
        settingsHref="/dashboard/business/reglages"
        settingsLabel={t.navSettings}
        maxWidth="1100px"
      />

      <div className="mx-auto max-w-[720px] px-pagina py-seccion">
        <h1 className="mb-seccion text-titre uppercase tracking-titre text-text-primary">
          {t.navSettings}
        </h1>

        <section className="mb-12">
          <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">
            {t.settingsLanguage}
          </p>
          <div>
            {LANGS.map(({ key, label, name }) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className="group grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-fila text-left"
              >
                <span
                  aria-hidden
                  className={`block h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-200 ease-curato ${
                    lang === key ? "border-accent bg-accent" : "border-text-muted group-hover:border-accent"
                  }`}
                />
                <span className={`truncate text-corps ${lang === key ? "text-text-primary" : "text-text-secondary"}`}>
                  {name}
                </span>
                <span className="shrink-0 text-capitale tracking-capitale text-text-muted">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* La cuenta, que no se decía en ninguna parte. */}
        {email && (
          <section className="mb-seccion">
            <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{t.settingsAccount}</p>
            <Row
              label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.settingsEmail}</span>}
              value={<span className="break-all text-legende text-text-primary">{email}</span>}
            />
            <div className="mt-fila">
              <ButtonLink href="/auth/change-password">{t.settingsChangePassword}</ButtonLink>
            </div>
          </section>
        )}

        <section>
          {/* Salir es un botón con su caja, no un enlace gris con un icono.
              Y sin diálogo de confirmación: quien lo pulsa sabe lo que hace. */}
          <Button onClick={signOut} disabled={busy}>
            {t.signOut}
          </Button>
        </section>
      </div>
    </div>
  );
}

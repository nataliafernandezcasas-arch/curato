"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { olvidarEsteAparato } from "@/lib/native/push";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { ButtonLink } from "@/components/member/button";
import { Row } from "@/components/member/row";
import { AvisosDelTelefono } from "@/components/member/avisos-telefono";
import { BorrarCuenta } from "@/components/member/borrar-cuenta";
import { Plegable } from "@/components/member/plegable";
import { Ayuda } from "@/components/member/ayuda";

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
  const [email, setEmail] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""))
      .catch(() => {});
  }, []);

  async function signOut() {
    setBusy(true);
    await olvidarEsteAparato();
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

      <div className="mx-auto max-w-[720px] px-pagina py-seccion">
        <h1 className="mb-seccion text-titre uppercase tracking-titre text-text-primary">
          {t.navSettings}
        </h1>

        {/* Apparence (claro u oscuro) vuelve con la piel nueva: son tres
            opciones en filas de 44 px, no los dos interruptores de antes. */}

        {/* Cada apartado se abre con su flecha: cerrados, se ve de un vistazo
            qué hay en Réglages. */}
        <div className="border-t border-border">
        <Plegable titulo={t.settingsLanguage}>
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
        </Plegable>

        {/* La cuenta, que no se decía en ninguna parte. */}
        {email && (
          <Plegable titulo={t.settingsAccount}>
            <Row
              label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.settingsEmail}</span>}
              value={<span className="break-all text-legende text-text-primary">{email}</span>}
            />
            <div className="mt-fila">
              <ButtonLink href="/auth/change-password">{t.settingsChangePassword}</ButtonLink>
            </div>
          </Plegable>
        )}

        <AvisosDelTelefono espacio="storyteller" />

        <Ayuda />

        <BorrarCuenta />
        </div>

        <section className="mt-seccion">
          {/* Salir: el icono de la puerta y la palabra, sin caja (Natalia,
              2026-10-10). Sin diálogo de confirmación: quien lo pulsa sabe lo
              que hace. */}
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-secondary transition-colors duration-200 ease-curato hover:text-accent disabled:opacity-45"
          >
            <SignOut size={18} aria-hidden />
            {t.signOut}
          </button>
        </section>
      </div>
    </div>
  );
}

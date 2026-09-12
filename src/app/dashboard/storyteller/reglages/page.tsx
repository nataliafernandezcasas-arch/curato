"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { Button, ButtonLink } from "@/components/member/button";
import { Row } from "@/components/member/row";
import { Interruptor } from "@/components/member/interruptor";
import { useTema } from "@/lib/use-tema";

const LANGS: { key: Lang; label: string; name: string }[] = [
  { key: "fr", label: "FR", name: "Français" },
  { key: "en", label: "EN", name: "English" },
  { key: "es", label: "ES", name: "Español" },
];

// El modo (entrega 5, 18 · Réglages). La frase de abajo dice el estado real,
// no una instrucción genérica.
const APARIENCIA = {
  fr: {
    titulo: "Apparence",
    sombre: "Mode sombre",
    suivre: "Suivre mon téléphone",
    sigue: (claro: boolean) =>
      `Votre téléphone est en ${claro ? "clair" : "sombre"}, donc Curato aussi. Touchez Mode sombre pour décider vous-même.`,
    fijo: (claro: boolean) => `Curato reste en ${claro ? "clair" : "sombre"}, quoi que fasse votre téléphone.`,
  },
  en: {
    titulo: "Appearance",
    sombre: "Dark mode",
    suivre: "Follow my phone",
    sigue: (claro: boolean) =>
      `Your phone is in ${claro ? "light" : "dark"} mode, so Curato is too. Tap Dark mode to decide for yourself.`,
    fijo: (claro: boolean) => `Curato stays ${claro ? "light" : "dark"}, whatever your phone does.`,
  },
  es: {
    titulo: "Apariencia",
    sombre: "Modo oscuro",
    suivre: "Seguir a mi teléfono",
    sigue: (claro: boolean) =>
      `Tu teléfono está en ${claro ? "claro" : "oscuro"}, así que Curato también. Toca Modo oscuro para decidir tú.`,
    fijo: (claro: boolean) => `Curato se queda en ${claro ? "claro" : "oscuro"}, haga lo que haga tu teléfono.`,
  },
};

export default function ReglagesPage() {
  const { lang, setLang } = useLang();
  const t = translations[lang].dashboard;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const { preferencia, claro, disponible, elegir } = useTema();
  const ta = APARIENCIA[lang] ?? APARIENCIA.fr;

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
        links={STORYTELLER_LINKS(t, "reglages")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={t.navSettings}
      />

      <div className="mx-auto max-w-[720px] px-pagina py-seccion">
        <h1 className="mb-seccion text-titre uppercase tracking-titre text-text-primary claro:vidrio claro:p-[26px] claro:text-accent">
          {t.navSettings}
        </h1>

        {/* Dos interruptores cubren los tres estados, y para cambiar de modo
            se toca una sola cosa. Mientras se sigue al teléfono, Mode sombre
            refleja lo que hace el sistema; al tocarlo, la elección pasa a ser
            de la persona y el segundo se apaga solo. Donde el claro no se
            puede enseñar entero (la app de iOS antes de la versión que sabe
            cambiar su franja), la sección no aparece. */}
        {disponible && (
          <section className="mb-12 claro:vidrio claro:p-[26px]">
            <p className="mb-bloque text-capitale uppercase tracking-capitale text-accent">{ta.titulo}</p>
            <Interruptor activo={!claro} onChange={(oscuro) => elegir(oscuro ? "oscuro" : "claro")}>
              {ta.sombre}
            </Interruptor>
            <Interruptor
              activo={preferencia === "sistema"}
              onChange={(seguir) => elegir(seguir ? "sistema" : claro ? "claro" : "oscuro")}
            >
              {ta.suivre}
            </Interruptor>
            <p className="mt-bloque max-w-[36ch] text-corps text-text-secondary">
              {preferencia === "sistema" ? ta.sigue(claro) : ta.fijo(claro)}
            </p>
          </section>
        )}

        <section className="mb-12 claro:vidrio claro:p-[26px]">
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
          <section className="mb-seccion claro:vidrio claro:p-[26px]">
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

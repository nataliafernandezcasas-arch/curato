"use client";

import type { Lang } from "@/lib/i18n/translations";
import { Interruptor } from "./interruptor";
import { useTema } from "@/lib/use-tema";

// El modo (entrega 5, 18 · Réglages). La frase de abajo dice el estado real,
// no una instrucción genérica.
const TEXTOS = {
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

/**
 * Claro u oscuro, en Réglages. Los mismos dos interruptores para el
 * storyteller y la maison.
 *
 * Dos interruptores cubren los tres estados, y para cambiar de modo se toca
 * una sola cosa. Mientras se sigue al teléfono, Mode sombre refleja lo que
 * hace el sistema; al tocarlo, la elección pasa a ser de la persona y el
 * segundo se apaga solo. Donde el claro no se puede enseñar entero (la app de
 * iOS antes de la versión que sabe cambiar su franja), no aparece.
 */
export function Apariencia({ lang, className }: { lang: Lang; className?: string }) {
  const { preferencia, claro, disponible, elegir } = useTema();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  if (!disponible) return null;

  return (
    <section className={className}>
      <p className="mb-bloque text-capitale uppercase tracking-capitale text-accent">{t.titulo}</p>
      <Interruptor activo={!claro} onChange={(oscuro) => elegir(oscuro ? "oscuro" : "claro")}>
        {t.sombre}
      </Interruptor>
      <Interruptor
        activo={preferencia === "sistema"}
        onChange={(seguir) => elegir(seguir ? "sistema" : claro ? "claro" : "oscuro")}
      >
        {t.suivre}
      </Interruptor>
      <p className="mt-bloque max-w-[36ch] text-corps text-text-secondary">
        {preferencia === "sistema" ? t.sigue(claro) : t.fijo(claro)}
      </p>
    </section>
  );
}

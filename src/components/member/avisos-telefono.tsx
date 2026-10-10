"use client";

import { Plegable } from "./plegable";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { apagarAvisos, avisosApagados, enablePushNotifications, estadoDeLosAvisos } from "@/lib/native/push";

const INTERRUPTOR: Record<Lang, string> = {
  fr: "Notifications sur cet appareil",
  en: "Notifications on this device",
  es: "Avisos en este teléfono",
};

/**
 * Los avisos del teléfono, con un interruptor como el de los ajustes del
 * iPhone (Natalia, 2026-10-09): encendido recibe los avisos, apagado no.
 *
 * El texto dice qué se avisa, y solo lo que le toca a cada uno: las stories son
 * del storyteller y la demanda es de la casa.
 *
 * No se ve en el navegador: sin app instalada no hay nada que encender. Y no
 * pregunta sola al arrancar, que es como se consigue un "no" definitivo: el
 * permiso lo pide el dedo de la persona al encender el interruptor.
 *
 * Una vez dicho que no a iOS, no vuelve a preguntar nunca: el interruptor se
 * queda apagado y se dice dónde se rehace.
 */
export function AvisosDelTelefono({ espacio }: { espacio: "storyteller" | "maison" }) {
  const { lang } = useLang();
  const t = translations[lang].dashboard;
  const [estado, setEstado] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [apagados, setApagados] = useState(false);
  const [esperando, setEsperando] = useState(false);

  useEffect(() => {
    estadoDeLosAvisos()
      .then((e) => {
        setApagados(avisosApagados());
        setEstado(e);
      })
      .catch(() => {});
  }, []);

  if (!estado) return null;

  const encendido = estado === "granted" && !apagados;
  const bloqueado = estado === "denied";

  async function cambiar() {
    setEsperando(true);
    if (encendido) {
      await apagarAvisos();
      setApagados(true);
    } else {
      const listo = await enablePushNotifications();
      setEstado(listo ? "granted" : "denied");
      setApagados(!listo);
    }
    setEsperando(false);
  }

  return (
    <Plegable titulo={t.settingsNotifications}>
      <p className="mb-fila max-w-prose text-legende text-text-secondary">
        {espacio === "maison" ? t.settingsNotificationsMaison : t.settingsNotificationsStoryteller}
      </p>
      <label className={`flex min-h-11 items-center justify-between gap-fila ${bloqueado ? "opacity-50" : "cursor-pointer"}`}>
        <span className="text-corps text-text-primary">{INTERRUPTOR[lang] ?? INTERRUPTOR.fr}</span>
        <button
          type="button"
          role="switch"
          aria-checked={encendido}
          aria-label={INTERRUPTOR[lang] ?? INTERRUPTOR.fr}
          onClick={cambiar}
          disabled={esperando || bloqueado}
          className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ease-curato ${
            encendido ? "bg-sauge-vif" : "bg-white/20"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-200 ease-curato ${
              encendido ? "translate-x-[20px]" : ""
            }`}
          />
        </button>
      </label>
      {bloqueado && <p className="mt-bloque text-legende text-text-secondary">{t.settingsNotificationsBlocked}</p>}
    </Plegable>
  );
}

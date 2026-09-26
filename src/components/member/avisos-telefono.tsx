"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { Button } from "./button";
import { enablePushNotifications, estadoDeLosAvisos } from "@/lib/native/push";

/**
 * La fila que enciende los avisos del teléfono.
 *
 * El texto dice qué se avisa, y solo lo que le toca a cada uno: las stories son
 * del storyteller y la demanda es de la casa, así que un texto común hacía que
 * cada cual leyera la mitad que no era suya.
 *
 * No se ve en el navegador: sin app instalada no hay nada que encender. Y no
 * pregunta sola al arrancar, que es como se consigue un "no" definitivo: aquí
 * se dice antes de qué se avisa, y el permiso lo pide el dedo de la persona.
 *
 * Una vez dicho que no, iOS no vuelve a preguntar nunca, así que en ese caso lo
 * único honesto es decir dónde se rehace.
 */
export function AvisosDelTelefono({ espacio }: { espacio: "storyteller" | "maison" }) {
  const { lang } = useLang();
  const t = translations[lang].dashboard;
  const [estado, setEstado] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [esperando, setEsperando] = useState(false);

  useEffect(() => {
    estadoDeLosAvisos().then(setEstado).catch(() => {});
  }, []);

  if (!estado) return null;

  async function encender() {
    setEsperando(true);
    const listo = await enablePushNotifications();
    setEstado(listo ? "granted" : "denied");
    setEsperando(false);
  }

  return (
    <section className="mb-seccion">
      <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">
        {t.settingsNotifications}
      </p>
      <p className="mb-fila max-w-prose text-legende text-text-secondary">
        {espacio === "maison" ? t.settingsNotificationsMaison : t.settingsNotificationsStoryteller}
      </p>
      {estado === "granted" ? (
        <p className="text-legende text-text-primary">{t.settingsNotificationsDone}</p>
      ) : estado === "denied" ? (
        <p className="text-legende text-text-secondary">{t.settingsNotificationsBlocked}</p>
      ) : (
        <Button onClick={encender} disabled={esperando}>
          {t.settingsNotificationsOn}
        </Button>
      )}
    </section>
  );
}

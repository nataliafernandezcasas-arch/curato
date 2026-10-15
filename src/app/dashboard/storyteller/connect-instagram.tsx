"use client";

import { useCallback, useEffect, useState } from "react";
import { InstagramLogo, CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { Button } from "@/components/member/button";
import { abrirPhyllo, PHYLLO_ENV } from "@/lib/phyllo/connect";
import { getNativePlatform } from "@/lib/native/bridge";

// En el iPhone se conecta en Safari: ver el comentario de ConnectInstagram.
const SAFARI: Record<Lang, { abrir: string; nota: string; listo: string; aunNo: string }> = {
  fr: {
    abrir: "Ouvrir dans Safari",
    nota: "Instagram s'ouvre dans Safari. Connectez votre compte, puis revenez ici : touchez « ◀ Curato » en haut à gauche de l'écran.",
    listo: "J'ai connecté mon Instagram",
    aunNo: "Votre compte n'est pas encore connecté. Terminez dans Safari, puis réessayez.",
  },
  en: {
    abrir: "Open in Safari",
    nota: "Instagram opens in Safari. Connect your account, then come back here: tap “◀ Curato” at the top left of the screen.",
    listo: "I've connected my Instagram",
    aunNo: "Your account isn't connected yet. Finish in Safari, then try again.",
  },
  es: {
    abrir: "Abrir en Safari",
    nota: "Instagram se abre en Safari. Conecta tu cuenta y vuelve aquí: toca «◀ Curato» arriba a la izquierda de la pantalla.",
    listo: "Ya conecté mi Instagram",
    aunNo: "Tu cuenta aún no está conectada. Termina en Safari y vuelve a intentarlo.",
  },
};

type ErrorClave = "igErrorSession" | "igErrorInit" | "igErrorFailed";

/**
 * Conectar Instagram, con Phyllo.
 *
 * En el ordenador, la ventana de Phyllo se abre aquí mismo. En la app del
 * iPhone no puede: Instagram inicia sesión en una ventana nueva, y dentro de la
 * app una ventana nueva se abre en Safari, que no sabe nada de la de Phyllo que
 * se quedó en la app. Por eso no se conectaba desde el teléfono y había que ir
 * al ordenador (Natalia, 2026-10-15). Ahora, en la app, todo el proceso va a
 * Safari (/instagram/conectar, con el permiso de Phyllo en el enlace) y, al
 * volver, la app pregunta a Phyllo si la cuenta ya está conectada.
 */
export default function ConnectInstagram({
  connected,
  onConnected,
  className = "mb-10",
}: {
  connected: boolean;
  onConnected?: () => void;
  className?: string;
}) {
  const { lang } = useLang();
  const t = translations[lang].dashboard;
  const ts = SAFARI[lang] ?? SAFARI.fr;
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "safari" | "done" | "error">(connected ? "done" : "idle");
  const [enlace, setEnlace] = useState<string | null>(null);
  const [aunNo, setAunNo] = useState(false);
  // La clave del mensaje, no el texto: así sigue al idioma.
  const [error, setError] = useState<ErrorClave | null>(null);

  const conectada = useCallback(() => {
    setStatus("done");
    onConnected?.();
  }, [onConnected]);

  // Pregunta si la cuenta ya está conectada y trae sus cifras.
  const comprobar = useCallback(
    async (avisar: boolean) => {
      const res = await fetch("/api/phyllo/sync-engagement", { method: "POST" }).catch(() => null);
      if (res?.ok) return conectada();
      if (avisar) setAunNo(true);
    },
    [conectada]
  );

  // De vuelta de Safari, la app vuelve a estar a la vista: se comprueba sola.
  useEffect(() => {
    if (status !== "safari") return;
    const alVolver = () => document.visibilityState === "visible" && void comprobar(false);
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [status, comprobar]);

  async function connect() {
    setStatus("loading");
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { data: { user } } = await createClient().auth.getUser();
      if (!user?.email) {
        setError("igErrorSession");
        setStatus("error");
        return;
      }

      const res = await fetch("/api/phyllo/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, phyllo_consent: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.sdk_token) {
        // La ruta manda un código; aquí solo importa si la sesión caducó.
        setError(data.code === "auth" ? "igErrorSession" : "igErrorInit");
        setStatus("error");
        return;
      }

      // En la app: a Safari. El permiso va detrás de #, que no viaja al
      // servidor ni queda en ningún registro.
      if (getNativePlatform()) {
        const datos = new URLSearchParams({ u: data.user_id, t: data.sdk_token, e: PHYLLO_ENV, l: lang });
        setEnlace(`${window.location.origin}/instagram/conectar#${datos.toString()}`);
        setStatus("safari");
        return;
      }

      await abrirPhyllo(data.user_id, data.sdk_token, {
        conectada: async () => {
          await fetch("/api/phyllo/sync-engagement", { method: "POST" }).catch(() => null);
          conectada();
        },
        salida: () => setStatus((s) => (s === "done" ? s : "idle")),
        fallo: () => {
          setError("igErrorFailed");
          setStatus("error");
        },
      });
    } catch (e) {
      console.error("Phyllo connect error:", e);
      setError("igErrorFailed");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className={`caja-cristal flex items-center gap-3 px-6 py-4 ${className}`}>
        <CheckCircle size={18} weight="thin" className="shrink-0 text-accent" />
        <p className="text-legende text-text-secondary">{t.igConnected}</p>
      </div>
    );
  }

  return (
    <div className={`caja-cristal px-6 py-5 ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <InstagramLogo size={20} weight="thin" className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="mb-1 text-corps text-text-primary">{t.igTitle}</p>
          <p className="text-legende text-text-secondary">{t.igDesc}</p>
        </div>
      </div>

      {status === "safari" && enlace ? (
        <>
          <p className="mb-4 text-legende text-text-secondary">{ts.nota}</p>
          {/* Un enlace de verdad, tocado con el dedo: la app solo abre Safari
              con un toque, no desde código. */}
          <a
            href={enlace}
            target="_blank"
            rel="noopener"
            className="boton-cristal w-full"
          >
            {ts.abrir}
          </a>
          <button
            type="button"
            onClick={() => {
              setAunNo(false);
              void comprobar(true);
            }}
            className="mt-fila flex min-h-11 w-full items-center justify-center text-capitale uppercase tracking-capitale text-accent"
          >
            {ts.listo}
          </button>
          {aunNo && <p className="mt-bloque text-legende text-copper-vif">{ts.aunNo}</p>}
        </>
      ) : (
        <>
          <label className="mb-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 accent-accent"
            />
            <span className="text-legende text-text-secondary">{t.igConsent}</span>
          </label>

          {error && <p className="mb-3 border-l border-copper-vif pl-3 text-legende text-copper-vif">{t[error]}</p>}

          <Button type="button" onClick={connect} disabled={!consent || status === "loading"}>
            {status === "loading" ? t.igConnecting : t.igButton}
          </Button>
        </>
      )}
    </div>
  );
}

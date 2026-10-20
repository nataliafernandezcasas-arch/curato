"use client";

import { useEffect, useState } from "react";
import { CheckCircle, InstagramLogo } from "@/components/member/iconos";
import { Button } from "@/components/member/button";
import { abrirPhyllo } from "@/lib/phyllo/connect";
import type { Lang } from "@/lib/i18n/translations";

const TEXTOS: Record<Lang, { titulo: string; nota: string; boton: string; abriendo: string; listo: string; volver: string; fallo: string; sinDatos: string }> = {
  fr: {
    titulo: "Connecter votre Instagram",
    nota: "Connectez-vous à Instagram dans la fenêtre qui s'ouvre. Curato ne voit jamais votre mot de passe.",
    boton: "Connecter mon Instagram",
    abriendo: "Ouverture…",
    listo: "C'est fait, votre Instagram est connecté.",
    volver: "Revenez dans l'app Curato : touchez « ◀ Curato » en haut à gauche de l'écran.",
    fallo: "La connexion n'a pas abouti. Réessayez.",
    sinDatos: "Ce lien a expiré. Revenez dans l'app Curato et touchez de nouveau « Connecter mon Instagram ».",
  },
  en: {
    titulo: "Connect your Instagram",
    nota: "Sign in to Instagram in the window that opens. Curato never sees your password.",
    boton: "Connect my Instagram",
    abriendo: "Opening…",
    listo: "Done, your Instagram is connected.",
    volver: "Go back to the Curato app: tap “◀ Curato” at the top left of the screen.",
    fallo: "The connection didn't go through. Try again.",
    sinDatos: "This link has expired. Go back to the Curato app and tap “Connect my Instagram” again.",
  },
  es: {
    titulo: "Conectar tu Instagram",
    nota: "Inicia sesión en Instagram en la ventana que se abre. Curato nunca ve tu contraseña.",
    boton: "Conectar mi Instagram",
    abriendo: "Abriendo…",
    listo: "Listo, tu Instagram está conectado.",
    volver: "Vuelve a la app de Curato: toca «◀ Curato» arriba a la izquierda de la pantalla.",
    fallo: "La conexión no salió bien. Vuelve a intentarlo.",
    sinDatos: "Este enlace ha caducado. Vuelve a la app de Curato y toca otra vez «Conectar mi Instagram».",
  },
};

type Datos = { u: string; t: string; e: string; l: Lang };

function leerDatos(): Datos | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.hash.slice(1));
  const u = p.get("u");
  const t = p.get("t");
  if (!u || !t) return null;
  const l = p.get("l");
  return { u, t, e: p.get("e") || "staging", l: l === "en" || l === "es" ? l : "fr" };
}

/**
 * Conectar Instagram desde el iPhone, en Safari.
 *
 * Dentro de la app no se puede: Instagram inicia sesión en una ventana nueva y
 * la app las abre en Safari, lejos de la ventana de Phyllo. La app trae aquí,
 * a Safari, el permiso de Phyllo detrás de # (no llega al servidor), y aquí
 * pasa todo el proceso. Sin sesión de Curato: no hace falta, el permiso basta.
 * Al volver a la app, ella misma comprueba que la cuenta quedó conectada.
 */
export default function ConectarInstagram() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [leido, setLeido] = useState(false);
  const [estado, setEstado] = useState<"listo" | "abriendo" | "hecho" | "fallo">("listo");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el # solo existe en el navegador
    setDatos(leerDatos());
    setLeido(true);
  }, []);

  const t = TEXTOS[datos?.l ?? "fr"];

  async function abrir() {
    if (!datos) return;
    setEstado("abriendo");
    try {
      await abrirPhyllo(
        datos.u,
        datos.t,
        {
          conectada: () => setEstado("hecho"),
          salida: () => setEstado((s) => (s === "hecho" ? s : "listo")),
          fallo: () => setEstado("fallo"),
        },
        datos.e
      );
    } catch {
      setEstado("fallo");
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface px-pagina">
      <div className="w-full max-w-[360px] py-respiro text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-curato-simple.png" alt="curato" className="mx-auto mb-rango h-[20px] w-auto" />
        {!leido ? null : !datos ? (
          <p className="text-corps text-text-secondary">{t.sinDatos}</p>
        ) : estado === "hecho" ? (
          <>
            <CheckCircle size={36} weight="thin" className="mx-auto mb-fila text-sauge-vif" />
            <p className="text-corps text-text-primary">{t.listo}</p>
            <p className="mt-fila text-legende text-text-secondary">{t.volver}</p>
          </>
        ) : (
          <>
            <InstagramLogo size={32} weight="thin" className="mx-auto mb-fila text-accent" />
            <h1 className="font-titulo text-[20px] uppercase tracking-titre text-text-primary">{t.titulo}</h1>
            <p className="mt-fila text-legende text-text-secondary">{t.nota}</p>
            <div className="mt-rango">
              <Button full onClick={abrir} disabled={estado === "abriendo"}>
                {estado === "abriendo" ? t.abriendo : t.boton}
              </Button>
            </div>
            {estado === "fallo" && <p className="mt-fila text-legende text-copper-vif">{t.fallo}</p>}
          </>
        )}
      </div>
    </main>
  );
}

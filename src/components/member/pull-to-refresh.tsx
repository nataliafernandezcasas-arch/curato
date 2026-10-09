"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";

/**
 * Tirar para actualizar.
 *
 * Sin botón de recargar. El gesto es el que ya hace todo el mundo sin
 * pensarlo, y la cabecera aparece con él y se va sola. En vez de texto, un
 * círculo en champagne (Natalia, 2026-10-09): se va cerrando mientras se tira,
 * gira mientras actualiza y se va cuando termina.
 *
 * Solo actúa cuando la página está arriba del todo: si no, tirar hacia abajo es
 * scroll normal y secuestrarlo sería insufrible.
 */
const TIRON = 64;

// Solo para lectores de pantalla: lo que se ve es el círculo.
const TEXTOS = {
  fr: { trabajando: "Actualisation…", listo: "À jour" },
  en: { trabajando: "Refreshing…", listo: "Up to date" },
  es: { trabajando: "Actualizando…", listo: "Al día" },
};

const RADIO = 10;
const VUELTA = 2 * Math.PI * RADIO;

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void> | void; children: React.ReactNode }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [tirado, setTirado] = useState(0);
  const [estado, setEstado] = useState<"reposo" | "trabajando" | "listo">("reposo");
  const inicioY = useRef<number | null>(null);

  useEffect(() => {
    if (estado !== "listo") return;
    const id = setTimeout(() => setEstado("reposo"), 300);
    return () => clearTimeout(id);
  }, [estado]);

  function empezar(e: React.TouchEvent) {
    if (window.scrollY > 0 || estado === "trabajando") return;
    inicioY.current = e.touches[0].clientY;
  }

  function seguir(e: React.TouchEvent) {
    if (inicioY.current === null) return;
    const delta = e.touches[0].clientY - inicioY.current;
    // Resistencia: el dedo recorre el doble de lo que baja la cabecera.
    setTirado(delta > 0 ? Math.min(delta / 2, TIRON * 1.5) : 0);
  }

  async function terminar() {
    if (inicioY.current === null) return;
    const suficiente = tirado >= TIRON;
    inicioY.current = null;
    setTirado(0);
    if (!suficiente) return;
    setEstado("trabajando");
    try {
      await onRefresh();
      setEstado("listo");
    } catch {
      setEstado("reposo");
    }
  }

  // Cuánto del círculo se ha dibujado: lleno al llegar al tirón que actualiza.
  const avance = estado === "reposo" ? Math.min(tirado / TIRON, 1) : estado === "trabajando" ? 0.75 : 1;

  return (
    <div onTouchStart={empezar} onTouchMove={seguir} onTouchEnd={terminar}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-curato"
        style={{ height: estado === "reposo" && tirado === 0 ? 0 : Math.max(tirado, estado === "reposo" ? 0 : 48) }}
        role="status"
        aria-live="polite"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          aria-hidden
          className={estado === "trabajando" ? "animate-spin [animation-duration:0.9s]" : ""}
          style={{ opacity: estado === "reposo" ? Math.min(tirado / (TIRON * 0.5), 1) : 1 }}
        >
          <circle cx="13" cy="13" r={RADIO} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
          <circle
            cx="13"
            cy="13"
            r={RADIO}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-accent"
            strokeDasharray={VUELTA}
            strokeDashoffset={VUELTA * (1 - avance)}
            transform="rotate(-90 13 13)"
          />
        </svg>
        <span className="sr-only">{estado === "trabajando" ? t.trabajando : estado === "listo" ? t.listo : ""}</span>
      </div>
      {children}
    </div>
  );
}

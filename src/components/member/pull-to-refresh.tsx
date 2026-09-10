"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";

/**
 * Tirar para actualizar.
 *
 * Sin botón de recargar y sin rueda girando. El gesto es el que ya hace todo el
 * mundo sin pensarlo, y la cabecera aparece con él y se va sola.
 *
 * Solo actúa cuando la página está arriba del todo: si no, tirar hacia abajo es
 * scroll normal y secuestrarlo sería insufrible.
 */
const TIRON = 64;

const TEXTOS = {
  fr: { tirar: "Tirer", soltar: "Relâcher pour actualiser", listo: "À jour" },
  en: { tirar: "Pull", soltar: "Release to refresh", listo: "Up to date" },
  es: { tirar: "Tira", soltar: "Suelta para actualizar", listo: "Al día" },
};

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void> | void; children: React.ReactNode }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [tirado, setTirado] = useState(0);
  const [estado, setEstado] = useState<"reposo" | "trabajando" | "listo">("reposo");
  const inicioY = useRef<number | null>(null);

  useEffect(() => {
    if (estado !== "listo") return;
    const id = setTimeout(() => setEstado("reposo"), 1600);
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

  const etiqueta =
    estado === "listo" ? t.listo : estado === "trabajando" ? t.soltar : tirado >= TIRON ? t.soltar : t.tirar;

  return (
    <div onTouchStart={empezar} onTouchMove={seguir} onTouchEnd={terminar}>
      <div
        className="overflow-hidden text-center transition-[height] duration-200 ease-curato"
        style={{ height: estado === "reposo" && tirado === 0 ? 0 : Math.max(tirado, estado === "reposo" ? 0 : 32) }}
      >
        <span
          className={`text-capitale uppercase tracking-capitale ${
            estado === "listo" ? "text-sauge-vif" : "text-text-muted"
          }`}
        >
          {etiqueta}
        </span>
      </div>
      {children}
    </div>
  );
}

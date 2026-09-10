"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * El visor a pantalla completa.
 *
 * Se abre en la fotografía que se estaba mirando, y las demás se recorren
 * dentro sin salir. Sin marco y sin negro puro: el fondo es el negro de la
 * marca a punto de cerrarse, no un agujero.
 *
 * Sin pellizcar para ampliar, a propósito. Son fotografías de casas, no mapas:
 * nadie necesita ver el grano de un mantel, y el gesto de ampliar se come el de
 * pasar a la siguiente.
 */
export function Viewer({
  photos,
  index,
  onClose,
  caption,
  protect = false,
}: {
  photos: string[];
  /** null cierra el visor. */
  index: number | null;
  onClose: () => void;
  caption?: string;
  /**
   * Fotografías que se miran pero no se guardan, como el portafolio de un
   * creador: sin menú de "guardar imagen" al mantener pulsado. No impide una
   * captura de pantalla, pero sí que guardarla sea el gesto fácil.
   */
  protect?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const pistaRef = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(index ?? 0);
  const abierto = index !== null;

  // Escape cierra, y el fondo deja de moverse mientras esto está encima.
  useEffect(() => {
    if (!abierto) return;
    setActual(index ?? 0);
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [abierto, index, onClose]);

  // Arranca en la que se estaba mirando, sin animar hasta ella.
  useEffect(() => {
    const pista = pistaRef.current;
    if (!abierto || !pista) return;
    pista.scrollTo({ left: (index ?? 0) * pista.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [abierto, index]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-surface"
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between px-pagina py-fila">
            <span className="text-capitale uppercase tracking-capitale tabular-nums text-text-secondary">
              {actual + 1} / {photos.length}
            </span>
            <button
              onClick={onClose}
              className="min-h-11 text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
            >
              Fermer
            </button>
          </div>

          <div
            ref={pistaRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setActual(Math.round(el.scrollLeft / (el.clientWidth || 1)));
            }}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((url, i) => (
              <div key={i} className="flex w-full shrink-0 snap-center items-center justify-center px-pagina">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  draggable={false}
                  onContextMenu={protect ? (e) => e.preventDefault() : undefined}
                  className={`max-h-full max-w-full object-contain ${protect ? "select-none [-webkit-touch-callout:none]" : ""}`}
                />
              </div>
            ))}
          </div>

          {caption && (
            <p className="px-pagina py-fila text-center text-legende text-text-secondary">{caption}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

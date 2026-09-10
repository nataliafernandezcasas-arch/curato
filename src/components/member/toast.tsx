"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tono } from "./state-mark";

/**
 * El aviso que aparece y se va.
 *
 * Es la marca de estado tumbada: el mismo filete de 2 px, ahora de pie en el
 * canto izquierdo. No es una caja nueva, así que no abre ninguna excepción a la
 * regla de las cajas. Se separa del fondo por profundidad (un negro más hondo
 * que la pantalla), no por un borde.
 *
 * Se apoya encima de la barra de abajo, nunca sobre ella. Uno cada vez: si
 * llega otro, sustituye al primero. Entra en 260 ms subiendo 8 px y sale en
 * 140 ms solo con opacidad. Lo cumplido dura 4 s; lo que tiene plazo o se ha
 * caído, 7. Un error con reintento no se va solo: espera al toque.
 */
export type Aviso = { id: number; tono: Tono; texto: string; persistente?: boolean };

const FILETE: Record<Tono, string> = {
  cumplido: "bg-sauge-vif",
  plazo: "bg-copper-vif",
  caido: "bg-burgundy-vif",
};
const DURACION: Record<Tono, number> = { cumplido: 4000, plazo: 7000, caido: 7000 };

/** Un aviso cada vez: mostrar otro sustituye al que hubiera. */
export function useToast() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const siguiente = useRef(0);
  const mostrar = useCallback((texto: string, tono: Tono = "cumplido", persistente = false) => {
    siguiente.current += 1;
    setAviso({ id: siguiente.current, tono, texto, persistente });
  }, []);
  const cerrar = useCallback(() => setAviso(null), []);
  return { aviso, mostrar, cerrar };
}

export function Toast({ aviso, onClose }: { aviso: Aviso | null; onClose: () => void }) {
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!aviso || aviso.persistente) return;
    const t = setTimeout(onClose, DURACION[aviso.tono]);
    return () => clearTimeout(t);
  }, [aviso, onClose]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 px-pagina"
      // Encima de la barra de destinos (56 px) y de la zona segura, con aire.
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
    >
      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.id}
            role={aviso.tono === "caido" ? "alert" : "status"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: reduce ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            onClick={aviso.persistente ? onClose : undefined}
            className={`relative mx-auto max-w-[480px] py-fila pl-fila pr-fila ${aviso.persistente ? "pointer-events-auto cursor-pointer" : ""}`}
            style={{ backgroundColor: "rgba(20,20,20,0.92)" }}
          >
            <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] ${FILETE[aviso.tono]}`} />
            <p className="text-legende text-text-primary">{aviso.texto}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

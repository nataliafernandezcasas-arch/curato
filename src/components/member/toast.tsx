"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock, WarningCircle } from "@/components/member/iconos";
import type { Tono } from "./state-mark";

/**
 * El aviso que aparece y se va.
 *
 * Una tarjeta oscura con un círculo de color y su icono, el título y, si lo
 * hay, una línea que explica qué ha pasado (Natalia eligió esta entre cinco,
 * 2026-10-15). El color dice el tono: salvia lo cumplido, cobre lo que tiene
 * plazo, burdeos lo que se ha caído.
 *
 * Se apoya encima de la barra de abajo, nunca sobre ella. Uno cada vez: si
 * llega otro, sustituye al primero. Entra en 260 ms subiendo 8 px y sale en
 * 140 ms solo con opacidad. Lo cumplido dura 4 s; lo que tiene plazo o se ha
 * caído, 7. Un error con reintento no se va solo: espera al toque.
 */
export type Aviso = { id: number; tono: Tono; texto: string; detalle?: string; persistente?: boolean };

const CIRCULO: Record<Tono, { fondo: string; icono: string }> = {
  cumplido: { fondo: "bg-sauge-vif/20", icono: "text-sauge-vif" },
  plazo: { fondo: "bg-copper-vif/20", icono: "text-copper-vif" },
  caido: { fondo: "bg-burgundy-vif/25", icono: "text-copper-vif" },
};
const ICONO: Record<Tono, typeof Check> = { cumplido: Check, plazo: Clock, caido: WarningCircle };
const DURACION: Record<Tono, number> = { cumplido: 4000, plazo: 7000, caido: 7000 };

/** Un aviso cada vez: mostrar otro sustituye al que hubiera. */
export function useToast() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const siguiente = useRef(0);
  const mostrar = useCallback((texto: string, tono: Tono = "cumplido", persistente = false, detalle?: string) => {
    siguiente.current += 1;
    setAviso({ id: siguiente.current, tono, texto, persistente, detalle });
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
            className={`caja-cristal mx-auto flex max-w-[480px] items-center gap-3 !bg-[#1a1a1a]/90 px-4 py-3 shadow-2xl ${aviso.persistente ? "pointer-events-auto cursor-pointer" : ""}`}
          >
            <Circulo tono={aviso.tono} />
            <div className="min-w-0">
              <p className="text-corps text-text-primary">{aviso.texto}</p>
              {aviso.detalle && <p className="text-legende text-text-secondary">{aviso.detalle}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Circulo({ tono }: { tono: Tono }) {
  const Icono = ICONO[tono];
  return (
    <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${CIRCULO[tono].fondo}`}>
      <Icono size={18} weight="bold" className={CIRCULO[tono].icono} />
    </span>
  );
}

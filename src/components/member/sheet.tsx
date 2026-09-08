"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Una hoja que sube desde abajo, para elecciones cortas.
 *
 * Sustituye a los diálogos centrados. En un teléfono un diálogo en el medio
 * queda lejos del pulgar y tapa lo que estabas mirando; una hoja abajo se
 * alcanza y deja ver el contexto por encima.
 *
 * Se aplica al tocar, sin botón de aceptar: si hay que confirmar una elección
 * de una sola cosa, la elección no estaba clara.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* El fondo se atenúa, no se cubre de negro: sigues sabiendo dónde estás. */}
          <motion.button
            aria-label="Fermer"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-surface/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-surface px-pagina pt-rango backdrop-blur-sm"
            style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: reduce ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {title && (
              <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{title}</p>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

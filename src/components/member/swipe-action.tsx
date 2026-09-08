"use client";

import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useState } from "react";

/**
 * Deslizar una fila para actuar.
 *
 * La fila se arrastra a la izquierda y aparece **una sola** acción: la que toca
 * según el estado, nunca dos, y nunca una destructiva sin decir antes qué pasa.
 *
 * El gesto es un atajo, no la única vía. El mismo botón sigue dentro de la
 * visita, porque un gesto que nadie descubre no es una función: quien lo
 * encuentre irá más rápido, quien no, seguirá pudiendo.
 */
const APERTURA = 96;

export function SwipeAction({
  action,
  onAction,
  children,
}: {
  /** Una palabra. Si hacen falta dos, la acción no estaba clara. */
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const [abierto, setAbierto] = useState(false);
  const opacidad = useTransform(x, [-APERTURA, -APERTURA / 3, 0], [1, 0.4, 0]);

  // Con movimiento reducido el gesto sobra: queda el botón de dentro.
  if (reduce) return <>{children}</>;

  return (
    <div className="relative">
      <motion.div
        style={{ opacity: opacidad }}
        className="absolute inset-y-0 right-0 flex items-center"
      >
        <button
          type="button"
          onClick={() => {
            onAction();
            x.set(0);
            setAbierto(false);
          }}
          className="min-h-11 px-fila text-capitale uppercase tracking-capitale text-accent"
        >
          {action}
        </button>
      </motion.div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -APERTURA, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          const abrir = info.offset.x < -APERTURA / 2;
          setAbierto(abrir);
          x.set(abrir ? -APERTURA : 0);
        }}
        animate={{ x: abierto ? -APERTURA : 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Una pantalla que entra desde la derecha.
 *
 * En una app, abrir un detalle viene de un lado y volver lo devuelve. En una
 * web aparece y ya está, y esa es una de las dos cosas que hacían que esto
 * pareciera una página.
 *
 * El desplazamiento es corto a propósito. Una entrada del ancho completo obliga
 * al navegador a componer toda la pantalla y en el WebView se ve a tirones; 32
 * píxeles con la opacidad bastan para que el ojo lea "esto viene de la
 * derecha", que es lo único que hay que decir.
 */
export function SlideIn({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      // Recorta por si el desplazamiento asomara: una barra horizontal en un
      // teléfono es justo la queja de la que venimos.
      className="overflow-x-clip"
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

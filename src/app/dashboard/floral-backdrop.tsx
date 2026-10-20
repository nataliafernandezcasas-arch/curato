"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The flower behind every dashboard.
 *
 * It used to be a plain `fixed` image. On iOS that is the one layout Safari
 * handles badly: during a momentum scroll the fixed layer is repainted a beat
 * behind the content, so the flower judders instead of sitting still. Inside
 * the native WebView it was the first thing you noticed.
 *
 * Then the layer was composited and moved by transform, driven by scroll through
 * a soft spring. Two things come out of that. The judder goes, because a
 * transform on its own layer never waits for a repaint. And the image trails
 * the finger by a fraction of a second instead of locking to it, which is what
 * makes the movement feel like it is being dragged rather than stepped.
 *
 * The travel is deliberately small. This is a backdrop behind text, not a
 * parallax showpiece: past roughly 8% the flower starts pulling the eye away
 * from what the person came to read.
 *
 * The veil is heavy for the same reason. The flower has a pale, busy centre,
 * and text sitting over it was unreadable at 0.65. Legibility wins over seeing
 * more of the photograph.
 *
 * La imagen y el velo vienen de .fondo-flor y .fondo-flor-velo (globals.css),
 * así que ninguna pantalla escribe la ruta ni el color.
 */
export default function FloralBackdrop({
  opacity = 0.8,
  breathe = false,
}: {
  opacity?: number;
  /** Para las pantallas sin scroll: la flor deriva muy despacio, en bucle.
      Es el único bucle del producto. */
  breathe?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        // Quieta al hacer scroll: moverse detrás del texto costaba leerlo
        // (revisión de diseño, 2026-10-20). Sigue en su propia capa, así que
        // no tiembla en iOS.
        className="absolute inset-0 h-full w-full will-change-transform"
        animate={reduce || !breathe ? undefined : { scale: [1, 1.008, 1] }}
        transition={reduce || !breathe ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <div aria-hidden className="fondo-flor h-full w-full" />
      </motion.div>
      <div className="fondo-flor-velo absolute inset-0" style={{ "--velo": opacity } as React.CSSProperties} />
    </div>
  );
}

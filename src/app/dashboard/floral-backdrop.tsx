"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * The flower behind every dashboard.
 *
 * It used to be a plain `fixed` image. On iOS that is the one layout Safari
 * handles badly: during a momentum scroll the fixed layer is repainted a beat
 * behind the content, so the flower judders instead of sitting still. Inside
 * the native WebView it was the first thing you noticed.
 *
 * Now the layer is composited and moved by transform, driven by scroll through
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
 */
export default function FloralBackdrop({ opacity = 0.8 }: { opacity?: number }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  // Low stiffness and high damping give the lag. Stiffer than this and it
  // snaps to the finger, which reads as the old jitter all over again.
  const eased = useSpring(scrollY, { stiffness: 38, damping: 24, mass: 0.7 });
  const y = useTransform(eased, [0, 2400], ["0%", "-8%"]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        // Oversized so the drift never exposes an edge.
        className="absolute inset-0 h-[112%] w-full will-change-transform"
        style={reduce ? undefined : { y }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/flor-bg.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
          draggable={false}
        />
      </motion.div>
      <div className="absolute inset-0 bg-charcoal-deep" style={{ opacity }} />
    </div>
  );
}

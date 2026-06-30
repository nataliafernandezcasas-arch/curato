"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useVelocity,
  useSpring,
  useAnimationFrame,
  useMotionValue,
  wrap,
} from "framer-motion";

/* ── Mouse-follow parallax image ──────────────────────────────────────────────
   The image drifts opposite the cursor (mostly sideways) for an interactive,
   alive feel. Tracks the pointer across the whole section it fills. */
export function MouseParallaxImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  overlay,
  strength = 7,
  zoom = 1,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  overlay?: string;
  strength?: number;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });
  const x = useTransform(sx, [0, 1], [`${strength}%`, `-${strength}%`]);
  const y = useTransform(sy, [0, 1], [`${strength * 0.5}%`, `-${strength * 0.5}%`]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) {
        mx.set((e.clientX - rect.left) / rect.width);
        my.set((e.clientY - rect.top) / rect.height);
      } else {
        mx.set(0.5);
        my.set(0.5);
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // Oversize the image so the drift never reveals an edge (zoom can crop further).
  const scale = zoom + (strength * 2) / 100 + 0.04;

  return (
    <div ref={ref} className={`overflow-hidden ${/\b(absolute|fixed|sticky|relative)\b/.test(className) ? "" : "relative"} ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ x, y, scale }}
        className={`w-full h-full object-cover object-center will-change-transform ${imgClassName}`}
      />
      {overlay && <div className={`absolute inset-0 ${overlay}`} />}
    </div>
  );
}

/* ── Parallax image ──────────────────────────────────────────────────────────
   The <img> is oversized (scale) so it can drift on the Y axis as the section
   crosses the viewport without ever revealing an edge. */
export function ParallaxImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  strength = 80,
  overlay,
  caption,
  zoom = 1,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  strength?: number;
  overlay?: string;
  caption?: React.ReactNode;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);

  // When zoomed in (to crop baked-in text), the scale provides the headroom for
  // the drift; otherwise the image is oversized via height so an edge never shows.
  const zoomed = zoom > 1;

  return (
    <div ref={ref} className={`overflow-hidden ${/\b(absolute|fixed|sticky|relative)\b/.test(className) ? "" : "relative"} ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={zoomed ? { y, scale: zoom } : { y }}
        className={
          zoomed
            ? `absolute inset-0 w-full h-full object-cover object-center will-change-transform ${imgClassName}`
            : `absolute left-0 top-[-30%] w-full h-[160%] object-cover object-center will-change-transform ${imgClassName}`
        }
      />
      {overlay && <div className={`absolute inset-0 ${overlay}`} />}
      {caption}
    </div>
  );
}

/* ── Velocity-reactive marquee ────────────────────────────────────────────────
   Drifts continuously; scroll speed bends and reverses it (noartmusic feel). */
export function Marquee({
  items,
  baseVelocity = 2,
  className = "",
}: {
  items: string[];
  baseVelocity?: number;
  className?: string;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);
  const directionFactor = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  const block = (
    <span className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          {it}
          <span className="mx-8 text-champagne/40">&#9670;</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={`overflow-hidden whitespace-nowrap flex flex-nowrap ${className}`}>
      <motion.div className="flex flex-nowrap" style={{ x }}>
        {block}
        {block}
        {block}
        {block}
      </motion.div>
    </div>
  );
}

/* ── Line reveal ──────────────────────────────────────────────────────────────
   A single line of type masked behind overflow-hidden, sliding up on mount. */
export function RevealLine({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  // box-content + horizontal padding cancelled by negative margin: gives the
  // mask horizontal slack so wide lines (e.g. "UNE CAMPAGNE.") aren't clipped
  // on the sides, while overflow-hidden still masks the vertical slide reveal.
  return (
    <span className="box-content block overflow-hidden px-[0.75em] -mx-[0.75em]">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`block ${className}`}
      >
        {children}
      </motion.span>
    </span>
  );
}

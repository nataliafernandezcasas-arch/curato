"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

// Footer link with an underline that grows from the left on hover.
const linkCls =
  "relative font-serif hover:text-champagne transition-colors duration-300 " +
  "after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-champagne " +
  "after:transition-all after:duration-300 hover:after:w-full";

export default function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  // Image drifts a few % opposite the cursor for a parallax feel.
  const imgX = useTransform(sx, [0, 1], ["6%", "-6%"]);
  const imgY = useTransform(sy, [0, 1], ["6%", "-6%"]);

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function recenter() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <footer
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={recenter}
      className="relative overflow-hidden border-t border-border py-16 px-5 bg-charcoal-deep"
    >
      {/* Floral backdrop that drifts with the cursor, lightly darkened. */}
      <div className="absolute inset-0">
        <motion.img
          src="/footer-floral.jpeg"
          alt=""
          style={{ x: imgX, y: imgY, scale: 1.2 }}
          className="w-full h-full object-cover object-center will-change-transform"
        />
        <div className="absolute inset-0 bg-charcoal-deep/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-[1200px] mx-auto"
      >
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <div>
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "14px", width: "auto", display: "block" }}
            />
            <p className="font-serif text-[13px] text-text-secondary mt-2 tracking-wide font-light">
              {t.footer.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12px] text-text-primary/80 font-light tracking-widest">
            <Link href="/storytellers" className={linkCls}>{t.nav.creators}</Link>
            <Link href="/casas" className={linkCls}>{t.nav.maisons}</Link>
            <Link href="/auth/sign-in" className={linkCls}>{t.nav.access}</Link>
            <Link href="/faq" className={linkCls}>{t.footer.faq}</Link>
            <Link href="/privacidad" className={linkCls}>{t.footer.privacy}</Link>
            <Link href="/condiciones" className={linkCls}>{t.footer.terms}</Link>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-8">
          <p className="font-serif text-[11px] text-text-muted font-light italic leading-relaxed">
            {t.footer.copyright}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}

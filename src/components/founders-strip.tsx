"use client";

import { motion } from "framer-motion";

type Founder = {
  number: number;
  /** Si hay name + photo, muestra el founder. Si faltan, se muestra mystery tile. */
  name?: string;
  handle?: string;
  photo?: string;
};

// Para revelar un founder: agrega name + handle (+ opcionalmente photo).
// Sin esos campos se muestra como mystery tile (queda elegante para el día del lanzamiento).
const FOUNDERS: Founder[] = [
  { number: 1 },
  { number: 2 },
  { number: 3 },
  { number: 4 },
  { number: 5 },
  { number: 6 },
  { number: 7 },
  { number: 8 },
  { number: 9 },
  { number: 10 },
];

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
});

export default function FoundersStrip() {
  const revealedCount = FOUNDERS.filter((f) => f.name && f.photo).length;
  const remaining = Math.max(0, 100 - FOUNDERS.length);

  return (
    <section className="py-24 border-b border-border overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 mb-12">
        <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">
          Founders · primeros 100
        </motion.p>
        <motion.h2 {...fade(0.1)} className="text-3xl md:text-4xl font-extralight tracking-tighter leading-[1] text-text-primary mb-4 max-w-[640px]">
          {revealedCount === 0 ? (
            <>
              Las primeras voces. <span className="font-medium">Se revelan el 13.05.</span>
            </>
          ) : (
            <>
              Las primeras voces. <span className="font-medium">Únicas, numeradas, elegidas.</span>
            </>
          )}
        </motion.h2>
        <motion.p {...fade(0.18)} className="text-sm text-text-muted leading-relaxed max-w-[540px]">
          {revealedCount === 0
            ? "Los 100 creadores que abren Midi Pass se revelan al mismo tiempo el día del lanzamiento. Por ahora solo el número les pertenece."
            : "Estos son los creadores que ya forman parte de la primera ola de Midi Pass. Cada semana se suman nuevas caras."}
        </motion.p>
      </div>

      <motion.div {...fade(0.25)} className="relative">
        {/* Edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-5 md:gap-7 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-5 md:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FOUNDERS.map((f) => {
            const revealed = f.name && f.photo;
            const num = String(f.number).padStart(3, "0");

            if (revealed) {
              return (
                <a
                  key={`${f.number}-${f.handle}`}
                  href={`https://instagram.com/${f.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group shrink-0 snap-start"
                >
                  <div className="relative w-[170px] h-[210px] md:w-[210px] md:h-[260px] rounded-2xl overflow-hidden border border-border group-hover:border-accent/40 transition-all duration-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.photo!}
                      alt={f.name!}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-text-primary/55 via-text-primary/10 to-transparent" />
                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm text-text-primary text-[10px] font-semibold tracking-[0.12em] px-2 py-0.5 rounded-full">
                      #{num}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-[14px] font-semibold text-white leading-tight">{f.name}</p>
                      <p className="text-[11px] text-white/75 mt-0.5">@{f.handle}</p>
                    </div>
                  </div>
                </a>
              );
            }

            return (
              <div
                key={`mystery-${f.number}`}
                className="shrink-0 snap-start relative w-[170px] h-[210px] md:w-[210px] md:h-[260px] rounded-2xl overflow-hidden border border-border"
              >
                {/* Mystery background — soft purple-tinted gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b19] via-[#26213F] to-[#3a2870]" />
                {/* subtle vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.35)_100%)]" />

                {/* Big number watermark */}
                <p className="absolute inset-0 flex items-center justify-center text-[88px] md:text-[112px] font-extralight tracking-tighter leading-none text-white/8 select-none">
                  {num}
                </p>

                <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm text-white text-[10px] font-semibold tracking-[0.12em] px-2 py-0.5 rounded-full">
                  #{num}
                </div>

                {/* Reveal label */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/60 mb-1">Reveal</p>
                  <p className="text-[14px] font-light tracking-[0.18em] text-white">13 · 05 · 26</p>
                </div>
              </div>
            );
          })}

          {/* Trailing tile so the strip never feels closed */}
          {remaining > 0 && (
            <div className="shrink-0 snap-start flex items-center justify-center w-[170px] h-[210px] md:w-[210px] md:h-[260px] rounded-2xl border border-dashed border-border text-text-muted">
              <div className="text-center px-4">
                <p className="text-2xl font-extralight tracking-tighter mb-1">+{remaining}</p>
                <p className="text-[11px] uppercase tracking-[0.2em]">por venir</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

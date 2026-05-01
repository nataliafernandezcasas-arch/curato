"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import FoundersStrip from "@/components/founders-strip";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const fade = (d: number = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-14">

        {/* ── HERO ── */}
        <section className="relative min-h-[100dvh] flex items-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="absolute inset-0">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" src="/video/midi-pass-hero.mp4" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </motion.div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-5 w-full pb-16 md:pb-20">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.7 }} className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-midi-lime mb-6">
              <span className="w-1.5 h-1.5 bg-midi-lime rounded-full" /> LATAM · Solo por invitación
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }} className="text-3xl md:text-6xl font-extralight tracking-tighter leading-[0.95] text-white mb-5 max-w-[600px]">
              Experiencias reales. <span className="font-bold">Contenido auténtico.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.7 }} className="text-[15px] text-white/60 max-w-[44ch] mb-8">
              Un ecosistema vivo que conecta creadores de contenido con los comercios y experiencias que ya aman, para que construyan en conjunto.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }} className="flex gap-3">
              <Link href="/creadores" className="group inline-flex items-center gap-2 bg-white text-black text-[13px] font-semibold px-6 py-3 rounded-lg hover:bg-midi-lime transition-all duration-400 active:scale-[0.97]">
                Soy Creador <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/comercios" className="inline-flex items-center gap-2 border border-white/25 text-white text-[13px] font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all duration-400 active:scale-[0.97]">
                Soy Comercio
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── ¿QUÉ ES MIDI PASS? ── */}
        <section className="py-24 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5">
                <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">¿Cómo funciona?</motion.p>
                <motion.h2 {...fade(0.1)} className="text-3xl md:text-4xl font-extralight tracking-tighter leading-[1] text-text-primary">
                  Un ecosistema donde <span className="font-bold">todos ganan.</span>
                </motion.h2>
              </div>
              <div className="lg:col-span-7 lg:pt-7">
                <motion.p {...fade(0.2)} className="text-base text-text-secondary leading-relaxed mb-4">
                  <strong>Los creadores</strong> reciben un crédito mensual para ir a los lugares que más les gustan.
                </motion.p>
                <motion.p {...fade(0.3)} className="text-base text-text-secondary leading-relaxed mb-6">
                  <strong>Los comercios</strong> reciben la visita de creadores que genuinamente quieren estar ahí y quienes expresan su gusto por la marca a través de contenido real para sus redes.
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DOS LADOS ── */}
        <section className="py-24 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Creadores */}
              <motion.div {...fade(0.1)} className="border border-border rounded-2xl p-8 md:p-10 hover:border-accent/25 hover:shadow-[0_12px_40px_-10px_rgba(130,93,199,0.06)] transition-all duration-400">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">Para Creadores</span>
                <h3 className="text-2xl font-extralight tracking-tight mt-3 mb-3 leading-tight text-text-primary">
                  Tu influencia tiene valor. <span className="font-bold">Úsala.</span>
                </h3>
                <ul className="space-y-2.5 mb-6">
                  {[
                    "De $1M a $3M COP al mes según tus seguidores",
                    "Restaurantes, beauty, wellness, hoteles y más",
                    "Parte de tu vida diaria, no una campaña",
                    "Tu Midi Pass digital en Apple Wallet y Billetera de Google",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 items-start">
                      <span className="w-1 h-1 bg-accent rounded-full mt-2 shrink-0" />
                      <span className="text-sm text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/creadores" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:text-text-primary transition-colors">
                  Conocer más <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              {/* Comercios */}
              <motion.div {...fade(0.18)} className="border border-border rounded-2xl p-8 md:p-10 hover:border-accent/25 hover:shadow-[0_12px_40px_-10px_rgba(130,93,199,0.06)] transition-all duration-400">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">Para Comercios</span>
                <h3 className="text-2xl font-extralight tracking-tight mt-3 mb-3 leading-tight text-text-primary">
                  Creadores que te eligieron. <span className="font-bold">Porque te prefieren.</span>
                </h3>
                <ul className="space-y-2.5 mb-6">
                  {[
                    "Visitas de creadores realmente interesados en tu marca",
                    "Contenido auténtico publicado en redes",
                    "90 días de derecho de uso del contenido",
                    "Desde USD $150/mes, sin fee por influencer",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 items-start">
                      <span className="w-1 h-1 bg-accent rounded-full mt-2 shrink-0" />
                      <span className="text-sm text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/comercios" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:text-text-primary transition-colors">
                  Conocer más <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CATEGORÍAS ── */}
        <section className="py-24 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-8">Categorías</motion.p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Gastronomía", desc: "Restaurantes, cafés, bares, brunchs", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" },
                { name: "Beauty", desc: "Salones, spas faciales, nail studios", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80" },
                { name: "Wellness", desc: "Spas, masajes, yoga, gimnasios boutique", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80" },
                { name: "Hospedaje", desc: "Hoteles boutique, glamping, experiencias", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80" },
              ].map((cat, i) => (
                <motion.div key={cat.name} {...fade(i * 0.08)} className="group rounded-xl overflow-hidden border border-border hover:border-accent/20 transition-all duration-400">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/25 via-rose-800/15 to-transparent mix-blend-color group-hover:opacity-70 transition-opacity duration-700" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[15px] font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">{cat.name}</h3>
                    <p className="text-xs text-text-muted leading-relaxed">{cat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDERS ── */}
        <FoundersStrip />

        {/* ── CTA ── */}
        <section className="py-24">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="bg-accent/8 border border-accent/15 rounded-xl md:rounded-2xl p-6 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extralight tracking-tighter leading-tight text-text-primary mb-2">
                  ¿Listo para ser parte?
                </h2>
                <p className="text-sm text-text-muted">Cupos limitados. Disponible en LATAM.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href="/influencers" className="group inline-flex items-center gap-2 bg-text-primary text-white text-[13px] font-semibold px-6 py-3 rounded-lg hover:bg-accent transition-all duration-400 active:scale-[0.97]">
                  Soy Influencer <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/businesses" className="inline-flex items-center gap-2 border border-border text-text-primary text-[13px] font-semibold px-6 py-3 rounded-lg hover:bg-surface-hover transition-all duration-400 active:scale-[0.97]">
                  Soy Comercio <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

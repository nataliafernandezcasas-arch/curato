"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, Camera, QrCode, Star, TrendUp, Lock } from "@phosphor-icons/react";

const fade = (d: number = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
});

export default function CreadoresPage() {
  return (
    <>
      <Nav />
      <main className="pt-14">

        {/* ── HERO ── */}
        <section className="py-24 md:py-32 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <motion.span {...fade(0.1)} className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-accent mb-6">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Para Creadores
                </motion.span>
                <motion.h1 {...fade(0.2)} className="text-[clamp(1.8rem,4vw,3.2rem)] font-extralight tracking-tighter leading-[0.95]">
                  Tu influencia tiene valor. <span className="font-bold text-accent">Úsala.</span>
                </motion.h1>
              </div>
              <div className="lg:col-span-5">
                <motion.p {...fade(0.3)} className="text-base text-text-secondary leading-relaxed">
                  Recibe un crédito mensual para ir a los lugares que más te gustan. Restaurantes, beauty, wellness, hoteles y más. Vive la experiencia, comparte lo que te gusta y construye tu perfil dentro del ecosistema Midi.
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* ── NIVELES DE CRÉDITO ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">Tu allowance mensual</motion.p>
            <motion.h2 {...fade(0.1)} className="text-3xl md:text-4xl font-extralight tracking-tighter leading-[1] text-text-primary mb-4">
              Más alcance, <span className="font-bold">más allowance.</span>
            </motion.h2>
            <motion.p {...fade(0.15)} className="text-sm text-text-muted mb-10 max-w-[52ch]">
              Cada perfil es único. Tu allowance personal se revela cuando eres aceptado en Midi Pass — depende de tu alcance, tu categoría y tu fit con los comercios aliados.
            </motion.p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { tier: "Nano", range: "5K - 10K", color: "border-border" },
                { tier: "Micro", range: "10K - 100K", color: "border-accent/20 bg-accent/3" },
                { tier: "Macro", range: "100K - 1M", color: "border-accent/25 bg-accent/4" },
                { tier: "Celebrity", range: "1M+", color: "border-accent/40 bg-accent/8" },
              ].map((item, i) => (
                <motion.div key={item.tier} {...fade(i * 0.08)} className={`rounded-xl p-6 border text-center ${item.color}`}>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent mb-4">{item.tier}</p>
                  <div className="flex items-center justify-center gap-1.5 h-[42px]">
                    <Lock size={14} weight="duotone" className="text-text-muted/70" />
                    <span className="text-2xl font-light text-text-primary tracking-[0.4em] leading-none translate-y-[-2px]">···</span>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.18em] mt-2">Confidencial</p>
                  <div className="h-px bg-border my-4" />
                  <p className="text-xs text-text-muted">{item.range} seguidores</p>
                </motion.div>
              ))}
            </div>

            <motion.p {...fade(0.5)} className="text-center text-[12px] text-text-muted mt-8">
              <Link href="/influencers" className="text-accent hover:text-text-primary transition-colors font-semibold">
                Aplica para descubrir tu allowance →
              </Link>
            </motion.p>
          </div>
        </section>

        {/* ── QUÉ RECIBES ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-10">Qué recibes</motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: Wallet,
                  title: "Allowance mensual personal",
                  body: "Tu monto se revela cuando eres aceptado y se acredita el día 1 de cada mes. Lo gastas en restaurantes, beauty, wellness, hoteles y más aliados de Midi Pass.",
                },
                {
                  icon: QrCode,
                  title: "Tu Midi Pass digital",
                  body: "Tu pase personal en Apple Wallet y Billetera de Google. Con foto, nombre e Instagram handle. Lo muestras al llegar al comercio y ellos lo escanean para validar tu identidad.",
                },
                {
                  icon: Camera,
                  title: "Contenido auténtico con mención",
                  body: "Sin briefs, sin guiones. Publicas lo que vives con mención a la marca y a Midi Pass. El comercio puede usar tu contenido por 90 días.",
                },
                {
                  icon: Star,
                  title: "Beneficios por frecuencia",
                  body: "5 visitas a una misma categoría en un mes te dan 1 visita extra gratis. 10 visitas totales te abren acceso a experiencias premium.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fade(i * 0.08)}
                  className="border border-border rounded-xl p-7 hover:border-accent/25 hover:shadow-[0_8px_30px_-8px_rgba(130,93,199,0.06)] transition-all duration-400"
                >
                  <item.icon size={22} weight="duotone" className="text-accent mb-4" />
                  <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MIDI SCORE ── */}
        <section className="py-20 border-b border-border bg-accent/4">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="flex items-center gap-3 mb-10">
              <TrendUp size={22} weight="duotone" className="text-accent" />
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-accent">Midi Score</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-10">
              <div className="lg:col-span-5">
                <motion.h2 {...fade(0.1)} className="text-3xl font-extralight tracking-tighter leading-[1] text-text-primary">
                  Cada visita construye <span className="font-bold">tu futuro con Midi.</span>
                </motion.h2>
              </div>
              <div className="lg:col-span-7">
                <motion.p {...fade(0.15)} className="text-base text-text-secondary leading-relaxed">
                  Tu actividad dentro de Midi Pass construye tu Midi Score, un perfil que refleja tu compromiso, la calidad de tu contenido y tu reputación con los comercios. Es como tu historial crediticio dentro del ecosistema Midi.
                </motion.p>
              </div>
            </div>
            <motion.div {...fade(0.2)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: "Más crédito mensual", desc: "Tu score sube y puedes subir de nivel. De Nano a Micro, de Micro a Macro, y más." },
                { title: "Experiencias premium", desc: "Acceso a hoteles, eventos y experiencias exclusivas reservadas para los mejores scores." },
                { title: "Prioridad en nuevas ciudades", desc: "Cuando Midi Pass se expanda, los primeros en entrar son los que tienen mejor score." },
                { title: "Tu reputación verificable", desc: "Tu Midi Score se convierte en parte de tu perfil Midi, prueba de que eres un creador confiable." },
              ].map((item, i) => (
                <motion.div key={item.title} {...fade(0.2 + i * 0.06)} className="border border-accent/10 bg-white rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{item.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PASO A PASO ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-10">Paso a paso</motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { n: "01", title: "Aplica", desc: "Formulario + revisión manual" },
                { n: "02", title: "Te aceptamos", desc: "Correo y WhatsApp de acceso" },
                { n: "03", title: "Explora", desc: "Catálogo de comercios aliados" },
                { n: "04", title: "Reserva", desc: "Llama, confirma y muestra tu Pass" },
                { n: "05", title: "Comparte", desc: "Contenido con mención a marca y Midi" },
                { n: "06", title: "Sube de nivel", desc: "Tu Midi Score crece con cada visita" },
              ].map((step, i) => (
                <motion.div key={step.n} {...fade(i * 0.06)} className="group border border-border rounded-xl p-6 hover:border-accent/25 transition-all duration-400">
                  <span className="text-[11px] font-bold text-accent tracking-wider">{step.n}</span>
                  <h3 className="text-base font-semibold text-text-primary mt-2 mb-1 group-hover:text-accent transition-colors">{step.title}</h3>
                  <p className="text-xs text-text-muted">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REQUISITOS ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">Requisitos</motion.p>
                <motion.h2 {...fade(0.1)} className="text-3xl font-extralight tracking-tighter leading-[1]">
                  No todos son aceptados. <span className="font-bold">Buscamos autenticidad.</span>
                </motion.h2>
              </div>
              <div className="lg:col-span-7">
                <motion.div {...fade(0.15)} className="space-y-4">
                  {[
                    "Cobrar a través de Midi con al menos 1 pago recibido en los últimos 30 días",
                    "10,000+ seguidores reales en Instagram o TikTok",
                    "Audiencia en la ciudad donde opera Midi Pass",
                  ].map((req) => (
                    <div key={req} className="flex gap-3 items-start">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 shrink-0" />
                      <p className="text-sm text-text-secondary leading-relaxed">{req}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="bg-accent/8 border border-accent/15 rounded-xl md:rounded-2xl p-6 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extralight tracking-tighter leading-tight mb-2">
                  ¿Listo para aplicar?
                </h2>
                <p className="text-sm text-text-muted">Cupos limitados. Revisamos cada aplicación manualmente.</p>
              </div>
              <Link href="/influencers" className="group inline-flex items-center gap-2 bg-text-primary text-white text-[13px] font-semibold px-7 py-3.5 rounded-lg hover:bg-accent transition-all duration-400 active:scale-[0.97] shrink-0">
                Aplicar ahora
                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

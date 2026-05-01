"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ArrowRight, Storefront, Camera, ShieldCheck, ChartLineUp } from "@phosphor-icons/react";

const fade = (d: number = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
});

export default function ComerciosPage() {
  return (
    <>
      <Nav />
      <main className="pt-14">

        {/* ── HERO ── */}
        <section className="py-24 md:py-32 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-7">
                <motion.span {...fade(0.1)} className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-accent mb-6">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Para Comercios Aliados
                </motion.span>
                <motion.h1 {...fade(0.2)} className="text-[clamp(1.8rem,4vw,3.2rem)] font-extralight tracking-tighter leading-[0.95]">
                  Creadores reales en tu negocio. <span className="font-bold text-accent">Porque te eligieron.</span>
                </motion.h1>
              </div>
              <div className="lg:col-span-5 lg:pt-7">
                <motion.p {...fade(0.3)} className="text-base text-text-secondary leading-relaxed">
                  Los comercios aliados de Midi Pass reciben visitas de creadores verificados que eligieron ir porque te conocen y prefieren o porque genuinamente te quieren conocer, no porque los contrataste. El contenido que recibirás será auténtico y publicado en redes antes de que finalice la experiencia.
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* ── QUÉ RECIBES ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-10">Qué recibes</motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: Storefront,
                  title: "Visitas de creadores que te prefieren",
                  body: "Creadores realmente interesados en tu marca, dispuestos a ayudarte a posicionar tu negocio. Mínimo 5 visitas garantizadas por mes. Si no cumplimos, el siguiente mes es gratis.",
                },
                {
                  icon: Camera,
                  title: "Contenido auténtico",
                  body: "Stories publicadas en redes sociales mencionando tu comercio. El contenido se envía automáticamente a tu correo y tienes 90 días de derecho de uso en tus propias redes. Si la experiencia fue increíble, el creador podría publicar reels o posts fijos.",
                },
                {
                  icon: ShieldCheck,
                  title: "Cero coordinación",
                  body: "Sin fee por influencer. Sin negociación por contenido. Sin campañas que gestionar. Sin coordinar horarios manualmente. El creador llama, reserva y asiste.",
                },
                {
                  icon: ChartLineUp,
                  title: "Visibilidad en el catálogo",
                  body: "Tu oferta aparece en el catálogo oficial de Midi Pass. Spotlight semanal rotativo en las comunicaciones a creadores. Rotación equitativa para que todos reciban exposición.",
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

        {/* ── TU OFERTA ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">Tu oferta</motion.p>
                <motion.h2 {...fade(0.1)} className="text-3xl font-extralight tracking-tighter leading-[1] text-text-primary">
                  Tú decides <span className="font-bold">qué ofrecer.</span>
                </motion.h2>
              </div>
              <div className="lg:col-span-7 lg:pt-7">
                <motion.p {...fade(0.15)} className="text-base text-text-secondary leading-relaxed mb-6">
                  Cada comercio define la experiencia que quiere ofrecer a los creadores. Puede ser un brunch, un tratamiento, una noche de hotel o lo que mejor represente a tu marca.
                </motion.p>
                <motion.div {...fade(0.25)} className="border border-accent/15 bg-accent/4 rounded-xl p-5 flex items-center gap-4">
                  <div className="text-2xl font-bold text-accent tracking-tight">$250K</div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Valor mínimo por visita</p>
                    <p className="text-xs text-text-muted">El comercio define el valor exacto de su oferta</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── NIVEL DEL COMERCIO ── */}
        <section className="py-20 border-b border-border bg-accent/4">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-accent mb-4">Tu reputación crece</motion.p>
                <motion.h2 {...fade(0.1)} className="text-3xl font-extralight tracking-tighter leading-[1] text-text-primary">
                  Mejor experiencia, <span className="font-bold">más visitas.</span>
                </motion.h2>
              </div>
              <div className="lg:col-span-7 lg:pt-4">
                <motion.p {...fade(0.15)} className="text-base text-text-secondary leading-relaxed">
                  A medida que tu comercio ofrece experiencias memorables, sube de nivel dentro del ecosistema. Los creadores califican cada visita, y los comercios con mejores calificaciones reciben más exposición y más visitas. Es un ciclo: mejor experiencia → mejor calificación → más creadores quieren ir.
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARATIVO ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">¿Por qué Midi Pass?</motion.p>
            <motion.h2 {...fade(0.1)} className="text-3xl md:text-4xl font-extralight tracking-tighter leading-[1] text-text-primary mb-12">
              Compara y decide.
            </motion.h2>

            {/* Escenario: 5 influencers al mes */}
            <motion.div {...fade(0.15)} className="border border-border rounded-xl p-6 mb-8 bg-surface-hover/30">
              <p className="text-xs text-text-muted mb-1">Escenario:</p>
              <p className="text-sm font-semibold text-text-primary">5 influencers visitando tu negocio cada mes, publicando contenido en redes.</p>
            </motion.div>

            <motion.div {...fade(0.2)} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {/* Hacerlo tú */}
              <div className="border border-border rounded-xl p-6 opacity-60">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-4">Hacerlo tú</p>
                <p className="text-3xl font-bold text-text-primary tracking-tight">$1,500+</p>
                <p className="text-xs text-text-muted mt-1 mb-5">USD / mes</p>
                <div className="h-px bg-border mb-5" />
                <ul className="space-y-2.5">
                  {[
                    "5 influencers x $300 por post = $1,500",
                    "Tú los buscas, negocias y coordinas",
                    "10-20 horas al mes de tu tiempo",
                    "Sin garantía de calidad ni publicación",
                  ].map((item) => (
                    <li key={item} className="text-xs text-text-muted flex gap-2 items-start">
                      <span className="text-red-400 shrink-0 mt-0.5">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agencia */}
              <div className="border border-border rounded-xl p-6 opacity-60">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-4">Agencia</p>
                <p className="text-3xl font-bold text-text-primary tracking-tight">$3,500+</p>
                <p className="text-xs text-text-muted mt-1 mb-5">USD / mes</p>
                <div className="h-px bg-border mb-5" />
                <ul className="space-y-2.5">
                  {[
                    "Fee agencia: $2,000/mes",
                    "Pago a influencers aparte (10-15% extra)",
                    "Tú tienes que brifear a la agencia",
                    "+3 horas al mes de tu tiempo",
                  ].map((item) => (
                    <li key={item} className="text-xs text-text-muted flex gap-2 items-start">
                      <span className="text-red-400 shrink-0 mt-0.5">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Midi Pass */}
              <div className="border-2 border-accent rounded-xl p-6 bg-accent/4">
                <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-4">Midi Pass</p>
                <p className="text-3xl font-bold text-accent tracking-tight">$150</p>
                <p className="text-xs text-text-muted mt-1 mb-5">USD / mes</p>
                <div className="h-px bg-accent/15 mb-5" />
                <ul className="space-y-2.5">
                  {[
                    "5+ visitas garantizadas al mes",
                    "$0 pago al influencer",
                    "0 horas de coordinación",
                    "Contenido publicado en redes + 90 días de uso",
                  ].map((item) => (
                    <li key={item} className="text-xs font-medium text-text-primary flex gap-2 items-start">
                      <span className="text-accent shrink-0 mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Ahorro destacado */}
            <motion.div {...fade(0.3)} className="border-2 border-accent rounded-xl p-6 bg-accent/4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Con Midi Pass ahorras hasta</p>
                <p className="text-3xl font-bold text-accent tracking-tight">$3,350 USD/mes</p>
                <p className="text-xs text-text-muted mt-1">vs contratar una agencia para el mismo resultado</p>
              </div>
              <Link href="/businesses" className="group inline-flex items-center gap-2 bg-accent text-white text-[13px] font-semibold px-7 py-3.5 rounded-lg hover:bg-accent/80 transition-all duration-400 active:scale-[0.97] shrink-0">
                Empezar ahora <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── PLANES ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <motion.p {...fade()} className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-4">Planes</motion.p>
                <motion.h2 {...fade(0.1)} className="text-3xl font-extralight tracking-tighter leading-[1] mb-4">
                  Simple. <span className="font-bold">Transparente. De tu lado.</span>
                </motion.h2>
                <motion.p {...fade(0.15)} className="text-sm text-text-muted leading-relaxed mb-6">
                  Todos los planes incluyen acceso al catálogo, app de escaneo Midi Pass, contenido enviado a tu correo, spotlight semanal rotativo, mínimo 5 visitas garantizadas y soporte por WhatsApp.
                </motion.p>
                <motion.p {...fade(0.2)} className="text-xs text-text-muted">
                  15 días de prueba gratis en todos los planes.
                </motion.p>
              </div>

              <div className="lg:col-span-7">
                <div className="space-y-3">
                  {[
                    { plan: "1 mes", price: "$250", note: "sin compromiso", features: "Ideal para probar el programa", popular: false },
                    { plan: "3 meses", price: "$200", note: "ahorras USD $150", features: "El más elegido por comercios nuevos", popular: true },
                    { plan: "6 meses", price: "$150", note: "ahorras USD $600", features: "Mejor precio, mayor compromiso", popular: false },
                  ].map((p, i) => (
                    <motion.div
                      key={p.plan}
                      {...fade(0.1 + i * 0.08)}
                      className={`flex items-center justify-between p-5 rounded-xl border transition-all duration-400 ${
                        p.popular
                          ? "border-accent/25 bg-accent/4"
                          : "border-border hover:border-border"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">{p.plan}</span>
                          {p.popular && <span className="text-[8px] font-bold text-accent tracking-[0.2em] uppercase bg-accent/10 px-2 py-0.5 rounded">popular</span>}
                        </div>
                        <p className="text-xs text-text-muted">{p.features}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-text-primary">USD {p.price}</div>
                        <div className="text-[10px] text-text-muted">/mes, {p.note}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GARANTÍA ── */}
        <section className="py-20 border-b border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="bg-accent/5 border border-accent/15 rounded-xl md:rounded-2xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Garantía Midi</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Si no llegamos al mínimo de visitas pactado en un mes, el siguiente mes va por nuestra cuenta. Así de simple.
                </p>
              </div>
              <div className="md:col-span-4 text-center">
                <div className="text-4xl font-bold text-accent">5+</div>
                <div className="text-xs text-text-muted mt-1">visitas garantizadas al mes</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="bg-accent/8 border border-accent/15 rounded-xl md:rounded-2xl p-6 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extralight tracking-tighter leading-tight mb-2">
                  15 días de prueba gratis
                </h2>
                <p className="text-sm text-text-muted">Para que veas cómo funciona. Sin compromiso.</p>
              </div>
              <Link href="/businesses" className="group inline-flex items-center gap-2 bg-text-primary text-white text-[13px] font-bold px-7 py-3.5 rounded-lg hover:bg-accent transition-all duration-400 active:scale-[0.97] shrink-0">
                Aplicar como Comercio
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

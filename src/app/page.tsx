"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const fade = (d: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
});

const fadeIn = (d: number = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { delay: d, duration: 1.1 },
});

export default function Home() {
  return (
    <>
      <Nav />
      <main className="bg-charcoal-deep">

        {/* ── HERO ── */}
        <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6 }}
            className="absolute inset-0"
          >
            <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-charcoal-deep/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal-deep/70 to-transparent" />
          </motion.div>

          {/* spacer: empuja el contenido hacia abajo, mínimo 80px para dejar espacio al nav */}
          <div className="flex-1 min-h-[80px]" />

          <div className="relative z-10 max-w-[1200px] mx-auto px-5 w-full pb-16 md:pb-28">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.9 }}
              className="inline-flex items-center gap-2.5 font-serif text-[11px] font-light tracking-[0.35em] uppercase text-champagne/60 mb-7 md:mb-10"
            >
              <span className="w-6 h-px bg-champagne/40" />
              Paris · Sur invitation
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2.1rem,10vw,7rem)] font-light tracking-[0.35em] uppercase leading-[1] text-text-primary mb-8 max-w-[800px]"
            >
              <span className="text-champagne">Jamais</span> une campagne.
              <br />
              Toujours une histoire.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.9 }}
              className="font-serif text-[19px] font-light text-text-secondary leading-relaxed max-w-[44ch] mb-14"
            >
              Un écosystème vivant qui unit créateurs et maisons d'exception,
              pour qu'ils construisent quelque chose ensemble.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/creadores" className="group inline-flex items-center gap-3 bg-champagne text-charcoal-deep font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:bg-copper hover:text-white transition-all duration-400">
                Je suis créateur <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/comercios" className="inline-flex items-center gap-3 border border-champagne/30 text-champagne font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:border-champagne/60 hover:bg-champagne/5 transition-all duration-400">
                Je suis une maison
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── PHOTO INTERLUDE 1 ── */}
        <motion.section {...fadeIn()} className="w-full h-[70vh] md:h-[90vh] overflow-hidden relative">
          <img src="/Background Image 4.jpeg" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-charcoal-deep/30" />
          <div className="absolute bottom-10 left-0 right-0 text-center">
            <span className="font-serif text-[11px] font-light tracking-[0.4em] uppercase text-champagne/50">Curato · Paris</span>
          </div>
        </motion.section>

        {/* ── LE MODÈLE ── */}
        <section className="py-28 md:py-36 border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4">
                <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-6">Le modèle</motion.p>
                <motion.h2 {...fade(0.1)} className="font-serif text-4xl md:text-5xl font-light tracking-[0.35em] uppercase leading-[1.05] text-text-primary">
                  Un écosystème où{" "}
                  <span className="text-champagne">tout le monde gagne.</span>
                </motion.h2>
              </div>
              <div className="md:col-span-8 md:pt-10 space-y-10">
                <motion.div {...fade(0.2)} className="border-l border-champagne/25 pl-8">
                  <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 mb-3">Pour les créateurs</p>
                  <p className="font-serif text-[18px] font-light text-text-secondary leading-relaxed">
                    Un <span className="text-text-primary">crédit mensuel en EUR</span> pour découvrir les meilleurs restaurants, sanctuaires de beauté, retraites de bien-être et hôtels boutique, intégré à leur vie quotidienne, jamais comme une campagne.
                  </p>
                </motion.div>
                <motion.div {...fade(0.3)} className="border-l border-copper/25 pl-8">
                  <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-copper/60 mb-3">Pour les maisons</p>
                  <p className="font-serif text-[18px] font-light text-text-secondary leading-relaxed">
                    Des visites de créateurs qui les ont <span className="text-text-primary">sincèrement choisis</span>, du contenu éditorial publié sur leurs réseaux, et 90 jours de droits d'utilisation exclusifs.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PHOTO PAIR ── */}
        <section className="grid grid-cols-2 h-[60vh] md:h-[80vh]">
          <motion.div {...fadeIn()} className="overflow-hidden relative">
            <img src="/Background Image 7.jpeg" alt="" className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-[2s]" />
            <div className="absolute inset-0 bg-charcoal-deep/20" />
          </motion.div>
          <motion.div {...fadeIn(0.15)} className="overflow-hidden relative">
            <img src="/Background Image 3.jpeg" alt="" className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-[2s]" />
            <div className="absolute inset-0 bg-charcoal-deep/20" />
          </motion.div>
        </section>

        {/* ── CRÉATEURS / MAISONS ── */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
              <motion.div {...fade(0.1)} className="bg-charcoal-deep p-10 md:p-14 hover:bg-charcoal-mid transition-colors duration-500">
                <span className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50">Pour les créateurs</span>
                <h3 className="font-serif text-3xl md:text-4xl font-light tracking-[0.35em] uppercase mt-5 mb-5 leading-[1.05] text-text-primary">
                  Votre présence<br />a de la <span className="text-champagne">valeur.</span>
                </h3>
                <ul className="space-y-3 mb-8">
                  {[
                    "Crédit mensuel en EUR, adapté à votre profil",
                    "Restaurants, beauté, bien-être, hôtels boutique",
                    "Authentique, pas sponsorisé",
                    "Adresses sélectionnées à Paris",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="w-4 h-px bg-champagne/40 mt-[11px] shrink-0" />
                      <span className="font-serif text-[15px] font-light text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/creadores" className="group/link inline-flex items-center gap-2 font-serif text-[12px] font-light tracking-widest uppercase text-champagne hover:text-copper transition-colors">
                  En savoir plus <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div {...fade(0.18)} className="bg-charcoal-deep p-10 md:p-14 hover:bg-charcoal-mid transition-colors duration-500">
                <span className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-copper/60">Pour les maisons</span>
                <h3 className="font-serif text-3xl md:text-4xl font-light tracking-[0.35em] uppercase mt-5 mb-5 leading-[1.05] text-text-primary">
                  Des créateurs qui vous ont choisi. <span className="text-copper">Parce qu'ils vous préfèrent.</span>
                </h3>
                <ul className="space-y-3 mb-8">
                  {[
                    "Visites de créateurs intéressés par votre maison",
                    "Contenu éditorial publié sur leurs réseaux",
                    "90 jours de droits d'utilisation exclusifs",
                    "Sans frais d'intermédiation par visite",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="w-4 h-px bg-copper/40 mt-[11px] shrink-0" />
                      <span className="font-serif text-[15px] font-light text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/comercios" className="group/link inline-flex items-center gap-2 font-serif text-[12px] font-light tracking-widest uppercase text-copper hover:text-champagne transition-colors">
                  En savoir plus <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── QUOTE PLEINE PAGE ── */}
        <motion.section {...fadeIn()} className="relative h-[75vh] md:h-[95vh] overflow-hidden flex items-center justify-center">
          <img src="/Background Image 6.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-charcoal-deep/55" />
          <div className="relative z-10 text-center px-5 max-w-[700px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.4em] uppercase text-champagne/50 mb-8">
             Notre vision
            </motion.p>
            <motion.h2 {...fade(0.15)} className="font-serif text-3xl md:text-5xl font-light tracking-[0.35em] uppercase leading-[1.1] text-text-primary">
              Un écosystème vivant.<br />
              <span className="text-champagne">Pas une plateforme.</span>
            </motion.h2>
          </div>
        </motion.section>

        {/* ── CATÉGORIES ── */}
        <section className="py-28 border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-4">Les catégories</motion.p>
            <motion.h2 {...fade(0.1)} className="font-serif text-[clamp(1.6rem,7vw,2.5rem)] font-light tracking-[0.35em] uppercase text-text-primary mb-14">
              Expériences <span className="text-champagne">sélectionnées.</span>
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {[
                { name: "Gastronomie", desc: "Restaurants, cafés, bistrots, expériences culinaires", img: "/Gastronomie.jpeg" },
                { name: "Bien-être", desc: "Spas, massages, yoga, studios boutique", img: "/Bien etre.jpeg" },
                { name: "Conscience", desc: "Soins du visage, instituts beauté, ateliers, nail bars", img: "/Conscience.jpeg" },
                { name: "Hôtellerie", desc: "Hôtels boutique, retraites, séjours singuliers", img: "/Hotelerie.jpeg" },
              ].map((cat, i) => (
                <motion.div key={cat.name} {...fade(i * 0.07)} className="group bg-charcoal-deep overflow-hidden hover:bg-charcoal-mid transition-colors duration-500">
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/80 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-[15px] font-light tracking-[0.08em] uppercase text-text-primary mb-1.5 group-hover:text-champagne transition-colors">{cat.name}</h3>
                    <p className="font-serif text-[13px] font-light text-text-muted leading-relaxed">{cat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MOSAÏQUE ── */}
        <section className="grid grid-cols-12 h-[70vh] md:h-[85vh]">
          <motion.div {...fadeIn()} className="col-span-5 overflow-hidden relative">
            <img src="/Background image 1.jpeg" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s]" />
          </motion.div>
          <motion.div {...fadeIn(0.1)} className="col-span-4 overflow-hidden relative">
            <img src="/Background Image 5.jpeg" alt="" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-[2s]" />
          </motion.div>
          <motion.div {...fadeIn(0.2)} className="col-span-3 overflow-hidden relative">
            <img src="/Background Image 8.jpeg" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s]" />
          </motion.div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative py-36 md:py-48 overflow-hidden">
          <div className="absolute inset-0">
            <img src="/Background Image 8.jpeg" alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-charcoal-deep/75" />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
              <div className="max-w-[520px]">
                <p className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-6">Rejoindre Curato</p>
                <h2 className="font-serif text-4xl md:text-6xl font-light tracking-[0.35em] uppercase leading-[1.05] text-text-primary">
                  Rejoindre{" "}
                  <span className="text-champagne">Curato.</span>
                </h2>
                <p className="font-serif text-[17px] font-light text-text-muted mt-6">
                  Places limitées. Sur invitation uniquement.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Link href="/creadores" className="group inline-flex items-center gap-3 bg-champagne text-charcoal-deep font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:bg-copper hover:text-white transition-all duration-400">
                  Postuler comme créateur <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/comercios" className="inline-flex items-center gap-3 border border-champagne/25 text-champagne/70 font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:border-champagne/50 hover:text-champagne transition-all duration-400">
                  Inscrire ma maison
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

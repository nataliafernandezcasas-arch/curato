"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ParallaxImage, MouseParallaxImage, RevealLine } from "@/components/home/motion";
import { ArrowRight } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

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

const catImgs = ["/Gastronomie.jpeg", "/Bien etre.jpeg", "/Conscience.jpeg", "/Hotelerie.jpeg"];

export default function Home() {
  const { lang } = useLang();
  const t = translations[lang].home;

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
            <MouseParallaxImage src="/hero-floral.jpeg" className="absolute inset-0" strength={10} />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/80 via-charcoal-deep/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal-deep/45 to-transparent" />
          </motion.div>

          <div className="flex-1 min-h-[80px]" />

          <div className="relative z-10 max-w-[1200px] mx-auto px-5 w-full pb-16 md:pb-28">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.9 }}
              className="inline-flex items-center gap-2.5 font-serif text-[11px] font-light tracking-[0.35em] uppercase text-champagne/60 mb-7 md:mb-10"
            >
              <span className="w-6 h-px bg-champagne/40" />
              {t.badge}
            </motion.span>

            <h1 className="font-serif text-[clamp(2.1rem,9vw,6.5rem)] font-light tracking-[0.18em] uppercase leading-[1.05] text-text-primary mb-8 max-w-[1000px]">
              <RevealLine delay={0.65}>{t.heroTitle1}</RevealLine>
              <RevealLine delay={0.8} className="text-champagne">{t.heroTitle2}</RevealLine>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.9 }}
              className="font-serif text-[19px] font-light text-text-secondary leading-relaxed max-w-[44ch] mb-14"
            >
              {t.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/storytellers" className="group inline-flex items-center gap-3 bg-champagne text-charcoal-deep font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:bg-copper hover:text-white transition-all duration-400">
                {t.ctaCreator} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/casas" className="inline-flex items-center gap-3 border border-champagne/30 text-champagne font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:border-champagne/60 hover:bg-champagne/5 transition-all duration-400">
                {t.ctaMaison}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── PHOTO INTERLUDE ── */}
        <ParallaxImage
          src="/Background Image 4.jpeg"
          className="w-full h-[70vh] md:h-[90vh]"
          strength={150}
          overlay="bg-charcoal-deep/30"
          caption={
            <div className="absolute bottom-10 left-0 right-0 text-center z-10">
              <span className="font-serif text-[11px] font-light tracking-[0.4em] uppercase text-champagne/50">{t.photoCaption}</span>
            </div>
          }
        />

        {/* ── LE MODÈLE ── */}
        <section className="py-28 md:py-36 border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4">
                <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-6">{t.modelLabel}</motion.p>
                <motion.h2 {...fade(0.1)} className="font-serif text-2xl md:text-[1.85rem] font-light tracking-[0.28em] uppercase leading-[1.2] text-text-primary">
                  {t.modelTitle}
                </motion.h2>
              </div>
              <div className="md:col-span-8 md:pt-10 space-y-10">
                <motion.div {...fade(0.2)} className="border-l border-champagne/25 pl-8">
                  <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/50 mb-3">{t.modelCreatorLabel}</p>
                  <p className="font-serif text-[18px] font-light text-text-secondary leading-relaxed">
                    {t.modelCreatorText}
                  </p>
                </motion.div>
                <motion.div {...fade(0.3)} className="border-l border-copper/25 pl-8">
                  <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-copper/60 mb-3">{t.modelMaisonLabel}</p>
                  <p className="font-serif text-[18px] font-light text-text-secondary leading-relaxed">
                    {t.modelMaisonText}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PHOTO PAIR ── */}
        <section className="grid grid-cols-2 h-[60vh] md:h-[80vh]">
          <ParallaxImage src="/Background Image 7.jpeg" className="h-full" strength={115} overlay="bg-charcoal-deep/20" />
          <ParallaxImage src="/Background Image 3.jpeg" className="h-full" strength={155} overlay="bg-charcoal-deep/20" />
        </section>

        {/* ── MANIFESTE ── */}
        <section className="py-32 md:py-44 px-5 bg-charcoal-deep border-t border-border">
          <div className="max-w-[860px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-14">
              {t.manifestLabel}
            </motion.p>
            <motion.p {...fade(0.1)} className="font-serif text-[clamp(1.2rem,2.8vw,1.9rem)] font-light leading-[1.7] text-text-secondary">
              {t.manifestCreatorText}
            </motion.p>
            <motion.div {...fadeIn(0.25)} className="my-12 w-10 h-px bg-border" />
            <motion.p {...fade(0.3)} className="font-serif text-[clamp(1.2rem,2.8vw,1.9rem)] font-light leading-[1.7] text-text-secondary">
              {t.manifestMaisonText}
            </motion.p>
          </div>
        </section>

        {/* ── CRÉATEURS / MAISONS ── */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
              <motion.div {...fade(0.1)} className="bg-charcoal-deep p-10 md:p-14 hover:bg-charcoal-mid transition-colors duration-500">
                <span className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50">{t.creatorsLabel}</span>
                <h3 className="font-serif text-3xl md:text-4xl font-light tracking-[0.35em] uppercase mt-5 mb-5 leading-[1.05] text-text-primary">
                  {t.creatorsTitle}
                </h3>
                <ul className="space-y-3 mb-8">
                  {t.creatorsBullets.map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="w-4 h-px bg-champagne/40 mt-[11px] shrink-0" />
                      <span className="font-serif text-[15px] font-light text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/storytellers" className="group/link inline-flex items-center gap-2 font-serif text-[12px] font-light tracking-widest uppercase text-champagne hover:text-copper transition-colors">
                  {t.learnMore} <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div {...fade(0.18)} className="bg-charcoal-deep p-10 md:p-14 hover:bg-charcoal-mid transition-colors duration-500">
                <span className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-copper/60">{t.maisonsLabel}</span>
                <h3 className="font-serif text-3xl md:text-4xl font-light tracking-[0.35em] uppercase mt-5 mb-5 leading-[1.05] text-text-primary">
                  {t.maisonsTitle} <span className="text-copper">{t.maisonsSubtitle}</span>
                </h3>
                <ul className="space-y-3 mb-8">
                  {t.maisonsBullets.map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="w-4 h-px bg-copper/40 mt-[11px] shrink-0" />
                      <span className="font-serif text-[15px] font-light text-text-secondary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/casas" className="group/link inline-flex items-center gap-2 font-serif text-[12px] font-light tracking-widest uppercase text-copper hover:text-champagne transition-colors">
                  {t.learnMore} <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── QUOTE ── */}
        <section className="relative h-[75vh] md:h-[95vh] overflow-hidden flex items-center justify-center">
          <ParallaxImage src="/Background Image 6.jpeg" className="absolute inset-0" strength={155} overlay="bg-charcoal-deep/55" />
          <div className="relative z-10 text-center px-5 max-w-[700px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.4em] uppercase text-champagne/50 mb-8">
              {t.visionLabel}
            </motion.p>
            <motion.h2 {...fade(0.15)} className="font-serif text-3xl md:text-5xl font-light tracking-[0.35em] uppercase leading-[1.1] text-text-primary">
              {t.visionTitle1}<br />
              <span className="text-champagne">{t.visionTitle2}</span>
            </motion.h2>
          </div>
        </section>

        {/* ── CATÉGORIES ── */}
        <section className="py-28 border-t border-border">
          <div className="max-w-[1200px] mx-auto px-5">
            <motion.p {...fade()} className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-4">{t.categoriesLabel}</motion.p>
            <motion.h2 {...fade(0.1)} className="font-serif text-[clamp(1.6rem,7vw,2.5rem)] font-light tracking-[0.35em] uppercase text-text-primary mb-14">
              {t.categoriesTitle}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {t.categories.map((cat, i) => (
                <motion.div key={cat.name} {...fade(i * 0.07)} className="group bg-charcoal-deep overflow-hidden hover:bg-charcoal-mid transition-colors duration-500">
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img src={catImgs[i]} alt={cat.name} className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out" />
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
          <ParallaxImage src="/Background image 1.jpeg" className="col-span-5 h-full" strength={115} />
          <ParallaxImage src="/Background Image 5.jpeg" className="col-span-4 h-full" strength={175} imgClassName="object-top" />
          <ParallaxImage src="/Background Image 8.jpeg" className="col-span-3 h-full" strength={145} />
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative py-36 md:py-48 overflow-hidden">
          <ParallaxImage src="/Background Image 8.jpeg" className="absolute inset-0" strength={130} overlay="bg-charcoal-deep/75" />
          <div className="relative z-10 max-w-[1200px] mx-auto px-5">
            <motion.div {...fade()} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
              <div className="max-w-[520px]">
                <p className="font-serif text-[11px] font-light tracking-[0.3em] uppercase text-champagne/50 mb-6">{t.ctaLabel}</p>
                <h2 className="font-serif text-4xl md:text-6xl font-light tracking-[0.35em] uppercase leading-[1.05] text-text-primary">
                  {t.ctaTitle}
                </h2>
                <p className="font-serif text-[17px] font-light text-text-muted mt-6">
                  {t.ctaSubtitle}
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Link href="/storytellers" className="group inline-flex items-center gap-3 bg-champagne text-charcoal-deep font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:bg-copper hover:text-white transition-all duration-400">
                  {t.ctaCreatorBtn} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/casas" className="inline-flex items-center gap-3 border border-champagne/25 text-champagne/70 font-serif text-[13px] font-light tracking-widest uppercase px-8 py-4 hover:border-champagne/50 hover:text-champagne transition-all duration-400">
                  {t.ctaMaisonBtn}
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

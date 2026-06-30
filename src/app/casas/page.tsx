"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ParallaxImage, MouseParallaxImage } from "@/components/home/motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
});

export default function ComerciosPage() {
  const { lang } = useLang();
  const t = translations[lang].maisons;

  return (
    <>
      <Nav />
      <main>

        {/* HERO */}
        <section className="relative min-h-[92vh] flex items-end pt-36 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <MouseParallaxImage src="/Background Image 8.jpeg" className="absolute inset-0" strength={7} />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-black/50 to-black/20" />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto px-5 w-full">
            <motion.p {...fade(0.1)} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">
              {t.badge}
            </motion.p>
            <motion.h1 {...fade(0.2)} className="font-serif text-5xl md:text-[6.5rem] font-light tracking-[0.28em] uppercase leading-[1] text-text-primary max-w-4xl">
              {t.heroTitle1}<br />
              <span className="text-champagne">{t.heroTitle2}</span>
            </motion.h1>
            <motion.p {...fade(0.35)} className="font-serif text-[18px] font-light text-text-secondary mt-8 max-w-xl leading-relaxed">
              {t.heroSubtitle}
            </motion.p>
          </div>
        </section>

        {/* LE PRINCIPE */}
        <section className="py-28 px-5 bg-charcoal-deep">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
              <motion.div {...fade()}>
                <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-8">{t.principleLabel}</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light tracking-[0.28em] uppercase leading-[1.1] text-text-primary">
                  {t.principleTitle}
                </h2>
              </motion.div>
              <motion.div {...fade(0.15)} className="pt-0 md:pt-14">
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed mb-6">{t.principleText1}</p>
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed">{t.principleText2}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PHOTO BREAK */}
        <ParallaxImage src="/Background Image 6.jpeg" className="h-[60vh]" strength={135} overlay="bg-black/30" />

        {/* WHAT YOU RECEIVE */}
        <section className="py-28 px-5 bg-charcoal-deep border-t border-border">
          <div className="max-w-[1200px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-16">
              {t.whatLabel}
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
              {t.benefits.map((item, i) => (
                <motion.div key={item.num} {...fade(i * 0.1)} className="bg-charcoal-deep p-10 md:p-12">
                  <p className="font-serif text-[11px] tracking-[0.3em] text-champagne/40 mb-8">{item.num}</p>
                  <h3 className="font-serif text-2xl font-light tracking-wider uppercase text-text-primary mb-5">{item.title}</h3>
                  <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PHOTO PAIR */}
        <section className="grid grid-cols-2 h-[75vh]">
          <ParallaxImage src="/Hotelerie.jpeg" className="h-full" strength={120} overlay="bg-black/20" />
          <ParallaxImage src="/Conscience.jpeg" className="h-full" strength={165} overlay="bg-black/20" />
        </section>

        {/* WHY CURATO */}
        <section className="py-28 px-5 bg-charcoal-mid">
          <div className="max-w-[1200px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-16">
              {t.whyLabel}
            </motion.p>
            <div className="space-y-0 divide-y divide-border">
              {t.whyItems.map((step, i) => (
                <motion.div key={step.n} {...fade(i * 0.08)} className="flex items-start gap-10 py-10">
                  <span className="font-serif text-[13px] tracking-[0.2em] text-champagne/40 w-10 shrink-0 pt-1">{step.n}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <h3 className="font-serif text-2xl font-light tracking-wider uppercase text-text-primary">{step.title}</h3>
                    <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <section className="relative py-36 overflow-hidden">
          <ParallaxImage src="/Background Image 5.jpeg" className="absolute inset-0" strength={130} overlay="bg-black/65" />
          <div className="relative z-10 max-w-[900px] mx-auto px-5 text-center">
            <motion.p {...fade()} className="font-serif text-3xl md:text-5xl font-light tracking-[0.28em] leading-[1.3] text-text-primary">
              {t.quote}
            </motion.p>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-36 overflow-hidden">
          <MouseParallaxImage src="/Background Image 8.jpeg" className="absolute inset-0" strength={10} overlay="bg-black/65" />
          <div className="relative z-10 max-w-[1200px] mx-auto px-5 text-center">
            <motion.h2 {...fade()} className="font-serif text-4xl md:text-6xl font-light tracking-[0.35em] uppercase leading-[1.1] text-text-primary mb-6">
              {t.ctaTitle}
            </motion.h2>
            <motion.p {...fade(0.15)} className="font-serif text-[16px] font-light text-text-secondary mb-12 max-w-md mx-auto">
              {t.ctaSubtitle}
            </motion.p>
            <motion.div {...fade(0.25)}>
              <Link href="/candidature" className="inline-block font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper transition-all duration-300">
                {t.ctaBtn}
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

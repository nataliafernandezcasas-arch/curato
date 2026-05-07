"use client";

import Link from "next/link";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { motion } from "framer-motion";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { delay: d, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
});

export default function ComerciosPage() {
  return (
    <>
      <Nav />
      <main>

        {/* HERO */}
        <section className="relative h-[92vh] flex items-end pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/Background Image 8.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-black/50 to-black/20" />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto px-5 w-full">
            <motion.p
              {...fade(0.1)}
              className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6"
            >
              Pour les maisons
            </motion.p>
            <motion.h1
              {...fade(0.2)}
              className="font-serif text-5xl md:text-[6.5rem] font-light tracking-[0.28em] uppercase leading-[1] text-text-primary max-w-4xl"
            >
              Ils vous ont<br />
              <span className="text-champagne">choisi.</span>
            </motion.h1>
            <motion.p
              {...fade(0.35)}
              className="font-serif text-[18px] font-light text-text-secondary mt-8 max-w-xl leading-relaxed"
            >
              Des créateurs qui visitent votre maison parce qu'ils l'ont choisie,
              pas parce qu'on les a engagés. Un contenu authentique, publié.
            </motion.p>
          </div>
        </section>

        {/* LE PRINCIPE */}
        <section className="py-28 px-5 bg-charcoal-deep">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
              <motion.div {...fade()}>
                <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-8">
                  Le principe
                </p>
                <h2 className="font-serif text-4xl md:text-5xl font-light tracking-[0.28em] uppercase leading-[1.1] text-text-primary">
                  Toujours<br />une histoire.
                </h2>
              </motion.div>
              <motion.div {...fade(0.15)} className="pt-0 md:pt-14">
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed mb-6">
                  Curato sélectionne des créateurs parisiens qui explorent les meilleures adresses
                  de la ville avec leur propre crédit mensuel. Ils choisissent où aller.
                </p>
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed">
                  Votre maison apparaît dans leur vie, pas dans une campagne.
                  C'est la différence entre un message publicitaire et une recommandation sincère.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PHOTO BREAK */}
        <section className="relative h-[60vh] overflow-hidden">
          <img
            src="/Background Image 6.jpeg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/30" />
        </section>

        {/* CE QUE VOUS RECEVEZ */}
        <section className="py-28 px-5 bg-charcoal-deep border-t border-border">
          <div className="max-w-[1200px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-16">
              Ce que vous recevez
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
              {[
                {
                  num: "01",
                  title: "Visites authentiques",
                  body: "Des créateurs vérifiés qui ont sincèrement choisi votre maison. Aucun brief imposé, aucune coordination de votre côté.",
                },
                {
                  num: "02",
                  title: "Contenu éditorial",
                  body: "Stories, reels, posts publiés sur leurs réseaux avec mention à votre maison. Vous disposez de 90 jours de droits exclusifs d'utilisation.",
                },
                {
                  num: "03",
                  title: "Visibilité curé",
                  body: "Votre adresse figure dans le carnet Curato, distribué aux créateurs sélectionnés à Paris. Une présence discrète, ciblée, efficace.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  {...fade(i * 0.1)}
                  className="bg-charcoal-deep p-10 md:p-12"
                >
                  <p className="font-serif text-[11px] tracking-[0.3em] text-champagne/40 mb-8">{item.num}</p>
                  <h3 className="font-serif text-2xl font-light tracking-wider uppercase text-text-primary mb-5">
                    {item.title}
                  </h3>
                  <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed">
                    {item.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PHOTO BREAK */}
        <section className="grid grid-cols-2 h-[55vh]">
          <div className="relative overflow-hidden">
            <img src="/Hotelerie.jpeg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="relative overflow-hidden">
            <img src="/Conscience.jpeg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </section>

        {/* POURQUOI CURATO */}
        <section className="py-28 px-5 bg-charcoal-mid">
          <div className="max-w-[1200px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-16">
              Pourquoi Curato
            </motion.p>
            <div className="space-y-0 divide-y divide-border">
              {[
                {
                  n: "I",
                  title: "Zéro coordination",
                  desc: "Le créateur réserve, arrive, vit l'expérience. Aucune négociation de votre côté, aucun brief à rédiger, aucun horaire à synchroniser.",
                },
                {
                  n: "II",
                  title: "Contenu sans campagne",
                  desc: "Ce n'est pas du marketing d'influence traditionnel. C'est un créateur qui vous recommande parce qu'il a choisi d'y être.",
                },
                {
                  n: "III",
                  title: "90 jours de droits",
                  desc: "Le contenu publié par le créateur vous appartient pour 90 jours. Réutilisez-le sur vos propres réseaux, librement.",
                },
                {
                  n: "IV",
                  title: "Sélection mutuelle",
                  desc: "Curato sélectionne les maisons comme il sélectionne les créateurs. Votre présence dans le carnet est un signe de qualité.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  {...fade(i * 0.08)}
                  className="flex items-start gap-10 py-10"
                >
                  <span className="font-serif text-[13px] tracking-[0.2em] text-champagne/40 w-10 shrink-0 pt-1">
                    {step.n}
                  </span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <h3 className="font-serif text-2xl font-light tracking-wider uppercase text-text-primary">
                      {step.title}
                    </h3>
                    <p className="font-serif text-[15px] font-light text-text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <section className="relative py-36 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/Background Image 5.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/65" />
          </div>
          <div className="relative z-10 max-w-[900px] mx-auto px-5 text-center">
            <motion.p
              {...fade()}
              className="font-serif text-3xl md:text-5xl font-light tracking-[0.28em] leading-[1.3] text-text-primary"
            >
              "La différence entre une publicité<br />
              et une <span className="text-champagne">recommandation sincère</span>."
            </motion.p>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-36 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/Background Image 8.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/65" />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto px-5 text-center">
            <motion.h2
              {...fade()}
              className="font-serif text-4xl md:text-6xl font-light tracking-[0.35em] uppercase leading-[1.1] text-text-primary mb-6"
            >
              Inscrire<br />votre maison.
            </motion.h2>
            <motion.p {...fade(0.15)} className="font-serif text-[16px] font-light text-text-secondary mb-12 max-w-md mx-auto">
              Curato sélectionne ses maisons partenaires avec le même soin
              qu'il sélectionne ses créateurs. Chaque candidature est étudiée.
            </motion.p>
            <motion.div {...fade(0.25)}>
              <Link
                href="/auth/sign-in"
                className="inline-block font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper transition-all duration-300"
              >
                Inscrire ma maison
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

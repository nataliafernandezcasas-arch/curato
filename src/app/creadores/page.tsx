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

export default function CreadoresPage() {
  return (
    <>
      <Nav />
      <main>

        {/* HERO */}
        <section className="relative h-[92vh] flex items-end pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/Background Image 4.jpeg"
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
              Pour les créateurs
            </motion.p>
            <motion.h1
              {...fade(0.2)}
              className="font-serif text-5xl md:text-[6.5rem] font-light tracking-[0.28em] uppercase leading-[1] text-text-primary max-w-4xl"
            >
              Votre vie.<br />
              <span className="text-champagne">Votre histoire.</span>
            </motion.h1>
            <motion.p
              {...fade(0.35)}
              className="font-serif text-[18px] font-light text-text-secondary mt-8 max-w-xl leading-relaxed"
            >
              Un crédit mensuel pour découvrir les meilleures adresses de Paris.
              Intégré à votre quotidien, jamais une mission.
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
                  Jamais une<br />campagne.
                </h2>
              </motion.div>
              <motion.div {...fade(0.15)} className="pt-0 md:pt-14">
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed mb-6">
                  Curato vous offre un crédit mensuel en euros pour visiter les restaurants,
                  sanctuaires de beauté, retraites de bien-être et hôtels boutique que vous choisissez.
                </p>
                <p className="font-serif text-[17px] font-light text-text-secondary leading-relaxed">
                  Vous vivez l'expérience. Vous publiez ce que vous ressentez.
                  La maison reçoit un contenu authentique, parce que vous l'avez sincèrement choisie.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PHOTO BREAK */}
        <section className="relative h-[60vh] overflow-hidden">
          <img
            src="/Background Image 7.jpeg"
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
                  title: "Crédit mensuel",
                  body: "Un montant en euros crédité chaque mois, à dépenser dans les adresses sélectionnées par Curato à Paris.",
                },
                {
                  num: "02",
                  title: "Accès curé",
                  body: "Un carnet d'adresses exclusif, gastronomie, beauté, bien-être, hôtellerie. Des maisons qui vous attendent.",
                },
                {
                  num: "03",
                  title: "Liberté éditoriale",
                  body: "Aucun brief, aucun script. Publiez ce que vous vivez, comme vous le vivez. La maison dispose de 90 jours de droits sur votre contenu.",
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
            <img src="/Gastronomie.jpeg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="relative overflow-hidden">
            <img src="/Bien etre.jpeg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </section>

        {/* COMMENT ÇA FONCTIONNE */}
        <section className="py-28 px-5 bg-charcoal-mid">
          <div className="max-w-[1200px] mx-auto">
            <motion.p {...fade()} className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-16">
              Comment ça fonctionne
            </motion.p>
            <div className="space-y-0 divide-y divide-border">
              {[
                {
                  n: "I",
                  title: "Sur invitation",
                  desc: "Curato est un écosystème fermé. Vous recevez une invitation, ou vous soumettez votre candidature.",
                },
                {
                  n: "II",
                  title: "Vous choisissez",
                  desc: "Parcourez le carnet d'adresses curé. Réservez ce qui vous attire, pas ce qu'on vous demande.",
                },
                {
                  n: "III",
                  title: "Vous vivez",
                  desc: "La visite est à votre rythme, intégrée à votre vie. Aucune contrainte de format ni de publication.",
                },
                {
                  n: "IV",
                  title: "Vous partagez",
                  desc: "Publiez ce que vous avez vécu. Une mention à la maison. Le reste vous appartient.",
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

        {/* CTA */}
        <section className="relative py-36 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/Background Image 3.jpeg"
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
              Votre invitation<br />vous attend.
            </motion.h2>
            <motion.p {...fade(0.15)} className="font-serif text-[16px] font-light text-text-secondary mb-12 max-w-md mx-auto">
              Curato sélectionne ses créateurs avec soin. Chaque candidature est étudiée manuellement.
            </motion.p>
            <motion.div {...fade(0.25)}>
              <Link
                href="/auth/sign-in"
                className="inline-block font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper transition-all duration-300"
              >
                Demander une invitation
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

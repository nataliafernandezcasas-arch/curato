"use client";

import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { useLang } from "@/lib/i18n/LanguageContext";
import { faqContent, type FaqSection } from "@/lib/i18n/faq";

// ─────────────────────────────────────────────────────────────────────────────
// /faq — Page de FAQ unifiée pour les deux audiences.
//
// Pourquoi tout sur une seule URL plutôt que /faq/creators + /faq/maisons :
//   • SEO indexable d'un seul coup, pas de duplication de chrome
//   • La majorité des visiteurs sont curieux des deux côtés (un créateur veut
//     comprendre comment les maisons fonctionnent, et inversement)
//   • Le toggle de langue (FR/EN/ES) du Nav couvre tout sans gymnastique
//
// Pas de framer-motion : /privacidad et /condiciones ont prouvé que
// whileInView reste coincé à opacity:0 en prod sur Next 16 + React 19 quand
// la page est lourde en contenu. HTML/CSS pur, et accordéon via <details>.
// ─────────────────────────────────────────────────────────────────────────────

function FaqAccordionItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  // <details>/<summary> donne un accordéon natif accessible, sans JS de notre côté.
  // Le marker par défaut est moche, on le cache avec marker:hidden et on dessine
  // notre propre indicateur "+/−" via CSS.
  return (
    <details
      className="group border-b border-white/8 py-5 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex items-start gap-4 cursor-pointer list-none">
        <span className="font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/40 mt-[6px] flex-shrink-0">
          {String(idx + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 font-serif text-[15px] md:text-[16px] font-light text-text-primary leading-snug tracking-wide group-hover:text-champagne transition-colors">
          {q}
        </span>
        <span
          aria-hidden="true"
          className="font-serif text-[18px] text-champagne/50 group-hover:text-champagne transition-all duration-300 select-none mt-[2px] group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-4 pl-10 pr-8">
        <p className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-[1.85] tracking-wide">
          {a}
        </p>
      </div>
    </details>
  );
}

function FaqSectionBlock({ section }: { section: FaqSection }) {
  return (
    <article id={section.id} className="scroll-mt-28">
      <h3 className="font-serif text-[18px] md:text-[20px] font-light tracking-[0.12em] uppercase text-champagne mb-6 leading-snug">
        {section.title}
      </h3>
      <div className="border-t border-white/8">
        {section.items.map((item, i) => (
          <FaqAccordionItem key={i} q={item.q} a={item.a} idx={i} />
        ))}
      </div>
    </article>
  );
}

export default function FaqPage() {
  const { lang } = useLang();
  const t = faqContent[lang];

  return (
    <>
      <Nav />
      <main className="bg-charcoal-deep">
        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <section className="pt-36 md:pt-44 pb-12 px-5 border-b border-border">
          <div className="max-w-[860px] mx-auto">
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-6">
              {t.eyebrow}
            </p>
            <h1 className="font-serif text-[clamp(2rem,6vw,3.4rem)] font-light tracking-[0.18em] uppercase leading-[1.1] text-text-primary mb-6">
              {t.pageTitle}
            </h1>
            <p className="font-serif text-[15px] md:text-[16px] font-light text-text-muted leading-[1.85] tracking-wide max-w-[640px] mb-6">
              {t.pageSubtitle}
            </p>
            <p className="font-serif text-[12px] font-light italic tracking-wide text-text-muted/60">
              {t.lastUpdatedLabel} · {t.lastUpdated}
            </p>
          </div>
        </section>

        {/* ─── TOC — jump aux deux audiences ──────────────────────────── */}
        <section className="px-5 pt-12 pb-4">
          <div className="max-w-[860px] mx-auto flex flex-col sm:flex-row gap-3 sm:gap-6">
            <a
              href="#storytellers"
              className="group flex items-baseline gap-3 font-serif text-[13px] font-light text-text-secondary hover:text-champagne transition-colors"
            >
              <span className="w-3 h-px bg-border group-hover:bg-champagne transition-colors" />
              {t.tocStorytellersLabel}
            </a>
            <a
              href="#maisons"
              className="group flex items-baseline gap-3 font-serif text-[13px] font-light text-text-secondary hover:text-champagne transition-colors"
            >
              <span className="w-3 h-px bg-border group-hover:bg-champagne transition-colors" />
              {t.tocMaisonsLabel}
            </a>
          </div>
        </section>

        {/* ─── STORYTELLERS ───────────────────────────────────────────── */}
        <section id="storytellers" className="px-5 py-16 md:py-20 scroll-mt-24">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-12">
              <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/60 mb-4">
                {t.storytellers.audienceLabel}
              </p>
              <h2 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.12em] uppercase leading-tight text-text-primary mb-5">
                {t.storytellers.audienceTitle}
              </h2>
              <p className="font-serif text-[15px] font-light text-text-muted leading-[1.85] tracking-wide max-w-[640px]">
                {t.storytellers.audienceIntro}
              </p>
            </div>

            <div className="space-y-14">
              {t.storytellers.sections.map((section) => (
                <FaqSectionBlock key={section.id} section={section} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Divider editorial ──────────────────────────────────────── */}
        <div className="px-5">
          <div className="max-w-[760px] mx-auto">
            <div className="w-full h-px bg-white/8" />
          </div>
        </div>

        {/* ─── MAISONS ────────────────────────────────────────────────── */}
        <section id="maisons" className="px-5 py-16 md:py-20 scroll-mt-24">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-12">
              <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/60 mb-4">
                {t.maisons.audienceLabel}
              </p>
              <h2 className="font-serif text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.12em] uppercase leading-tight text-text-primary mb-5">
                {t.maisons.audienceTitle}
              </h2>
              <p className="font-serif text-[15px] font-light text-text-muted leading-[1.85] tracking-wide max-w-[640px]">
                {t.maisons.audienceIntro}
              </p>
            </div>

            <div className="space-y-14">
              {t.maisons.sections.map((section) => (
                <FaqSectionBlock key={section.id} section={section} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── CONTACT CTA ────────────────────────────────────────────── */}
        <section className="px-5 py-20 md:py-28 border-t border-border">
          <div className="max-w-[640px] mx-auto text-center">
            <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/50 mb-6">
              {t.stillHaveQuestionsLabel}
            </p>
            <p className="font-serif text-[16px] md:text-[17px] font-light text-text-secondary leading-[1.85] tracking-wide mb-10">
              {t.stillHaveQuestionsText}
            </p>
            <a
              href={t.contactHref}
              className="inline-block font-serif text-[13px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-10 py-4 hover:bg-copper hover:text-white transition-all duration-300"
            >
              {t.contactCta}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

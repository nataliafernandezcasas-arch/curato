"use client";

import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { useLang } from "@/lib/i18n/LanguageContext";
import { privacyContent } from "@/lib/i18n/privacy";

export default function PrivacyPage() {
  const { lang } = useLang();
  const t = privacyContent[lang];

  return (
    <>
      <Nav />
      <main className="bg-charcoal-deep">
        {/* ── HEADER ── */}
        <section className="pt-36 md:pt-44 pb-12 px-5 border-b border-border">
          <div className="max-w-[860px] mx-auto">
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-6">
              {t.eyebrow}
            </p>
            <h1 className="font-serif text-[clamp(2rem,6vw,3.4rem)] font-light tracking-[0.18em] uppercase leading-[1.1] text-text-primary mb-6">
              {t.pageTitle}
            </h1>
            <p className="font-serif text-[12px] font-light italic tracking-wide text-text-muted">
              {t.lastUpdatedLabel} · {t.lastUpdated}
            </p>
          </div>
        </section>

        {/* ── TABLE OF CONTENTS ── */}
        <section className="px-5 pt-12">
          <div className="max-w-[860px] mx-auto">
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-5">
              {t.tocTitle}
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 list-none">
              {t.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="group flex items-baseline gap-3 font-serif text-[13px] font-light text-text-secondary hover:text-champagne transition-colors"
                  >
                    <span className="w-3 h-px bg-border group-hover:bg-champagne transition-colors" />
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── BODY ── */}
        <section className="px-5 py-16 md:py-24">
          <div className="max-w-[760px] mx-auto space-y-16">
            {t.sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28"
              >
                <h2 className="font-serif text-[20px] md:text-[22px] font-light tracking-[0.12em] uppercase text-champagne mb-6 leading-snug">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.blocks.map((block, j) => {
                    if (typeof block === "string") {
                      return (
                        <p
                          key={j}
                          className="font-serif text-[15px] font-light text-text-secondary leading-[1.85] tracking-wide"
                        >
                          {block}
                        </p>
                      );
                    }
                    return (
                      <ul key={j} className="space-y-2.5 pl-0">
                        {block.list.map((item, k) => (
                          <li
                            key={k}
                            className="flex gap-3 items-start font-serif text-[15px] font-light text-text-secondary leading-[1.75] tracking-wide"
                          >
                            <span className="w-4 h-px bg-champagne/40 mt-[14px] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

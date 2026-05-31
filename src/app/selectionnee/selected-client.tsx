"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

// ─────────────────────────────────────────────────────────────────────────────
// Selected-storyteller landing — used by three sibling routes so the URL
// reads naturally in each language: /selectionnee (FR), /selected (EN),
// /seleccionada (ES). All three render this component with a different
// `initialLang`. The language switcher in the top-right still lets the
// storyteller hop between languages once on the page.
//
// Storytellers don't apply to Curato — they're picked. This page is the first
// touch after a personal DM: it confirms they were chosen on purpose (not
// recruited from a form), names the première vague benefit, and offers a single
// CTA to continue to /candidature where we capture their email + IG handle.
//
// No framer-motion. The /privacidad and /condiciones pages taught us the hard
// way that whileInView/animate stick at opacity 0 in production on Next 16 +
// React 19 for content-heavy pages. Plain HTML + CSS only.
// ─────────────────────────────────────────────────────────────────────────────

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

type Copy = {
  eyebrow: string;
  title1: string;
  title2: string;
  intro: string;
  pillarsLabel: string;
  pillars: { title: string; desc: string }[];
  ctaLabel: string;
  ctaBtn: string;
  ctaNote: string;
  closing: string;
  signedBy: string;
};

const fr: Copy = {
  eyebrow: "Première vague · Sur invitation personnelle",
  title1: "Vous avez été",
  title2: "sélectionné.e.",
  intro:
    "Curato ne se postule pas. Chaque storyteller est choisi.e à la main, parmi celles et ceux dont l'univers nous semble juste pour ce que nous construisons à Paris. Si vous lisez ces mots, c'est que votre regard nous a touché.e.s.",
  pillarsLabel: "Ce que cela signifie",
  pillars: [
    {
      title: "Crédit doublé, à vie",
      desc: "Les premier.ère.s storytellers bénéficient d'un crédit mensuel doublé tant que leur compte reste actif. Un privilège que nous ne ré-ouvrirons pas.",
    },
    {
      title: "Aucun brief, aucune validation",
      desc: "Vous choisissez quand, où, comment. Le contenu naît de l'expérience, pas d'une commande.",
    },
    {
      title: "Confidentialité totale",
      desc: "Les conditions économiques se discutent en privé, lors de notre échange. Rien ne circule par écrit avant que vous ne le souhaitiez.",
    },
  ],
  ctaLabel: "Pour confirmer votre place",
  ctaBtn: "Continuer",
  ctaNote: "Vous serez recontacté.e sous 48 heures.",
  closing:
    "Si vous préférez en parler avant, écrivez-nous simplement en réponse à notre message. Nous prendrons le temps qu'il faut.",
  signedBy: "Natalia, fondatrice de Curato",
};

const en: Copy = {
  eyebrow: "First wave · By personal invitation",
  title1: "You have been",
  title2: "selected.",
  intro:
    "Curato isn't something you apply to. Every storyteller is hand-picked, chosen from those whose universe feels right for what we're building in Paris. If you're reading this, it's because your work caught us.",
  pillarsLabel: "What this means",
  pillars: [
    {
      title: "Lifetime doubled credit",
      desc: "The first storytellers receive a doubled monthly credit for as long as their account stays active. A privilege we will not reopen.",
    },
    {
      title: "No brief, no approval",
      desc: "You choose when, where, how. Content is born from the experience, never from a commission.",
    },
    {
      title: "Full confidentiality",
      desc: "Economic terms are discussed privately, in our call. Nothing circulates in writing before you wish it to.",
    },
  ],
  ctaLabel: "To confirm your place",
  ctaBtn: "Continue",
  ctaNote: "We will be in touch within 48 hours.",
  closing:
    "If you'd rather speak first, simply reply to our message. We'll take whatever time you need.",
  signedBy: "Natalia, founder of Curato",
};

const es: Copy = {
  eyebrow: "Primera ola · Por invitación personal",
  title1: "Has sido",
  title2: "seleccionado.a.",
  intro:
    "A Curato no se postula. Cada storyteller es elegido.a a mano, entre aquellas y aquellos cuyo universo encaja con lo que estamos construyendo en París. Si estás leyendo esto, es porque tu mirada nos llegó.",
  pillarsLabel: "Lo que esto significa",
  pillars: [
    {
      title: "Crédito doblado, de por vida",
      desc: "Los primeros.as storytellers reciben un crédito mensual doblado mientras la cuenta siga activa. Un privilegio que no volveremos a abrir.",
    },
    {
      title: "Sin brief, sin validación",
      desc: "Tú eliges cuándo, dónde, cómo. El contenido nace de la experiencia, no de un encargo.",
    },
    {
      title: "Confidencialidad total",
      desc: "Las condiciones económicas se conversan en privado, en nuestra llamada. Nada circula por escrito antes de que tú lo desees.",
    },
  ],
  ctaLabel: "Para confirmar tu plaza",
  ctaBtn: "Continuar",
  ctaNote: "Te contactaremos en menos de 48 horas.",
  closing:
    "Si prefieres hablar antes, responde simplemente al mensaje que te enviamos. Nos tomaremos el tiempo que haga falta.",
  signedBy: "Natalia, fundadora de Curato",
};

function copyFor(lang: Lang): Copy {
  if (lang === "en") return en;
  if (lang === "es") return es;
  return fr;
}

export default function SelectedClient({ initialLang }: { initialLang: Lang }) {
  const { setLang: setContextLang } = useLang();

  // We use local state seeded with initialLang (from the URL) instead of
  // reading the language from the global LanguageContext. The reason is SSR:
  // the global context defaults to "fr" on the server and on the very first
  // client render, then reads localStorage in useEffect. That meant the
  // initial HTML for /selected and /seleccionada was served in French, with
  // a flicker to the right language only after JS hydration. With local
  // state, the very first paint (server AND client hydration) is in the
  // correct language, no flicker, and SEO crawlers see the right content.
  const [lang, setLocalLang] = useState<Lang>(initialLang);

  // Sync the global context to the URL's language on mount, so the rest of
  // the app (nav, footer, links into other pages) lands in the same language
  // when the storyteller clicks away from this page.
  useEffect(() => {
    setContextLang(initialLang);
  }, [initialLang, setContextLang]);

  // Language switcher updates both the local state (controls THIS page's
  // rendering) and the global context (carries the choice to other pages).
  function handleLangChange(next: Lang) {
    setLocalLang(next);
    setContextLang(next);
  }

  const t = copyFor(lang);

  // CTA carries ?source=selectionnee so /candidature (and any downstream
  // analytics) can tell hand-picked première vague applicants apart from
  // organic /candidature traffic. The flag is informational only — the
  // candidature form itself is unchanged.
  const ctaHref = "/candidature?source=selectionnee";

  return (
    <div className="min-h-[100dvh] relative bg-charcoal-deep text-white">
      {/* ─── Backdrop ─────────────────────────────────────────────────────
          Floral hero, dimmed enough that the typography sits cleanly on
          top without losing the texture underneath. */}
      <div className="absolute inset-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-charcoal-deep/85 backdrop-blur-[2px]" />
      </div>

      {/* ─── Language switcher ──────────────────────────────────────────
          Same pattern as /onboarding/welcome — pointer-events-none on the
          wrapper so it never steals scroll; each button opts back in. */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 pointer-events-none">
        {LANGS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleLangChange(key)}
            className={`pointer-events-auto font-serif text-[11px] tracking-[0.25em] px-2.5 py-1.5 rounded-sm backdrop-blur-md transition-colors ${
              lang === key
                ? "bg-champagne/90 text-charcoal-deep"
                : "bg-black/40 text-white/70 hover:text-white"
            }`}
            aria-label={`Switch to ${label}`}
            aria-pressed={lang === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center px-5 py-20 md:py-28">
        <Link href="/" className="mb-16">
          <img
            src="/logo-curato-simple.png"
            alt="curato"
            style={{ height: "14px", width: "auto", display: "block" }}
          />
        </Link>

        <div className="w-full max-w-[640px] text-center">
          {/* Eyebrow */}
          <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/60 mb-10">
            {t.eyebrow}
          </p>

          {/* Title — second line italic for the editorial cut */}
          <h1 className="font-serif text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.1] font-light tracking-[0.08em] uppercase text-text-primary mb-10">
            {t.title1}
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                letterSpacing: "0.04em",
              }}
            >
              {t.title2}
            </em>
          </h1>

          {/* Hairline divider */}
          <div className="w-16 h-px bg-champagne/40 mx-auto mb-10" />

          {/* Intro */}
          <p className="font-serif text-[16px] md:text-[17px] font-light leading-[1.85] tracking-wide text-text-secondary max-w-[520px] mx-auto">
            {t.intro}
          </p>
        </div>

        {/* ─── Pillars ──────────────────────────────────────────────────
            Three reasons to feel chosen. Vertically stacked on mobile,
            still stacked on desktop — the reading rhythm matters more
            than horizontal density here. */}
        <div className="w-full max-w-[560px] mt-20">
          <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/50 text-center mb-10">
            {t.pillarsLabel}
          </p>

          <div className="space-y-8">
            {t.pillars.map((p, i) => (
              <div
                key={i}
                className="border-t border-white/10 pt-8 text-center"
              >
                <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/40 mb-3">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="font-serif text-[20px] md:text-[22px] font-light tracking-wide text-text-primary mb-4">
                  {p.title}
                </h2>
                <p className="font-serif text-[15px] font-light leading-[1.8] text-text-muted">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CTA ──────────────────────────────────────────────────── */}
        <div className="w-full max-w-[480px] mt-24 text-center">
          <p className="font-serif text-[11px] tracking-[0.4em] uppercase text-champagne/50 mb-6">
            {t.ctaLabel}
          </p>
          <Link
            href={ctaHref}
            className="inline-block font-serif text-[13px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-12 py-4 hover:bg-copper hover:text-white transition-all duration-300"
          >
            {t.ctaBtn}
          </Link>
          <p className="font-serif text-[12px] font-light text-text-muted/60 tracking-wide mt-6">
            {t.ctaNote}
          </p>
        </div>

        {/* ─── Closing ──────────────────────────────────────────────────
            Warm-out: lets the storyteller know she can just reply to the
            DM instead of clicking through, if that's more her style. */}
        <div className="w-full max-w-[520px] mt-20 text-center">
          <div className="w-px h-12 bg-champagne/30 mx-auto mb-10" />
          <p className="font-serif italic text-[15px] font-light leading-[1.9] text-text-muted">
            {t.closing}
          </p>
          <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/40 mt-8">
            — {t.signedBy}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-24">
          <p className="font-serif text-[10px] tracking-[0.4em] uppercase text-champagne/25">
            © Curato — {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

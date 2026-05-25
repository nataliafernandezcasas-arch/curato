"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { getWelcomeSlides, getWelcomeLabels } from "@/lib/i18n/welcome";
import { completeWelcome } from "./actions";

// Single scrollable page: the 10 PDF pages exported as JPGs are stacked
// vertically, full bleed, no chrome. The acceptance section (T&C + Privacy
// checkboxes + final CTA) sits at the bottom of the scroll. The storyteller
// reads through at their own pace and accepts at the end.
//
// We don't use Next/Image because the slides need to render full-width
// regardless of viewport, the file sizes are already under 350KB each (so
// they're network-friendly), and Next/Image's optimization can soften the
// typography in the rasterized text on each slide.
const LANG_OPTIONS = [
  { key: "fr" as const, label: "FR" },
  { key: "en" as const, label: "EN" },
  { key: "es" as const, label: "ES" },
];

export default function WelcomeClient() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const welcomeSlides = getWelcomeSlides(lang);
  const welcomeLabels = getWelcomeLabels(lang);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = termsAccepted && privacyAccepted && !submitting;

  async function handleSubmit() {
    if (!termsAccepted || !privacyAccepted) {
      setError(welcomeLabels.errorMustAccept);
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await completeWelcome({ termsAccepted, privacyAccepted });
    if (!res.ok) {
      setError(`${welcomeLabels.errorGeneric} (${res.error})`);
      setSubmitting(false);
      return;
    }
    // Onto the survey. The server-side guard in /onboarding/survey then
    // forwards to /dashboard/influencer once the survey is filled.
    router.push("/onboarding/survey");
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep text-white">
      {/* Floating language switcher — fixed top-right, subtle.
          Lets the storyteller switch between FR/EN/ES without breaking
          the scroll. ES currently falls back to FR (Canva translation
          pending). Pointer-events-none on the wrapper so it never blocks
          the underlying scroll/click; the buttons themselves opt back in. */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 pointer-events-none">
        {LANG_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setLang(key)}
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

      {/* Stacked slides — full bleed, no gaps */}
      <section aria-label="Dossier Curato">
        {welcomeSlides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            // First slide eagerly loaded so the page lands ready;
            // the rest are lazy so we don't hammer the network on load.
            loading={i === 0 ? "eager" : "lazy"}
            className="block w-full h-auto"
          />
        ))}
      </section>

      {/* Acceptance block — lives in the same scroll, separated by a
          dark band so the storyteller knows they've reached the action. */}
      <section
        aria-label="Acceptation des conditions"
        className="px-5 py-20 md:py-28 bg-charcoal-deep border-t border-white/10"
      >
        <div className="max-w-[680px] mx-auto">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">
            {welcomeLabels.acceptEyebrow}
          </p>
          <h1 className="font-serif text-[clamp(1.8rem,4.5vw,2.6rem)] font-light tracking-[0.15em] uppercase text-text-primary leading-tight mb-6">
            {welcomeLabels.acceptTitle}
          </h1>
          <p className="font-serif text-[15px] md:text-[16px] font-light text-text-secondary leading-[1.85] tracking-wide mb-12">
            {welcomeLabels.acceptIntro}
          </p>

          <div className="space-y-6 border-t border-white/8 pt-10">
            {/* Terms checkbox */}
            <label className="flex items-start gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
              />
              <span className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-relaxed tracking-wide group-hover:text-text-primary transition-colors">
                {welcomeLabels.termsLabel}{" "}
                <Link
                  href="/condiciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne/90 hover:text-champagne underline underline-offset-2 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {welcomeLabels.termsLink}
                </Link>
                <span className="text-copper/70"> {welcomeLabels.required}</span>
              </span>
            </label>

            {/* Privacy checkbox */}
            <label className="flex items-start gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
              />
              <span className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-relaxed tracking-wide group-hover:text-text-primary transition-colors">
                {welcomeLabels.privacyLabel}{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne/90 hover:text-champagne underline underline-offset-2 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {welcomeLabels.privacyLink}
                </Link>
                <span className="text-copper/70"> {welcomeLabels.required}</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4 mt-8">
              {error}
            </p>
          )}

          <div className="mt-12">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 font-serif text-[12px] tracking-[0.25em] uppercase px-8 py-4 transition-all duration-300 ${
                canSubmit
                  ? "bg-champagne text-charcoal-deep hover:bg-copper hover:text-white"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              {submitting ? welcomeLabels.submitting : welcomeLabels.enterCurato}
              {!submitting && <Check size={14} weight="bold" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

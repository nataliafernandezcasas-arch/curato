"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/member/button";
import { Choice } from "@/components/member/choice";
import { useRouter } from "next/navigation";
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
    // forwards to /dashboard/storyteller once the survey is filled.
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
            className={`pointer-events-auto bg-black/40 px-2.5 py-1.5 text-capitale tracking-capitale backdrop-blur-md transition-colors duration-200 ease-curato ${
              lang === key ? "text-accent" : "text-text-secondary hover:text-text-primary"
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
        className="bg-surface px-pagina py-respiro"
      >
        <div className="max-w-[680px] mx-auto">
          <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">
            {welcomeLabels.acceptEyebrow}
          </p>
          <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
            {welcomeLabels.acceptTitle}
          </h1>
          <p className="mb-seccion max-w-[46ch] text-corps text-text-secondary">
            {welcomeLabels.acceptIntro}
          </p>

          <div>
            {/* Terms checkbox */}
            <Choice checked={termsAccepted} onChange={setTermsAccepted}>
              <>
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
                <span className="text-copper"> {welcomeLabels.required}</span>
              </>
            </Choice>

            <Choice checked={privacyAccepted} onChange={setPrivacyAccepted}>
              <>
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
                <span className="text-copper"> {welcomeLabels.required}</span>
              </>
            </Choice>
          </div>

          {error && (
            <p className="mt-rango border-l-2 border-burgundy pl-fila text-legende text-text-primary">
              {error}
            </p>
          )}

          <div className="mt-seccion">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? welcomeLabels.submitting : welcomeLabels.enterCurato}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

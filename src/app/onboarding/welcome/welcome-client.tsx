"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { welcomeSlides, welcomeLabels, type WelcomeSlide } from "@/lib/i18n/welcome";
import { completeWelcome } from "./actions";

// Wizard with one step per PDF page (10 slides) + 1 final acceptance step.
// User navigates with Previous / Next buttons. Last step shows the two
// required checkboxes (Terms + Privacy) and a final "Entrer dans Curato"
// button that calls the server action and then forwards to the survey.
//
// State is intentionally kept in-component (no URL state) — this is a
// single-session walkthrough, refreshing should start over from slide 1.
// If we ever want resumability we can add a `welcome_progress` JSONB
// column on creators, but for now simplicity > resumability.
export default function WelcomeClient() {
  const router = useRouter();
  const totalSlides = welcomeSlides.length; // 10
  const acceptStepIndex = totalSlides; // step 10 = acceptance, so 11 total steps
  const totalSteps = totalSlides + 1;

  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirst = step === 0;
  const isAcceptStep = step === acceptStepIndex;
  const isLastSlide = step === totalSlides - 1; // last DOSSIER slide (not accept)
  const currentSlide: WelcomeSlide | undefined = welcomeSlides[step];
  const progressPct = ((step + 1) / totalSteps) * 100;

  function goBack() {
    if (isFirst || submitting) return;
    setError(null);
    setStep((s) => s - 1);
  }

  function goNext() {
    if (submitting) return;
    setError(null);
    if (step < acceptStepIndex) setStep((s) => s + 1);
  }

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
    // Onto the survey. Server-side guard in /onboarding/survey will then
    // forward to /dashboard/influencer once the survey is filled.
    router.push("/onboarding/survey");
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep text-white flex flex-col">
      {/* Top bar: logo + progress */}
      <header className="px-5 h-16 flex items-center justify-between border-b border-white/8 bg-black/20 backdrop-blur-sm">
        <Link href="/" tabIndex={-1} aria-label="Curato">
          <img
            src="/logo-curato-simple.png"
            alt="curato"
            style={{ height: "12px", width: "auto", display: "block" }}
          />
        </Link>
        <p className="font-serif text-[11px] tracking-[0.2em] uppercase text-white/30">
          {welcomeLabels.progressText(step + 1, totalSteps)}
        </p>
      </header>

      {/* Progress bar */}
      <div className="h-px bg-white/8 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-champagne transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Slide content */}
      <main className="flex-1 px-5 py-12 md:py-16 max-w-[1100px] mx-auto w-full">
        {isAcceptStep ? (
          <AcceptanceStep
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            onToggleTerms={(v) => setTermsAccepted(v)}
            onTogglePrivacy={(v) => setPrivacyAccepted(v)}
          />
        ) : currentSlide ? (
          <Slide slide={currentSlide} />
        ) : null}

        {error && (
          <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4 mt-10 max-w-[760px] mx-auto">
            {error}
          </p>
        )}
      </main>

      {/* Footer nav */}
      <footer className="px-5 pb-8 md:pb-10 max-w-[1100px] mx-auto w-full">
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/8">
          <button
            type="button"
            onClick={goBack}
            disabled={isFirst || submitting}
            className="flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/40 hover:text-champagne transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} />
            {welcomeLabels.back}
          </button>

          {isAcceptStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !termsAccepted || !privacyAccepted}
              className={`flex items-center gap-2 font-serif text-[12px] tracking-[0.25em] uppercase px-7 py-3.5 transition-all duration-300 ${
                !submitting && termsAccepted && privacyAccepted
                  ? "bg-champagne text-charcoal-deep hover:bg-copper hover:text-white"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              {submitting ? welcomeLabels.submitting : welcomeLabels.enterCurato}
              {!submitting && <Check size={14} weight="bold" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="flex items-center gap-2 font-serif text-[12px] tracking-[0.25em] uppercase px-7 py-3.5 bg-champagne text-charcoal-deep hover:bg-copper hover:text-white transition-all duration-300"
            >
              {isLastSlide ? welcomeLabels.next : welcomeLabels.next}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// ─── Slide renderer ─────────────────────────────────────────────────────────
// Picks the right layout based on which fields are present on the slide.
// Keeps the JSX of WelcomeClient lean.
function Slide({ slide }: { slide: WelcomeSlide }) {
  const hasBg = !!slide.bg;
  return (
    <section className="relative">
      {hasBg && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-sm">
          <img
            src={slide.bg}
            alt=""
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-charcoal-deep/40" />
        </div>
      )}

      <div className={`max-w-[860px] mx-auto ${hasBg ? "py-16 px-5" : ""}`}>
        {slide.eyebrow && (
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">
            {slide.eyebrow}
          </p>
        )}

        {slide.title && (
          <h1 className="font-serif text-[clamp(1.8rem,5vw,3rem)] font-light tracking-[0.15em] uppercase text-text-primary leading-tight mb-4">
            {slide.title}
          </h1>
        )}

        {slide.subtitle && (
          <p className="font-serif text-[13px] tracking-[0.3em] uppercase text-champagne/70 mb-10">
            {slide.subtitle}
          </p>
        )}

        {/* Quote-style block (used for confidentiality slide) */}
        {slide.quote && (
          <div className="text-center max-w-[680px] mx-auto space-y-6 italic">
            {slide.quote.map((line, i) => (
              <p
                key={i}
                className="font-serif text-[15px] md:text-[16px] font-light text-text-secondary leading-relaxed tracking-wide"
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Plain paragraphs */}
        {slide.paragraphs && (
          <div className="space-y-5 mt-2">
            {slide.paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-serif text-[15px] md:text-[16px] font-light text-text-secondary leading-[1.85] tracking-wide"
              >
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Categories grid (4 items) */}
        {slide.categories && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8 mt-8">
            {slide.categories.map((c) => (
              <div key={c.name} className="bg-charcoal-deep p-7 md:p-9">
                <p className="font-serif text-[13px] tracking-[0.3em] uppercase text-text-primary mb-3">
                  {c.name}
                </p>
                <p className="font-serif text-[13px] font-light text-text-muted tracking-wide">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Two columns (Vous recevez vos crédits / Vous racontez) */}
        {slide.twoColumns && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mt-4">
            <div>
              <h2 className="font-serif text-[18px] tracking-[0.15em] uppercase text-champagne mb-5">
                {slide.twoColumns.left.title}
              </h2>
              <p className="font-serif text-[15px] font-light text-text-secondary leading-[1.85]">
                {slide.twoColumns.left.body}
              </p>
            </div>
            <div>
              <h2 className="font-serif text-[18px] tracking-[0.15em] uppercase text-champagne mb-5">
                {slide.twoColumns.right.title}
              </h2>
              <p className="font-serif text-[15px] font-light text-text-secondary leading-[1.85]">
                {slide.twoColumns.right.body}
              </p>
            </div>
          </div>
        )}

        {/* Three columns (Calibré à votre audience) */}
        {slide.threeColumns && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 mt-4">
            <p className="font-serif text-[14px] font-light text-text-secondary leading-[1.85] italic">
              {slide.threeColumns.left.body}
            </p>
            <p className="font-serif text-[14px] font-light text-text-secondary leading-[1.85]">
              {slide.threeColumns.middle.body}
            </p>
            <div>
              <p className="font-serif text-[14px] font-light text-text-secondary leading-[1.7] mb-6">
                {slide.threeColumns.right.intro}
              </p>
              <ul className="space-y-3">
                {slide.threeColumns.right.items.map((it) => (
                  <li
                    key={it.label}
                    className="flex items-baseline justify-between gap-3 border-b border-white/8 pb-2"
                  >
                    <span className="font-serif text-[13px] font-light text-text-secondary">
                      {it.label}
                    </span>
                    <span className="font-serif text-[14px] text-champagne whitespace-nowrap">
                      {it.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Engagements (two columns of bullets) */}
        {slide.engagements && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 mt-4">
            <ul className="space-y-5">
              {slide.engagements.left.map((p, i) => (
                <li
                  key={i}
                  className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-[1.75]"
                >
                  {p}
                </li>
              ))}
            </ul>
            <ul className="space-y-5">
              {slide.engagements.right.map((p, i) => (
                <li
                  key={i}
                  className="font-serif text-[14px] md:text-[15px] font-light text-text-secondary leading-[1.75]"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits list (Ce que vous recevez) */}
        {slide.benefits && (
          <ul className="space-y-4 mt-6">
            {slide.benefits.map((b, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="w-3 h-px bg-champagne/60 mt-[14px] shrink-0" />
                <span className="font-serif text-[15px] font-light text-text-secondary leading-[1.75]">
                  {b}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Final acceptance step ──────────────────────────────────────────────────
function AcceptanceStep({
  termsAccepted,
  privacyAccepted,
  onToggleTerms,
  onTogglePrivacy,
}: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onToggleTerms: (v: boolean) => void;
  onTogglePrivacy: (v: boolean) => void;
}) {
  return (
    <div className="max-w-[680px] mx-auto">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">
        Dernière étape
      </p>
      <h1 className="font-serif text-[clamp(1.8rem,4.5vw,2.6rem)] font-light tracking-[0.15em] uppercase text-text-primary leading-tight mb-6">
        {welcomeLabels.acceptTitle}
      </h1>
      <p className="font-serif text-[15px] md:text-[16px] font-light text-text-secondary leading-[1.85] tracking-wide mb-12">
        {welcomeLabels.acceptIntro}
      </p>

      <div className="space-y-6 border-t border-white/8 pt-10">
        <label className="flex items-start gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onToggleTerms(e.target.checked)}
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

        <label className="flex items-start gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => onTogglePrivacy(e.target.checked)}
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
    </div>
  );
}

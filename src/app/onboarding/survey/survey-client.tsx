"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/member/button";
import { Choice } from "@/components/member/choice";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { submitSurvey, type SurveyAnswers } from "./actions";
import { SUBJECT_MAX, SUBJECT_QUESTION } from "@/lib/photo-subjects";

const DOS_AL_MAS: Record<Lang, string> = {
  fr: "Deux au plus. C'est ce que les maisons lisent sous votre nom.",
  en: "Two at most. It's what houses read under your name.",
  es: "Dos como máximo. Es lo que las maisons leen bajo tu nombre.",
};

// ────────────────────────────────────────────────────────────────────────────
// Types — mirror what /onboarding/survey/page.tsx selects from the DB
// ────────────────────────────────────────────────────────────────────────────

export type SurveyOption = {
  value: string;
  label_es: string;
  label_fr?: string;
  label_en?: string;
};

export type SurveyQuestion = {
  id: string;
  position: number;
  slug: string;
  question_text_es: string;
  question_text_fr: string | null;
  question_text_en: string | null;
  question_type: "multi_select" | "cards" | "single_select" | "slider";
  options: SurveyOption[];
  is_required: boolean;
};

// ────────────────────────────────────────────────────────────────────────────
// i18n helpers — fall back to ES if FR/EN labels are missing on a row
// ────────────────────────────────────────────────────────────────────────────

const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

function pickQuestionText(q: SurveyQuestion, lang: Lang): string {
  if (lang === "es") return q.question_text_es;
  if (lang === "fr") return q.question_text_fr ?? q.question_text_es;
  return q.question_text_en ?? q.question_text_es;
}

function pickOptionLabel(opt: SurveyOption, lang: Lang): string {
  if (lang === "es") return opt.label_es;
  if (lang === "fr") return opt.label_fr ?? opt.label_es;
  return opt.label_en ?? opt.label_es;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export default function SurveyClient({ questions }: { questions: SurveyQuestion[] }) {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = translations[lang].onboardingSurvey;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [consented, setConsented] = useState(false);

  const total = questions.length;
  const current = questions[step];
  const currentAnswers = answers[current?.slug ?? ""] ?? [];
  const answersOk = !current?.is_required || currentAnswers.length > 0;
  const isLast = step === total - 1;
  const isFirst = step === 0;
  const canProceed = answersOk && (!isLast || consented);
  const progressPct = ((step + 1) / total) * 100;

  // ── Option selection
  function toggleOption(value: string, mode: "multi" | "single") {
    setAnswers((prev) => {
      const slug = current.slug;
      const cur = prev[slug] ?? [];
      if (mode === "single") {
        // Tap-to-deselect on cards keeps the UI honest.
        return { ...prev, [slug]: cur.includes(value) ? [] : [value] };
      }
      // Qué fotografía: dos al más, igual que en la 16b (photo-subjects.ts).
      if (!cur.includes(value) && slug === SUBJECT_QUESTION && cur.length >= SUBJECT_MAX) return prev;
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [slug]: next };
    });
  }

  // ── Navigation
  function goNext() {
    if (!canProceed || submitting) return;
    setDirection(1);
    if (isLast) {
      void handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (isFirst || submitting) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitSurvey(answers);
    if (!res.ok) {
      // Surface the actual server-side error code so we can diagnose
      // why the upsert / completion flag flip failed.
      setSubmitError(`${t.error} (${res.error})`);
      setSubmitting(false);
      return;
    }
    setDone(true);
    // Brief celebratory pause, then off to the feed.
    setTimeout(() => router.push("/dashboard/storyteller"), 1500);
  }

  // ── Done screen
  if (done) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-deep flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-[440px]"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
            className="inline-flex items-center justify-center w-14 h-14 border border-champagne/40 mb-7"
          >
            <Sparkle size={22} weight="fill" className="text-champagne" />
          </motion.div>
          <h1 className="font-serif text-[28px] md:text-[32px] font-light tracking-[0.15em] uppercase text-white leading-tight mb-4">
            {t.doneTitle}
          </h1>
          <p className="font-serif text-[14px] font-light text-white/50 leading-relaxed tracking-wide">
            {t.doneSubtitle}
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Survey screen
  return (
    <div className="min-h-[100dvh] bg-charcoal-deep flex flex-col">
      {/* ── Top bar: logo + language switcher ── */}
      <header className="flex h-16 items-center justify-between bg-surface/70 px-pagina backdrop-blur-sm">
        <Link href="/" tabIndex={-1}>
          <img
            src="/logo-curato-simple.png"
            alt="curato"
            style={{ height: "12px", width: "auto", display: "block" }}
          />
        </Link>
        <div className="flex items-center gap-3">
          {LANGS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setLang(key)}
              className={`min-h-11 text-capitale tracking-capitale transition-colors duration-200 ease-curato ${
                lang === key ? "text-accent" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="px-5 pt-8 max-w-[760px] mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.eyebrow}</p>
          <p className="text-capitale uppercase tracking-capitale tabular-nums text-text-muted">
            {t.progress(step + 1, total)}
          </p>
        </div>
        <div className="relative h-px overflow-hidden bg-border">
          <motion.div
            className="absolute inset-y-0 left-0 bg-accent"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* ── Question content ── */}
      <main className="flex-1 px-5 py-10 md:py-14 max-w-[760px] mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.slug}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-serif text-[26px] md:text-[34px] font-light tracking-wide text-white leading-tight mb-3">
              {pickQuestionText(current, lang)}
            </h1>
            <p className="font-serif text-[13px] font-light italic text-white/40 leading-relaxed mb-10 tracking-wide">
              {current.slug === SUBJECT_QUESTION
                ? DOS_AL_MAS[lang]
                : current.question_type === "cards"
                  ? t.cardsHint
                  : t.multiSelectHint}
            </p>

            {current.question_type === "cards" ? (
              <CardsGrid
                options={current.options}
                lang={lang}
                selected={currentAnswers}
                onToggle={(v) => toggleOption(v, "multi")}
              />
            ) : (
              <ChipsGrid
                options={current.options}
                lang={lang}
                selected={currentAnswers}
                onToggle={(v) => toggleOption(v, "multi")}
              />
            )}

            {/* Required hint only after the user tried to advance */}
            {!answersOk && current.is_required && (
              <p className="font-serif text-[12px] italic text-copper-vif mt-6 tracking-wide">
                {t.requiredHint}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Privacy notice — only on the first step */}
        {isFirst && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-serif text-[12px] font-light text-white/40 leading-relaxed tracking-wide mt-12 pt-6 border-t border-white/8"
          >
            {t.privacyNotice}{" "}
            <Link
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne/70 hover:text-champagne underline underline-offset-2 transition-colors"
            >
              {t.privacyPolicyLink}
            </Link>
          </motion.p>
        )}

        {/* Consent checkbox — only on the last step */}
        {isLast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-10 pt-6 border-t border-white/8"
          >
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
              />
              <span className="font-serif text-[13px] font-light text-white/70 leading-relaxed tracking-wide group-hover:text-white/90 transition-colors">
                {t.consentLabel}
                <span className="text-copper-vif"> *</span>
              </span>
            </label>
            {!consented && (
              <p className="font-serif text-[11px] italic text-white/30 mt-3 ml-7 tracking-wide">
                {t.consentRequiredHint}
              </p>
            )}
          </motion.div>
        )}
      </main>

      {/* ── Footer: nav buttons + error ── */}
      <footer className="px-5 pb-8 md:pb-10 max-w-[760px] mx-auto w-full">
        {submitError && (
          <p className="mb-fila border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">
            {submitError}
          </p>
        )}
        <div className="flex items-center justify-between gap-fila pt-fila">
          <button
            type="button"
            onClick={goBack}
            disabled={isFirst || submitting}
            className="flex min-h-11 items-center gap-2 text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-accent disabled:pointer-events-none disabled:opacity-45"
          >
            <ArrowLeft size={14} />
            {t.back}
          </button>
          <Button type="button" onClick={goNext} disabled={!canProceed || submitting}>
            {submitting ? t.submitting : isLast ? t.finish : t.next}
          </Button>
        </div>
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Chips (multi_select) — wrap layout, all options visible at once
// ────────────────────────────────────────────────────────────────────────────
function ChipsGrid({
  options,
  lang,
  selected,
  onToggle,
}: {
  options: SurveyOption[];
  lang: Lang;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      {options.map((opt) => (
        <Choice key={opt.value} checked={selected.includes(opt.value)} onChange={() => onToggle(opt.value)}>
          {pickOptionLabel(opt, lang)}
        </Choice>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Cards (single-select) — 2-column grid, larger visual selection
// ────────────────────────────────────────────────────────────────────────────
function CardsGrid({
  options,
  lang,
  selected,
  onToggle,
}: {
  options: SurveyOption[];
  lang: Lang;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      {options.map((opt) => (
        <Choice key={opt.value} checked={selected.includes(opt.value)} onChange={() => onToggle(opt.value)}>
          <span className="text-sous-titre">{pickOptionLabel(opt, lang)}</span>
        </Choice>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { submitSurvey, type SurveyAnswers } from "./actions";

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

  const total = questions.length;
  const current = questions[step];
  const currentAnswers = answers[current?.slug ?? ""] ?? [];
  const canProceed = !current?.is_required || currentAnswers.length > 0;
  const isLast = step === total - 1;
  const isFirst = step === 0;
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
    setTimeout(() => router.push("/dashboard/influencer"), 1500);
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
      <header className="px-5 h-16 flex items-center justify-between border-b border-white/8 bg-black/20 backdrop-blur-sm">
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
              className={`font-serif text-[11px] tracking-[0.2em] transition-colors ${
                lang === key ? "text-champagne" : "text-white/30 hover:text-white/60"
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
          <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/50">
            {t.eyebrow}
          </p>
          <p className="font-serif text-[11px] tracking-[0.2em] uppercase text-white/30">
            {t.progress(step + 1, total)}
          </p>
        </div>
        <div className="h-px bg-white/8 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-champagne"
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
              {current.question_type === "cards" ? t.cardsHint : t.multiSelectHint}
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
            {!canProceed && current.is_required && (
              <p className="font-serif text-[12px] italic text-copper/70 mt-6 tracking-wide">
                {t.requiredHint}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer: nav buttons + error ── */}
      <footer className="px-5 pb-8 md:pb-10 max-w-[760px] mx-auto w-full">
        {submitError && (
          <p className="font-serif text-[13px] font-light text-copper/80 border-l border-copper/40 pl-4 mb-5">
            {submitError}
          </p>
        )}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/8">
          <button
            type="button"
            onClick={goBack}
            disabled={isFirst || submitting}
            className="flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/40 hover:text-champagne transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} />
            {t.back}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed || submitting}
            className={`flex items-center gap-2 font-serif text-[12px] tracking-[0.25em] uppercase px-7 py-3.5 transition-all duration-300 ${
              canProceed && !submitting
                ? "bg-champagne text-charcoal-deep hover:bg-copper hover:text-white"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {submitting ? t.submitting : isLast ? t.finish : t.next}
            {!submitting && (isLast ? <Check size={14} weight="bold" /> : <ArrowRight size={14} />)}
          </button>
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
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isOn = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`group relative font-serif text-[13px] tracking-wide px-5 py-3 transition-all duration-200 border ${
              isOn
                ? "bg-champagne text-charcoal-deep border-champagne"
                : "bg-transparent text-white/70 border-white/15 hover:border-champagne/50 hover:text-champagne"
            }`}
          >
            {isOn && (
              <Check size={11} weight="bold" className="inline-block mr-1.5 -mt-0.5" />
            )}
            {pickOptionLabel(opt, lang)}
          </button>
        );
      })}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const isOn = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`group relative text-left p-7 min-h-[120px] flex items-end transition-all duration-300 border ${
              isOn
                ? "border-champagne bg-champagne/10"
                : "border-white/10 bg-charcoal-mid/30 hover:border-champagne/40 hover:bg-charcoal-mid/50"
            }`}
          >
            {isOn && (
              <span className="absolute top-4 right-4 inline-flex items-center justify-center w-6 h-6 bg-champagne text-charcoal-deep">
                <Check size={12} weight="bold" />
              </span>
            )}
            <span
              className={`font-serif text-[18px] md:text-[20px] font-light tracking-wide leading-tight transition-colors ${
                isOn ? "text-champagne" : "text-white/80 group-hover:text-white"
              }`}
            >
              {pickOptionLabel(opt, lang)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

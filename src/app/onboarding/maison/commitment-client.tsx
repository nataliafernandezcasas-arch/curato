"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, DownloadSimple } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { getCommitmentLabels, MAISON_DOSSIER_SLIDES, MAISON_DOSSIER_PDF } from "@/lib/i18n/commitment";
import { signCommitment } from "./actions";

const LANG_OPTIONS = [
  { key: "fr" as const, label: "FR" },
  { key: "en" as const, label: "EN" },
  { key: "es" as const, label: "ES" },
];

export default function CommitmentClient({ maisonName }: { maisonName: string }) {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const l = getCommitmentLabels(lang);

  const [signatory, setSignatory] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = accepted && signatory.trim().length >= 2 && !submitting;

  async function handleSubmit() {
    if (!accepted) {
      setError(l.errorMustAccept);
      return;
    }
    if (signatory.trim().length < 2) {
      setError(l.errorMustSign);
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await signCommitment({ accepted, signatory });
    if (!res.ok) {
      setError(res.error === "must_sign" ? l.errorMustSign : res.error === "must_accept" ? l.errorMustAccept : `${l.errorGeneric} (${res.error})`);
      setSubmitting(false);
      return;
    }
    router.push("/dashboard/business");
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep text-white">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {LANG_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setLang(key)}
            className={`font-serif text-[11px] tracking-[0.25em] px-2.5 py-1.5 rounded-sm backdrop-blur-md transition-colors ${
              lang === key ? "bg-champagne/90 text-charcoal-deep" : "bg-black/40 text-white/70 hover:text-white"
            }`}
            aria-pressed={lang === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presentation dossier — stacked full-bleed pages */}
      <section aria-label="Dossier Curato">
        {MAISON_DOSSIER_SLIDES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="block w-full h-auto" />
        ))}
      </section>

      {/* Download the dossier */}
      <div className="text-center py-10 border-t border-white/10">
        <a
          href={MAISON_DOSSIER_PDF}
          download
          className="inline-flex items-center gap-2 font-serif text-[12px] tracking-[0.2em] uppercase text-champagne/80 hover:text-champagne border border-champagne/30 hover:border-champagne/60 px-6 py-3 transition-colors"
        >
          <DownloadSimple size={15} />
          {l.downloadLabel}
        </a>
      </div>

      {/* Commitment + signature band, over the floral backdrop */}
      <section className="relative border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal-deep/85" />
        </div>
        <div className="max-w-[640px] mx-auto px-5 py-24 md:py-28">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">{l.eyebrow}</p>
        <h1 className="font-serif text-[clamp(1.9rem,5vw,2.8rem)] font-light tracking-[0.14em] uppercase leading-tight mb-6">
          {l.title}
        </h1>
        {maisonName && (
          <p className="font-serif text-[13px] tracking-[0.25em] uppercase text-champagne/70 mb-6">{maisonName}</p>
        )}
        <p className="font-serif text-[15px] md:text-[16px] font-light text-white/70 leading-[1.8] tracking-wide mb-10">
          {l.intro}
        </p>

        {/* Commitment terms */}
        <ul className="space-y-4 border-t border-white/10 pt-8 mb-10">
          {l.terms.map((term, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-serif text-[13px] text-champagne/70 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-serif text-[15px] md:text-[16px] font-light text-white/85 leading-relaxed">{term}</span>
            </li>
          ))}
        </ul>

        {/* Signature */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <div>
            <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
              {l.signatureLabel} <span className="text-copper/70">{l.required}</span>
            </label>
            <input
              type="text"
              value={signatory}
              onChange={(e) => setSignatory(e.target.value)}
              placeholder={l.signaturePlaceholder}
              className="w-full px-5 py-4 border border-white/15 bg-charcoal-deep/50 text-text-primary font-serif text-[18px] italic tracking-wide focus:outline-none focus:border-champagne/50 transition-colors"
            />
          </div>

          <label className="flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0"
            />
            <span className="font-serif text-[14px] md:text-[15px] font-light text-white/75 leading-relaxed tracking-wide group-hover:text-white transition-colors">
              {l.acceptLabel.replace("{maison}", maisonName || "Curato")}
              <span className="text-copper/70"> {l.required}</span>
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
              canSubmit ? "bg-champagne text-charcoal-deep hover:bg-copper hover:text-white" : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {submitting ? l.submitting : l.submit}
            {!submitting && <Check size={14} weight="bold" />}
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/member/button";
import { useRouter } from "next/navigation";
import { DownloadSimple } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { getCommitmentLabels, getMaisonDossierSlides, getMaisonDossierPdf, getMaisonDossierFilename } from "@/lib/i18n/commitment";
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
  const dossierSlides = getMaisonDossierSlides(lang);
  const dossierPdf = getMaisonDossierPdf(lang);
  const dossierFilename = getMaisonDossierFilename(lang);

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

    const res = await signCommitment({ accepted, signatory, lang });
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
            className={`px-2.5 py-1.5 text-capitale tracking-capitale backdrop-blur-md transition-colors duration-200 ease-curato ${
              lang === key ? "bg-black/40 text-accent" : "bg-black/40 text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={lang === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presentation dossier — stacked full-bleed pages */}
      <section aria-label="Dossier Curato">
        {dossierSlides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="block w-full h-auto" />
        ))}
      </section>

      {/* Download the dossier */}
      <div className="py-seccion text-center">
        <a
          href={dossierPdf}
          download={dossierFilename}
          className="boton-cristal gap-2"
        >
          <DownloadSimple size={15} />
          {l.downloadLabel}
        </a>
      </div>

      {/* Commitment + signature band, over the floral backdrop */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal-deep/85" />
        </div>
        <div className="max-w-[640px] mx-auto px-5 py-24 md:py-28">
        <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{l.eyebrow}</p>
        <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
          {l.title}
        </h1>
        {maisonName && (
          <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{maisonName}</p>
        )}
        <p className="mb-seccion max-w-[46ch] text-corps text-text-secondary">
          {l.intro}
        </p>

        {/* Commitment terms */}
        <ul className="mb-seccion space-y-fila">
          {l.terms.map((term, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 text-capitale tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-corps text-text-primary">{term}</span>
            </li>
          ))}
        </ul>

        {/* Signature */}
        <div className="space-y-rango">
          <div>
            <label className="mb-bloque block text-capitale uppercase tracking-capitale text-accent">
              {l.signatureLabel} <span className="text-copper-vif">{l.required}</span>
            </label>
            <input
              type="text"
              value={signatory}
              onChange={(e) => setSignatory(e.target.value)}
              placeholder={l.signaturePlaceholder}
              className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ italic text-text-primary transition-colors duration-200 ease-curato outline-none placeholder:text-text-muted focus:border-accent"
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
              {l.acceptLabel.replace("{maison}", maisonName || "Curato")}{" "}
              <Link href="/condiciones" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                {l.termsLink}
              </Link>{" "}
              {l.acceptAndThe}{" "}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                {l.privacyLink}
              </Link>
              <span className="text-copper-vif"> {l.required}</span>
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-rango border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">
            {error}
          </p>
        )}

        <div className="mt-seccion">
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? l.submitting : l.submit}
          </Button>
        </div>
        </div>
      </section>
    </div>
  );
}

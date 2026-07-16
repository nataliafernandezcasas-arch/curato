"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, DownloadSimple } from "@phosphor-icons/react";
import { signRecruiterCommitment } from "./actions";

const SLIDES = [1, 2, 3, 4, 5, 6].map((n) => `/onboarding/recruiter/slide-${n}.jpg`);

// The commitment terms shown before signing (French — matches the recruiter
// space). They mirror the Recruiters agreement dossier.
const TERMS = [
  "Vous présentez à Curato des maisons parisiennes susceptibles de rejoindre le cercle, en toute indépendance (ni salarié, ni mandataire exclusif).",
  "Pour chaque maison que vous apportez et qui signe, vous percevez 50 % de l'abonnement de 299 €, soit 149,50 € par mois, pendant les 3 premiers mois payés (jusqu'à 448,50 € par maison).",
  "Une maison vous est attribuée si vous l'enregistrez avant qu'elle ne soit déjà contactée par Curato ou un autre recruiter. En cas de doublon, le premier enregistrement prime.",
  "La commission est versée par virement, dans les 15 jours suivant le paiement de la maison. Vous êtes responsable de vos obligations fiscales et sociales.",
  "Vous vous engagez à représenter Curato avec honnêteté et à ne pas contracter directement avec les maisons en dehors de la plateforme.",
  "Vous traitez les informations des maisons et de Curato de manière confidentielle, dans le respect du RGPD.",
];

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function RecruiterCommitmentClient({ recruiterName }: { recruiterName: string }) {
  const router = useRouter();

  const [signatory, setSignatory] = useState(recruiterName);
  const [place, setPlace] = useState("Paris");
  const [date, setDate] = useState(todayISO());
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = accepted && signatory.trim().length >= 2 && place.trim().length >= 1 && !!date && !submitting;

  async function handleSubmit() {
    if (!accepted) return setError("Vous devez accepter les conditions pour continuer.");
    if (signatory.trim().length < 2) return setError("Merci d'indiquer votre nom.");
    if (place.trim().length < 1) return setError("Merci d'indiquer le lieu.");
    if (!date) return setError("Merci d'indiquer la date.");
    setSubmitting(true);
    setError(null);
    const res = await signRecruiterCommitment({ accepted, signatory, place, date });
    if (!res.ok) {
      setError(`Une erreur est survenue (${res.error}).`);
      setSubmitting(false);
      return;
    }
    router.push("/dashboard/recruiter");
  }

  const inputClass =
    "w-full px-5 py-4 border border-white/15 bg-charcoal-deep/50 text-white font-serif text-[16px] tracking-wide focus:outline-none focus:border-champagne/50 transition-colors";
  const labelClass = "block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3";

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep text-white">
      {/* Dossier — stacked full-bleed pages */}
      <section aria-label="Dossier Recruiters Curato">
        {SLIDES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="block w-full h-auto" />
        ))}
      </section>

      {/* Download */}
      <div className="text-center py-10 border-t border-white/10">
        <a
          href="/onboarding/recruiter/dossier-curato-recruiter.pdf"
          download="Curato - Programme Recruiters.pdf"
          className="inline-flex items-center gap-2 font-serif text-[12px] tracking-[0.2em] uppercase text-champagne/80 hover:text-champagne border border-champagne/30 hover:border-champagne/60 px-6 py-3 transition-colors"
        >
          <DownloadSimple size={15} />
          Télécharger le dossier
        </a>
      </div>

      {/* Commitment + signature */}
      <section className="relative border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal-deep/85" />
        </div>
        <div className="max-w-[640px] mx-auto px-5 py-24 md:py-28">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-6">Programme Recruiters</p>
          <h1 className="font-serif text-[clamp(1.9rem,5vw,2.8rem)] font-light tracking-[0.14em] uppercase leading-tight mb-6">
            Votre engagement
          </h1>
          <p className="font-serif text-[15px] md:text-[16px] font-light text-white/70 leading-[1.8] tracking-wide mb-10">
            En rejoignant le programme Recruiters de Curato, vous acceptez les conditions ci-dessous. Signez pour accéder à votre espace.
          </p>

          <ul className="space-y-4 border-t border-white/10 pt-8 mb-10">
            {TERMS.map((term, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-serif text-[13px] text-champagne/70 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-[15px] md:text-[16px] font-light text-white/85 leading-relaxed">{term}</span>
              </li>
            ))}
          </ul>

          {/* Signature */}
          <div className="border-t border-white/10 pt-8 space-y-6">
            <div>
              <label className={labelClass}>Nom et prénom <span className="text-copper/70">*</span></label>
              <input type="text" value={signatory} onChange={(e) => setSignatory(e.target.value)} placeholder="Votre nom" className={`${inputClass} italic`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Fait à <span className="text-copper/70">*</span></label>
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Paris" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Le <span className="text-copper/70">*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <label className="flex items-start gap-4 cursor-pointer group">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0" />
              <span className="font-serif text-[14px] md:text-[15px] font-light text-white/75 leading-relaxed tracking-wide group-hover:text-white transition-colors">
                J&apos;ai lu et j&apos;accepte les conditions du programme Recruiters Curato, ainsi que les{" "}
                <Link href="/condiciones" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                  conditions générales
                </Link>{" "}
                et la{" "}
                <Link href="/privacidad" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                  politique de confidentialité
                </Link>
                <span className="text-copper/70"> *</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="font-serif text-[13px] font-light text-copper/80 leading-relaxed border-l border-copper/40 pl-4 mt-8">{error}</p>
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
              {submitting ? "Signature…" : "Signer et accéder à mon espace"}
              {!submitting && <Check size={14} weight="bold" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

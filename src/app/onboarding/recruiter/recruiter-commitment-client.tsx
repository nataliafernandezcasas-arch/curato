"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/member/button";
import { useRouter } from "next/navigation";
import { DownloadSimple } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { signRecruiterCommitment } from "./actions";

const SLIDES = [1, 2, 3, 4, 5, 6].map((n) => `/onboarding/recruiter/slide-${n}.jpg`);

// Las condiciones que se muestran antes de firmar. Calcan el dossier
// Recruiters (el PDF y las láminas siguen en francés hasta que lleguen las
// versiones traducidas).
const T: Record<Lang, {
  terms: string[];
  dossierLabel: string;
  download: string;
  eyebrow: string;
  title: string;
  intro: string;
  nameLabel: string;
  namePlaceholder: string;
  placeLabel: string;
  dateLabel: string;
  acceptStart: string;
  termsLink: string;
  and: string;
  privacyLink: string;
  signing: string;
  submit: string;
  errorAccept: string;
  errorName: string;
  errorPlace: string;
  errorDate: string;
  errorGeneric: string;
}> = {
  fr: {
    terms: [
      "Vous présentez à Curato des maisons parisiennes susceptibles de rejoindre le cercle, en toute indépendance (ni salarié, ni mandataire exclusif).",
      "Pour chaque maison que vous apportez et qui signe, vous percevez 50 % de l'abonnement de 299 €, soit 149,50 € par mois, pendant les 3 premiers mois payés (jusqu'à 448,50 € par maison).",
      "Une maison vous est attribuée si vous l'enregistrez avant qu'elle ne soit déjà contactée par Curato ou un autre recruiter. En cas de doublon, le premier enregistrement prime.",
      "La commission est versée par virement, dans les 15 jours suivant le paiement de la maison. Vous êtes responsable de vos obligations fiscales et sociales.",
      "Vous vous engagez à représenter Curato avec honnêteté et à ne pas contracter directement avec les maisons en dehors de la plateforme.",
      "Vous traitez les informations des maisons et de Curato de manière confidentielle, dans le respect du RGPD.",
    ],
    dossierLabel: "Dossier Recruiters Curato",
    download: "Télécharger le dossier",
    eyebrow: "Programme Recruiters",
    title: "Votre engagement",
    intro: "En rejoignant le programme Recruiters de Curato, vous acceptez les conditions ci-dessous. Signez pour accéder à votre espace.",
    nameLabel: "Nom et prénom",
    namePlaceholder: "Votre nom",
    placeLabel: "Fait à",
    dateLabel: "Le",
    acceptStart: "J'ai lu et j'accepte les conditions du programme Recruiters Curato, ainsi que les",
    termsLink: "conditions générales",
    and: "et la",
    privacyLink: "politique de confidentialité",
    signing: "Signature…",
    submit: "Signer et accéder à mon espace",
    errorAccept: "Vous devez accepter les conditions pour continuer.",
    errorName: "Merci d'indiquer votre nom.",
    errorPlace: "Merci d'indiquer le lieu.",
    errorDate: "Merci d'indiquer la date.",
    errorGeneric: "Une erreur est survenue. Réessayez dans un instant.",
  },
  en: {
    terms: [
      "You introduce Curato to Parisian maisons that could join the circle, as an independent party (neither an employee nor an exclusive agent).",
      "For each maison you bring in that signs, you receive 50% of the €299 subscription, i.e. €149.50 per month, for the first 3 paid months (up to €448.50 per maison).",
      "A maison is credited to you if you register it before Curato or another recruiter has already contacted it. In the event of a duplicate, the first registration prevails.",
      "The commission is paid by bank transfer within 15 days of the maison's payment. You are responsible for your own tax and social security obligations.",
      "You undertake to represent Curato honestly and not to contract directly with the maisons outside the platform.",
      "You treat information about the maisons and Curato as confidential, in compliance with the GDPR.",
    ],
    dossierLabel: "Curato Recruiters dossier",
    download: "Download the dossier",
    eyebrow: "Recruiters programme",
    title: "Your commitment",
    intro: "By joining the Curato Recruiters programme, you accept the terms below. Sign to access your space.",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    placeLabel: "Signed at",
    dateLabel: "On",
    acceptStart: "I have read and accept the terms of the Curato Recruiters programme, as well as the",
    termsLink: "terms and conditions",
    and: "and the",
    privacyLink: "privacy policy",
    signing: "Signing…",
    submit: "Sign and access my space",
    errorAccept: "You must accept the terms to continue.",
    errorName: "Please enter your name.",
    errorPlace: "Please enter the place.",
    errorDate: "Please enter the date.",
    errorGeneric: "Something went wrong. Try again in a moment.",
  },
  es: {
    terms: [
      "Presentas a Curato casas parisinas que podrían unirse al círculo, con total independencia (sin ser empleado ni agente exclusivo).",
      "Por cada casa que traes y que firma, recibes el 50 % de la suscripción de 299 €, es decir, 149,50 € al mes, durante los 3 primeros meses pagados (hasta 448,50 € por casa).",
      "Una casa se te atribuye si la registras antes de que Curato u otro recruiter la haya contactado. Si hay un duplicado, vale el primer registro.",
      "La comisión se paga por transferencia, en los 15 días siguientes al pago de la casa. Tú te encargas de tus obligaciones fiscales y sociales.",
      "Te comprometes a representar a Curato con honestidad y a no contratar directamente con las casas fuera de la plataforma.",
      "Tratas la información de las casas y de Curato de forma confidencial, respetando el RGPD.",
    ],
    dossierLabel: "Dossier Recruiters de Curato",
    download: "Descargar el dossier",
    eyebrow: "Programa Recruiters",
    title: "Tu compromiso",
    intro: "Al unirte al programa Recruiters de Curato, aceptas las condiciones de abajo. Firma para entrar en tu espacio.",
    nameLabel: "Nombre y apellidos",
    namePlaceholder: "Tu nombre",
    placeLabel: "En",
    dateLabel: "Fecha",
    acceptStart: "He leído y acepto las condiciones del programa Recruiters de Curato, así como las",
    termsLink: "condiciones generales",
    and: "y la",
    privacyLink: "política de privacidad",
    signing: "Firmando…",
    submit: "Firmar y entrar en mi espacio",
    errorAccept: "Tienes que aceptar las condiciones para continuar.",
    errorName: "Escribe tu nombre.",
    errorPlace: "Escribe el lugar.",
    errorDate: "Indica la fecha.",
    errorGeneric: "Algo ha fallado. Vuelve a intentarlo en un momento.",
  },
};

type ErrorKey = "errorAccept" | "errorName" | "errorPlace" | "errorDate" | "errorGeneric";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function RecruiterCommitmentClient({ recruiterName }: { recruiterName: string }) {
  const router = useRouter();
  const { lang } = useLang();
  const t = T[lang];

  const [signatory, setSignatory] = useState(recruiterName);
  const [place, setPlace] = useState("Paris");
  const [date, setDate] = useState(todayISO());
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // La clave del error, para que cambie con el idioma.
  const [error, setError] = useState<ErrorKey | null>(null);

  const canSubmit = accepted && signatory.trim().length >= 2 && place.trim().length >= 1 && !!date && !submitting;

  async function handleSubmit() {
    if (!accepted) return setError("errorAccept");
    if (signatory.trim().length < 2) return setError("errorName");
    if (place.trim().length < 1) return setError("errorPlace");
    if (!date) return setError("errorDate");
    setSubmitting(true);
    setError(null);
    const res = await signRecruiterCommitment({ accepted, signatory, place, date });
    if (!res.ok) {
      // El código técnico a la consola; en pantalla, un mensaje que se entienda.
      console.error("signRecruiterCommitment:", res.error);
      setError("errorGeneric");
      setSubmitting(false);
      return;
    }
    router.push("/dashboard/recruiter");
  }

  const inputClass =
    "campo-cristal font-serif text-[16px] tracking-wide";
  const labelClass = "block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3";

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep text-white">
      {/* Dossier — stacked full-bleed pages */}
      <section aria-label={t.dossierLabel}>
        {SLIDES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="block w-full h-auto" />
        ))}
      </section>

      {/* Download */}
      <div className="py-seccion text-center">
        <a
          href="/onboarding/recruiter/dossier-curato-recruiter.pdf"
          download="Curato - Programme Recruiters.pdf"
          className="boton-cristal gap-2"
        >
          <DownloadSimple size={15} />
          {t.download}
        </a>
      </div>

      {/* Commitment + signature */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal-deep/85" />
        </div>
        <div className="max-w-[640px] mx-auto px-5 py-24 md:py-28">
          <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{t.eyebrow}</p>
          <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
            {t.title}
          </h1>
          <p className="mb-seccion max-w-[46ch] text-corps text-text-secondary">
            {t.intro}
          </p>

          <ul className="mb-seccion space-y-fila">
            {t.terms.map((term, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 text-capitale tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-corps text-text-primary">{term}</span>
              </li>
            ))}
          </ul>

          {/* Signature */}
          <div className="space-y-rango">
            <div>
              <label className={labelClass}>{t.nameLabel} <span className="text-copper-vif">*</span></label>
              <input type="text" value={signatory} onChange={(e) => setSignatory(e.target.value)} placeholder={t.namePlaceholder} className={`${inputClass} italic`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>{t.placeLabel} <span className="text-copper-vif">*</span></label>
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Paris" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.dateLabel} <span className="text-copper-vif">*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <label className="flex items-start gap-4 cursor-pointer group">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-champagne cursor-pointer flex-shrink-0" />
              <span className="font-serif text-[14px] md:text-[15px] font-light text-white/75 leading-relaxed tracking-wide group-hover:text-white transition-colors">
                {t.acceptStart}{" "}
                <Link href="/condiciones" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                  {t.termsLink}
                </Link>{" "}
                {t.and}{" "}
                <Link href="/privacidad" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-champagne/90 hover:text-champagne underline underline-offset-2">
                  {t.privacyLink}
                </Link>
                <span className="text-copper-vif"> *</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-rango border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{t[error]}</p>
          )}

          <div className="mt-seccion">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? t.signing : t.submit}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

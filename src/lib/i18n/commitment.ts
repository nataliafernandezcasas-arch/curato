// Copy for the maison commitment step (/onboarding/maison). Kept in its own
// file (like welcome.ts) so the agreement wording is easy to review and update.

import type { Lang } from "./translations";

// The maison presentation dossier (8 pages, exported from the Canva PDF). Shown
// as stacked slides at the top of the commitment step, mirroring the creators'
// welcome dossier. French only for now (like the creators', ES/EN fall back).
export const MAISON_DOSSIER_SLIDES: string[] = Array.from(
  { length: 8 },
  (_, i) => `/onboarding/maison/slide-${i + 1}.jpg`
);
export const MAISON_DOSSIER_PDF = "/onboarding/maison/dossier-curato-maison.pdf";

export type CommitmentLabels = {
  dossierEyebrow: string;
  downloadLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  terms: string[]; // the bullet points of what they commit to
  signatureLabel: string;
  signaturePlaceholder: string;
  acceptLabel: string; // "{maison}" is replaced with the maison name
  required: string;
  submit: string;
  submitting: string;
  errorMustAccept: string;
  errorMustSign: string;
  errorGeneric: string;
  // Record: PDF + confirmation email copy
  signedBy: string;
  dateWord: string;
  pdfFooter: string;
  emailSubject: string;
  emailHeading: string;
  emailIntro: string;
  emailConfirmNote: string;
};

const LABELS: Record<Lang, CommitmentLabels> = {
  fr: {
    dossierEyebrow: "Le dossier",
    downloadLabel: "Télécharger le dossier (PDF)",
    eyebrow: "Dernière étape",
    title: "Votre engagement Curato",
    intro:
      "Avant d'accéder à votre espace, confirmez les conditions de votre partenariat avec Curato.",
    terms: [
      "Les 15 premiers jours vous sont offerts.",
      "Puis un abonnement mensuel de 299 € pour rejoindre le cercle Curato.",
      "Un engagement initial de 3 mois minimum.",
      "À l'issue de ces 3 mois, l'abonnement se poursuit au mois et reste résiliable à tout moment.",
    ],
    signatureLabel: "Signature — saisissez votre nom complet",
    signaturePlaceholder: "Prénom et nom",
    acceptLabel:
      "J'ai lu et j'accepte, au nom de {maison}, les conditions d'engagement ci-dessus.",
    required: "*",
    submit: "Signer et entrer",
    submitting: "Signature…",
    errorMustAccept: "Merci d'accepter les conditions d'engagement pour continuer.",
    errorMustSign: "Merci de saisir votre nom complet comme signature.",
    errorGeneric: "Une erreur est survenue. Réessayez.",
    signedBy: "Signé par",
    dateWord: "Date",
    pdfFooter: "Curato · Paris · curatocollective.com",
    emailSubject: "Curato · Votre engagement est signé",
    emailHeading: "Engagement confirmé",
    emailIntro:
      "Merci, et bienvenue dans le cercle Curato. Voici le récapitulatif de votre engagement, dont une copie signée est jointe en PDF.",
    emailConfirmNote:
      "Conservez ce document. Pour toute question, écrivez-nous à hello@curatocollective.com.",
  },
  en: {
    dossierEyebrow: "The dossier",
    downloadLabel: "Download the dossier (PDF)",
    eyebrow: "Last step",
    title: "Your Curato commitment",
    intro:
      "Before entering your space, confirm the terms of your partnership with Curato.",
    terms: [
      "Your first 15 days are free.",
      "Then a monthly subscription of 299 € to join the Curato circle.",
      "An initial commitment of 3 months minimum.",
      "After these 3 months, the subscription continues month to month and can be cancelled at any time.",
    ],
    signatureLabel: "Signature — type your full name",
    signaturePlaceholder: "First and last name",
    acceptLabel:
      "I have read and accept, on behalf of {maison}, the commitment terms above.",
    required: "*",
    submit: "Sign and enter",
    submitting: "Signing…",
    errorMustAccept: "Please accept the commitment terms to continue.",
    errorMustSign: "Please type your full name as a signature.",
    errorGeneric: "Something went wrong. Please try again.",
    signedBy: "Signed by",
    dateWord: "Date",
    pdfFooter: "Curato · Paris · curatocollective.com",
    emailSubject: "Curato · Your commitment is signed",
    emailHeading: "Commitment confirmed",
    emailIntro:
      "Thank you, and welcome to the Curato circle. Here is a summary of your commitment; a signed copy is attached as a PDF.",
    emailConfirmNote:
      "Please keep this document. For any question, write to us at hello@curatocollective.com.",
  },
  es: {
    dossierEyebrow: "El dossier",
    downloadLabel: "Descargar el dossier (PDF)",
    eyebrow: "Último paso",
    title: "Tu compromiso con Curato",
    intro:
      "Antes de entrar a tu espacio, confirma las condiciones de tu alianza con Curato.",
    terms: [
      "Los primeros 15 días son gratis.",
      "Luego una suscripción mensual de 299 € para unirte al círculo Curato.",
      "Un compromiso inicial de 3 meses mínimo.",
      "Pasados esos 3 meses, la suscripción continúa mes a mes y se puede cancelar en cualquier momento.",
    ],
    signatureLabel: "Firma — escribe tu nombre completo",
    signaturePlaceholder: "Nombre y apellido",
    acceptLabel:
      "He leído y acepto, en nombre de {maison}, las condiciones de compromiso anteriores.",
    required: "*",
    submit: "Firmar y entrar",
    submitting: "Firmando…",
    errorMustAccept: "Acepta las condiciones de compromiso para continuar.",
    errorMustSign: "Escribe tu nombre completo como firma.",
    errorGeneric: "Ocurrió un error. Inténtalo de nuevo.",
    signedBy: "Firmado por",
    dateWord: "Fecha",
    pdfFooter: "Curato · Paris · curatocollective.com",
    emailSubject: "Curato · Tu compromiso está firmado",
    emailHeading: "Compromiso confirmado",
    emailIntro:
      "Gracias, y bienvenida al círculo Curato. Aquí tienes el resumen de tu compromiso; se adjunta una copia firmada en PDF.",
    emailConfirmNote:
      "Conserva este documento. Para cualquier duda, escríbenos a hello@curatocollective.com.",
  },
};

export function getCommitmentLabels(lang: Lang): CommitmentLabels {
  return LABELS[lang] ?? LABELS.fr;
}

// Copy for the maison commitment step (/onboarding/maison). Kept in its own
// file (like welcome.ts) so the agreement wording is easy to review and update.

import type { Lang } from "./translations";

export type CommitmentLabels = {
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
};

const LABELS: Record<Lang, CommitmentLabels> = {
  fr: {
    eyebrow: "Dernière étape",
    title: "Votre engagement Curato",
    intro:
      "Avant d'accéder à votre espace, confirmez les conditions de votre partenariat avec Curato.",
    terms: [
      "Un abonnement mensuel de 299 € pour rejoindre le cercle Curato.",
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
  },
  en: {
    eyebrow: "Last step",
    title: "Your Curato commitment",
    intro:
      "Before entering your space, confirm the terms of your partnership with Curato.",
    terms: [
      "A monthly subscription of 299 € to join the Curato circle.",
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
  },
  es: {
    eyebrow: "Último paso",
    title: "Tu compromiso con Curato",
    intro:
      "Antes de entrar a tu espacio, confirma las condiciones de tu alianza con Curato.",
    terms: [
      "Una suscripción mensual de 299 € para unirte al círculo Curato.",
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
  },
};

export function getCommitmentLabels(lang: Lang): CommitmentLabels {
  return LABELS[lang] ?? LABELS.fr;
}

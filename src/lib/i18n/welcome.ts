// ─────────────────────────────────────────────────────────────────────────────
// /onboarding/welcome — scrollable dossier
//
// The dossier is rendered as a single scrollable page: 10 PDF pages exported
// as JPGs are stacked top-to-bottom, full bleed. The acceptance section
// (T&C + Privacy checkboxes) lives at the bottom of the same scroll. No
// wizard, no pagination — the storyteller reads at their own pace.
//
// JPGs live in /public/onboarding/{lang}/ where {lang} is fr | en | es.
// Each language is a full export of the dossier from Canva — the text and
// visuals are baked into each image, so our code never overlays text on
// top of the slides. Spanish images are not ready yet; ES shows the French
// images (with Spanish alt texts and labels).
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./translations";

type Slide = { src: string; alt: string };

// Slide sources indexed by language. The 10 file names are identical across
// languages (slide-01.jpg through slide-10.jpg), only the folder changes.
// The alt texts follow the reader's language even while the images don't
// (ES still shows the FR export).
function slidesFor(folder: "fr" | "en", alts: string[]): Slide[] {
  return Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { src: `/onboarding/${folder}/slide-${n}.jpg`, alt: alts[i] };
  });
}

const altsFr = [
  "Curato — Pour les Storytellers",
  "Document confidentiel",
  "Comment ça fonctionne",
  "Catégories : Hôtellerie, Gastronomie, Bien-être, Conscience",
  "Vous recevez vos crédits · Vous racontez",
  "Calibré à votre audience",
  "Vos engagements (1/2)",
  "Vos engagements (2/2)",
  "Ce que vous recevez",
  "Rejoindre Curato",
];

const altsEn = [
  "Curato — For Storytellers",
  "Confidential document",
  "How it works",
  "Categories: Hospitality, Gastronomy, Wellness, Mindfulness",
  "You receive your credits · You tell the story",
  "Calibrated to your audience",
  "Your commitments (1/2)",
  "Your commitments (2/2)",
  "What you receive",
  "Join Curato",
];

const altsEs = [
  "Curato — Para los Storytellers",
  "Documento confidencial",
  "Cómo funciona",
  "Categorías: Hostelería, Gastronomía, Bienestar, Conciencia",
  "Recibes tus créditos · Cuentas la historia",
  "Ajustado a tu audiencia",
  "Tus compromisos (1/2)",
  "Tus compromisos (2/2)",
  "Lo que recibes",
  "Unirte a Curato",
];

// Returns the slide list for the user's language. Falls back to FR (legally
// binding) for languages not yet translated, so we never break the flow.
export function getWelcomeSlides(lang: Lang): Slide[] {
  if (lang === "en") return slidesFor("en", altsEn);
  // ES images not yet ready — FR images, Spanish alt texts.
  if (lang === "es") return slidesFor("fr", altsEs);
  return slidesFor("fr", altsFr);
}

// ─── Labels per language ─────────────────────────────────────────────────────
// Used by the acceptance block at the bottom of the scroll. FR is the legally
// binding default; EN and ES are translations of it.

type Labels = {
  acceptEyebrow: string;
  acceptTitle: string;
  acceptIntro: string;
  termsLabel: string;
  termsLink: string;
  privacyLabel: string;
  privacyLink: string;
  required: string;
  enterCurato: string;
  submitting: string;
  errorGeneric: string;
  errorMustAccept: string;
  switchLang: string;
  dossierLabel: string;
  acceptSectionLabel: string;
};

const labelsFr: Labels = {
  acceptEyebrow: "Dernière étape",
  acceptTitle: "Pour finaliser votre arrivée",
  acceptIntro:
    "Avant de découvrir le carnet et de commencer votre première saison, merci de confirmer que vous avez lu et accepté nos deux documents fondateurs.",
  termsLabel: "J'ai lu et j'accepte les",
  termsLink: "Conditions Générales",
  privacyLabel: "J'ai lu et j'accepte la",
  privacyLink: "Politique de Confidentialité",
  required: "*",
  enterCurato: "Entrer dans Curato",
  submitting: "Un instant…",
  errorGeneric: "Une erreur est survenue. Réessayez dans un instant.",
  errorMustAccept:
    "Merci d'accepter les Conditions Générales et la Politique de Confidentialité pour continuer.",
  switchLang: "Passer en",
  dossierLabel: "Dossier Curato",
  acceptSectionLabel: "Acceptation des conditions",
};

const labelsEn: Labels = {
  acceptEyebrow: "Last step",
  acceptTitle: "To finalise your arrival",
  acceptIntro:
    "Before discovering the address book and starting your first season, please confirm that you have read and accepted our two founding documents.",
  termsLabel: "I have read and accept the",
  termsLink: "Terms and Conditions",
  privacyLabel: "I have read and accept the",
  privacyLink: "Privacy Policy",
  required: "*",
  enterCurato: "Enter Curato",
  submitting: "One moment…",
  errorGeneric: "Something went wrong. Try again in a moment.",
  errorMustAccept:
    "Please accept the Terms and Conditions and the Privacy Policy to continue.",
  switchLang: "Switch to",
  dossierLabel: "Curato dossier",
  acceptSectionLabel: "Accepting the terms",
};

const labelsEs: Labels = {
  acceptEyebrow: "Último paso",
  acceptTitle: "Para completar tu llegada",
  acceptIntro:
    "Antes de descubrir el carnet y empezar tu primera temporada, confirma que has leído y aceptas nuestros dos documentos fundacionales.",
  termsLabel: "He leído y acepto las",
  termsLink: "Condiciones Generales",
  privacyLabel: "He leído y acepto la",
  privacyLink: "Política de Privacidad",
  required: "*",
  enterCurato: "Entrar en Curato",
  submitting: "Un momento…",
  errorGeneric: "Algo ha fallado. Vuelve a intentarlo en un momento.",
  errorMustAccept:
    "Acepta las Condiciones Generales y la Política de Privacidad para continuar.",
  switchLang: "Cambiar a",
  dossierLabel: "Dossier de Curato",
  acceptSectionLabel: "Aceptación de las condiciones",
};

export function getWelcomeLabels(lang: Lang): Labels {
  if (lang === "en") return labelsEn;
  if (lang === "es") return labelsEs;
  return labelsFr;
}

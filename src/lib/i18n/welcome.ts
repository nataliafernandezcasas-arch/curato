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
// top of the slides. Spanish is not yet ready; falls back to French.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./translations";

type Slide = { src: string; alt: string };

// Slide sources indexed by language. The 10 file names are identical across
// languages (slide-01.jpg through slide-10.jpg), only the folder changes.
function slidesFor(lang: "fr" | "en"): Slide[] {
  const alts = lang === "fr" ? altsFr : altsEn;
  return Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { src: `/onboarding/${lang}/slide-${n}.jpg`, alt: alts[i] };
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

// Returns the slide list for the user's language. Falls back to FR (legally
// binding) for languages not yet translated, so we never break the flow.
export function getWelcomeSlides(lang: Lang): Slide[] {
  if (lang === "en") return slidesFor("en");
  // ES not yet ready — fall back to FR.
  return slidesFor("fr");
}

// ─── Labels per language ─────────────────────────────────────────────────────
// Used by the acceptance block at the bottom of the scroll. FR is the legally
// binding default; EN ships now; ES falls back to FR until ready.

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
};

export function getWelcomeLabels(lang: Lang): Labels {
  if (lang === "en") return labelsEn;
  // ES not ready — fall back to FR (legally binding default).
  return labelsFr;
}

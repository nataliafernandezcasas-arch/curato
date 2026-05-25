// ─────────────────────────────────────────────────────────────────────────────
// /onboarding/welcome — scrollable dossier
//
// The dossier is rendered as a single scrollable page: 10 PDF pages exported
// as JPGs are stacked top-to-bottom, full bleed. The acceptance section
// (T&C + Privacy checkboxes) lives at the bottom of the same scroll. No
// wizard, no pagination — the storyteller reads at their own pace.
//
// JPGs live in /public/onboarding/. They were exported directly from the
// designer's PDF, so the text and visuals are already baked into each image.
// Our code does not overlay any text on the slides — it just renders them.
// ─────────────────────────────────────────────────────────────────────────────

export const welcomeSlides: { src: string; alt: string }[] = [
  { src: "/onboarding/slide-01-cover.jpg", alt: "Curato — Pour les Storytellers" },
  { src: "/onboarding/slide-02-confidentialite.jpg", alt: "Document confidentiel" },
  { src: "/onboarding/slide-03-fonctionne.jpg", alt: "Comment ça fonctionne" },
  { src: "/onboarding/slide-04-categories.jpg", alt: "Catégories : Hôtellerie, Gastronomie, Bien-être, Conscience" },
  { src: "/onboarding/slide-05-credits.jpg", alt: "Vous recevez vos crédits · Vous racontez" },
  { src: "/onboarding/slide-06-calibre.jpg", alt: "Calibré à votre audience" },
  { src: "/onboarding/slide-07-engagements-1.jpg", alt: "Vos engagements (1/2)" },
  { src: "/onboarding/slide-08-engagements-2.jpg", alt: "Vos engagements (2/2)" },
  { src: "/onboarding/slide-09-recevez.jpg", alt: "Ce que vous recevez" },
  { src: "/onboarding/slide-10-rejoindre.jpg", alt: "Rejoindre Curato" },
];

// Labels for the acceptance section at the bottom of the scroll. Kept FR-only
// for now since the dossier itself is FR-only.
export const welcomeLabels = {
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

// ─────────────────────────────────────────────────────────────────────────────
// /onboarding/welcome — slide content
//
// LITERAL COPY of the storytellers dossier PDF (10 slides + 1 acceptance step).
// Currently FR only because the PDF is FR; EN/ES translations can be added
// later when ready. The page renders the FR version regardless of the user's
// language preference for now.
//
// Each slide has an id, title/eyebrow/body shape that the welcome-client
// component knows how to render. Backgrounds reference existing images in
// /public so the visual is brand-consistent without needing PDF design assets.
//
// When the storyteller reaches the 11th step (`accept`), they check two
// boxes (Terms + Privacy) and submit. The server action then writes:
//   creators.welcome_completed_at = NOW()
//   creators.terms_accepted_at   = NOW()
//   creators.privacy_accepted_at = NOW()
// ─────────────────────────────────────────────────────────────────────────────

export type WelcomeSlide = {
  id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  // Single column of italic/quote-style content (used for the confidentiality slide)
  quote?: string[];
  // Categories block (4 items rendered as a grid)
  categories?: { name: string; desc: string }[];
  // Two-column block (used for "Vous recevez vos crédits" / "Vous racontez")
  twoColumns?: {
    left: { title: string; body: string };
    right: { title: string; body: string };
  };
  // Three-column block (used for "Calibré à votre audience")
  threeColumns?: {
    left: { body: string };
    middle: { body: string };
    right: { intro: string; items: { label: string; price: string }[] };
  };
  // Engagements columns (used for "Vos engagements" slides)
  engagements?: {
    left: string[];
    right: string[];
  };
  // Benefits list (used for "Ce que vous recevez")
  benefits?: string[];
  // Background image filename in /public (optional, used for cinematic slides)
  bg?: string;
};

export const welcomeSlides: WelcomeSlide[] = [
  // ─── 1 · COVER ───────────────────────────────────────────────────────────
  {
    id: "cover",
    bg: "/hero-floral.jpeg",
    eyebrow: "Pour les Storytellers",
    title: "Curato",
    subtitle: "Paris · Invitation Only",
    paragraphs: [
      "DOSSIER DE PRÉSENTATION",
      "Accès gratuit. Contenu authentique. Adresses d'exception.",
      "Curato connecte des créateurs soigneusement sélectionnés avec des maisons que nous choisissons une à une à Paris : restaurants, beauté, bien-être, hôtels boutique. Ce n'est pas un réseau d'influence classique. C'est un cercle de gens qui aiment vraiment ce qu'ils montrent.",
    ],
  },

  // ─── 2 · CONFIDENTIALITY ─────────────────────────────────────────────────
  {
    id: "confidentialite",
    bg: "/hero-floral.jpeg",
    quote: [
      "Ce document vous est adressé à titre personnel dans le cadre de votre invitation à découvrir Curato.",
      "Il contient des informations confidentielles sur notre fonctionnement et notre modèle.",
      "Merci de ne pas le partager.",
    ],
  },

  // ─── 3 · COMMENT ÇA FONCTIONNE ──────────────────────────────────────────
  {
    id: "fonctionne",
    eyebrow: "Comment ça fonctionne",
    title: "Vous êtes sélectionné",
    paragraphs: [
      "Curato choisit ses storytellers à la main. Chaque profil est évalué selon la qualité du contenu, l'univers visuel et l'affinité avec nos adresses. Chaque manifestation d'intérêt est étudiée individuellement.",
      "Une fois admis, vous reliez votre compte Instagram via une plateforme tierce sécurisée. Nous suivons uniquement vos publications publiques liées aux visites, jamais vos messages ni vos données privées.",
    ],
  },

  // ─── 4 · CATÉGORIES ──────────────────────────────────────────────────────
  {
    id: "categories",
    eyebrow: "Catégories",
    categories: [
      { name: "Hôtellerie", desc: "Boutique · Maisons d'hôtes" },
      { name: "Gastronomie", desc: "Restaurants · Cafés · Bars" },
      { name: "Bien-être", desc: "Spas · Soins · Massages" },
      { name: "Conscience", desc: "Yoga · Retraites · Sport · Méditation" },
    ],
  },

  // ─── 5 · VOUS RECEVEZ VOS CRÉDITS / VOUS RACONTEZ ───────────────────────
  {
    id: "credits-racontez",
    twoColumns: {
      left: {
        title: "Vous recevez vos crédits",
        body: "Chaque mois, vous recevez un crédit calibré à la taille de votre audience. Libre à vous de le dépenser dans l'adresse de votre choix, ou de le diviser entre deux maisons dans le mois. Une seule visite par lieu, pour toujours découvrir quelque chose de nouveau.",
      },
      right: {
        title: "Vous racontez",
        body: "Après la visite, vous publiez deux stories dans les 24 heures, en mentionnant la maison et Curato. Le ton, le style et le fond restent les vôtres. Pas de brief, pas de validation préalable, juste votre regard.",
      },
    },
  },

  // ─── 6 · CALIBRÉ À VOTRE AUDIENCE ───────────────────────────────────────
  {
    id: "calibre",
    title: "Calibré à votre audience",
    threeColumns: {
      left: {
        body: "Votre crédit mensuel est personnel et déterminé selon la taille de votre communauté et la nature de votre univers éditorial.",
      },
      middle: {
        body: "Vous répartissez votre crédit entre une ou deux maisons dans le mois, avec une limite d'une visite par adresse. Si l'expérience que vous choisissez dépasse votre crédit, vous pouvez librement couvrir la différence. Le montant exact de votre crédit vous est communiqué individuellement lors de votre admission.",
      },
      right: {
        intro: "Chaque maison fixe librement le tarif de l'expérience qu'elle propose. À titre indicatif :",
        items: [
          { label: "Une expérience gastronomique", price: "~ 150 €" },
          { label: "Une nuit en hôtel boutique", price: "~ 300 €" },
          { label: "Un soin bien-être", price: "~ 250 €" },
        ],
      },
    },
  },

  // ─── 7 · VOS ENGAGEMENTS (1/2) ──────────────────────────────────────────
  {
    id: "engagements-1",
    title: "Vos engagements",
    engagements: {
      left: [
        "En rejoignant Curato, vous acceptez quelques règles simples qui protègent la qualité du cercle et la confiance avec les maisons. Tout est précisé dans nos Conditions Générales, disponibles sur curatocollective.com.",
        "Chaque publication portera la mention « Collaboration commerciale », conformément à la réglementation française sur l'influence.",
        "Le contenu reflète votre expérience réelle. Vous restez libre du ton, du format et du fond éditorial. Pas de brief, jamais de validation préalable.",
      ],
      right: [
        "Annuler au moins 24 heures avant l'horaire prévu en cas d'empêchement.",
        "Une non-présentation sans annulation entraîne la perte du crédit de la visite et un avertissement.",
        "Trois avertissements dans une période de six mois donnent lieu à une revue du compte.",
        "Se comporter avec respect envers la maison, son équipe et ses clients.",
        "Engagement mensuel : utiliser au minimum 60% du crédit. Votre contenu peut être réutilisé uniquement par Curato et par la maison visitée.",
      ],
    },
  },

  // ─── 8 · VOS ENGAGEMENTS (2/2) ──────────────────────────────────────────
  {
    id: "engagements-2",
    title: "Vos engagements",
    engagements: {
      left: [
        "Vous restez propriétaire de votre contenu.",
        "La maison visitée peut le réutiliser pendant 90 jours en exclusivité, uniquement sur ses canaux propres : réseaux institutionnels, site internet, emailing et supports imprimés. Pas de publicité payante, pas de sub-licence à un tiers.",
        "Au-delà de 90 jours, vous retrouvez la pleine liberté sur sa diffusion.",
        "Lorsque vous photographiez ou filmez d'autres personnes dans la maison, vous êtes responsable d'obtenir leur consentement.",
      ],
      right: [
        "Curato est réservé aux personnes majeures.",
        "Un seul compte par personne.",
        "Vous vous engagez à ne pas contacter directement les maisons découvertes via Curato pour organiser des visites ou collaborations en dehors de la plateforme, pendant la durée de votre membership et pendant six mois après votre départ.",
      ],
    },
  },

  // ─── 9 · CE QUE VOUS RECEVEZ ────────────────────────────────────────────
  {
    id: "recevez",
    eyebrow: "Ce que vous recevez",
    title: "Entièrement gratuit.",
    benefits: [
      "Accès aux meilleures adresses curées de Paris : Restaurants, spas, bien-être, hôtels boutique.",
      "Votre contenu est votre monnaie. Aucun frais, aucun engagement financier.",
      "Catalogue exclusif sur invitation uniquement. Des adresses que personne d'autre ne vous propose.",
      "Nouvelles adresses chaque mois. Toujours quelque chose à découvrir.",
      "Tissé naturellement dans votre quotidien. Jamais une campagne, toujours une histoire.",
      "Une seule visite par adresse. Pour que Paris reste toujours une découverte.",
    ],
    paragraphs: ["Repartagez ce qui vous anime."],
  },

  // ─── 10 · REJOINDRE CURATO ──────────────────────────────────────────────
  {
    id: "rejoindre",
    bg: "/hero-floral.jpeg",
    eyebrow: "Rejoindre Curato",
    title: "Les places sont comptées.",
    subtitle: "Paris commence maintenant.",
    paragraphs: [
      "Vous y êtes. Encore une étape avant d'entrer dans le cercle : confirmer votre acceptation de nos Conditions Générales et de notre Politique de Confidentialité.",
    ],
  },
];

// Labels for the navigation + acceptance UI. Kept FR-only for now; can be
// moved into translations.ts when EN/ES are added.
export const welcomeLabels = {
  progressText: (current: number, total: number) =>
    `Page ${current} sur ${total}`,
  back: "Précédent",
  next: "Suivant",
  // Final acceptance step labels
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

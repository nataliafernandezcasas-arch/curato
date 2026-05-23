// ─────────────────────────────────────────────────────────────────────────────
// Terms & Conditions content — FR/EN/ES
//
// Legally binding version: FR (Curato Collective SAS is/will be a French entity).
// EN/ES are courtesy translations.
//
// DRAFT — pending review by a French legal counsel before publication.
// Once Curato Collective SAS is registered, replace [SIRET], [RCS], and
// [DOMICILIATION_ADDRESS] placeholders with the values on the KBis.
//
// Business model decisions encoded here (locked in with the founder, 2026-05-23):
//   • 90-day exclusive rights to maison, broad scope (paid ads + sub-licensing
//     to partners allowed). After 90 days: non-exclusive perpetual broad license.
//   • Creator retains ownership of the content.
//   • Publishing obligation: 3 Instagram stories within 14 days, mandatory
//     mentions @maison + @curato. No mandatory feed post.
//   • Monthly credit: rolling, expires at end of 2nd month after allocation.
//   • Cancellation: 24h grace. No-show = lose visit credit + 1 strike.
//     3 strikes in 6 months = account review.
//   • Disputes: Curato mediates 7 days, credit refund if creator wins.
//   • Exclusion: standard list (fraud, 3 strikes, inappropriate conduct,
//     model bypass, illegal content, serious violation).
//
// Enhancements after benchmarking MIDI PASS terms (2026-05-23):
//   • Section 6 "Nature juridique" — explicit no-employment / no-agency /
//     no-exclusivity clause (critical in France to avoid salariat déguisé).
//   • Section 7 "Confidentialité" — bilateral, survives 2 years post-termination.
//   • Section 8 "Champ d'application géographique" — Paris, expandable.
//   • Section 14 "Obligations de publication" — reinforced with explicit
//     reference to Loi n° 2023-451 du 9 juin 2023 (French influencer law)
//     and the mandatory "Collaboration commerciale" mention.
//   • Section 15 "Contenu" — reinforced with third-party image-rights clause.
//   • Section 22 "Marque" — new section: maison authorises Curato to use its
//     name/logo/photos in the platform catalogue + brand usage rules for both
//     creators and maisons.
//   • Preamble reinforced with pilot/evolutionary nature framing.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./translations";

type Block = string | { list: string[] };

type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

type TermsContent = {
  pageTitle: string;
  eyebrow: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  draftNoticeTitle: string;
  draftNoticeBody: string;
  tocTitle: string;
  sections: Section[];
};

// Placeholders to swap in once the SAS is registered.
const COMPANY = "Curato Collective SAS";
const STATUS_FR = "société en cours de constitution";
const STATUS_EN = "company in formation";
const STATUS_ES = "sociedad en constitución";
const SIRET = "[SIRET — à compléter après immatriculation]";
const RCS = "[RCS Paris — à compléter après immatriculation]";
const ADDRESS = "[Adresse de domiciliation commerciale — à compléter]";
const DIRECTOR = "Natalia Fernandez Casasfranco";
const CONTACT_EMAIL = "hello@curatocollective.com";

// ─── FRENCH (legally binding) ───────────────────────────────────────────────

const fr: TermsContent = {
  pageTitle: "Conditions générales d'utilisation",
  eyebrow: "Curato · Conditions",
  lastUpdatedLabel: "Dernière mise à jour",
  lastUpdated: "23 mai 2026",
  draftNoticeTitle: "Document de travail",
  draftNoticeBody:
    "Les présentes conditions sont un projet en cours de finalisation. Elles seront mises à jour à l'issue de l'immatriculation de Curato Collective SAS et de leur revue par un conseil juridique français. Les mentions [entre crochets] sont des champs en attente.",
  tocTitle: "Sommaire",
  sections: [
    // ─── Commun (1-10) ──────────────────────────────────────────────────────
    {
      id: "preambule",
      title: "1. Préambule",
      blocks: [
        `Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme curatocollective.com (« Curato » ou « la Plateforme »), éditée par ${COMPANY} (${STATUS_FR}).`,
        "Curato est un écosystème curé qui met en relation des créateurs de contenu et des maisons d'exception à Paris. Les créateurs reçoivent un crédit mensuel en euros pour découvrir des restaurants, sanctuaires de beauté, retraites de bien-être et hôtels boutique sélectionnés ; les maisons accueillent ces créateurs et reçoivent en retour un contenu éditorial publié sur leurs réseaux sociaux, avec 90 jours de droits d'utilisation exclusifs.",
        "**Nature évolutive du programme.** Curato est, à ce jour, un programme en phase de lancement. Le Membre reconnaît et accepte que les fonctionnalités, dynamiques opérationnelles et conditions de participation pourront évoluer, être ajustées ou étendues afin d'assurer le bon développement de l'écosystème. Ces évolutions seront notifiées conformément à l'article 4.",
        "Les présentes CGU complètent et ne remplacent pas la Politique de Confidentialité, disponible sur la page /privacidad du site. Les deux documents fonctionnent ensemble. En cas de contradiction portant sur le traitement des données personnelles, la Politique de Confidentialité prévaut.",
        "L'utilisation de la Plateforme implique l'acceptation expresse et sans réserve des présentes CGU, recueillie par une case à cocher dédiée lors de la candidature et confirmée à chaque connexion ultérieure.",
      ],
    },
    {
      id: "definitions",
      title: "2. Définitions",
      blocks: [
        "Dans les présentes CGU, les termes suivants ont la signification indiquée ci-dessous :",
        {
          list: [
            "« Curato » ou « la Plateforme » : le site curatocollective.com et l'ensemble des services associés, édités par Curato Collective SAS.",
            "« Membre » : toute personne physique ou morale ayant créé un compte sur la Plateforme, qu'il s'agisse d'un Créateur ou d'une Maison.",
            "« Créateur » : Membre, personne physique majeure, dont l'activité consiste à produire du contenu éditorial sur les réseaux sociaux et qui bénéficie d'un crédit mensuel pour visiter les Maisons sélectionnées.",
            "« Maison » : Membre, personne morale ou physique exerçant une activité commerciale physique (restaurant, sanctuaire de beauté, retraite de bien-être, hôtel boutique, etc.), qui accueille des Créateurs dans le cadre de Curato.",
            "« Visite » : une expérience proposée par une Maison et réservée par un Créateur via la Plateforme, financée par tout ou partie du Crédit mensuel du Créateur.",
            "« Contenu » : toute photographie, vidéo, texte ou autre élément éditorial produit et publié par un Créateur à l'occasion d'une Visite.",
            "« Crédit mensuel » : la somme en euros allouée mensuellement par Curato à chaque Créateur, utilisable pour réserver des Visites dans les conditions définies à l'article 12.",
            "« Strike » : un manquement aux obligations des présentes CGU, comptabilisé sur une période glissante de 6 mois.",
            "« Politique de Confidentialité » : le document accessible à l'adresse /privacidad du site, décrivant le traitement des données personnelles.",
            "« Information Confidentielle » : toute information, sous quelque forme que ce soit, à laquelle un Membre a accès dans le cadre du programme et qui n'est pas publique, telle que définie à l'article 7.",
          ],
        },
      ],
    },
    {
      id: "acceptation",
      title: "3. Acceptation et accès",
      blocks: [
        "L'accès à Curato est réservé aux personnes majeures (18 ans révolus) disposant de la pleine capacité juridique pour contracter.",
        "Curato fonctionne sur invitation et sélection : la création d'une candidature ne vaut pas acceptation. Curato examine chaque candidature manuellement et conserve la liberté d'accepter ou de refuser un candidat, sans avoir à motiver sa décision.",
        "Lors de l'acceptation d'une candidature, le Membre est invité à créer un compte. Le Membre s'engage à fournir des informations véridiques, complètes et à jour, et à les actualiser si elles évoluent.",
        "Le Membre est seul responsable de la confidentialité de ses identifiants. Toute action effectuée depuis son compte est réputée effectuée par lui. En cas d'utilisation non autorisée présumée, le Membre doit en informer Curato sans délai à l'adresse " + CONTACT_EMAIL + ".",
        "Un Membre ne peut détenir qu'un seul compte. La création de comptes multiples expose à la suspension immédiate.",
      ],
    },
    {
      id: "modifications",
      title: "4. Modification des conditions",
      blocks: [
        "Curato peut modifier les présentes CGU à tout moment, pour refléter une évolution du service, de la réglementation ou des pratiques du marché.",
        "Toute modification substantielle sera notifiée aux Membres par email au moins 30 jours avant son entrée en vigueur, sauf en cas de modification rendue urgente par une obligation légale.",
        "Le Membre qui n'accepte pas une modification peut résilier son compte sans frais avant l'entrée en vigueur de celle-ci. La poursuite de l'utilisation après cette date vaut acceptation tacite.",
        "La version applicable est celle en vigueur au moment de l'utilisation. La date de dernière mise à jour figure en haut du présent document.",
      ],
    },
    {
      id: "confidentialite-privacy",
      title: "5. Lien avec la Politique de Confidentialité",
      blocks: [
        "Le traitement des données personnelles des Membres est régi par la Politique de Confidentialité accessible à l'adresse /privacidad. Celle-ci décrit notamment les données collectées, leurs finalités, les bases légales du traitement, les destinataires (Supabase, Vercel, Resend, Phyllo), les durées de conservation et les droits des personnes concernées.",
        "Les CGU et la Politique de Confidentialité forment ensemble le cadre contractuel de la relation entre Curato et ses Membres. En cas de contradiction sur le traitement des données, la Politique de Confidentialité prévaut.",
      ],
    },
    {
      id: "nature-juridique",
      title: "6. Nature juridique de la relation",
      blocks: [
        "La participation à Curato repose sur un modèle d'échange de valeur qui ne donne lieu à aucun paiement direct entre les parties : la Maison met à disposition une expérience, le Créateur y accède au moyen de son Crédit mensuel et publie un contenu éditorial issu de cette expérience.",
        "La participation au programme **ne crée ni n'implique**, en aucun cas :",
        {
          list: [
            "Un contrat de travail ou une relation de subordination entre Curato et le Créateur, ou entre la Maison et le Créateur. Le Créateur n'est ni salarié, ni employé, ni stagiaire de Curato ou de la Maison.",
            "Un mandat, une agence commerciale, une représentation ou une distribution.",
            "Une société, un groupement, un partenariat ou un joint-venture.",
            "Un contrat traditionnel de prestation de services publicitaires ou d'influence commerciale rémunérée au sens du droit civil.",
            "Une prestation de service financier, le Crédit mensuel n'étant pas une monnaie, ni un instrument de paiement, ni un produit financier.",
            "Une obligation d'exclusivité : le Créateur conserve la pleine liberté de collaborer avec tout autre acteur, et la Maison conserve la pleine liberté d'accueillir tout autre visiteur dans les conditions de son choix.",
          ],
        },
        "Chaque Membre agit de manière strictement indépendante et autonome, sous sa seule responsabilité, et assume seul ses obligations légales, fiscales et sociales découlant de son activité.",
        "Aucune stipulation des présentes CGU ne pourra être interprétée comme créant une relation autre que celle d'une participation volontaire au programme Curato.",
      ],
    },
    {
      id: "confidentialite",
      title: "7. Confidentialité",
      blocks: [
        "Chaque Membre s'engage à préserver la confidentialité de toute Information Confidentielle à laquelle il aurait accès dans le cadre du programme Curato.",
        "Est qualifiée d'Information Confidentielle toute information, sous quelque forme que ce soit (orale, écrite, numérique), à laquelle un Membre a accès et qui n'est pas publique, en ce compris notamment : informations commerciales, opérationnelles, stratégiques ou techniques relatives à Curato ou à un autre Membre ; données personnelles d'autres Membres ; métriques internes du programme ; conditions financières individuelles (montant du Crédit mensuel) ; dynamiques de matching, algorithmes ou méthodes de curation.",
        "Cette information ne peut être divulguée à un tiers ni utilisée pour une finalité étrangère au programme, sauf accord préalable de la partie concernée ou obligation légale.",
        "Ne constitue pas une Information Confidentielle l'information qui :",
        {
          list: [
            "Est dans le domaine public sans violation des présentes ;",
            "Était déjà en possession licite du Membre avant sa divulgation ;",
            "A été obtenue licitement d'un tiers non tenu d'une obligation de confidentialité ;",
            "Doit être divulguée en exécution d'une obligation légale ou d'une décision d'une autorité compétente, auquel cas le Membre concerné en informera Curato avant divulgation lorsque cela est légalement possible.",
          ],
        },
        "**En particulier, la Maison s'interdit d'utiliser les coordonnées ou données personnelles d'un Créateur à des fins commerciales étrangères au programme Curato, notamment de prospection directe ou de constitution de fichier client.**",
        "L'obligation de confidentialité demeure pendant toute la durée de la participation au programme et pendant **deux (2) ans** à compter de la cessation de celle-ci.",
      ],
    },
    {
      id: "champ-geographique",
      title: "8. Champ d'application géographique",
      blocks: [
        "Le programme Curato est initialement déployé à Paris, France. La sélection des Maisons est, à ce jour, limitée à ce périmètre, et les Visites se déroulent dans les établissements physiques des Maisons partenaires sur ce territoire.",
        "Le programme peut être étendu à d'autres villes ou régions, en France ou à l'étranger, conformément à l'évolution de l'écosystème. Cette extension sera communiquée par Curato et n'emporte pas, par elle-même, modification des présentes CGU.",
        "La disponibilité du programme, ainsi que l'accès à certaines dynamiques ou fonctionnalités, peut varier en fonction de la localisation du Membre, de critères opérationnels ou de contraintes réglementaires locales.",
      ],
    },
    {
      id: "loi",
      title: "9. Loi applicable et juridiction",
      blocks: [
        "Les présentes CGU sont régies par le droit français.",
        "Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux du ressort de la Cour d'appel de Paris, sous réserve des règles impératives de protection des consommateurs et après tentative préalable de résolution amiable décrite à l'article 24.",
        "En cas de divergence entre la version française et toute traduction (anglais, espagnol), la version française fait foi.",
      ],
    },
    {
      id: "generales",
      title: "10. Dispositions générales",
      blocks: [
        {
          list: [
            "Force majeure : aucune partie ne pourra être tenue responsable d'un manquement résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.",
            "Cession : le Membre ne peut céder ses droits ou obligations au titre des présentes CGU sans l'accord écrit préalable de Curato. Curato peut céder librement le contrat en cas d'opération de réorganisation, fusion ou acquisition.",
            "Indépendance des clauses : la nullité d'une clause n'entraîne pas la nullité de l'ensemble des CGU.",
            "Notifications : sauf disposition contraire, toute notification s'effectue par email à l'adresse renseignée par le Membre dans son compte ou à " + CONTACT_EMAIL + " pour les notifications adressées à Curato.",
            "Intégralité de l'accord : les présentes CGU, ensemble avec la Politique de Confidentialité, constituent l'intégralité de l'accord entre les parties et remplacent toute communication antérieure.",
          ],
        },
      ],
    },

    // ─── Section CRÉATEURS (11-16) ──────────────────────────────────────────
    {
      id: "creator-compte",
      title: "11. Compte Créateur et éligibilité",
      blocks: [
        "Le statut de Créateur est ouvert aux personnes physiques majeures justifiant d'une activité de création de contenu sur les réseaux sociaux.",
        "La candidature au statut de Créateur s'effectue sur la page /candidature du site. Curato examine chaque dossier manuellement et notifie le candidat de sa décision. Aucune garantie d'admission n'est offerte. Les candidatures non retenues sont conservées 12 mois (voir Politique de Confidentialité).",
        "Le Créateur déclare et garantit :",
        {
          list: [
            "Avoir 18 ans révolus.",
            "Disposer de la pleine capacité juridique.",
            "Être l'auteur du contenu qu'il publiera et détenir l'ensemble des droits nécessaires (voir article 15).",
            "Que les informations fournies dans sa candidature sont véridiques, notamment l'identifiant du compte Instagram et le nombre d'abonnés déclaré.",
          ],
        },
        "**Évaluation continue.** La permanence dans le programme est subordonnée au respect continu des critères d'éligibilité et à la participation active du Créateur. Curato peut mettre en place des mécanismes d'évaluation et de retour d'expérience (système de Strikes, notation, retours des Maisons) pour gérer la qualité de l'écosystème, dans les conditions de l'article 16.",
      ],
    },
    {
      id: "creator-credit",
      title: "12. Crédit mensuel",
      blocks: [
        "Chaque Créateur accepté reçoit un crédit mensuel libellé en euros (« Crédit mensuel »), utilisable pour réserver des Visites auprès des Maisons partenaires.",
        "Le montant du Crédit mensuel est déterminé individuellement par Curato et communiqué au Créateur lors de son admission. Il peut être ajusté par Curato avec un préavis de 30 jours notifié par email.",
        "Règles de fonctionnement du Crédit :",
        {
          list: [
            "Le Crédit est attribué le premier jour de chaque mois calendaire.",
            "Le Crédit non utilisé est reportable jusqu'à la fin du deuxième mois suivant son attribution. Exemple : le crédit de janvier est utilisable jusqu'au 31 mars inclus.",
            "Le Crédit est strictement personnel, non transférable et non cessible.",
            "Le Crédit ne constitue ni de la monnaie, ni un instrument de paiement, ni un produit financier, et ne donne droit à aucune contrepartie en numéraire. Il ne peut être converti en argent, ni faire l'objet d'un remboursement, sauf cas prévu à l'article 24.",
            "Le Crédit est utilisable exclusivement auprès des Maisons partenaires référencées sur la Plateforme.",
            "En cas de clôture du compte (par le Créateur ou par Curato), tout Crédit non utilisé est définitivement perdu.",
          ],
        },
      ],
    },
    {
      id: "creator-visites",
      title: "13. Réservation et règles de Visite",
      blocks: [
        "La réservation d'une Visite s'effectue via la Plateforme. Le Créateur contacte directement la Maison via le lien fourni (WhatsApp ou téléphone) en s'identifiant comme membre de Curato.",
        "Le Créateur s'engage à :",
        {
          list: [
            "Respecter les horaires, le code de conduite et les usages de la Maison visitée.",
            "Se comporter de manière respectueuse et professionnelle envers l'équipe et les autres clients.",
            "Honorer la réservation effectuée.",
          ],
        },
        "Annulation : toute annulation doit être communiquée à la Maison au moins 24 heures avant l'horaire prévu. Une annulation dans ce délai est sans conséquence pour le Créateur. En deçà de 24 heures, la Maison peut, à sa discrétion, considérer la Visite comme effectuée et le Crédit comme consommé.",
        "No-show (non-présentation sans annulation) : la Visite est considérée comme effectuée, le Crédit correspondant est définitivement consommé, et un Strike est ajouté au compte du Créateur.",
        "Trois Strikes accumulés sur une période glissante de 6 mois entraînent une revue du compte, pouvant aboutir à une suspension temporaire (30 jours) ou à une exclusion (article 16).",
      ],
    },
    {
      id: "creator-publication",
      title: "14. Obligations de publication et transparence",
      blocks: [
        "À l'issue de chaque Visite, le Créateur s'engage à publier du Contenu éditorial dans les conditions suivantes :",
        {
          list: [
            "Format minimum : trois (3) stories Instagram. Les Reels et publications en feed sont bienvenus mais non obligatoires.",
            "Délai : dans les quatorze (14) jours calendaires suivant la date de la Visite.",
            "Mentions obligatoires : tag ou sticker @ de la Maison visitée ET @ de Curato sur chaque story publiée.",
            "Authenticité : le Contenu doit refléter sincèrement l'expérience vécue. Le Créateur n'est pas tenu de produire un contenu positif, mais s'engage à produire un contenu honnête, conforme à la réalité de sa Visite.",
          ],
        },
        "**Transparence et conformité légale (Loi n° 2023-451 du 9 juin 2023 sur l'influence commerciale).** Dans la mesure où le Contenu publié bénéficie d'une contrepartie en nature (la Visite financée par le Crédit), le Créateur s'engage à :",
        {
          list: [
            "Faire figurer de manière claire et lisible la mention « Collaboration commerciale » ou « Publicité » sur chaque publication, en plus des mentions @ requises ci-dessus, conformément à la loi française sur l'encadrement de l'influence commerciale.",
            "Signaler tout Contenu modifié ou généré au moyen d'intelligence artificielle par la mention « Images virtuelles » ou « Images retouchées », conformément à la même loi.",
            "Respecter les interdictions et restrictions sectorielles fixées par cette loi (notamment, sans s'y limiter, en matière de produits financiers, de jeux d'argent, d'actes médicaux ou esthétiques, de produits nicotiniques).",
            "Respecter, plus largement, l'ensemble de la réglementation applicable à la communication commerciale et à la protection des consommateurs, ainsi que les règles d'usage des plateformes sociales sur lesquelles il publie.",
          ],
        },
        "Le Créateur reste libre du ton, du style et du fond éditorial. Curato ne valide pas le Contenu avant publication et ne pratique aucune censure éditoriale.",
        "Le non-respect de l'obligation de publication entraîne la consommation rétroactive du Crédit (s'il avait été restitué) et l'ajout d'un Strike. La récidive peut entraîner la suspension ou l'exclusion (article 16).",
        "Si le Créateur supprime le Contenu publié dans les 90 jours suivant la publication, cela est assimilé à un manquement à l'obligation de publication, sauf motif légitime communiqué à Curato (procédure judiciaire, demande légale, etc.).",
      ],
    },
    {
      id: "creator-contenu",
      title: "15. Propriété, garanties et droits sur le Contenu",
      blocks: [
        "**Propriété.** Le Créateur reste et demeure pleinement propriétaire du Contenu qu'il produit. Curato ne revendique aucun droit de propriété sur ce Contenu.",
        "**Licence concédée.** Pour chaque Visite, le Créateur concède à la Maison visitée la licence d'utilisation décrite à l'article 20. Il concède en outre à Curato une licence non exclusive, mondiale, gratuite, pour la durée de la relation contractuelle, afin de référencer le Contenu sur la Plateforme et dans les communications éditoriales de Curato (newsletter, réseaux sociaux propres de Curato, supports de présentation), avec attribution au Créateur.",
        "**Garanties du Créateur.** Le Créateur déclare et garantit que :",
        {
          list: [
            "Il est l'auteur du Contenu ou détient l'ensemble des droits nécessaires pour le concéder en licence.",
            "Le Contenu ne porte atteinte à aucun droit de tiers (droit d'auteur, droit des marques, vie privée, etc.).",
            "Le Contenu n'est pas illégal, diffamatoire, discriminatoire, haineux, à caractère pornographique ou de nature à porter atteinte à la dignité humaine.",
          ],
        },
        "**Droit à l'image des tiers.** Lorsque le Créateur capte du Contenu dans l'établissement d'une Maison, il est seul responsable :",
        {
          list: [
            "D'obtenir l'autorisation préalable de toute personne physique reconnaissable (clients, personnel, autres visiteurs) avant de la photographier, filmer ou enregistrer, conformément à l'article 9 du Code civil.",
            "De respecter le droit à l'image, à la vie privée et à la protection des données personnelles de toute personne apparaissant dans le Contenu.",
            "D'obtenir, le cas échéant, le consentement écrit nécessaire à la diffusion publique de cette image.",
            "De s'abstenir de capter ou de diffuser toute image ou information susceptible de porter atteinte à la vie privée d'autres personnes présentes dans l'établissement.",
          ],
        },
        "Ces obligations s'appliquent indépendamment des autorisations générales que la Maison aurait pu accorder à Curato pour le tournage dans ses locaux.",
        "**Indemnisation.** En cas de réclamation d'un tiers fondée sur une violation des garanties ci-dessus, le Créateur s'engage à indemniser Curato et la Maison concernée de toutes conséquences (frais, dommages-intérêts, frais juridiques raisonnables).",
      ],
    },
    {
      id: "creator-exclusion",
      title: "16. Strikes, suspension et exclusion (Créateurs)",
      blocks: [
        "Curato applique un système progressif de sanctions, qui constitue la formalisation de la curation et de l'évaluation continue du programme :",
        {
          list: [
            "Strike : avertissement formel notifié par email, comptabilisé sur 6 mois glissants. Motifs : no-show, défaut de publication, conduite inappropriée mineure, manquement aux règles de Visite, défaut de mention de transparence prévue à l'article 14.",
            "Trois Strikes en 6 mois : revue du compte, pouvant aboutir à une suspension temporaire de 30 jours ou à une exclusion définitive selon la gravité.",
            "Exclusion directe sans Strike préalable : fraude, falsification de l'identité ou des informations de candidature, contenu illégal, contournement du modèle Curato (article 25), conduite grave (harcèlement, violence, discrimination), violation manifeste du droit à l'image de tiers.",
          ],
        },
        "Procédure : sauf cas grave nécessitant une action immédiate, le Créateur reçoit une notification par email l'informant du motif et dispose d'un délai de 5 jours ouvrés pour présenter ses observations avant décision définitive.",
        "Conséquences de l'exclusion : cessation immédiate de l'accès, perte du Crédit non utilisé, conservation des données et du Contenu selon la Politique de Confidentialité, maintien des licences déjà concédées sur le Contenu publié.",
      ],
    },

    // ─── Section MAISONS (17-23) ────────────────────────────────────────────
    {
      id: "maison-compte",
      title: "17. Compte Maison et éligibilité",
      blocks: [
        "Le statut de Maison est ouvert aux personnes morales ou physiques exerçant à titre professionnel une activité commerciale physique à Paris (et, le cas échéant, en région parisienne ou ailleurs en France selon l'extension du service, conformément à l'article 8), dans les catégories sélectionnées par Curato (gastronomie, beauté, bien-être, hôtellerie, etc.).",
        "La candidature s'effectue sur la page /candidature du site. Curato examine chaque dossier et notifie le candidat de sa décision. Aucune garantie d'admission n'est offerte.",
        "La Maison déclare et garantit :",
        {
          list: [
            "Être régulièrement immatriculée et disposer de l'ensemble des autorisations nécessaires à l'exercice de son activité.",
            "Que les informations fournies (raison sociale, adresse, contact, description du service) sont véridiques.",
            "Que son représentant légal est dûment habilité à engager la Maison.",
          ],
        },
      ],
    },
    {
      id: "maison-service",
      title: "18. Engagement de service",
      blocks: [
        "La Maison s'engage à offrir au Créateur l'expérience décrite sur la Plateforme, à hauteur de la valeur du Crédit alloué, dans les mêmes conditions de qualité que celles offertes à sa clientèle régulière.",
        "Si la Maison est dans l'impossibilité d'honorer une réservation (incident, fermeture exceptionnelle, complet), elle s'engage à en informer le Créateur dans un délai raisonnable et à proposer une alternative (report, créneau différent).",
        "La Maison s'interdit toute discrimination dans l'accueil du Créateur fondée sur un critère prohibé par la loi (origine, sexe, orientation, etc.).",
      ],
    },
    {
      id: "maison-acceptation",
      title: "19. Acceptation des Créateurs",
      blocks: [
        "Curato repose sur le principe de la curation : les Créateurs visibles dans le carnet d'adresses ont été sélectionnés par Curato. La Maison s'engage à les accueillir dans cet esprit.",
        "La Maison ne peut pas :",
        {
          list: [
            "Imposer un brief, des instructions de publication ou exiger l'approbation préalable du Contenu.",
            "Conditionner la Visite à la production d'un contenu spécifique au-delà des obligations de l'article 14.",
            "Systématiquement refuser des Créateurs sur la base de critères discriminatoires.",
          ],
        },
        "La Maison peut, ponctuellement et pour motif légitime (capacité, disponibilité, type d'événement privé en cours), refuser une réservation spécifique. Elle informe alors Curato si le motif tend à se répéter.",
      ],
    },
    {
      id: "maison-contenu",
      title: "20. Droits sur le Contenu (Maison)",
      blocks: [
        "Pour chaque Visite réalisée, le Créateur concède à la Maison visitée une licence d'utilisation sur le Contenu produit à l'occasion de cette Visite, dans les conditions suivantes :",
        "**Période d'exclusivité : 90 jours à compter de la date de publication du Contenu par le Créateur.**",
        "Durant cette période de 90 jours, la licence est :",
        {
          list: [
            "Exclusive : le Créateur s'interdit de concéder le même Contenu à un concurrent direct de la Maison.",
            "Mondiale.",
            "Gratuite (aucune rémunération additionnelle n'est due au Créateur, le Crédit consommé couvrant l'ensemble).",
            "Largement étendue : la Maison peut utiliser le Contenu sur ses réseaux sociaux propres, son site internet, ses campagnes d'emailing, ses supports imprimés, et dans le cadre de **publicités payantes** (Meta Ads, Google Ads, TikTok Ads, et équivalents).",
            "Sub-licenciable : la Maison peut accorder une sous-licence à ses partenaires (agences de relations presse, agences de marketing, médias) à des fins éditoriales ou publicitaires en lien avec son activité, sans accord supplémentaire du Créateur.",
          ],
        },
        "**Au-delà des 90 jours**, la licence devient non exclusive (le Créateur peut alors concéder le Contenu à d'autres tiers, y compris des concurrents) mais reste perpétuelle, mondiale, gratuite et conserve l'ensemble des droits ci-dessus (publicités payantes et sub-licence inclus).",
        "Limites de la licence :",
        {
          list: [
            "Attribution obligatoire au Créateur sur toute republication (mention @ ou crédit photo).",
            "Pas de modification substantielle du Contenu altérant son sens ou son message. Les ajustements techniques (recadrage pour formats, ajout de logo, sous-titres) restent autorisés.",
            "Pas de revente directe du Contenu en tant que tel.",
            "Pas d'utilisation dans un contexte susceptible de porter atteinte à l'image du Créateur.",
          ],
        },
        "Le non-respect de ces limites met fin à la licence et engage la responsabilité de la Maison.",
      ],
    },
    {
      id: "maison-usage",
      title: "21. Règles d'usage du Contenu",
      blocks: [
        "La Maison peut télécharger et conserver le Contenu pour les besoins de son exploitation, dans le respect de la Politique de Confidentialité et des durées de conservation qui y sont définies.",
        "Lorsque le Contenu est utilisé dans le cadre d'une campagne publicitaire payante significative, la Maison s'engage à en informer le Créateur par courtoisie (sans que cela conditionne la validité de la licence).",
        "Si le Créateur supprime le Contenu original de son propre compte, la Maison conserve néanmoins l'usage du Contenu déjà téléchargé pour la durée restant à courir de la licence.",
        "Au terme de la période d'exclusivité (90 jours), le Créateur retrouve la faculté de concéder le Contenu à d'autres tiers, mais la Maison conserve ses propres droits d'usage tels que définis à l'article 20.",
      ],
    },
    {
      id: "marque",
      title: "22. Marques et identité",
      blocks: [
        "**Autorisation d'usage de la marque et de l'identité de la Maison par Curato.** Pendant toute la durée de la participation de la Maison au programme, celle-ci autorise Curato à titre non exclusif, gratuit, révocable et limité aux finalités du programme, à utiliser sa raison sociale, son nom commercial, son logo, ses photographies institutionnelles et toute autre marque ou signe distinctif fourni par la Maison ou collecté avec son accord, aux seules fins :",
        {
          list: [
            "De référencer la Maison dans le carnet d'adresses de la Plateforme.",
            "De présenter la Maison dans les communications éditoriales du programme (newsletter, réseaux sociaux propres de Curato, supports de présentation).",
            "De faciliter la mise en relation entre la Maison et les Créateurs.",
          ],
        },
        "Cette autorisation n'emporte aucune cession de droits de propriété intellectuelle. La Maison demeure pleinement titulaire de ses signes distinctifs. La Maison peut révoquer cette autorisation à tout moment en notifiant Curato à " + CONTACT_EMAIL + ", étant entendu qu'une telle révocation entraîne en pratique la fin de sa participation au programme.",
        "**Usage de la marque Curato par les Membres.** Chaque Membre (Créateur ou Maison) peut mentionner sa participation à Curato et utiliser les signes « Curato » et « Curato Collective » dans les conditions suivantes :",
        {
          list: [
            "L'usage doit être loyal, conforme à la nature du programme et respectueux de l'identité de Curato.",
            "Aucune communication ne peut laisser entendre que le Membre est un employé, agent, représentant officiel, ambassadeur ou partenaire institutionnel de Curato au-delà de sa simple qualité de Membre du programme.",
            "L'usage ne peut intervenir dans un contexte susceptible de porter atteinte à la réputation de Curato, de générer une confusion avec une activité non liée au programme, ou d'induire en erreur le public sur la nature des services proposés.",
            "Curato peut, à tout moment et pour motif raisonnable, demander la modification, la limitation ou la suppression d'un usage qui ne respecterait pas ces principes.",
          ],
        },
        "L'autorisation d'usage des marques de Curato par les Membres ne confère aucun droit de propriété sur celles-ci.",
      ],
    },
    {
      id: "maison-exclusion",
      title: "23. Strikes, suspension et exclusion (Maisons)",
      blocks: [
        "Le système progressif décrit à l'article 16 s'applique également aux Maisons :",
        {
          list: [
            "Strike : avertissement formel notifié par email. Motifs : non-respect de l'engagement de service (article 18), imposition de brief ou de validation préalable (article 19), conduite inappropriée envers un Créateur, retard répété ou no-show de la Maison, usage non conforme du Contenu (article 21) ou de la marque Curato (article 22).",
            "Trois Strikes en 6 mois : revue du compte, suspension temporaire de 30 jours ou exclusion selon la gravité.",
            "Exclusion directe : fraude, harcèlement, discrimination grave, contenu illégal, contournement du modèle, utilisation des données d'un Créateur à des fins étrangères au programme (violation de l'article 7).",
          ],
        },
        "Procédure identique à celle décrite à l'article 16 (notification, droit de réponse de 5 jours ouvrés, décision).",
        "Conséquences de l'exclusion : cessation de la présence sur la Plateforme, révocation de l'autorisation d'usage de marque accordée à Curato (article 22), perte des réservations futures, maintien des droits déjà acquis sur le Contenu publié avant l'exclusion.",
      ],
    },

    // ─── Commun final (24-27) ────────────────────────────────────────────────
    {
      id: "disputes",
      title: "24. Résolution des litiges",
      blocks: [
        "En cas de différend entre un Créateur et une Maison (par exemple, une expérience non conforme à celle annoncée, un comportement inapproprié), les parties sont invitées à rechercher en priorité une solution amiable.",
        "**Médiation par Curato :**",
        {
          list: [
            "La partie qui s'estime lésée écrit à " + CONTACT_EMAIL + " en exposant les faits et en joignant tout élément utile.",
            "Curato accuse réception et propose une résolution écrite dans un délai de 7 jours ouvrés.",
            "Si la médiation est favorable au Créateur (la Maison a manqué à son engagement de service), Curato procède au remboursement du Crédit consommé au titre de la Visite litigieuse.",
            "Si la médiation est favorable à la Maison (le Créateur a manqué à ses obligations), un Strike peut être ajouté au compte du Créateur.",
          ],
        },
        "**Absence d'accord :** à défaut de résolution amiable, les parties peuvent saisir les tribunaux compétents conformément à l'article 9.",
        "Le délai de prescription pour engager une action au titre des présentes CGU est fixé à 6 mois à compter de la connaissance du fait litigieux par la partie concernée, sans pouvoir excéder les délais légaux impératifs.",
      ],
    },
    {
      id: "exclusion-generale",
      title: "25. Causes d'exclusion",
      blocks: [
        "Curato se réserve le droit de suspendre ou de résilier le compte d'un Membre, sans préavis et sans indemnité, dans les cas suivants :",
        {
          list: [
            "Fraude ou falsification de l'identité, des qualifications professionnelles, du nombre d'abonnés ou de toute autre information fournie à Curato.",
            "Accumulation de trois (3) Strikes sur une période glissante de 6 mois (articles 16 et 23).",
            "Conduite inappropriée : harcèlement, discrimination, propos violents, irrespect grave envers un autre Membre ou l'équipe Curato.",
            "Contournement du modèle Curato : tentative d'organiser des Visites ou collaborations directement avec une Maison découverte via la Plateforme, sans passer par celle-ci, pendant toute la durée de la membership et pendant les 6 mois suivant la fin de celle-ci.",
            "Violation de l'obligation de confidentialité de l'article 7, en particulier l'utilisation des données d'un autre Membre à des fins commerciales étrangères au programme.",
            "Publication ou diffusion de contenu illégal, discriminatoire, à caractère pornographique, haineux ou portant atteinte à la dignité humaine.",
            "Violation grave ou répétée des présentes CGU, y compris des obligations de transparence prévues à l'article 14.",
            "Utilisation de la Plateforme à des fins contraires à la loi française.",
          ],
        },
        "Procédure : sauf cas de gravité nécessitant une action immédiate, le Membre reçoit une notification motivée par email et dispose d'un délai de 5 jours ouvrés pour présenter ses observations avant décision définitive.",
        "Conséquences de l'exclusion :",
        {
          list: [
            "Cessation immédiate de l'accès à la Plateforme.",
            "Pour les Créateurs : perte du Crédit non utilisé, maintien des licences déjà concédées sur le Contenu publié.",
            "Pour les Maisons : annulation des réservations futures non encore réalisées, maintien des licences acquises sur le Contenu déjà reçu, révocation de l'autorisation d'usage de marque accordée à Curato (article 22).",
            "Conservation des données conformément à la Politique de Confidentialité.",
            "Possibilité pour Curato de rendre publique l'exclusion uniquement dans la mesure strictement nécessaire à la protection des autres Membres.",
          ],
        },
      ],
    },
    {
      id: "responsabilite",
      title: "26. Responsabilité et garanties",
      blocks: [
        "**Rôle de Curato.** Curato est une plateforme de mise en relation entre Créateurs et Maisons. Curato n'est pas partie au contrat de service qui se forme entre le Créateur et la Maison lors d'une Visite. La responsabilité de l'exécution effective de la Visite incombe à la Maison ; la responsabilité de la publication du Contenu, du respect des obligations de transparence (article 14) et des droits des tiers apparaissant dans le Contenu (article 15) incombe au Créateur.",
        "**Diligence de Curato.** Curato sélectionne les Maisons et les Créateurs avec soin, mais ne garantit ni la qualité spécifique d'une Visite donnée, ni la performance ou la portée d'une publication. Curato fait ses meilleurs efforts pour assurer la disponibilité et le bon fonctionnement de la Plateforme, sans pour autant garantir une disponibilité ininterrompue.",
        "**Limitation de responsabilité.** Dans la limite autorisée par le droit applicable, la responsabilité totale de Curato envers un Membre, toutes causes confondues, est plafonnée au montant total du Crédit mensuel attribué à ce Membre au cours des 12 derniers mois (pour un Créateur) ou au montant équivalent de la valeur d'une Visite (pour une Maison). Cette limitation ne s'applique pas en cas de faute lourde, de dol ou d'atteinte aux droits non patrimoniaux.",
        "**Exclusions de garantie.** La Plateforme est fournie « en l'état » et « selon disponibilité ». Curato ne donne aucune garantie expresse ou implicite sur l'adaptation à un usage particulier, la rentabilité économique pour le Membre ou la portée d'une Visite en termes d'audience.",
        "**Force majeure.** Curato ne saurait être tenue responsable d'un manquement résultant d'un cas de force majeure au sens de l'article 1218 du Code civil, en ce compris notamment : indisponibilité d'un sous-traitant technique (Supabase, Vercel, Resend, Phyllo), restrictions sanitaires, événements climatiques exceptionnels, actes des autorités publiques.",
      ],
    },
    {
      id: "terminaison",
      title: "27. Terminaison de la relation",
      blocks: [
        "**À l'initiative du Membre :** tout Membre peut résilier son compte à tout moment en adressant une demande à " + CONTACT_EMAIL + ", avec un préavis de 30 jours. Le préavis peut être levé d'un commun accord.",
        "**À l'initiative de Curato :** Curato peut résilier un compte conformément aux articles 16, 23 et 25.",
        "**Conséquences de la résiliation :**",
        {
          list: [
            "Cessation de l'accès à la Plateforme à l'expiration du préavis.",
            "Pour les Créateurs : tout Crédit non utilisé est définitivement perdu. Aucun remboursement n'est dû.",
            "Pour les Maisons : révocation de l'autorisation d'usage de marque accordée à Curato (article 22).",
            "Conservation des données conformément à la Politique de Confidentialité (article 7 de celle-ci).",
            "Maintien des licences concédées sur le Contenu publié, jusqu'à leur expiration naturelle (90 jours d'exclusivité puis licence perpétuelle non exclusive, conformément à l'article 20).",
            "Survie des clauses qui par nature doivent survivre à la résiliation : confidentialité pour 2 ans (article 7), propriété intellectuelle (articles 15 et 20), garanties du Créateur (article 15), résolution des litiges (article 24), loi applicable (article 9), responsabilité (article 26).",
          ],
        },
        "**Effet libératoire :** sous réserve de l'exécution des obligations en cours (notamment les obligations de publication post-Visite déjà engagées), la résiliation libère les parties de toute obligation future au titre des présentes CGU.",
      ],
    },
  ],
};

// ─── ENGLISH (courtesy translation) ─────────────────────────────────────────

const en: TermsContent = {
  pageTitle: "Terms and Conditions",
  eyebrow: "Curato · Terms",
  lastUpdatedLabel: "Last updated",
  lastUpdated: "May 23, 2026",
  draftNoticeTitle: "Working draft",
  draftNoticeBody:
    "These terms are a draft pending finalisation. They will be updated once Curato Collective SAS is registered and after review by a French legal counsel. Fields in [brackets] are placeholders. The French version is the legally binding one.",
  tocTitle: "Contents",
  sections: [
    {
      id: "preambule",
      title: "1. Preamble",
      blocks: [
        `These Terms and Conditions ("Terms") govern access to and use of the curatocollective.com platform ("Curato" or the "Platform"), operated by ${COMPANY} (${STATUS_EN}).`,
        "Curato is a curated ecosystem connecting content creators with exceptional houses in Paris. Creators receive a monthly credit in euros to discover selected restaurants, beauty sanctuaries, wellness retreats and boutique hotels; houses welcome these creators and receive in return editorial content published on their social channels, with 90 days of exclusive usage rights.",
        "**Evolving nature of the programme.** Curato is, at this stage, a programme in launch phase. The Member acknowledges and accepts that features, operational dynamics and participation conditions may evolve, be adjusted or extended to ensure the proper development of the ecosystem. Such changes will be notified in accordance with section 4.",
        "These Terms supplement and do not replace the Privacy Policy, available at /privacidad. Both documents operate together. In the event of any contradiction regarding the processing of personal data, the Privacy Policy prevails.",
        "Use of the Platform implies express and unreserved acceptance of these Terms, collected via a dedicated checkbox at application and confirmed on each subsequent login.",
      ],
    },
    {
      id: "definitions",
      title: "2. Definitions",
      blocks: [
        "In these Terms, the following terms have the meaning indicated below:",
        {
          list: [
            "\"Curato\" or \"the Platform\": the curatocollective.com site and all related services, operated by Curato Collective SAS.",
            "\"Member\": any natural or legal person who has created an account on the Platform, whether a Creator or a House.",
            "\"Creator\": Member, a natural person of full legal age, whose activity consists of producing editorial content on social media and who receives a monthly credit to visit selected Houses.",
            "\"House\" (Maison): Member, legal or natural person carrying out a physical commercial activity (restaurant, beauty sanctuary, wellness retreat, boutique hotel, etc.), who welcomes Creators within the Curato framework.",
            "\"Visit\": an experience offered by a House and booked by a Creator via the Platform, financed by all or part of the Creator's Monthly Credit.",
            "\"Content\": any photograph, video, text or other editorial element produced and published by a Creator on the occasion of a Visit.",
            "\"Monthly Credit\": the amount in euros allocated monthly by Curato to each Creator, usable to book Visits under the conditions defined in section 12.",
            "\"Strike\": a breach of the obligations under these Terms, counted over a rolling 6-month period.",
            "\"Privacy Policy\": the document accessible at /privacidad, describing the processing of personal data.",
            "\"Confidential Information\": any non-public information that a Member has access to in the context of the programme, as defined in section 7.",
          ],
        },
      ],
    },
    {
      id: "acceptation",
      title: "3. Acceptance and access",
      blocks: [
        "Access to Curato is reserved for adults (18 years old or over) with full legal capacity to contract.",
        "Curato operates on an invitation and selection basis: submitting an application does not amount to acceptance. Curato reviews each application manually and reserves the right to accept or reject a candidate without having to give reasons.",
        "Upon acceptance, the Member is invited to create an account. The Member undertakes to provide truthful, complete and up-to-date information, and to keep it updated.",
        "The Member is solely responsible for the confidentiality of their credentials. Any action taken from their account is deemed taken by them. In case of suspected unauthorised use, the Member must inform Curato without delay at " + CONTACT_EMAIL + ".",
        "A Member may hold only one account. Creating multiple accounts may result in immediate suspension.",
      ],
    },
    {
      id: "modifications",
      title: "4. Modification of the terms",
      blocks: [
        "Curato may amend these Terms at any time to reflect changes in the service, in the regulations or in market practices.",
        "Any substantial modification will be notified to Members by email at least 30 days before its entry into force, except for changes required urgently by a legal obligation.",
        "A Member who does not accept a modification may terminate their account at no cost before the modification takes effect. Continued use after that date constitutes tacit acceptance.",
        "The applicable version is the one in force at the time of use. The date of the last update appears at the top of this document.",
      ],
    },
    {
      id: "confidentialite-privacy",
      title: "5. Relationship with the Privacy Policy",
      blocks: [
        "The processing of Members' personal data is governed by the Privacy Policy accessible at /privacidad. It describes in particular the data collected, their purposes, the legal bases of processing, the recipients (Supabase, Vercel, Resend, Phyllo), the retention periods and the rights of data subjects.",
        "The Terms and the Privacy Policy together form the contractual framework of the relationship between Curato and its Members. In case of contradiction regarding data processing, the Privacy Policy prevails.",
      ],
    },
    {
      id: "nature-juridique",
      title: "6. Legal nature of the relationship",
      blocks: [
        "Participation in Curato rests on a value-exchange model that does not give rise to any direct payment between the parties: the House makes an experience available, the Creator accesses it through their Monthly Credit and publishes editorial content based on that experience.",
        "Participation in the programme **does not create or imply**, in any case:",
        {
          list: [
            "An employment contract or a relationship of subordination between Curato and the Creator, or between the House and the Creator. The Creator is neither an employee, nor a staff member, nor an intern of Curato or the House.",
            "A mandate, commercial agency, representation or distribution.",
            "A company, partnership or joint venture.",
            "A traditional contract for the provision of advertising services or paid commercial influence within the meaning of civil law.",
            "A financial service, the Monthly Credit being neither currency, payment instrument nor financial product.",
            "An exclusivity obligation: the Creator retains full freedom to collaborate with any other actor, and the House retains full freedom to welcome any other visitor under the conditions of its choice.",
          ],
        },
        "Each Member acts strictly independently and autonomously, under their sole responsibility, and bears alone their legal, tax and social obligations arising from their activity.",
        "No provision of these Terms may be interpreted as creating a relationship other than that of voluntary participation in the Curato programme.",
      ],
    },
    {
      id: "confidentialite",
      title: "7. Confidentiality",
      blocks: [
        "Each Member undertakes to preserve the confidentiality of any Confidential Information they may have access to in the context of the Curato programme.",
        "Confidential Information means any information, in any form (oral, written, digital), accessed by a Member that is not public, including in particular: commercial, operational, strategic or technical information relating to Curato or to another Member; personal data of other Members; internal programme metrics; individual financial terms (Monthly Credit amount); matching dynamics, algorithms or curation methods.",
        "This information may not be disclosed to any third party or used for any purpose unrelated to the programme, save with the prior consent of the relevant party or under legal obligation.",
        "The following does not constitute Confidential Information:",
        {
          list: [
            "Information in the public domain without breach of these Terms;",
            "Information already lawfully in the Member's possession prior to disclosure;",
            "Information lawfully obtained from a third party not bound by a duty of confidentiality;",
            "Information that must be disclosed pursuant to a legal obligation or decision of a competent authority, in which case the Member shall inform Curato prior to disclosure where legally possible.",
          ],
        },
        "**In particular, the House undertakes not to use the contact details or personal data of a Creator for commercial purposes unrelated to the Curato programme, including direct prospecting or building a customer database.**",
        "The confidentiality obligation remains in force for the duration of participation in the programme and for **two (2) years** after the termination thereof.",
      ],
    },
    {
      id: "champ-geographique",
      title: "8. Geographic scope",
      blocks: [
        "The Curato programme is initially deployed in Paris, France. House selection is, at this stage, limited to this perimeter, and Visits take place in the physical establishments of partner Houses within that territory.",
        "The programme may be extended to other cities or regions, in France or abroad, in line with the evolution of the ecosystem. Such extension will be communicated by Curato and does not, in itself, amount to a modification of these Terms.",
        "The availability of the programme, as well as access to certain dynamics or features, may vary depending on the Member's location, operational criteria or local regulatory constraints.",
      ],
    },
    {
      id: "loi",
      title: "9. Governing law and jurisdiction",
      blocks: [
        "These Terms are governed by French law.",
        "Any dispute relating to their interpretation or performance shall be subject to the exclusive jurisdiction of the courts within the Paris Court of Appeal, subject to mandatory consumer protection rules and after prior attempt at amicable resolution described in section 24.",
        "In the event of any discrepancy between the French version and any translation (English, Spanish), the French version shall prevail.",
      ],
    },
    {
      id: "generales",
      title: "10. General provisions",
      blocks: [
        {
          list: [
            "Force majeure: no party shall be liable for any breach resulting from a force majeure event within the meaning of Article 1218 of the French Civil Code.",
            "Assignment: the Member may not assign their rights or obligations under these Terms without Curato's prior written consent. Curato may freely assign the contract in case of reorganisation, merger or acquisition.",
            "Severability: the invalidity of any clause shall not affect the validity of the rest of the Terms.",
            "Notices: unless otherwise specified, any notice shall be made by email to the address provided by the Member in their account, or to " + CONTACT_EMAIL + " for notices addressed to Curato.",
            "Entire agreement: these Terms, together with the Privacy Policy, constitute the entire agreement between the parties and supersede any prior communication.",
          ],
        },
      ],
    },
    {
      id: "creator-compte",
      title: "11. Creator account and eligibility",
      blocks: [
        "The Creator status is open to natural persons of full legal age who carry out a content-creation activity on social media.",
        "Application for Creator status is made at /candidature. Curato reviews each application manually and notifies the candidate of its decision. No admission is guaranteed. Unsuccessful applications are kept for 12 months (see Privacy Policy).",
        "The Creator declares and warrants:",
        {
          list: [
            "To be 18 years old or over.",
            "To have full legal capacity.",
            "To be the author of the content they will publish and to hold all necessary rights (see section 15).",
            "That the information provided in their application is truthful, in particular the Instagram handle and the declared follower count.",
          ],
        },
        "**Ongoing assessment.** Continued participation in the programme is subject to ongoing compliance with eligibility criteria and to active participation by the Creator. Curato may implement evaluation and feedback mechanisms (Strikes system, rating, feedback from Houses) to manage the quality of the ecosystem, under the conditions of section 16.",
      ],
    },
    {
      id: "creator-credit",
      title: "12. Monthly Credit",
      blocks: [
        "Each accepted Creator receives a monthly credit denominated in euros (\"Monthly Credit\"), usable to book Visits with partner Houses.",
        "The amount of the Monthly Credit is determined individually by Curato and communicated to the Creator upon admission. It may be adjusted by Curato with 30 days' notice by email.",
        "Credit rules:",
        {
          list: [
            "The Credit is allocated on the first day of each calendar month.",
            "Unused Credit is carried over until the end of the second month following its allocation. Example: January credit can be used until 31 March inclusive.",
            "The Credit is strictly personal, non-transferable and non-assignable.",
            "The Credit is neither currency, payment instrument nor financial product, and does not entitle the Creator to any cash equivalent. It cannot be converted into money or refunded, except in the case provided in section 24.",
            "The Credit is usable exclusively with partner Houses listed on the Platform.",
            "Upon account closure (by the Creator or by Curato), any unused Credit is permanently lost.",
          ],
        },
      ],
    },
    {
      id: "creator-visites",
      title: "13. Booking and Visit rules",
      blocks: [
        "Booking a Visit is done via the Platform. The Creator contacts the House directly via the provided link (WhatsApp or phone), identifying themselves as a Curato member.",
        "The Creator undertakes to:",
        {
          list: [
            "Respect the hours, code of conduct and customs of the visited House.",
            "Behave in a respectful and professional manner towards the team and other guests.",
            "Honour the booking made.",
          ],
        },
        "Cancellation: any cancellation must be communicated to the House at least 24 hours before the scheduled time. A cancellation within this period has no consequence for the Creator. Within 24 hours, the House may, at its discretion, consider the Visit as performed and the Credit as consumed.",
        "No-show (failure to appear without cancellation): the Visit is deemed performed, the corresponding Credit is permanently consumed, and a Strike is added to the Creator's account.",
        "Three Strikes accumulated over a rolling 6-month period trigger an account review, which may result in temporary suspension (30 days) or exclusion (section 16).",
      ],
    },
    {
      id: "creator-publication",
      title: "14. Publishing obligations and transparency",
      blocks: [
        "Following each Visit, the Creator undertakes to publish editorial Content under the following conditions:",
        {
          list: [
            "Minimum format: three (3) Instagram stories. Reels and feed posts are welcome but not mandatory.",
            "Deadline: within fourteen (14) calendar days following the date of the Visit.",
            "Mandatory mentions: tag or @ sticker of the visited House AND of Curato on each published story.",
            "Authenticity: the Content must sincerely reflect the experience lived. The Creator is not required to produce positive content but undertakes to produce honest content, consistent with the reality of their Visit.",
          ],
        },
        "**Transparency and legal compliance (French Law No. 2023-451 of 9 June 2023 on commercial influence).** Insofar as the published Content benefits from in-kind consideration (the Visit financed by the Credit), the Creator undertakes to:",
        {
          list: [
            "Display clearly and legibly the mention \"Collaboration commerciale\" or \"Publicité\" on each publication, in addition to the @ mentions required above, in accordance with the French law on commercial influence.",
            "Flag any Content modified or generated using artificial intelligence with the mention \"Images virtuelles\" or \"Images retouchées\", in accordance with the same law.",
            "Comply with the sectoral prohibitions and restrictions set by this law (including, without limitation, on financial products, gambling, medical or aesthetic procedures, nicotine products).",
            "More broadly, comply with all applicable regulations on commercial communication and consumer protection, as well as the usage rules of the social platforms on which they publish.",
          ],
        },
        "The Creator remains free in tone, style and editorial substance. Curato does not validate the Content prior to publication and does not exercise any editorial censorship.",
        "Failure to comply with the publishing obligation results in the retroactive consumption of the Credit (if it had been refunded) and the addition of a Strike. Repeat offences may lead to suspension or exclusion (section 16).",
        "If the Creator deletes the published Content within 90 days of publication, this is treated as a breach of the publishing obligation, save for a legitimate reason communicated to Curato (legal proceedings, legal request, etc.).",
      ],
    },
    {
      id: "creator-contenu",
      title: "15. Ownership, warranties and rights over the Content",
      blocks: [
        "**Ownership.** The Creator remains the full owner of the Content they produce. Curato does not claim any ownership of this Content.",
        "**Licence granted.** For each Visit, the Creator grants the visited House the licence described in section 20 below. They also grant Curato a non-exclusive, worldwide, royalty-free licence, for the duration of the contractual relationship, to feature the Content on the Platform and in Curato's editorial communications (newsletter, Curato's own social channels, presentation materials), with attribution to the Creator.",
        "**Creator's warranties.** The Creator declares and warrants that:",
        {
          list: [
            "They are the author of the Content or hold all rights necessary to grant the licence.",
            "The Content does not infringe any third-party rights (copyright, trademarks, privacy, etc.).",
            "The Content is not illegal, defamatory, discriminatory, hateful, pornographic or such as to harm human dignity.",
          ],
        },
        "**Third-party image rights.** When the Creator captures Content within a House's premises, they are solely responsible for:",
        {
          list: [
            "Obtaining prior authorisation from any identifiable natural person (customers, staff, other visitors) before photographing, filming or recording them, in accordance with Article 9 of the French Civil Code.",
            "Respecting the image rights, privacy and personal data protection of any person appearing in the Content.",
            "Obtaining, where necessary, the written consent required for public distribution of that image.",
            "Refraining from capturing or distributing any image or information likely to infringe the privacy of other persons present on the premises.",
          ],
        },
        "These obligations apply regardless of any general authorisations the House may have granted Curato for filming on its premises.",
        "**Indemnity.** In case of a third-party claim based on a breach of the warranties above, the Creator undertakes to indemnify Curato and the relevant House for all consequences (costs, damages, reasonable legal fees).",
      ],
    },
    {
      id: "creator-exclusion",
      title: "16. Strikes, suspension and exclusion (Creators)",
      blocks: [
        "Curato applies a progressive sanctions system, which constitutes the formalisation of the curation and ongoing assessment of the programme:",
        {
          list: [
            "Strike: formal warning notified by email, counted over a rolling 6-month period. Grounds: no-show, failure to publish, minor inappropriate conduct, breach of Visit rules, failure to display the transparency mention required by section 14.",
            "Three Strikes within 6 months: account review, possibly leading to temporary suspension of 30 days or permanent exclusion depending on severity.",
            "Direct exclusion without prior Strike: fraud, falsification of identity or application information, illegal content, circumvention of the Curato model (section 25), serious conduct (harassment, violence, discrimination), manifest violation of third-party image rights.",
          ],
        },
        "Procedure: save for serious cases requiring immediate action, the Creator receives an email notification stating the grounds and has 5 working days to submit observations before final decision.",
        "Consequences of exclusion: immediate cessation of access, loss of unused Credit, data and Content retention per the Privacy Policy, preservation of licences already granted on published Content.",
      ],
    },
    {
      id: "maison-compte",
      title: "17. House account and eligibility",
      blocks: [
        "House status is open to legal or natural persons carrying out, on a professional basis, a physical commercial activity in Paris (and, where applicable, in the Paris region or elsewhere in France as the service expands, in accordance with section 8), in the categories selected by Curato (gastronomy, beauty, wellness, hospitality, etc.).",
        "Application is made at /candidature. Curato reviews each application and notifies the candidate of its decision. No admission is guaranteed.",
        "The House declares and warrants:",
        {
          list: [
            "To be duly registered and to hold all authorisations necessary to carry out its activity.",
            "That the information provided (corporate name, address, contact, service description) is truthful.",
            "That its legal representative is duly authorised to bind the House.",
          ],
        },
      ],
    },
    {
      id: "maison-service",
      title: "18. Service commitment",
      blocks: [
        "The House undertakes to offer the Creator the experience described on the Platform, up to the value of the allocated Credit, at the same quality as that offered to its regular clientele.",
        "If the House is unable to honour a booking (incident, exceptional closure, full capacity), it undertakes to inform the Creator within a reasonable time and to offer an alternative (postponement, different slot).",
        "The House refrains from any discrimination in welcoming the Creator based on a criterion prohibited by law (origin, gender, orientation, etc.).",
      ],
    },
    {
      id: "maison-acceptation",
      title: "19. Acceptance of Creators",
      blocks: [
        "Curato rests on the principle of curation: the Creators visible in the address book have been selected by Curato. The House undertakes to welcome them in that spirit.",
        "The House may not:",
        {
          list: [
            "Impose a brief, publication instructions or require prior approval of the Content.",
            "Make the Visit conditional on the production of specific content beyond the obligations of section 14.",
            "Systematically refuse Creators on the basis of discriminatory criteria.",
          ],
        },
        "The House may, on a one-off basis and for legitimate reason (capacity, availability, type of private event in progress), refuse a specific booking. It will inform Curato if the reason tends to recur.",
      ],
    },
    {
      id: "maison-contenu",
      title: "20. Rights over the Content (House)",
      blocks: [
        "For each Visit performed, the Creator grants the visited House a licence to use the Content produced on the occasion of that Visit, under the following conditions:",
        "**Exclusivity period: 90 days from the date of publication of the Content by the Creator.**",
        "During this 90-day period, the licence is:",
        {
          list: [
            "Exclusive: the Creator undertakes not to grant the same Content to a direct competitor of the House.",
            "Worldwide.",
            "Royalty-free (no additional remuneration is due to the Creator, the consumed Credit covering everything).",
            "Broadly extended: the House may use the Content on its own social channels, its website, its email campaigns, its printed materials, and as part of **paid advertising** (Meta Ads, Google Ads, TikTok Ads and equivalents).",
            "Sub-licensable: the House may grant a sub-licence to its partners (PR agencies, marketing agencies, media) for editorial or advertising purposes related to its activity, without further consent of the Creator.",
          ],
        },
        "**Beyond 90 days**, the licence becomes non-exclusive (the Creator may then grant the Content to other third parties, including competitors) but remains perpetual, worldwide, royalty-free and retains all the rights above (paid advertising and sub-licence included).",
        "Limits of the licence:",
        {
          list: [
            "Mandatory attribution to the Creator on any republication (@ mention or photo credit).",
            "No substantial modification of the Content altering its meaning or message. Technical adjustments (cropping for formats, logo addition, subtitles) remain authorised.",
            "No direct resale of the Content as such.",
            "No use in a context likely to harm the Creator's image.",
          ],
        },
        "Failure to respect these limits terminates the licence and engages the House's liability.",
      ],
    },
    {
      id: "maison-usage",
      title: "21. Rules on the use of Content",
      blocks: [
        "The House may download and retain the Content for the needs of its operation, in compliance with the Privacy Policy and the retention periods defined therein.",
        "When the Content is used in a significant paid advertising campaign, the House undertakes to inform the Creator as a courtesy (without this conditioning the validity of the licence).",
        "If the Creator deletes the original Content from their own account, the House nonetheless retains the use of the Content already downloaded for the remainder of the licence term.",
        "At the end of the exclusivity period (90 days), the Creator regains the ability to grant the Content to other third parties, but the House retains its own usage rights as defined in section 20.",
      ],
    },
    {
      id: "marque",
      title: "22. Brands and identity",
      blocks: [
        "**Authorisation to use the House's brand and identity by Curato.** For the duration of the House's participation in the programme, it authorises Curato, on a non-exclusive, royalty-free, revocable basis and limited to the purposes of the programme, to use its corporate name, trade name, logo, institutional photographs and any other brand or distinctive sign provided by the House or collected with its consent, solely for the purposes of:",
        {
          list: [
            "Featuring the House in the Platform's address book.",
            "Presenting the House in the programme's editorial communications (newsletter, Curato's own social channels, presentation materials).",
            "Facilitating connections between the House and Creators.",
          ],
        },
        "This authorisation does not entail any assignment of intellectual property rights. The House remains fully owner of its distinctive signs. The House may revoke this authorisation at any time by notifying Curato at " + CONTACT_EMAIL + ", it being understood that such revocation will in practice end its participation in the programme.",
        "**Use of the Curato brand by Members.** Each Member (Creator or House) may mention their participation in Curato and use the signs \"Curato\" and \"Curato Collective\" under the following conditions:",
        {
          list: [
            "Use must be fair, consistent with the nature of the programme and respectful of Curato's identity.",
            "No communication may suggest that the Member is an employee, agent, official representative, ambassador or institutional partner of Curato beyond their mere status as Member of the programme.",
            "Use may not take place in a context likely to harm Curato's reputation, generate confusion with an activity unrelated to the programme, or mislead the public as to the nature of the services offered.",
            "Curato may, at any time and for reasonable cause, request the modification, limitation or removal of any use that does not respect these principles.",
          ],
        },
        "The authorisation to use Curato's brands by Members does not confer any ownership rights over them.",
      ],
    },
    {
      id: "maison-exclusion",
      title: "23. Strikes, suspension and exclusion (Houses)",
      blocks: [
        "The progressive system described in section 16 also applies to Houses:",
        {
          list: [
            "Strike: formal warning notified by email. Grounds: failure to meet the service commitment (section 18), imposition of brief or prior validation (section 19), inappropriate conduct towards a Creator, repeated lateness or no-show of the House, non-compliant use of Content (section 21) or of the Curato brand (section 22).",
            "Three Strikes within 6 months: account review, temporary suspension of 30 days or exclusion depending on severity.",
            "Direct exclusion: fraud, harassment, serious discrimination, illegal content, model circumvention, use of a Creator's data for purposes unrelated to the programme (breach of section 7).",
          ],
        },
        "Procedure identical to that described in section 16 (notification, 5 working days right to reply, decision).",
        "Consequences of exclusion: cessation of presence on the Platform, revocation of the brand-use authorisation granted to Curato (section 22), loss of future bookings, preservation of rights already acquired on Content published prior to exclusion.",
      ],
    },
    {
      id: "disputes",
      title: "24. Dispute resolution",
      blocks: [
        "In case of dispute between a Creator and a House (for example, an experience not matching the one announced, inappropriate behaviour), the parties are encouraged to seek an amicable solution as a priority.",
        "**Mediation by Curato:**",
        {
          list: [
            "The aggrieved party writes to " + CONTACT_EMAIL + " setting out the facts and attaching any useful evidence.",
            "Curato acknowledges receipt and proposes a written resolution within 7 working days.",
            "If the mediation is favourable to the Creator (the House failed to meet its service commitment), Curato refunds the Credit consumed for the disputed Visit.",
            "If the mediation is favourable to the House (the Creator breached their obligations), a Strike may be added to the Creator's account.",
          ],
        },
        "**Absence of agreement:** failing amicable resolution, the parties may bring proceedings before the competent courts in accordance with section 9.",
        "The limitation period to bring an action under these Terms is set at 6 months from the date on which the relevant party became aware of the disputed fact, subject to mandatory statutory limits.",
      ],
    },
    {
      id: "exclusion-generale",
      title: "25. Grounds for exclusion",
      blocks: [
        "Curato reserves the right to suspend or terminate a Member's account, without notice and without compensation, in the following cases:",
        {
          list: [
            "Fraud or falsification of identity, professional qualifications, follower count or any other information provided to Curato.",
            "Accumulation of three (3) Strikes over a rolling 6-month period (sections 16 and 23).",
            "Inappropriate conduct: harassment, discrimination, violent words, serious disrespect towards another Member or the Curato team.",
            "Circumvention of the Curato model: attempting to organise Visits or collaborations directly with a House discovered via the Platform, bypassing it, throughout the membership and for the 6 months following its end.",
            "Breach of the confidentiality obligation under section 7, in particular the use of another Member's data for commercial purposes unrelated to the programme.",
            "Publication or distribution of illegal, discriminatory, pornographic, hateful or human-dignity-harming content.",
            "Serious or repeated breach of these Terms, including the transparency obligations of section 14.",
            "Use of the Platform for purposes contrary to French law.",
          ],
        },
        "Procedure: save for serious cases requiring immediate action, the Member receives a reasoned email notification and has 5 working days to submit observations before final decision.",
        "Consequences of exclusion:",
        {
          list: [
            "Immediate cessation of access to the Platform.",
            "For Creators: loss of unused Credit, preservation of licences already granted on published Content.",
            "For Houses: cancellation of future, not-yet-performed bookings, preservation of licences acquired on Content already received, revocation of the brand-use authorisation granted to Curato (section 22).",
            "Data retention in accordance with the Privacy Policy.",
            "Possibility for Curato to make the exclusion public only to the extent strictly necessary to protect other Members.",
          ],
        },
      ],
    },
    {
      id: "responsabilite",
      title: "26. Liability and warranties",
      blocks: [
        "**Curato's role.** Curato is a platform that brings Creators and Houses into contact. Curato is not a party to the service contract that forms between the Creator and the House upon a Visit. Responsibility for the actual performance of the Visit lies with the House; responsibility for publication of the Content, for compliance with the transparency obligations (section 14) and for the rights of third parties appearing in the Content (section 15) lies with the Creator.",
        "**Curato's diligence.** Curato selects Houses and Creators with care, but does not guarantee the specific quality of a given Visit, nor the performance or reach of a publication. Curato uses its best efforts to ensure the availability and proper operation of the Platform, without guaranteeing uninterrupted availability.",
        "**Limitation of liability.** To the extent permitted by applicable law, Curato's total liability towards a Member, on any grounds whatsoever, is capped at the total Monthly Credit allocated to that Member over the last 12 months (for a Creator) or the equivalent value of a Visit (for a House). This limitation does not apply in cases of gross negligence, wilful misconduct or infringement of non-pecuniary rights.",
        "**Warranty disclaimers.** The Platform is provided \"as is\" and \"as available\". Curato gives no express or implied warranty as to fitness for a particular purpose, the economic profitability for the Member, or the reach of a Visit in terms of audience.",
        "**Force majeure.** Curato shall not be liable for any breach resulting from a force majeure event within the meaning of Article 1218 of the French Civil Code, including in particular: unavailability of a technical sub-processor (Supabase, Vercel, Resend, Phyllo), health restrictions, exceptional climatic events, acts of public authorities.",
      ],
    },
    {
      id: "terminaison",
      title: "27. Termination of the relationship",
      blocks: [
        "**At the Member's initiative:** any Member may terminate their account at any time by sending a request to " + CONTACT_EMAIL + ", with 30 days' notice. The notice period may be waived by mutual agreement.",
        "**At Curato's initiative:** Curato may terminate an account in accordance with sections 16, 23 and 25.",
        "**Consequences of termination:**",
        {
          list: [
            "Cessation of access to the Platform at the end of the notice period.",
            "For Creators: any unused Credit is permanently lost. No refund is due.",
            "For Houses: revocation of the brand-use authorisation granted to Curato (section 22).",
            "Data retention in accordance with the Privacy Policy (section 7 thereof).",
            "Preservation of the licences granted on published Content, until their natural expiry (90 days of exclusivity then non-exclusive perpetual licence, in accordance with section 20).",
            "Survival of clauses that by their nature must survive termination: confidentiality for 2 years (section 7), intellectual property (sections 15 and 20), Creator's warranties (section 15), dispute resolution (section 24), governing law (section 9), liability (section 26).",
          ],
        },
        "**Releasing effect:** subject to performance of pending obligations (in particular post-Visit publishing obligations already engaged), termination releases the parties from any future obligation under these Terms.",
      ],
    },
  ],
};

// ─── SPANISH (courtesy translation) ─────────────────────────────────────────

const es: TermsContent = {
  pageTitle: "Condiciones Generales de Uso",
  eyebrow: "Curato · Condiciones",
  lastUpdatedLabel: "Última actualización",
  lastUpdated: "23 de mayo de 2026",
  draftNoticeTitle: "Borrador",
  draftNoticeBody:
    "Estas condiciones son un borrador pendiente de finalización. Se actualizarán una vez constituida Curato Collective SAS y tras la revisión por un abogado francés. Los campos entre [corchetes] son marcadores. La versión francesa es la jurídicamente vinculante.",
  tocTitle: "Índice",
  sections: [
    {
      id: "preambule",
      title: "1. Preámbulo",
      blocks: [
        `Las presentes Condiciones Generales de Uso («Condiciones») rigen el acceso y el uso de la plataforma curatocollective.com («Curato» o «la Plataforma»), operada por ${COMPANY} (${STATUS_ES}).`,
        "Curato es un ecosistema curado que pone en contacto a creadores de contenido con maisons de excepción en París. Los creadores reciben un crédito mensual en euros para descubrir restaurantes, santuarios de belleza, retiros de bienestar y hoteles boutique seleccionados; las maisons reciben a estos creadores y obtienen a cambio contenido editorial publicado en sus redes sociales, con 90 días de derechos de uso exclusivos.",
        "**Naturaleza evolutiva del programa.** Curato es, en esta fase, un programa en lanzamiento. El Miembro reconoce y acepta que las funcionalidades, dinámicas operativas y condiciones de participación podrán evolucionar, ajustarse o ampliarse para asegurar el adecuado desarrollo del ecosistema. Dichas evoluciones se notificarán conforme a la sección 4.",
        "Estas Condiciones complementan y no sustituyen a la Política de Privacidad, disponible en /privacidad. Ambos documentos funcionan juntos. En caso de contradicción sobre el tratamiento de datos personales, prevalece la Política de Privacidad.",
        "El uso de la Plataforma implica la aceptación expresa y sin reservas de estas Condiciones, recogida mediante una casilla dedicada en la candidatura y confirmada en cada conexión posterior.",
      ],
    },
    {
      id: "definitions",
      title: "2. Definiciones",
      blocks: [
        "En estas Condiciones, los siguientes términos tienen el significado indicado:",
        {
          list: [
            "«Curato» o «la Plataforma»: el sitio curatocollective.com y el conjunto de servicios asociados, operados por Curato Collective SAS.",
            "«Miembro»: toda persona física o jurídica que haya creado una cuenta en la Plataforma, sea Creador o Maison.",
            "«Creador»: Miembro, persona física mayor de edad, cuya actividad consiste en producir contenido editorial en redes sociales y que recibe un crédito mensual para visitar las Maisons seleccionadas.",
            "«Maison»: Miembro, persona jurídica o física que ejerce una actividad comercial física (restaurante, santuario de belleza, retiro de bienestar, hotel boutique, etc.), que acoge a Creadores en el marco de Curato.",
            "«Visita»: una experiencia ofrecida por una Maison y reservada por un Creador vía la Plataforma, financiada por la totalidad o parte del Crédito mensual del Creador.",
            "«Contenido»: toda fotografía, vídeo, texto u otro elemento editorial producido y publicado por un Creador con ocasión de una Visita.",
            "«Crédito mensual»: la cantidad en euros asignada mensualmente por Curato a cada Creador, utilizable para reservar Visitas en las condiciones definidas en la sección 12.",
            "«Strike»: un incumplimiento de las obligaciones de estas Condiciones, contabilizado en un periodo deslizante de 6 meses.",
            "«Política de Privacidad»: el documento accesible en /privacidad, que describe el tratamiento de los datos personales.",
            "«Información Confidencial»: toda información no pública a la que un Miembro tenga acceso en el contexto del programa, según se define en la sección 7.",
          ],
        },
      ],
    },
    {
      id: "acceptation",
      title: "3. Aceptación y acceso",
      blocks: [
        "El acceso a Curato está reservado a personas mayores de edad (18 años cumplidos) con plena capacidad jurídica para contratar.",
        "Curato funciona por invitación y selección: la presentación de una candidatura no implica aceptación. Curato examina cada candidatura manualmente y se reserva el derecho de aceptar o rechazar a un candidato sin tener que motivar su decisión.",
        "Tras la aceptación, el Miembro es invitado a crear una cuenta. El Miembro se compromete a facilitar información veraz, completa y actualizada, y a mantenerla actualizada.",
        "El Miembro es el único responsable de la confidencialidad de sus credenciales. Toda acción realizada desde su cuenta se considera realizada por él. En caso de uso no autorizado presunto, el Miembro debe informar a Curato sin demora en " + CONTACT_EMAIL + ".",
        "Un Miembro solo puede tener una cuenta. La creación de cuentas múltiples puede dar lugar a la suspensión inmediata.",
      ],
    },
    {
      id: "modifications",
      title: "4. Modificación de las condiciones",
      blocks: [
        "Curato puede modificar estas Condiciones en cualquier momento para reflejar la evolución del servicio, de la normativa o de las prácticas del mercado.",
        "Toda modificación sustancial se notificará a los Miembros por correo electrónico al menos 30 días antes de su entrada en vigor, salvo modificaciones urgentes por obligación legal.",
        "El Miembro que no acepte una modificación puede rescindir su cuenta sin coste antes de la entrada en vigor de la misma. La continuación del uso después de esa fecha equivale a aceptación tácita.",
        "La versión aplicable es la vigente en el momento del uso. La fecha de última actualización figura al principio de este documento.",
      ],
    },
    {
      id: "confidentialite-privacy",
      title: "5. Relación con la Política de Privacidad",
      blocks: [
        "El tratamiento de los datos personales de los Miembros se rige por la Política de Privacidad accesible en /privacidad. Esta describe en particular los datos recogidos, sus finalidades, las bases legales del tratamiento, los destinatarios (Supabase, Vercel, Resend, Phyllo), los plazos de conservación y los derechos de las personas concernidas.",
        "Las Condiciones y la Política de Privacidad forman conjuntamente el marco contractual de la relación entre Curato y sus Miembros. En caso de contradicción sobre el tratamiento de datos, prevalece la Política de Privacidad.",
      ],
    },
    {
      id: "nature-juridique",
      title: "6. Naturaleza jurídica de la relación",
      blocks: [
        "La participación en Curato se basa en un modelo de intercambio de valor que no da lugar a ningún pago directo entre las partes: la Maison pone a disposición una experiencia, el Creador accede a ella mediante su Crédito mensual y publica un contenido editorial derivado de dicha experiencia.",
        "La participación en el programa **no crea ni implica**, en ningún caso:",
        {
          list: [
            "Un contrato laboral o una relación de subordinación entre Curato y el Creador, ni entre la Maison y el Creador. El Creador no es ni empleado, ni asalariado, ni becario de Curato ni de la Maison.",
            "Un mandato, una agencia comercial, una representación o una distribución.",
            "Una sociedad, agrupación, partnership o joint-venture.",
            "Un contrato tradicional de prestación de servicios publicitarios o de influencia comercial remunerada en el sentido del derecho civil.",
            "Una prestación de servicio financiero, no siendo el Crédito mensual ni moneda, ni instrumento de pago, ni producto financiero.",
            "Una obligación de exclusividad: el Creador conserva la plena libertad de colaborar con cualquier otro actor, y la Maison conserva la plena libertad de acoger a cualquier otro visitante en las condiciones que decida.",
          ],
        },
        "Cada Miembro actúa de manera estrictamente independiente y autónoma, bajo su exclusiva responsabilidad, y asume por sí solo sus obligaciones legales, fiscales y sociales derivadas de su actividad.",
        "Ninguna estipulación de estas Condiciones podrá interpretarse como creadora de una relación distinta a la de participación voluntaria en el programa Curato.",
      ],
    },
    {
      id: "confidentialite",
      title: "7. Confidencialidad",
      blocks: [
        "Cada Miembro se compromete a preservar la confidencialidad de toda Información Confidencial a la que pueda tener acceso en el marco del programa Curato.",
        "Se considera Información Confidencial toda información, en cualquier forma (oral, escrita, digital), a la que un Miembro tenga acceso y que no sea pública, incluyendo en particular: información comercial, operativa, estratégica o técnica relativa a Curato o a otro Miembro; datos personales de otros Miembros; métricas internas del programa; condiciones financieras individuales (importe del Crédito mensual); dinámicas de matching, algoritmos o métodos de curación.",
        "Esta información no puede ser divulgada a terceros ni utilizada para finalidades ajenas al programa, salvo acuerdo previo de la parte concernida u obligación legal.",
        "No constituye Información Confidencial aquella que:",
        {
          list: [
            "Sea de dominio público sin incumplimiento de estas Condiciones;",
            "Ya estuviera lícitamente en posesión del Miembro con anterioridad a su divulgación;",
            "Haya sido obtenida lícitamente de un tercero no sujeto a obligación de confidencialidad;",
            "Deba ser divulgada en cumplimiento de obligación legal o decisión de autoridad competente, en cuyo caso el Miembro informará a Curato antes de la divulgación cuando ello sea legalmente posible.",
          ],
        },
        "**En particular, la Maison se compromete a no utilizar los datos de contacto o datos personales de un Creador para fines comerciales ajenos al programa Curato, incluyendo prospección directa o constitución de fichero de clientes.**",
        "La obligación de confidencialidad permanece vigente durante toda la duración de la participación en el programa y durante **dos (2) años** desde la cesación de la misma.",
      ],
    },
    {
      id: "champ-geographique",
      title: "8. Ámbito geográfico",
      blocks: [
        "El programa Curato se despliega inicialmente en París, Francia. La selección de Maisons está, en esta fase, limitada a este perímetro, y las Visitas se desarrollan en los establecimientos físicos de las Maisons partner en dicho territorio.",
        "El programa puede extenderse a otras ciudades o regiones, en Francia o en el extranjero, conforme a la evolución del ecosistema. Dicha extensión será comunicada por Curato y no supone, por sí misma, modificación de estas Condiciones.",
        "La disponibilidad del programa, así como el acceso a determinadas dinámicas o funcionalidades, puede variar en función de la ubicación del Miembro, de criterios operativos o de restricciones reglamentarias locales.",
      ],
    },
    {
      id: "loi",
      title: "9. Ley aplicable y jurisdicción",
      blocks: [
        "Estas Condiciones se rigen por el derecho francés.",
        "Toda controversia relativa a su interpretación o ejecución será competencia exclusiva de los tribunales del ámbito de la Corte de Apelación de París, sin perjuicio de las normas imperativas de protección al consumidor y previo intento de resolución amistosa descrito en la sección 24.",
        "En caso de discrepancia entre la versión francesa y cualquier traducción (inglés, español), prevalecerá la versión francesa.",
      ],
    },
    {
      id: "generales",
      title: "10. Disposiciones generales",
      blocks: [
        {
          list: [
            "Fuerza mayor: ninguna parte será responsable de un incumplimiento derivado de un caso de fuerza mayor en el sentido del artículo 1218 del Código Civil francés.",
            "Cesión: el Miembro no puede ceder sus derechos u obligaciones bajo estas Condiciones sin el acuerdo escrito previo de Curato. Curato puede ceder libremente el contrato en caso de reorganización, fusión o adquisición.",
            "Independencia de las cláusulas: la nulidad de una cláusula no implica la nulidad del conjunto de las Condiciones.",
            "Notificaciones: salvo disposición contraria, toda notificación se realizará por correo electrónico a la dirección facilitada por el Miembro en su cuenta o a " + CONTACT_EMAIL + " para las notificaciones dirigidas a Curato.",
            "Integridad del acuerdo: estas Condiciones, junto con la Política de Privacidad, constituyen el acuerdo íntegro entre las partes y sustituyen toda comunicación anterior.",
          ],
        },
      ],
    },
    {
      id: "creator-compte",
      title: "11. Cuenta de Creador y elegibilidad",
      blocks: [
        "La condición de Creador está abierta a personas físicas mayores de edad que justifiquen una actividad de creación de contenido en redes sociales.",
        "La candidatura para Creador se realiza en /candidature. Curato examina cada expediente manualmente y notifica al candidato su decisión. No se ofrece ninguna garantía de admisión. Las candidaturas no aceptadas se conservan 12 meses (ver Política de Privacidad).",
        "El Creador declara y garantiza:",
        {
          list: [
            "Tener 18 años cumplidos.",
            "Disponer de plena capacidad jurídica.",
            "Ser autor del contenido que publicará y disponer de todos los derechos necesarios (ver sección 15).",
            "Que la información facilitada en su candidatura es veraz, en particular el identificador de la cuenta de Instagram y el número de seguidores declarado.",
          ],
        },
        "**Evaluación continua.** La permanencia en el programa está sujeta al cumplimiento continuo de los criterios de elegibilidad y a la participación activa del Creador. Curato podrá implementar mecanismos de evaluación y retroalimentación (sistema de Strikes, calificación, retornos de las Maisons) para gestionar la calidad del ecosistema, conforme a las condiciones de la sección 16.",
      ],
    },
    {
      id: "creator-credit",
      title: "12. Crédito mensual",
      blocks: [
        "Cada Creador aceptado recibe un crédito mensual denominado en euros («Crédito mensual»), utilizable para reservar Visitas con las Maisons partner.",
        "El importe del Crédito mensual se determina individualmente por Curato y se comunica al Creador en su admisión. Puede ser ajustado por Curato con un preaviso de 30 días notificado por correo electrónico.",
        "Reglas de funcionamiento del Crédito:",
        {
          list: [
            "El Crédito se asigna el primer día de cada mes natural.",
            "El Crédito no utilizado es trasladable hasta el final del segundo mes siguiente a su asignación. Ejemplo: el crédito de enero es utilizable hasta el 31 de marzo inclusive.",
            "El Crédito es estrictamente personal, no transferible y no cesible.",
            "El Crédito no es ni moneda, ni instrumento de pago, ni producto financiero, y no da derecho a ninguna contraprestación dineraria. No puede convertirse en dinero ni ser reembolsado, salvo el caso previsto en la sección 24.",
            "El Crédito es utilizable exclusivamente con las Maisons partner referenciadas en la Plataforma.",
            "En caso de cierre de la cuenta (por el Creador o por Curato), todo Crédito no utilizado se pierde definitivamente.",
          ],
        },
      ],
    },
    {
      id: "creator-visites",
      title: "13. Reserva y reglas de Visita",
      blocks: [
        "La reserva de una Visita se realiza vía la Plataforma. El Creador contacta directamente con la Maison vía el enlace facilitado (WhatsApp o teléfono) identificándose como miembro de Curato.",
        "El Creador se compromete a:",
        {
          list: [
            "Respetar los horarios, el código de conducta y los usos de la Maison visitada.",
            "Comportarse de manera respetuosa y profesional con el equipo y los demás clientes.",
            "Honrar la reserva efectuada.",
          ],
        },
        "Cancelación: toda cancelación debe comunicarse a la Maison al menos 24 horas antes del horario previsto. Una cancelación en este plazo es sin consecuencias para el Creador. Por debajo de 24 horas, la Maison puede, a su discreción, considerar la Visita como realizada y el Crédito como consumido.",
        "No-show (no presentación sin cancelación): la Visita se considera realizada, el Crédito correspondiente se consume definitivamente, y se añade un Strike a la cuenta del Creador.",
        "Tres Strikes acumulados en un periodo deslizante de 6 meses dan lugar a una revisión de la cuenta, pudiendo derivar en suspensión temporal (30 días) o exclusión (sección 16).",
      ],
    },
    {
      id: "creator-publication",
      title: "14. Obligaciones de publicación y transparencia",
      blocks: [
        "Tras cada Visita, el Creador se compromete a publicar Contenido editorial en las siguientes condiciones:",
        {
          list: [
            "Formato mínimo: tres (3) stories de Instagram. Los Reels y publicaciones en feed son bienvenidos pero no obligatorios.",
            "Plazo: en los catorce (14) días naturales siguientes a la fecha de la Visita.",
            "Menciones obligatorias: tag o sticker @ de la Maison visitada Y @ de Curato en cada story publicada.",
            "Autenticidad: el Contenido debe reflejar sinceramente la experiencia vivida. El Creador no está obligado a producir un contenido positivo, pero se compromete a producir un contenido honesto, conforme a la realidad de su Visita.",
          ],
        },
        "**Transparencia y cumplimiento legal (Ley francesa n.° 2023-451 de 9 de junio de 2023 sobre influencia comercial).** En la medida en que el Contenido publicado se beneficia de una contraprestación en especie (la Visita financiada por el Crédito), el Creador se compromete a:",
        {
          list: [
            "Mostrar de forma clara y legible la mención «Collaboration commerciale» o «Publicité» en cada publicación, además de las menciones @ requeridas, conforme a la ley francesa de encuadre de la influencia comercial.",
            "Señalar todo Contenido modificado o generado mediante inteligencia artificial con la mención «Images virtuelles» o «Images retouchées», conforme a la misma ley.",
            "Respetar las prohibiciones y restricciones sectoriales fijadas por dicha ley (incluyendo, sin limitarse, en materia de productos financieros, juegos de azar, actos médicos o estéticos, productos nicotínicos).",
            "Respetar, en términos más amplios, toda la normativa aplicable a la comunicación comercial y a la protección de los consumidores, así como las reglas de uso de las plataformas sociales en las que publique.",
          ],
        },
        "El Creador conserva libertad de tono, estilo y fondo editorial. Curato no valida el Contenido antes de publicación y no ejerce ninguna censura editorial.",
        "El incumplimiento de la obligación de publicación conlleva el consumo retroactivo del Crédito (si hubiera sido restituido) y la adición de un Strike. La reincidencia puede dar lugar a suspensión o exclusión (sección 16).",
        "Si el Creador suprime el Contenido publicado en los 90 días siguientes a la publicación, ello se asimila a un incumplimiento de la obligación de publicación, salvo motivo legítimo comunicado a Curato (procedimiento judicial, requerimiento legal, etc.).",
      ],
    },
    {
      id: "creator-contenu",
      title: "15. Propiedad, garantías y derechos sobre el Contenido",
      blocks: [
        "**Propiedad.** El Creador es y permanece pleno propietario del Contenido que produce. Curato no reivindica ningún derecho de propiedad sobre este Contenido.",
        "**Licencia otorgada.** Para cada Visita, el Creador otorga a la Maison visitada la licencia descrita en la sección 20. Otorga además a Curato una licencia no exclusiva, mundial, gratuita, por la duración de la relación contractual, para referenciar el Contenido en la Plataforma y en las comunicaciones editoriales de Curato (newsletter, redes propias de Curato, soportes de presentación), con atribución al Creador.",
        "**Garantías del Creador.** El Creador declara y garantiza que:",
        {
          list: [
            "Es el autor del Contenido o dispone de todos los derechos necesarios para concederlo en licencia.",
            "El Contenido no infringe ningún derecho de terceros (derechos de autor, marcas, vida privada, etc.).",
            "El Contenido no es ilegal, difamatorio, discriminatorio, de odio, pornográfico ni atenta contra la dignidad humana.",
          ],
        },
        "**Derecho a la imagen de terceros.** Cuando el Creador capta Contenido en el establecimiento de una Maison, es exclusivamente responsable de:",
        {
          list: [
            "Obtener la autorización previa de toda persona física reconocible (clientes, personal, otros visitantes) antes de fotografiarla, filmarla o grabarla, conforme al artículo 9 del Código Civil francés.",
            "Respetar el derecho a la imagen, a la vida privada y a la protección de los datos personales de toda persona que aparezca en el Contenido.",
            "Obtener, en su caso, el consentimiento escrito necesario para la difusión pública de dicha imagen.",
            "Abstenerse de captar o difundir toda imagen o información susceptible de atentar contra la vida privada de otras personas presentes en el establecimiento.",
          ],
        },
        "Estas obligaciones se aplican con independencia de las autorizaciones generales que la Maison haya podido otorgar a Curato para grabar en sus locales.",
        "**Indemnización.** En caso de reclamación de un tercero fundada en una violación de las garantías anteriores, el Creador se compromete a indemnizar a Curato y a la Maison concernida de todas las consecuencias (gastos, indemnizaciones, gastos jurídicos razonables).",
      ],
    },
    {
      id: "creator-exclusion",
      title: "16. Strikes, suspensión y exclusión (Creadores)",
      blocks: [
        "Curato aplica un sistema progresivo de sanciones, que constituye la formalización de la curación y de la evaluación continua del programa:",
        {
          list: [
            "Strike: advertencia formal notificada por correo electrónico, contabilizada en 6 meses deslizantes. Motivos: no-show, falta de publicación, conducta inapropiada leve, incumplimiento de las reglas de Visita, falta de la mención de transparencia prevista en la sección 14.",
            "Tres Strikes en 6 meses: revisión de la cuenta, pudiendo dar lugar a suspensión temporal de 30 días o exclusión definitiva según la gravedad.",
            "Exclusión directa sin Strike previo: fraude, falsificación de la identidad o de la información de candidatura, contenido ilegal, bypass del modelo Curato (sección 25), conducta grave (acoso, violencia, discriminación), violación manifiesta del derecho a la imagen de terceros.",
          ],
        },
        "Procedimiento: salvo caso grave que requiera acción inmediata, el Creador recibe una notificación por correo electrónico informándole del motivo y dispone de 5 días hábiles para presentar sus observaciones antes de la decisión definitiva.",
        "Consecuencias de la exclusión: cesación inmediata del acceso, pérdida del Crédito no utilizado, conservación de los datos y del Contenido según la Política de Privacidad, mantenimiento de las licencias ya otorgadas sobre el Contenido publicado.",
      ],
    },
    {
      id: "maison-compte",
      title: "17. Cuenta de Maison y elegibilidad",
      blocks: [
        "La condición de Maison está abierta a personas jurídicas o físicas que ejerzan a título profesional una actividad comercial física en París (y, en su caso, en la región parisina u otros lugares de Francia según la extensión del servicio, conforme a la sección 8), en las categorías seleccionadas por Curato (gastronomía, belleza, bienestar, hostelería, etc.).",
        "La candidatura se realiza en /candidature. Curato examina cada expediente y notifica al candidato su decisión. No se ofrece ninguna garantía de admisión.",
        "La Maison declara y garantiza:",
        {
          list: [
            "Estar regularmente inmatriculada y disponer de todas las autorizaciones necesarias para el ejercicio de su actividad.",
            "Que la información facilitada (razón social, dirección, contacto, descripción del servicio) es veraz.",
            "Que su representante legal está debidamente facultado para obligar a la Maison.",
          ],
        },
      ],
    },
    {
      id: "maison-service",
      title: "18. Compromiso de servicio",
      blocks: [
        "La Maison se compromete a ofrecer al Creador la experiencia descrita en la Plataforma, hasta la cuantía del Crédito asignado, en las mismas condiciones de calidad que las ofrecidas a su clientela habitual.",
        "Si la Maison no puede honrar una reserva (incidente, cierre excepcional, completo), se compromete a informar al Creador en un plazo razonable y a proponer una alternativa (aplazamiento, franja diferente).",
        "La Maison se prohíbe toda discriminación en la acogida del Creador basada en un criterio prohibido por la ley (origen, sexo, orientación, etc.).",
      ],
    },
    {
      id: "maison-acceptation",
      title: "19. Aceptación de los Creadores",
      blocks: [
        "Curato se basa en el principio de curación: los Creadores visibles en el carnet de direcciones han sido seleccionados por Curato. La Maison se compromete a acogerlos con ese espíritu.",
        "La Maison no puede:",
        {
          list: [
            "Imponer un brief, instrucciones de publicación o exigir la aprobación previa del Contenido.",
            "Condicionar la Visita a la producción de un contenido específico más allá de las obligaciones de la sección 14.",
            "Rechazar sistemáticamente a Creadores basándose en criterios discriminatorios.",
          ],
        },
        "La Maison puede, puntualmente y por motivo legítimo (capacidad, disponibilidad, tipo de evento privado en curso), rechazar una reserva específica. Informará entonces a Curato si el motivo tiende a repetirse.",
      ],
    },
    {
      id: "maison-contenu",
      title: "20. Derechos sobre el Contenido (Maison)",
      blocks: [
        "Por cada Visita realizada, el Creador otorga a la Maison visitada una licencia de uso sobre el Contenido producido con ocasión de esa Visita, en las siguientes condiciones:",
        "**Periodo de exclusividad: 90 días desde la fecha de publicación del Contenido por el Creador.**",
        "Durante este periodo de 90 días, la licencia es:",
        {
          list: [
            "Exclusiva: el Creador se compromete a no otorgar el mismo Contenido a un competidor directo de la Maison.",
            "Mundial.",
            "Gratuita (no se debe ninguna remuneración adicional al Creador, el Crédito consumido cubre el conjunto).",
            "Ampliamente extendida: la Maison puede usar el Contenido en sus redes sociales propias, su sitio web, sus campañas de email marketing, sus soportes impresos, y en el marco de **publicidad pagada** (Meta Ads, Google Ads, TikTok Ads y equivalentes).",
            "Sublicenciable: la Maison puede otorgar una sublicencia a sus partners (agencias de relaciones con prensa, agencias de marketing, medios) con fines editoriales o publicitarios relacionados con su actividad, sin acuerdo adicional del Creador.",
          ],
        },
        "**Más allá de los 90 días**, la licencia pasa a ser no exclusiva (el Creador puede entonces otorgar el Contenido a otros terceros, incluidos competidores) pero permanece perpetua, mundial, gratuita y conserva todos los derechos anteriores (publicidad pagada y sublicencia incluidos).",
        "Límites de la licencia:",
        {
          list: [
            "Atribución obligatoria al Creador en toda republicación (mención @ o crédito fotográfico).",
            "Sin modificación sustancial del Contenido que altere su sentido o mensaje. Los ajustes técnicos (recorte para formatos, añadido de logo, subtítulos) permanecen autorizados.",
            "Sin reventa directa del Contenido como tal.",
            "Sin uso en un contexto susceptible de dañar la imagen del Creador.",
          ],
        },
        "El incumplimiento de estos límites pone fin a la licencia y compromete la responsabilidad de la Maison.",
      ],
    },
    {
      id: "maison-usage",
      title: "21. Reglas de uso del Contenido",
      blocks: [
        "La Maison puede descargar y conservar el Contenido para las necesidades de su explotación, respetando la Política de Privacidad y los plazos de conservación allí definidos.",
        "Cuando el Contenido se utilice en el marco de una campaña publicitaria pagada significativa, la Maison se compromete a informar al Creador por cortesía (sin que ello condicione la validez de la licencia).",
        "Si el Creador suprime el Contenido original de su propia cuenta, la Maison conserva no obstante el uso del Contenido ya descargado por la duración restante de la licencia.",
        "Al término del periodo de exclusividad (90 días), el Creador recupera la facultad de otorgar el Contenido a otros terceros, pero la Maison conserva sus propios derechos de uso tal como se definen en la sección 20.",
      ],
    },
    {
      id: "marque",
      title: "22. Marcas e identidad",
      blocks: [
        "**Autorización de uso de la marca e identidad de la Maison por Curato.** Durante toda la duración de la participación de la Maison en el programa, ésta autoriza a Curato, de forma no exclusiva, gratuita, revocable y limitada a las finalidades del programa, a utilizar su razón social, su nombre comercial, su logotipo, sus fotografías institucionales y cualquier otra marca o signo distintivo proporcionado por la Maison o recogido con su consentimiento, con la única finalidad de:",
        {
          list: [
            "Referenciar a la Maison en el carnet de direcciones de la Plataforma.",
            "Presentar a la Maison en las comunicaciones editoriales del programa (newsletter, redes sociales propias de Curato, soportes de presentación).",
            "Facilitar la puesta en contacto entre la Maison y los Creadores.",
          ],
        },
        "Esta autorización no implica ninguna cesión de derechos de propiedad intelectual. La Maison permanece plenamente titular de sus signos distintivos. La Maison puede revocar esta autorización en cualquier momento notificando a Curato en " + CONTACT_EMAIL + ", entendiéndose que dicha revocación implica en la práctica el fin de su participación en el programa.",
        "**Uso de la marca Curato por los Miembros.** Cada Miembro (Creador o Maison) puede mencionar su participación en Curato y utilizar los signos «Curato» y «Curato Collective» en las siguientes condiciones:",
        {
          list: [
            "El uso debe ser leal, conforme a la naturaleza del programa y respetuoso de la identidad de Curato.",
            "Ninguna comunicación puede sugerir que el Miembro es empleado, agente, representante oficial, embajador o partner institucional de Curato más allá de su mera condición de Miembro del programa.",
            "El uso no puede tener lugar en un contexto susceptible de dañar la reputación de Curato, generar confusión con una actividad ajena al programa, o inducir a error al público sobre la naturaleza de los servicios ofrecidos.",
            "Curato puede, en cualquier momento y por motivo razonable, solicitar la modificación, limitación o supresión de cualquier uso que no respete estos principios.",
          ],
        },
        "La autorización de uso de las marcas de Curato por los Miembros no confiere ningún derecho de propiedad sobre las mismas.",
      ],
    },
    {
      id: "maison-exclusion",
      title: "23. Strikes, suspensión y exclusión (Maisons)",
      blocks: [
        "El sistema progresivo descrito en la sección 16 se aplica igualmente a las Maisons:",
        {
          list: [
            "Strike: advertencia formal notificada por correo electrónico. Motivos: incumplimiento del compromiso de servicio (sección 18), imposición de brief o de validación previa (sección 19), conducta inapropiada hacia un Creador, retrasos repetidos o no-show de la Maison, uso no conforme del Contenido (sección 21) o de la marca Curato (sección 22).",
            "Tres Strikes en 6 meses: revisión de la cuenta, suspensión temporal de 30 días o exclusión según la gravedad.",
            "Exclusión directa: fraude, acoso, discriminación grave, contenido ilegal, bypass del modelo, utilización de los datos de un Creador con fines ajenos al programa (violación de la sección 7).",
          ],
        },
        "Procedimiento idéntico al descrito en la sección 16 (notificación, derecho de réplica de 5 días hábiles, decisión).",
        "Consecuencias de la exclusión: cesación de la presencia en la Plataforma, revocación de la autorización de uso de marca concedida a Curato (sección 22), pérdida de las reservas futuras, mantenimiento de los derechos ya adquiridos sobre el Contenido publicado antes de la exclusión.",
      ],
    },
    {
      id: "disputes",
      title: "24. Resolución de disputas",
      blocks: [
        "En caso de desacuerdo entre un Creador y una Maison (por ejemplo, una experiencia no conforme con la anunciada, un comportamiento inapropiado), las partes son invitadas a buscar prioritariamente una solución amistosa.",
        "**Mediación de Curato:**",
        {
          list: [
            "La parte que se considera perjudicada escribe a " + CONTACT_EMAIL + " exponiendo los hechos y adjuntando cualquier elemento útil.",
            "Curato acusa recibo y propone una resolución escrita en un plazo de 7 días hábiles.",
            "Si la mediación es favorable al Creador (la Maison incumplió su compromiso de servicio), Curato procede al reembolso del Crédito consumido por la Visita litigiosa.",
            "Si la mediación es favorable a la Maison (el Creador incumplió sus obligaciones), puede añadirse un Strike a la cuenta del Creador.",
          ],
        },
        "**Ausencia de acuerdo:** a falta de resolución amistosa, las partes pueden acudir a los tribunales competentes conforme a la sección 9.",
        "El plazo de prescripción para iniciar una acción bajo estas Condiciones se fija en 6 meses desde el conocimiento del hecho litigioso por la parte concernida, sin poder exceder los plazos legales imperativos.",
      ],
    },
    {
      id: "exclusion-generale",
      title: "25. Causas de exclusión",
      blocks: [
        "Curato se reserva el derecho de suspender o rescindir la cuenta de un Miembro, sin preaviso y sin indemnización, en los siguientes casos:",
        {
          list: [
            "Fraude o falsificación de la identidad, cualificaciones profesionales, número de seguidores o cualquier otra información facilitada a Curato.",
            "Acumulación de tres (3) Strikes en un periodo deslizante de 6 meses (secciones 16 y 23).",
            "Conducta inapropiada: acoso, discriminación, expresiones violentas, falta de respeto grave hacia otro Miembro o el equipo de Curato.",
            "Bypass del modelo Curato: intentar organizar Visitas o colaboraciones directamente con una Maison descubierta vía la Plataforma, saltándola, durante toda la duración de la membresía y durante los 6 meses siguientes al fin de la misma.",
            "Violación de la obligación de confidencialidad de la sección 7, en particular la utilización de los datos de otro Miembro con fines comerciales ajenos al programa.",
            "Publicación o difusión de contenido ilegal, discriminatorio, pornográfico, de odio o que atente contra la dignidad humana.",
            "Incumplimiento grave o reiterado de estas Condiciones, incluidas las obligaciones de transparencia de la sección 14.",
            "Uso de la Plataforma con fines contrarios a la ley francesa.",
          ],
        },
        "Procedimiento: salvo casos de gravedad que requieran acción inmediata, el Miembro recibe una notificación motivada por correo electrónico y dispone de 5 días hábiles para presentar sus observaciones antes de la decisión definitiva.",
        "Consecuencias de la exclusión:",
        {
          list: [
            "Cesación inmediata del acceso a la Plataforma.",
            "Para los Creadores: pérdida del Crédito no utilizado, mantenimiento de las licencias ya otorgadas sobre el Contenido publicado.",
            "Para las Maisons: cancelación de las reservas futuras aún no realizadas, mantenimiento de las licencias adquiridas sobre el Contenido ya recibido, revocación de la autorización de uso de marca concedida a Curato (sección 22).",
            "Conservación de los datos conforme a la Política de Privacidad.",
            "Posibilidad para Curato de hacer pública la exclusión únicamente en la medida estrictamente necesaria para la protección de los demás Miembros.",
          ],
        },
      ],
    },
    {
      id: "responsabilite",
      title: "26. Responsabilidad y garantías",
      blocks: [
        "**Rol de Curato.** Curato es una plataforma de puesta en contacto entre Creadores y Maisons. Curato no es parte del contrato de servicio que se forma entre el Creador y la Maison con ocasión de una Visita. La responsabilidad de la ejecución efectiva de la Visita incumbe a la Maison; la responsabilidad de la publicación del Contenido, del cumplimiento de las obligaciones de transparencia (sección 14) y de los derechos de los terceros que aparezcan en el Contenido (sección 15) incumbe al Creador.",
        "**Diligencia de Curato.** Curato selecciona a las Maisons y a los Creadores con cuidado, pero no garantiza ni la calidad específica de una Visita dada, ni el rendimiento o alcance de una publicación. Curato hace sus mejores esfuerzos para asegurar la disponibilidad y el buen funcionamiento de la Plataforma, sin garantizar por ello una disponibilidad ininterrumpida.",
        "**Limitación de responsabilidad.** En la medida permitida por el derecho aplicable, la responsabilidad total de Curato hacia un Miembro, por todas las causas combinadas, queda limitada al monto total del Crédito mensual asignado a ese Miembro durante los últimos 12 meses (para un Creador) o al monto equivalente del valor de una Visita (para una Maison). Esta limitación no se aplica en caso de culpa grave, dolo o atentado contra derechos no patrimoniales.",
        "**Exclusiones de garantía.** La Plataforma se proporciona «tal cual» y «según disponibilidad». Curato no otorga ninguna garantía expresa o implícita sobre la adaptación a un uso particular, la rentabilidad económica para el Miembro o el alcance de una Visita en términos de audiencia.",
        "**Fuerza mayor.** Curato no podrá ser responsable de un incumplimiento derivado de un caso de fuerza mayor en el sentido del artículo 1218 del Código Civil francés, incluyendo en particular: indisponibilidad de un encargado del tratamiento técnico (Supabase, Vercel, Resend, Phyllo), restricciones sanitarias, eventos climáticos excepcionales, actos de autoridades públicas.",
      ],
    },
    {
      id: "terminaison",
      title: "27. Terminación de la relación",
      blocks: [
        "**A iniciativa del Miembro:** todo Miembro puede rescindir su cuenta en cualquier momento dirigiendo una solicitud a " + CONTACT_EMAIL + ", con un preaviso de 30 días. El preaviso puede ser dispensado de mutuo acuerdo.",
        "**A iniciativa de Curato:** Curato puede rescindir una cuenta conforme a las secciones 16, 23 y 25.",
        "**Consecuencias de la rescisión:**",
        {
          list: [
            "Cesación del acceso a la Plataforma al expirar el preaviso.",
            "Para los Creadores: todo Crédito no utilizado se pierde definitivamente. No se debe ningún reembolso.",
            "Para las Maisons: revocación de la autorización de uso de marca concedida a Curato (sección 22).",
            "Conservación de los datos conforme a la Política de Privacidad (sección 7 de la misma).",
            "Mantenimiento de las licencias otorgadas sobre el Contenido publicado, hasta su expiración natural (90 días de exclusividad y luego licencia perpetua no exclusiva, conforme a la sección 20).",
            "Supervivencia de las cláusulas que por su naturaleza deben sobrevivir a la rescisión: confidencialidad por 2 años (sección 7), propiedad intelectual (secciones 15 y 20), garantías del Creador (sección 15), resolución de litigios (sección 24), ley aplicable (sección 9), responsabilidad (sección 26).",
          ],
        },
        "**Efecto liberatorio:** sin perjuicio de la ejecución de las obligaciones en curso (en particular las obligaciones de publicación post-Visita ya iniciadas), la rescisión libera a las partes de toda obligación futura bajo estas Condiciones.",
      ],
    },
  ],
};

export const termsContent: Record<Lang, TermsContent> = { fr, en, es };

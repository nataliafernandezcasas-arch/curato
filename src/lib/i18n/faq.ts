// ─────────────────────────────────────────────────────────────────────────────
// /faq — Contenu des questions fréquentes (storytellers + maisons).
//
// Structure :
//   • Page header (eyebrow, titre, sous-titre)
//   • Section "Storytellers" — 4 sous-thèmes, ~17 questions
//   • Section "Maisons" — 4 sous-thèmes, ~20 questions
//
// Toutes les réponses sont alignées avec les T&C et le modèle économique
// confirmé par Natalia. Les chiffres sensibles (prix de l'abonnement maison,
// montant du crédit storyteller) restent privés : ils renvoient à un contact
// direct ou à l'inscription.
//
// Trois langues : fr | en | es. FR est la version de référence.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./translations";

export type FaqItem = { q: string; a: string };

export type FaqSection = {
  id: string; // ancre URL
  title: string;
  items: FaqItem[];
};

export type FaqAudience = {
  audienceLabel: string;
  audienceTitle: string;
  audienceIntro: string;
  sections: FaqSection[];
};

export type FaqContent = {
  // Header
  eyebrow: string;
  pageTitle: string;
  pageSubtitle: string;
  lastUpdatedLabel: string;
  lastUpdated: string;

  // Navigation entre les deux audiences
  tocStorytellersLabel: string;
  tocMaisonsLabel: string;

  // Audiences
  storytellers: FaqAudience;
  maisons: FaqAudience;

  // Closing
  stillHaveQuestionsLabel: string;
  stillHaveQuestionsText: string;
  contactCta: string;
  contactHref: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// FRANÇAIS (référence)
// ═══════════════════════════════════════════════════════════════════════════

const fr: FaqContent = {
  eyebrow: "Foire aux questions",
  pageTitle: "Tout ce que vous voulez savoir",
  pageSubtitle:
    "Les réponses claires aux questions qui reviennent le plus. Si la vôtre n'y figure pas, écrivez-nous, nous y répondrons personnellement.",
  lastUpdatedLabel: "Dernière mise à jour",
  lastUpdated: "27 mai 2026",

  tocStorytellersLabel: "Pour les storytellers",
  tocMaisonsLabel: "Pour les maisons",

  stillHaveQuestionsLabel: "Une question reste sans réponse ?",
  stillHaveQuestionsText:
    "Écrivez-nous directement, nous vous répondons en moins de 48 heures.",
  contactCta: "Nous contacter",
  contactHref: "mailto:hello@curatocollective.com",

  // ─── STORYTELLERS ──────────────────────────────────────────────────────
  storytellers: {
    audienceLabel: "Storytellers",
    audienceTitle: "Pour les créateurs",
    audienceIntro:
      "Que ce soit suite à notre invitation ou par votre propre démarche, voici les réponses aux questions les plus posées avant de rejoindre le cercle.",
    sections: [
      {
        id: "creators-credit",
        title: "Le crédit",
        items: [
          {
            q: "Y a-t-il un nombre minimum d'abonnés pour postuler ?",
            a: "Oui. Pour rejoindre Curato, vous devez avoir au minimum 5 000 abonnés sur Instagram. Le crédit mensuel est ensuite calibré à votre audience et à votre engagement, et le détail vous est communiqué au moment de votre inscription.",
          },
          {
            q: "Dois-je payer quelque chose pour participer ?",
            a: "Non. Pour les storytellers, Curato est entièrement gratuit. Vous recevez chaque mois un crédit en euros à utiliser dans les maisons sélectionnées, sans aucune contrepartie financière de votre part.",
          },
          {
            q: "Que se passe-t-il si l'addition dépasse mon crédit ?",
            a: "Vous réglez vous-même la différence, directement à la maison. Vous restez libre de profiter d'une expérience plus large que ce que couvre votre crédit, en sachant que le complément est à votre charge.",
          },
          {
            q: "Quand mon crédit se renouvelle-t-il ?",
            a: "Le premier jour de chaque mois. Le compteur est remis à zéro à cette date.",
          },
          {
            q: "Puis-je accumuler mon crédit si je ne l'utilise pas ?",
            a: "Oui, partiellement. Un crédit non utilisé peut être reporté jusqu'à la fin du deuxième mois. Au-delà, il est perdu. Pour rester active dans le programme, vous devez utiliser au minimum 60 % de votre crédit mensuel chaque mois.",
          },
        ],
      },
      {
        id: "creators-visits",
        title: "Les visites",
        items: [
          {
            q: "Comment réserver dans une maison Curato ?",
            a: "La réservation se fait via la plateforme Curato. Les détails précis du flow sont en cours de finalisation et vous seront communiqués au lancement.",
          },
          {
            q: "Puis-je venir avec quelqu'un ?",
            a: "Oui. Vous pouvez venir avec la personne de votre choix. Il suffit de nous prévenir en amont afin que nous puissions ajuster la réservation auprès de la maison.",
          },
          {
            q: "Puis-je visiter deux fois la même maison ?",
            a: "Non, pas pour le moment. Une visite par maison est la règle au lancement, afin de permettre la rotation entre les différentes adresses du carnet. Cette règle pourra évoluer par la suite.",
          },
          {
            q: "Combien de maisons sont disponibles dans le carnet ?",
            a: "Le carnet se construit avec vous. Le nombre exact d'adresses sera communiqué au lancement, ou dès que les 15 premiers commerces partenaires seront signés.",
          },
          {
            q: "Puis-je annuler une réservation ?",
            a: "Oui, jusqu'à 24 heures avant la visite, sans conséquence. Au-delà, la valeur du crédit engagée pour cette visite est perdue. C'est par respect du temps et de la place réservée par la maison.",
          },
        ],
      },
      {
        id: "creators-publication",
        title: "La publication",
        items: [
          {
            q: "La publication est-elle obligatoire après une visite ?",
            a: "Oui. La publication fait partie intégrante de l'engagement Curato : 2 stories Instagram dans les 24 heures suivant votre visite, avec mention de la maison et de Curato. C'est la contrepartie du crédit que vous recevez.",
          },
          {
            q: "Si l'expérience ne me plaît pas, dois-je quand même publier ?",
            a: "Oui. L'engagement de publication est ferme. Si vous rencontrez un problème réel pendant la visite (service, qualité, sécurité), contactez-nous immédiatement et nous étudions la situation au cas par cas. Mais ne pas publier par simple manque d'envie n'est pas une option.",
          },
          {
            q: "À qui appartient le contenu que je publie ?",
            a: "Le contenu vous appartient. Vous accordez simplement à Curato et à la maison concernée une licence exclusive d'utilisation pendant 90 jours à compter de la publication.",
          },
          {
            q: "Que se passe-t-il après les 90 jours ?",
            a: "Au-delà de cette période, vous récupérez la pleine liberté d'utilisation. Vous pouvez republier, réutiliser ou retirer le contenu comme bon vous semble.",
          },
          {
            q: "Est-ce conforme à la loi française sur l'influence ?",
            a: "Oui. Tout contenu publié dans le cadre de Curato relève de la loi du 9 juin 2023 et doit comporter la mention « Collaboration commerciale ». Nous vous accompagnons pour respecter strictement ce cadre légal.",
          },
        ],
      },
      {
        id: "creators-account",
        title: "Le compte",
        items: [
          {
            q: "Puis-je travailler avec d'autres marques en parallèle ?",
            a: "Oui, sans restriction sur les marques extérieures à Curato. En revanche, si vous travaillez avec une maison qui figure déjà dans le carnet Curato, la collaboration doit passer par Curato et mentionner notre plateforme.",
          },
          {
            q: "Puis-je quitter Curato à tout moment ?",
            a: "Oui, à tout moment, sans engagement de durée. Si vous bénéficiez de l'offre première vague (crédit doublé à vie), elle est perdue à la fermeture du compte et ne pourra pas être réactivée si vous revenez plus tard.",
          },
        ],
      },
    ],
  },

  // ─── MAISONS ───────────────────────────────────────────────────────────
  maisons: {
    audienceLabel: "Maisons",
    audienceTitle: "Pour les maisons",
    audienceIntro:
      "Vous êtes une maison, un restaurant, un spa, un hôtel ou un institut. Voici les réponses aux questions que se posent les propriétaires avant de rejoindre Curato.",
    sections: [
      {
        id: "houses-model",
        title: "Le modèle",
        items: [
          {
            q: "Combien coûte Curato pour ma maison ?",
            a: "Curato fonctionne sur un modèle d'abonnement annuel ou mensuel. La grille tarifaire est partagée lors d'un premier échange, afin de pouvoir l'ajuster à la réalité de votre maison. Écrivez-nous pour la recevoir.",
          },
          {
            q: "Comment Curato se rémunère-t-il ?",
            a: "Uniquement via l'abonnement payé par les maisons partenaires. Aucun frais d'intermédiation n'est prélevé sur les visites individuelles : ce que la maison propose au storyteller reste intégralement entre la maison et le storyteller.",
          },
          {
            q: "Comment les storytellers paient-ils leur visite ?",
            a: "Vous fixez librement l'offre que vous souhaitez proposer aux storytellers, exprimée en euros (par exemple : 150 € chez un restaurant, 300 € pour une nuit d'hôtel, 250 € pour un soin). Le storyteller utilise son crédit Curato pour couvrir cette offre. Si l'addition dépasse l'offre convenue, le storyteller règle la différence directement.",
          },
          {
            q: "Curato est-il viable pour un petit commerce ?",
            a: "Oui. Comme c'est vous qui fixez librement votre offre, une maison de taille modeste peut proposer une expérience adaptée à sa marge. Tant que la qualité éditoriale et l'esthétique sont là, votre maison a sa place dans le carnet.",
          },
          {
            q: "Quelle différence avec une press list traditionnelle ?",
            a: "Une press list traditionnelle dépend de votre équipe et d'un travail de relance continu. Curato gère pour vous un cercle de storytellers triés à la main et engagés à publier (2 stories par visite, mention obligatoire), avec un minimum de visites garanti chaque mois et 90 jours de droits d'usage exclusifs sur le contenu produit.",
          },
          {
            q: "Quel est le retour sur investissement face à une campagne sponsorisée classique ?",
            a: "Une campagne sponsorisée vous coûte par publication, avec un contenu souvent éphémère. Curato vous offre un flux régulier de contenu authentique (minimum 5 visites par mois, 90 jours de droits d'usage exclusifs) à un coût d'abonnement fixe et prévisible, sans frais d'intermédiation par visite.",
          },
        ],
      },
      {
        id: "houses-visits",
        title: "Les visites",
        items: [
          {
            q: "Qui choisit ma maison ?",
            a: "Le storyteller choisit librement, en parcourant le carnet Curato. Il n'y a pas d'attribution algorithmique : votre maison est sélectionnée par affinité éditoriale.",
          },
          {
            q: "Combien de visites par mois suis-je sûre de recevoir ?",
            a: "Curato vous garantit un minimum de 5 visites de storytellers par mois. Si ce seuil n'est pas atteint sur un mois donné, le mois suivant vous est offert. Si trois mois consécutifs passent sans atteindre les 5 visites, cela signifie que votre maison ne suscite pas l'intérêt des storytellers et votre participation au programme prend fin.",
          },
          {
            q: "Puis-je refuser un storyteller en particulier ?",
            a: "Au lancement, non. Le storyteller choisit librement la maison qu'il souhaite visiter et les maisons ne peuvent pas refuser un storyteller en particulier. Cette flexibilité sera évaluée selon les retours des maisons une fois le programme rodé.",
          },
          {
            q: "Puis-je limiter les jours ou les horaires des visites Curato ?",
            a: "Oui. Chaque maison définit ses propres créneaux d'accueil pour les visites Curato. Vous pouvez par exemple n'accepter les visites qu'en semaine, exclure le service du midi, ou plafonner le nombre de visites par semaine.",
          },
          {
            q: "Quand puis-je espérer ma première visite ?",
            a: "Une fois votre maison inscrite et publiée dans le carnet, les premières visites se planifient généralement entre 2 et 4 semaines, selon l'intérêt des storytellers pour votre univers.",
          },
          {
            q: "Comment vérifiez-vous l'authenticité des storytellers ?",
            a: "Chaque storyteller est vérifié via une plateforme tierce sécurisée qui authentifie son compte Instagram et ses statistiques. Nous écartons les comptes aux audiences artificielles avant même qu'ils ne rejoignent le cercle.",
          },
        ],
      },
      {
        id: "houses-content",
        title: "Le contenu et la plateforme",
        items: [
          {
            q: "Que sont les storytellers obligés de publier ?",
            a: "Au minimum 2 stories Instagram dans les 24 heures suivant la visite, avec mention de votre maison et de Curato, et la balise « Collaboration commerciale » imposée par la loi française. Vous bénéficiez ensuite de 90 jours de droits exclusifs d'usage sur ce contenu.",
          },
          {
            q: "Que se passe-t-il si un storyteller ne se présente pas ou publie un contenu négatif ?",
            a: "Le contenu publié est évalué au cas par cas, mais l'obligation de publication reste ferme. En cas de no-show, de comportement inadapté ou de contenu manifestement problématique, contactez-nous immédiatement : la situation est traitée directement avec le storyteller concerné, et la visite peut être recomptée si la responsabilité revient au storyteller.",
          },
          {
            q: "Existe-t-il un tableau de bord pour les maisons ?",
            a: "Un espace dédié aux maisons est en cours de construction. Il vous permettra de visualiser vos visites à venir, le contenu publié et vos statistiques. Le calendrier de mise à disposition vous sera communiqué.",
          },
          {
            q: "Puis-je proposer des expériences exclusives aux storytellers Curato ?",
            a: "Oui, c'est à votre initiative. Vous êtes libre de concevoir des expériences spécifiquement réservées aux storytellers Curato (menu signature, accès privilégié, événement privé), tant qu'elles s'inscrivent dans l'esprit éditorial du programme.",
          },
        ],
      },
      {
        id: "houses-engagement",
        title: "Engagement et cadre légal",
        items: [
          {
            q: "Quel est l'engagement minimum ?",
            a: "L'abonnement se prend pour une durée mensuelle ou annuelle selon la formule choisie. Si votre maison ne reçoit pas les 5 visites par mois pendant 3 mois consécutifs, le programme prend fin de notre côté.",
          },
          {
            q: "Quelles sont les catégories acceptées ?",
            a: "Curato couvre actuellement quatre univers : Gastronomie, Bien-être, Hôtellerie et Conscience (beauté, soin). De nouvelles catégories pourront être ajoutées par la suite selon l'évolution du programme.",
          },
          {
            q: "Qui est responsable si un storyteller a un accident dans mon établissement ?",
            a: "Le storyteller visite votre maison comme tout autre client. Votre responsabilité civile professionnelle s'applique dans les mêmes conditions habituelles. Curato n'altère pas votre cadre légal ni votre couverture assurantielle.",
          },
          {
            q: "Y a-t-il un accompagnement pour mon équipe ?",
            a: "Oui. À la signature, nous vous fournissons un kit d'onboarding pour que votre équipe sache identifier et accueillir un visiteur Curato. Un appel de 30 minutes avec notre équipe est également proposé si vous le souhaitez.",
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH
// ═══════════════════════════════════════════════════════════════════════════

const en: FaqContent = {
  eyebrow: "Frequently asked questions",
  pageTitle: "Everything you want to know",
  pageSubtitle:
    "Clear answers to the questions that come up most often. If yours isn't here, write to us and we'll answer personally.",
  lastUpdatedLabel: "Last updated",
  lastUpdated: "May 27, 2026",

  tocStorytellersLabel: "For storytellers",
  tocMaisonsLabel: "For maisons",

  stillHaveQuestionsLabel: "Still have a question?",
  stillHaveQuestionsText:
    "Write to us directly, we reply within 48 hours.",
  contactCta: "Contact us",
  contactHref: "mailto:hello@curatocollective.com",

  storytellers: {
    audienceLabel: "Storytellers",
    audienceTitle: "For creators",
    audienceIntro:
      "You've been spotted, or you'd like to apply. Here are the answers to the questions most often asked before joining the circle.",
    sections: [
      {
        id: "creators-credit",
        title: "The credit",
        items: [
          {
            q: "Is there a minimum follower count to apply?",
            a: "Yes. To join Curato, you must have at least 5,000 followers on Instagram. The monthly credit is then calibrated to your audience and engagement, and the exact amount is shared with you at the time of registration.",
          },
          {
            q: "Do I have to pay anything to participate?",
            a: "No. Curato is entirely free for storytellers. Every month you receive a credit in euros to use at selected maisons, with no financial contribution required from you.",
          },
          {
            q: "What happens if the bill exceeds my credit?",
            a: "You cover the difference yourself, directly with the maison. You remain free to enjoy a broader experience than what your credit covers, knowing that the surplus is on you.",
          },
          {
            q: "When does my credit renew?",
            a: "The first day of each month. The counter resets on that date.",
          },
          {
            q: "Can I roll over my credit if I don't use it?",
            a: "Yes, partially. Unused credit can be carried over until the end of the following month. Beyond that, it is lost. To stay active in the program, you must use at least 60% of your monthly credit each month.",
          },
        ],
      },
      {
        id: "creators-visits",
        title: "The visits",
        items: [
          {
            q: "How do I book at a Curato maison?",
            a: "Bookings go through the Curato platform. The exact flow is being finalized and will be shared with you at launch.",
          },
          {
            q: "Can I bring a guest?",
            a: "Yes. You can come accompanied by the person of your choice. Just let us know in advance so we can adjust the reservation with the maison.",
          },
          {
            q: "Can I visit the same maison twice?",
            a: "No, not for now. One visit per maison is the rule at launch, so that storytellers rotate across the addresses in the carnet. This rule may change in the future.",
          },
          {
            q: "How many maisons are available in the carnet?",
            a: "The carnet is being built with you. The exact number will be communicated at launch, or as soon as the first 15 partner maisons are signed.",
          },
          {
            q: "Can I cancel a reservation?",
            a: "Yes, up to 24 hours before the visit, with no consequence. Beyond that, the value of the credit committed to that visit is forfeited. This is out of respect for the maison's time and reserved spot.",
          },
        ],
      },
      {
        id: "creators-publication",
        title: "Publication",
        items: [
          {
            q: "Am I required to publish after a visit?",
            a: "Yes. Publication is a core part of the Curato commitment: 2 Instagram stories within 24 hours after your visit, mentioning the maison and Curato. This is the counterpart to the credit you receive.",
          },
          {
            q: "If I didn't enjoy the experience, do I still have to publish?",
            a: "Yes. The publication commitment is firm. If you experience a real problem during the visit (service, quality, safety), contact us immediately and we'll review the situation case by case. But not publishing simply because you weren't in the mood isn't an option.",
          },
          {
            q: "Who owns the content I publish?",
            a: "The content belongs to you. You simply grant Curato and the maison involved an exclusive usage license for 90 days from the date of publication.",
          },
          {
            q: "What happens after the 90 days?",
            a: "Beyond that period, you regain full usage rights. You can republish, reuse, or remove the content as you wish.",
          },
          {
            q: "Is this compliant with French influencer law?",
            a: "Yes. Any content published as part of Curato falls under the French law of 9 June 2023 and must carry the « Collaboration commerciale » disclosure. We support you in complying strictly with this legal framework.",
          },
        ],
      },
      {
        id: "creators-account",
        title: "The account",
        items: [
          {
            q: "Can I work with other brands in parallel?",
            a: "Yes, with no restriction on brands outside Curato. However, if you work with a maison that is already in the Curato carnet, the collaboration must go through Curato and must mention our platform.",
          },
          {
            q: "Can I leave Curato at any time?",
            a: "Yes, at any time, with no minimum commitment. Note: if you benefit from the first-wave offer (lifetime doubled credit), it is forfeited when you close the account and cannot be reactivated if you return later.",
          },
        ],
      },
    ],
  },

  maisons: {
    audienceLabel: "Maisons",
    audienceTitle: "For maisons",
    audienceIntro:
      "You're a maison, a restaurant, a spa, a hotel or an institute. Here are the answers to the questions owners ask most often before joining Curato.",
    sections: [
      {
        id: "houses-model",
        title: "The model",
        items: [
          {
            q: "How much does Curato cost for my maison?",
            a: "Curato operates on an annual or monthly subscription model. The pricing grid is shared during a first conversation, so we can adapt it to the reality of your maison. Write to us to receive it.",
          },
          {
            q: "How does Curato make money?",
            a: "Solely through the subscription paid by partner maisons. No intermediation fee is charged on individual visits: what the maison offers the storyteller stays fully between the maison and the storyteller.",
          },
          {
            q: "How do storytellers pay for their visit?",
            a: "You set the offer you wish to extend to storytellers freely, expressed in euros (for example: €150 at a restaurant, €300 for a hotel night, €250 for a treatment). The storyteller uses their Curato credit to cover this offer. If the bill exceeds the agreed offer, the storyteller settles the difference directly.",
          },
          {
            q: "Is Curato viable for a small business?",
            a: "Yes. Because you set the offer freely, a smaller maison can propose an experience tailored to its margins. As long as the editorial quality and aesthetic are there, your maison has its place in the carnet.",
          },
          {
            q: "How is this different from a traditional press list?",
            a: "A traditional press list depends on your team and continuous outreach work. Curato manages a circle of hand-picked storytellers committed to publishing (2 stories per visit, mandatory mention) for you, with a guaranteed minimum of visits each month and 90 days of exclusive usage rights on the content produced.",
          },
          {
            q: "What's the return on investment compared to a classic sponsored campaign?",
            a: "A sponsored campaign costs you per publication, with often short-lived content. Curato offers you a steady flow of authentic content (minimum 5 visits per month, 90 days of exclusive usage rights) at a fixed and predictable subscription cost, with no per-visit intermediation fee.",
          },
        ],
      },
      {
        id: "houses-visits",
        title: "The visits",
        items: [
          {
            q: "Who picks my maison?",
            a: "The storyteller picks freely, browsing the Curato carnet. There is no algorithmic assignment: your maison is selected by editorial affinity.",
          },
          {
            q: "How many visits per month am I guaranteed?",
            a: "Curato guarantees a minimum of 5 storyteller visits per month. If that threshold isn't met in a given month, the following month is offered to you free of charge. If three consecutive months go by without reaching 5 visits, it means your maison isn't generating interest from storytellers and your participation in the program ends.",
          },
          {
            q: "Can I refuse a specific storyteller?",
            a: "At launch, no. The storyteller picks freely the maison they wish to visit and maisons cannot refuse a specific storyteller. This flexibility will be evaluated based on maison feedback once the program is up and running.",
          },
          {
            q: "Can I limit the days or times of Curato visits?",
            a: "Yes. Each maison defines its own slots for Curato visits. For example, you can accept visits only on weekdays, exclude lunch service, or cap the number of visits per week.",
          },
          {
            q: "When can I expect my first visit?",
            a: "Once your maison is registered and published in the carnet, the first visits are typically scheduled within 2 to 4 weeks, depending on storyteller interest in your world.",
          },
          {
            q: "How do you verify storyteller authenticity?",
            a: "Each storyteller is verified through a secure third-party platform that authenticates their Instagram account and statistics. We screen out accounts with artificial audiences before they even join the circle.",
          },
        ],
      },
      {
        id: "houses-content",
        title: "Content and platform",
        items: [
          {
            q: "What are storytellers required to publish?",
            a: "At minimum, 2 Instagram stories within 24 hours after the visit, mentioning your maison and Curato, with the « Collaboration commerciale » tag required by French law. You then benefit from 90 days of exclusive usage rights on this content.",
          },
          {
            q: "What if a storyteller doesn't show up or publishes negative content?",
            a: "The content published is evaluated case by case, but the publication obligation remains firm. In the event of a no-show, inappropriate behavior or clearly problematic content, contact us immediately: the situation is handled directly with the storyteller concerned, and the visit can be recounted if the storyteller is at fault.",
          },
          {
            q: "Is there a dashboard for maisons?",
            a: "A dedicated space for maisons is currently being built. It will allow you to see your upcoming visits, the content published and your statistics. The release timeline will be communicated to you.",
          },
          {
            q: "Can I offer exclusive experiences to Curato storytellers?",
            a: "Yes, at your initiative. You're free to design experiences specifically reserved for Curato storytellers (signature menu, privileged access, private event), as long as they fit the editorial spirit of the program.",
          },
        ],
      },
      {
        id: "houses-engagement",
        title: "Commitment and legal framework",
        items: [
          {
            q: "What is the minimum commitment?",
            a: "The subscription runs on a monthly or annual basis depending on the formula chosen. If your maison does not receive the 5 visits per month for 3 consecutive months, the program ends from our side.",
          },
          {
            q: "What categories are accepted?",
            a: "Curato currently covers four universes: Gastronomy, Wellness, Hospitality and Mindfulness (beauty, care). New categories may be added over time as the program evolves.",
          },
          {
            q: "Who is liable if a storyteller has an accident in my establishment?",
            a: "The storyteller visits your maison as any other guest. Your professional civil liability applies under the same usual conditions. Curato does not alter your legal framework or insurance coverage.",
          },
          {
            q: "Is there onboarding for my team?",
            a: "Yes. Upon signing, we provide you with an onboarding kit so your team knows how to identify and welcome a Curato visitor. A 30-minute call with our team is also offered if you'd like.",
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ESPAÑOL
// ═══════════════════════════════════════════════════════════════════════════

const es: FaqContent = {
  eyebrow: "Preguntas frecuentes",
  pageTitle: "Todo lo que quieres saber",
  pageSubtitle:
    "Respuestas claras a las preguntas que más se repiten. Si la tuya no está, escríbenos y te responderemos personalmente.",
  lastUpdatedLabel: "Última actualización",
  lastUpdated: "27 de mayo de 2026",

  tocStorytellersLabel: "Para storytellers",
  tocMaisonsLabel: "Para las casas",

  stillHaveQuestionsLabel: "¿Te queda una pregunta sin responder?",
  stillHaveQuestionsText:
    "Escríbenos directamente, te respondemos en menos de 48 horas.",
  contactCta: "Contáctanos",
  contactHref: "mailto:hello@curatocollective.com",

  storytellers: {
    audienceLabel: "Storytellers",
    audienceTitle: "Para creadores",
    audienceIntro:
      "Ya sea tras nuestra invitación o por iniciativa propia, aquí están las respuestas a las preguntas más frecuentes antes de unirte al círculo.",
    sections: [
      {
        id: "creators-credit",
        title: "El crédito",
        items: [
          {
            q: "¿Hay un mínimo de seguidores para postular?",
            a: "Sí. Para unirte a Curato, debes tener al menos 5 000 seguidores en Instagram. El crédito mensual se calibra después según tu audiencia y engagement, y el monto exacto se comunica al momento de la inscripción.",
          },
          {
            q: "¿Tengo que pagar algo para participar?",
            a: "No. Para los storytellers, Curato es totalmente gratuito. Cada mes recibes un crédito en euros para usar en las casas seleccionadas, sin ninguna contrapartida financiera de tu parte.",
          },
          {
            q: "¿Qué pasa si la cuenta supera mi crédito?",
            a: "Pagas la diferencia directamente a la casa. Mantienes la libertad de disfrutar una experiencia más amplia de lo que cubre tu crédito, sabiendo que el complemento corre por tu cuenta.",
          },
          {
            q: "¿Cuándo se renueva mi crédito?",
            a: "El primer día de cada mes. El contador se reinicia en esa fecha.",
          },
          {
            q: "¿Puedo acumular mi crédito si no lo uso?",
            a: "Sí, parcialmente. Un crédito no utilizado puede acumularse hasta el final del segundo mes. Más allá, se pierde. Para mantener tu cuenta activa en el programa, debes usar al menos el 60 % de tu crédito mensual cada mes.",
          },
        ],
      },
      {
        id: "creators-visits",
        title: "Las visitas",
        items: [
          {
            q: "¿Cómo reservo en una casa Curato?",
            a: "La reserva se hace a través de la plataforma Curato. Los detalles exactos del flujo se están finalizando y se comunicarán al lanzamiento.",
          },
          {
            q: "¿Puedo ir acompañada?",
            a: "Sí. Puedes venir acompañada de la persona que quieras. Solo hay que avisarnos con antelación para que podamos ajustar la reserva con la casa.",
          },
          {
            q: "¿Puedo visitar dos veces la misma casa?",
            a: "No, por ahora no. Una visita por casa es la regla al lanzamiento, para permitir la rotación entre las distintas direcciones del carnet. Esta regla podrá evolucionar más adelante.",
          },
          {
            q: "¿Cuántas casas hay disponibles en el carnet?",
            a: "El carnet se construye contigo. El número exacto de direcciones se comunicará al lanzamiento, o en cuanto las primeras 15 casas socias estén firmadas.",
          },
          {
            q: "¿Puedo cancelar una reserva?",
            a: "Sí, hasta 24 horas antes de la visita, sin consecuencia. Pasado ese plazo, el valor del crédito comprometido en esa visita se pierde. Es por respeto al tiempo y al lugar reservado por la casa.",
          },
        ],
      },
      {
        id: "creators-publication",
        title: "La publicación",
        items: [
          {
            q: "¿Es obligatorio publicar después de una visita?",
            a: "Sí. La publicación forma parte integral del compromiso Curato: 2 stories de Instagram en las 24 horas siguientes a la visita, con mención de la casa y de Curato. Es la contrapartida del crédito que recibes.",
          },
          {
            q: "Si la experiencia no me gusta, ¿debo publicar igual?",
            a: "Sí. El compromiso de publicación es firme. Si encuentras un problema real durante la visita (servicio, calidad, seguridad), contáctanos de inmediato y estudiamos la situación caso por caso. Pero no publicar simplemente por falta de ganas no es una opción.",
          },
          {
            q: "¿De quién es el contenido que publico?",
            a: "El contenido te pertenece. Simplemente otorgas a Curato y a la casa correspondiente una licencia exclusiva de uso durante 90 días desde la fecha de publicación.",
          },
          {
            q: "¿Qué pasa después de los 90 días?",
            a: "Pasado ese periodo, recuperas la plena libertad de uso. Puedes republicar, reutilizar o eliminar el contenido como te parezca.",
          },
          {
            q: "¿Es conforme a la ley francesa sobre influencia?",
            a: "Sí. Todo contenido publicado en el marco de Curato se rige por la ley del 9 de junio de 2023 y debe incluir la mención « Collaboration commerciale ». Te acompañamos para respetar estrictamente este marco legal.",
          },
        ],
      },
      {
        id: "creators-account",
        title: "La cuenta",
        items: [
          {
            q: "¿Puedo trabajar con otras marcas en paralelo?",
            a: "Sí, sin restricción para marcas ajenas a Curato. Sin embargo, si trabajas con una casa que ya figura en el carnet Curato, la colaboración debe pasar por Curato y mencionar nuestra plataforma.",
          },
          {
            q: "¿Puedo dejar Curato cuando quiera?",
            a: "Sí, en cualquier momento, sin compromiso de duración. Atención: si te beneficias de la oferta primera ola (crédito doblado de por vida), se pierde al cerrar la cuenta y no podrá reactivarse si vuelves más adelante.",
          },
        ],
      },
    ],
  },

  maisons: {
    audienceLabel: "Casas",
    audienceTitle: "Para las casas",
    audienceIntro:
      "Eres una casa, un restaurante, un spa, un hotel o un instituto. Aquí están las respuestas a las preguntas que se hacen las propietarias antes de unirse a Curato.",
    sections: [
      {
        id: "houses-model",
        title: "El modelo",
        items: [
          {
            q: "¿Cuánto cuesta Curato para mi casa?",
            a: "Curato funciona con un modelo de suscripción anual o mensual. La tabla de tarifas se comparte en una primera conversación, para poder adaptarla a la realidad de tu casa. Escríbenos para recibirla.",
          },
          {
            q: "¿Cómo se monetiza Curato?",
            a: "Únicamente a través de la suscripción que pagan las casas socias. No se cobra ninguna comisión por visita individual: lo que la casa ofrece al storyteller queda íntegramente entre la casa y el storyteller.",
          },
          {
            q: "¿Cómo pagan los storytellers su visita?",
            a: "Tú fijas libremente la oferta que quieres proponer a los storytellers, expresada en euros (por ejemplo: 150 € en un restaurante, 300 € por una noche de hotel, 250 € por un tratamiento). El storyteller usa su crédito Curato para cubrir esa oferta. Si la cuenta supera la oferta acordada, el storyteller paga la diferencia directamente.",
          },
          {
            q: "¿Es viable Curato para un pequeño comercio?",
            a: "Sí. Como tú fijas libremente tu oferta, una casa más modesta puede proponer una experiencia adaptada a su margen. Mientras la calidad editorial y la estética estén ahí, tu casa tiene su sitio en el carnet.",
          },
          {
            q: "¿Cuál es la diferencia con una press list tradicional?",
            a: "Una press list tradicional depende de tu equipo y de un trabajo de seguimiento continuo. Curato gestiona por ti un círculo de storytellers seleccionados a mano y comprometidos a publicar (2 stories por visita, mención obligatoria), con un mínimo de visitas garantizado cada mes y 90 días de derechos de uso exclusivos sobre el contenido producido.",
          },
          {
            q: "¿Cuál es el retorno sobre la inversión frente a una campaña patrocinada clásica?",
            a: "Una campaña patrocinada te cuesta por publicación, con un contenido a menudo efímero. Curato te ofrece un flujo regular de contenido auténtico (mínimo 5 visitas al mes, 90 días de derechos de uso exclusivos) a un coste de suscripción fijo y previsible, sin comisiones por visita.",
          },
        ],
      },
      {
        id: "houses-visits",
        title: "Las visitas",
        items: [
          {
            q: "¿Quién elige mi casa?",
            a: "El storyteller elige libremente, recorriendo el carnet Curato. No hay asignación algorítmica: tu casa se selecciona por afinidad editorial.",
          },
          {
            q: "¿Cuántas visitas al mes tengo garantizadas?",
            a: "Curato te garantiza un mínimo de 5 visitas de storytellers al mes. Si ese umbral no se alcanza un mes dado, el mes siguiente te lo regalamos. Si pasan tres meses consecutivos sin alcanzar las 5 visitas, significa que tu casa no genera interés entre los storytellers y tu participación en el programa termina.",
          },
          {
            q: "¿Puedo rechazar a un storyteller en particular?",
            a: "Al lanzamiento, no. El storyteller elige libremente la casa que desea visitar y las casas no pueden rechazar a un storyteller concreto. Esta flexibilidad se evaluará según los comentarios de las casas una vez que el programa esté rodado.",
          },
          {
            q: "¿Puedo limitar los días u horarios de las visitas Curato?",
            a: "Sí. Cada casa define sus propios horarios para las visitas Curato. Por ejemplo, puedes aceptar visitas solo entre semana, excluir el servicio del mediodía, o limitar el número de visitas semanales.",
          },
          {
            q: "¿Cuándo puedo esperar mi primera visita?",
            a: "Una vez tu casa esté inscrita y publicada en el carnet, las primeras visitas suelen planificarse entre 2 y 4 semanas, según el interés de los storytellers por tu universo.",
          },
          {
            q: "¿Cómo verificáis la autenticidad de los storytellers?",
            a: "Cada storyteller se verifica a través de una plataforma tercera segura que autentifica su cuenta de Instagram y sus estadísticas. Descartamos las cuentas con audiencias artificiales antes incluso de que se unan al círculo.",
          },
        ],
      },
      {
        id: "houses-content",
        title: "El contenido y la plataforma",
        items: [
          {
            q: "¿A qué están obligados a publicar los storytellers?",
            a: "Como mínimo 2 stories de Instagram en las 24 horas siguientes a la visita, con mención de tu casa y de Curato, y la etiqueta « Collaboration commerciale » exigida por la ley francesa. Después dispones de 90 días de derechos exclusivos de uso sobre ese contenido.",
          },
          {
            q: "¿Qué pasa si un storyteller no se presenta o publica contenido negativo?",
            a: "El contenido publicado se evalúa caso por caso, pero la obligación de publicación se mantiene firme. En caso de no-show, comportamiento inadecuado o contenido manifiestamente problemático, contáctanos de inmediato: la situación se gestiona directamente con el storyteller, y la visita puede recontarse si la responsabilidad es del storyteller.",
          },
          {
            q: "¿Hay un panel de control para las casas?",
            a: "Un espacio dedicado a las casas se está construyendo actualmente. Te permitirá visualizar tus próximas visitas, el contenido publicado y tus estadísticas. El calendario de disponibilidad se te comunicará.",
          },
          {
            q: "¿Puedo ofrecer experiencias exclusivas a los storytellers Curato?",
            a: "Sí, por iniciativa tuya. Eres libre de diseñar experiencias específicamente reservadas a los storytellers Curato (menú firma, acceso privilegiado, evento privado), mientras encajen en el espíritu editorial del programa.",
          },
        ],
      },
      {
        id: "houses-engagement",
        title: "Compromiso y marco legal",
        items: [
          {
            q: "¿Cuál es el compromiso mínimo?",
            a: "La suscripción se contrata por duración mensual o anual según la fórmula elegida. Si tu casa no recibe las 5 visitas al mes durante 3 meses consecutivos, el programa termina por nuestra parte.",
          },
          {
            q: "¿Qué categorías se aceptan?",
            a: "Curato cubre actualmente cuatro universos: Gastronomía, Bienestar, Hostelería y Conciencia (belleza, cuidado). Podrán añadirse nuevas categorías más adelante según la evolución del programa.",
          },
          {
            q: "¿Quién es responsable si un storyteller sufre un accidente en mi establecimiento?",
            a: "El storyteller visita tu casa como cualquier otro cliente. Tu responsabilidad civil profesional se aplica en las mismas condiciones habituales. Curato no altera tu marco legal ni tu cobertura de seguro.",
          },
          {
            q: "¿Hay onboarding para mi equipo?",
            a: "Sí. A la firma, te facilitamos un kit de onboarding para que tu equipo sepa identificar y recibir a un visitante Curato. También se ofrece una llamada de 30 minutos con nuestro equipo si lo deseas.",
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const faqContent: Record<Lang, FaqContent> = { fr, en, es };

// ─────────────────────────────────────────────────────────────────────────────
// Privacy Policy content — FR/EN/ES
//
// Legally binding version: FR (Curato Collective SAS is/will be a French entity).
// EN/ES are courtesy translations.
//
// DRAFT — pending review by a RGPD-qualified lawyer before publication.
// Once Curato Collective SAS is registered, replace [SIRET], [RCS], and
// [DOMICILIATION_ADDRESS] placeholders with the values on the KBis.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./translations";

type Block = string | { list: string[] };

type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

type PrivacyContent = {
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
const HOST = "Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis";

// ─── FRENCH (legally binding) ───────────────────────────────────────────────

const fr: PrivacyContent = {
  pageTitle: "Politique de confidentialité",
  eyebrow: "Curato · Confidentialité",
  lastUpdatedLabel: "Dernière mise à jour",
  lastUpdated: "22 mai 2026",
  draftNoticeTitle: "Document de travail",
  draftNoticeBody:
    "La présente politique est un projet en cours de finalisation. Elle sera mise à jour à l'issue de l'immatriculation de Curato Collective SAS et de sa revue par un conseil juridique spécialisé en RGPD. Les mentions [entre crochets] sont des champs en attente.",
  tocTitle: "Sommaire",
  sections: [
    {
      id: "preambule",
      title: "1. Préambule",
      blocks: [
        `La présente politique de confidentialité décrit la manière dont ${COMPANY} (${STATUS_FR}), ci-après « Curato », collecte, utilise, conserve et protège les données personnelles des utilisateurs du site curatocollective.com et de ses services associés.`,
        "Curato est un écosystème trié à la main qui met en relation des créateurs de contenu et des maisons d'exception à Paris (restaurants, sanctuaires de beauté, retraites de bien-être, hôtels boutique). Les créateurs reçoivent un crédit mensuel en euros pour découvrir ces lieux ; les maisons accueillent des visiteurs qui les ont sincèrement choisis et reçoivent en retour un contenu éditorial publié sur les réseaux sociaux des créateurs, accompagné de 90 jours de droits d'utilisation exclusifs.",
        "Cette politique s'applique à toute personne qui visite le site, soumet une candidature, s'inscrit à un évènement, crée un compte (créateur ou maison) ou interagit avec le service de quelque manière que ce soit.",
        "En utilisant le service, vous reconnaissez avoir pris connaissance de la présente politique. Le consentement explicite à certains traitements (notamment les réponses au questionnaire d'onboarding) est recueilli séparément via une case à cocher dédiée.",
      ],
    },
    {
      id: "responsable",
      title: "2. Identité du responsable de traitement",
      blocks: [
        "Le responsable de traitement au sens du Règlement Général sur la Protection des Données (RGPD) est :",
        {
          list: [
            `Dénomination sociale : ${COMPANY} (${STATUS_FR})`,
            `Forme juridique : Société par actions simplifiée (SAS)`,
            `Siège social : ${ADDRESS}`,
            `SIRET : ${SIRET}`,
            `RCS : ${RCS}`,
            `Directrice de la publication : ${DIRECTOR}`,
            `Contact (toutes demandes RGPD) : ${CONTACT_EMAIL}`,
          ],
        },
        "Curato n'est pas tenue, à ce jour, de désigner un Délégué à la Protection des Données (DPO) au sens de l'article 37 du RGPD. Toute demande relative à vos données personnelles peut être adressée à l'adresse électronique indiquée ci-dessus.",
        `Hébergeur du site : ${HOST}.`,
      ],
    },
    {
      id: "donnees",
      title: "3. Données collectées",
      blocks: [
        "Curato collecte uniquement les données strictement nécessaires aux finalités décrites à la section 4. La nature des données collectées varie selon le point de contact :",
        {
          list: [
            "Candidature (créateur ou maison) : nom, adresse électronique, identifiant Instagram, site internet (facultatif), motivation libre.",
            "Inscription à l'évènement de lancement : nom complet, adresse électronique, numéro WhatsApp, profil déclaré, identifiant Instagram (facultatif).",
            "Questionnaire d'onboarding : réponses aux questions de préférences (centres d'intérêt, sensibilités, type de contenu produit). Le consentement est recueilli explicitement avant soumission.",
            "Compte utilisateur : adresse électronique et mot de passe (stocké sous forme hachée par notre prestataire d'authentification).",
            "Profil créateur : nombre d'abonnés, crédit mensuel alloué, historique des visites.",
            "Contenu de visite : photos et vidéos téléversées par les créateurs comme preuve de visite ; ces contenus sont visibles par la maison concernée et par l'équipe Curato.",
            "Données techniques : journaux de connexion, identifiants de session, adresse IP, type de navigateur, dates et heures d'accès, à des fins de sécurité et de bon fonctionnement du service.",
          ],
        },
        "Curato ne collecte aucune donnée sensible au sens de l'article 9 du RGPD (origine, opinions, santé, orientation sexuelle, etc.). Aucune donnée bancaire n'est collectée ni stockée : le crédit mensuel est pré-alloué par Curato et ne donne pas lieu à un paiement par l'utilisateur.",
      ],
    },
    {
      id: "finalites",
      title: "4. Finalités et bases légales",
      blocks: [
        "Chaque traitement de données personnelles repose sur une base légale conforme à l'article 6 du RGPD :",
        {
          list: [
            "Gestion de la candidature et du compte utilisateur — exécution du contrat (art. 6.1.b).",
            "Mise en relation entre créateurs et maisons (matching) — exécution du contrat (art. 6.1.b).",
            "Recommandations personnalisées à partir du questionnaire d'onboarding — consentement explicite (art. 6.1.a), recueilli via case à cocher dédiée.",
            "Envoi d'emails transactionnels (confirmation, bienvenue, réinitialisation de mot de passe) — exécution du contrat (art. 6.1.b).",
            "Réponses aux messages adressés à hello@curatocollective.com — intérêt légitime (art. 6.1.f).",
            "Inscription et confirmation à l'évènement de lancement — consentement (art. 6.1.a).",
            "Vérification automatique des publications de visite via notre prestataire d'analyse de réseaux sociaux — exécution du contrat (art. 6.1.b), précédée d'un consentement explicite lors de la connexion du compte Instagram.",
            "Sécurité du service et prévention des abus — intérêt légitime (art. 6.1.f).",
            "Respect des obligations légales (comptabilité, demandes des autorités) — obligation légale (art. 6.1.c).",
          ],
        },
        "Vous pouvez à tout moment retirer votre consentement aux traitements qui en dépendent, sans que cela n'affecte la licéité des traitements antérieurs. Le retrait du consentement au questionnaire d'onboarding peut entraîner l'impossibilité de recevoir des recommandations personnalisées.",
      ],
    },
    {
      id: "destinataires",
      title: "5. Destinataires et sous-traitants",
      blocks: [
        "Vos données ne sont jamais vendues. Elles sont accessibles uniquement aux personnes habilitées au sein de Curato et aux prestataires techniques (sous-traitants au sens de l'article 28 du RGPD) listés ci-dessous, dont l'intervention est strictement nécessaire au fonctionnement du service :",
        {
          list: [
            "Supabase (Supabase Inc.) — hébergement de la base de données et service d'authentification. Données traitées : toutes les données utilisateur. Région de traitement : Union européenne.",
            "Vercel (Vercel Inc.) — hébergement du site et des fonctions serveur. Données traitées : journaux techniques, requêtes HTTP. Localisation : États-Unis et Union européenne (selon la région d'exécution).",
            "Resend (Resend Inc.) — envoi des emails transactionnels. Données traitées : adresse électronique, nom, contenu de l'email. Localisation : États-Unis.",
            "Phyllo (Phyllo Inc.) — analyse des publications publiques sur Instagram pour vérifier automatiquement la réalité d'une visite et associer le contenu publié à la maison concernée. Données traitées : identifiant Instagram, identifiant interne créateur, métadonnées des publications publiques. Localisation : États-Unis. Ce traitement n'est activé que pour les créateurs qui connectent volontairement leur compte Instagram, après consentement explicite.",
          ],
        },
        "Chaque sous-traitant est lié à Curato par un contrat (Data Processing Agreement) imposant des garanties équivalentes à celles de la présente politique. La liste des sous-traitants peut évoluer ; toute modification substantielle sera reflétée dans cette politique.",
      ],
    },
    {
      id: "visibilite",
      title: "6. Visibilité des données entre utilisateurs",
      blocks: [
        "Le modèle de Curato repose sur la transparence des relations entre créateurs et maisons. Cette section précise ce qui est visible par qui :",
        {
          list: [
            "Une maison voit, pour chaque visite : le nom du créateur, son identifiant Instagram (avec lien public), son nombre d'abonnés, son adresse électronique de contact, et le contenu (photos et vidéos) qu'il téléverse à l'issue de la visite.",
            "Un créateur voit, pour chaque offre : le nom de la maison, son adresse, sa catégorie et la valeur du crédit accordé. Les coordonnées privées de la maison (adresse électronique du contact, numéro privé) ne sont pas exposées.",
            "Les réponses au questionnaire d'onboarding ne sont jamais partagées avec les maisons. Elles servent uniquement à l'algorithme interne de matching et à l'équipe Curato.",
            "L'équipe Curato (administrateurs) a accès à l'ensemble des données aux seules fins de fonctionnement et de support du service.",
          ],
        },
      ],
    },
    {
      id: "conservation",
      title: "7. Durées de conservation",
      blocks: [
        "Vos données sont conservées pour la durée strictement nécessaire à la finalité du traitement :",
        {
          list: [
            "Comptes actifs : pendant toute la durée de la relation, puis 12 mois après la clôture du compte.",
            "Candidatures non retenues : 12 mois à compter de la décision (pour permettre une éventuelle re-candidature).",
            "Inscriptions à l'évènement de lancement : jusqu'à 6 mois après la tenue de l'évènement.",
            "Contenu de visite (photos, vidéos) : tant que le compte du créateur est actif ; la maison bénéficie en parallèle de 90 jours de droits d'utilisation exclusifs à compter de la date de visite, conformément aux conditions générales.",
            "Journaux techniques et données d'authentification : 12 mois.",
            "Documents comptables et de facturation (le cas échéant) : 10 ans, conformément à l'article L. 123-22 du Code de commerce.",
          ],
        },
        "À l'issue de ces durées, les données sont supprimées ou anonymisées de manière irréversible.",
      ],
    },
    {
      id: "droits",
      title: "8. Vos droits",
      blocks: [
        "Conformément au RGPD et à la loi française « Informatique et Libertés », vous disposez des droits suivants sur vos données personnelles :",
        {
          list: [
            "Droit d'accès : obtenir confirmation que vos données sont traitées et en recevoir copie (art. 15).",
            "Droit de rectification : corriger des données inexactes ou incomplètes (art. 16).",
            "Droit à l'effacement (« droit à l'oubli ») : demander la suppression de vos données dans les conditions prévues (art. 17).",
            "Droit à la limitation du traitement (art. 18).",
            "Droit à la portabilité : recevoir vos données dans un format structuré et lisible par machine (art. 20).",
            "Droit d'opposition : vous opposer à un traitement fondé sur l'intérêt légitime (art. 21).",
            "Droit de retirer votre consentement à tout moment, pour les traitements qui en dépendent (art. 7.3).",
            "Droit de définir des directives relatives au sort de vos données après votre décès (art. 85 de la loi Informatique et Libertés).",
          ],
        },
        `Pour exercer ces droits, adressez votre demande à ${CONTACT_EMAIL} en précisant l'objet de votre demande. Une réponse vous sera apportée dans un délai d'un mois, pouvant être prolongé de deux mois en cas de complexité, conformément à l'article 12 du RGPD.`,
        "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.",
      ],
    },
    {
      id: "securite",
      title: "9. Sécurité",
      blocks: [
        "Curato met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre toute destruction, perte, altération, divulgation ou accès non autorisés.",
        {
          list: [
            "Chiffrement des communications via HTTPS (TLS).",
            "Mots de passe stockés sous forme hachée par notre prestataire d'authentification (jamais en clair).",
            "Contrôle d'accès à la base de données par règles de sécurité au niveau ligne (Row Level Security).",
            "Accès administratif restreint aux seules personnes habilitées au sein de l'équipe Curato.",
            "Sélection rigoureuse des sous-traitants et conclusion de contrats de traitement.",
          ],
        },
        "Aucun système n'est infaillible. En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, Curato notifiera la CNIL dans un délai de 72 heures et, le cas échéant, les personnes concernées, conformément aux articles 33 et 34 du RGPD.",
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies et stockage local",
      blocks: [
        "Le site curatocollective.com n'utilise pas de cookies à des fins de mesure d'audience, de publicité ou de profilage. Seuls les éléments suivants sont déposés :",
        {
          list: [
            "Cookies de session (strictement nécessaires) : déposés par notre prestataire d'authentification Supabase pour vous maintenir connecté. Leur dépôt ne requiert pas votre consentement préalable (art. 82 de la loi Informatique et Libertés).",
            "Stockage local (localStorage) : utilisé pour mémoriser votre préférence de langue (FR / EN / ES). Aucune donnée personnelle n'y est inscrite.",
          ],
        },
        "Si Curato venait à intégrer ultérieurement des outils de mesure d'audience ou de tracking, un bandeau de consentement conforme aux recommandations de la CNIL serait mis en place et la présente politique mise à jour.",
      ],
    },
    {
      id: "mineurs",
      title: "11. Mineurs",
      blocks: [
        "Le service Curato est strictement réservé aux personnes majeures (18 ans révolus). La création d'un compte ou la soumission d'une candidature suppose que vous attestez avoir atteint cet âge.",
        "Si nous apprenions qu'un compte appartient à une personne mineure, ce compte serait clôturé et les données associées supprimées dans les meilleurs délais.",
      ],
    },
    {
      id: "transferts",
      title: "12. Transferts hors Union européenne",
      blocks: [
        "Certains de nos sous-traitants (Vercel, Resend, Phyllo) sont établis aux États-Unis. Les transferts de données hors UE sont encadrés par les garanties prévues par le RGPD :",
        {
          list: [
            "Adhésion au cadre Data Privacy Framework (DPF) lorsque le prestataire y est certifié, ou",
            "Conclusion des clauses contractuelles types adoptées par la Commission européenne (décision 2021/914).",
          ],
        },
        "Une copie des garanties applicables peut être obtenue sur demande à l'adresse indiquée à la section 2.",
      ],
    },
    {
      id: "modifications",
      title: "13. Modifications de la politique",
      blocks: [
        "Curato peut modifier la présente politique pour refléter une évolution du service, des sous-traitants ou de la réglementation applicable. La date de dernière mise à jour figure en haut du document.",
        "En cas de modification substantielle (nouvelle finalité, nouveau sous-traitant impactant vos droits), vous serez informé par email ou par un message visible lors de votre prochaine connexion.",
      ],
    },
    {
      id: "loi",
      title: "14. Loi applicable et juridiction",
      blocks: [
        "La présente politique est régie par le droit français. Tout litige relatif à son interprétation ou à son exécution relève de la compétence des tribunaux du ressort de la Cour d'appel de Paris, sous réserve des règles impératives de protection des consommateurs.",
        "En cas de divergence entre la version française et toute traduction (anglais, espagnol), la version française fait foi.",
      ],
    },
  ],
};

// ─── ENGLISH (courtesy translation) ─────────────────────────────────────────

const en: PrivacyContent = {
  pageTitle: "Privacy Policy",
  eyebrow: "Curato · Privacy",
  lastUpdatedLabel: "Last updated",
  lastUpdated: "May 22, 2026",
  draftNoticeTitle: "Working draft",
  draftNoticeBody:
    "This policy is a draft pending finalisation. It will be updated once Curato Collective SAS is registered and after review by a GDPR-qualified legal counsel. Fields in [brackets] are placeholders. The French version is the legally binding one.",
  tocTitle: "Contents",
  sections: [
    {
      id: "preambule",
      title: "1. Preamble",
      blocks: [
        `This privacy policy describes how ${COMPANY} (${STATUS_EN}), hereinafter "Curato", collects, uses, retains and protects the personal data of users of the curatocollective.com website and its related services.`,
        "Curato is a curated ecosystem that connects content creators with exceptional houses in Paris (restaurants, beauty sanctuaries, wellness retreats, boutique hotels). Creators receive a monthly credit in euros to discover these places; houses welcome visitors who have genuinely chosen them and receive in return editorial content published on the creators' social channels, with 90 days of exclusive usage rights.",
        "This policy applies to anyone who visits the site, submits an application, registers for an event, creates an account (creator or house) or interacts with the service in any way.",
        "By using the service, you acknowledge having read this policy. Explicit consent for certain processing activities (notably the onboarding questionnaire answers) is collected separately via a dedicated checkbox.",
      ],
    },
    {
      id: "responsable",
      title: "2. Data controller",
      blocks: [
        "The data controller within the meaning of the General Data Protection Regulation (GDPR) is:",
        {
          list: [
            `Company name: ${COMPANY} (${STATUS_EN})`,
            `Legal form: Société par actions simplifiée (SAS) — French simplified joint-stock company`,
            `Registered address: ${ADDRESS}`,
            `SIRET: ${SIRET}`,
            `RCS: ${RCS}`,
            `Publishing director: ${DIRECTOR}`,
            `Contact (all GDPR requests): ${CONTACT_EMAIL}`,
          ],
        },
        "Curato is not required, at this stage, to appoint a Data Protection Officer (DPO) under Article 37 GDPR. Any request relating to your personal data can be addressed to the email above.",
        `Site host: ${HOST}.`,
      ],
    },
    {
      id: "donnees",
      title: "3. Data we collect",
      blocks: [
        "Curato only collects data strictly necessary for the purposes described in section 4. The data collected varies by touchpoint:",
        {
          list: [
            "Application (creator or house): name, email, Instagram handle, website (optional), free-text motivation.",
            "Launch event registration: full name, email, WhatsApp number, declared profile, Instagram handle (optional).",
            "Onboarding questionnaire: answers to preference questions (interests, sensibilities, type of content produced). Consent is collected explicitly before submission.",
            "User account: email and password (stored in hashed form by our authentication provider).",
            "Creator profile: follower count, allocated monthly credit, visit history.",
            "Visit content: photos and videos uploaded by creators as proof of visit; this content is visible to the relevant house and to the Curato team.",
            "Technical data: connection logs, session identifiers, IP address, browser type, access timestamps, for security and service operation.",
          ],
        },
        "Curato does not collect any special category data within the meaning of Article 9 GDPR (origin, opinions, health, sexual orientation, etc.). No banking data is collected or stored: the monthly credit is pre-allocated by Curato and does not involve any payment by the user.",
      ],
    },
    {
      id: "finalites",
      title: "4. Purposes and legal bases",
      blocks: [
        "Each processing activity rests on a legal basis under Article 6 GDPR:",
        {
          list: [
            "Application and account management — performance of the contract (Art. 6.1.b).",
            "Matching between creators and houses — performance of the contract (Art. 6.1.b).",
            "Personalised recommendations based on the onboarding questionnaire — explicit consent (Art. 6.1.a), collected via a dedicated checkbox.",
            "Sending transactional emails (confirmation, welcome, password reset) — performance of the contract (Art. 6.1.b).",
            "Replies to messages addressed to hello@curatocollective.com — legitimate interest (Art. 6.1.f).",
            "Launch event registration and confirmation — consent (Art. 6.1.a).",
            "Automated verification of visit content via our social-media analytics provider — performance of the contract (Art. 6.1.b), preceded by explicit consent when connecting the Instagram account.",
            "Service security and abuse prevention — legitimate interest (Art. 6.1.f).",
            "Compliance with legal obligations (accounting, authority requests) — legal obligation (Art. 6.1.c).",
          ],
        },
        "You can withdraw your consent to consent-based processing at any time, without affecting the lawfulness of prior processing. Withdrawing consent to the onboarding questionnaire may make it impossible to receive personalised recommendations.",
      ],
    },
    {
      id: "destinataires",
      title: "5. Recipients and sub-processors",
      blocks: [
        "Your data is never sold. It is only accessible to authorised personnel within Curato and to the technical providers (sub-processors under Article 28 GDPR) listed below, whose involvement is strictly necessary to operate the service:",
        {
          list: [
            "Supabase (Supabase Inc.) — database hosting and authentication service. Data processed: all user data. Processing region: European Union.",
            "Vercel (Vercel Inc.) — site and serverless function hosting. Data processed: technical logs, HTTP requests. Location: United States and European Union (depending on execution region).",
            "Resend (Resend Inc.) — transactional email delivery. Data processed: email, name, email content. Location: United States.",
            "Phyllo (Phyllo Inc.) — analysis of public Instagram posts to automatically verify the reality of a visit and link published content to the relevant house. Data processed: Instagram handle, internal creator ID, public post metadata. Location: United States. This processing is only activated for creators who voluntarily connect their Instagram account, after explicit consent.",
          ],
        },
        "Each sub-processor is bound to Curato by a Data Processing Agreement imposing safeguards equivalent to this policy. The list of sub-processors may evolve; any substantial change will be reflected here.",
      ],
    },
    {
      id: "visibilite",
      title: "6. Visibility of data between users",
      blocks: [
        "Curato's model rests on transparency in the relationship between creators and houses. This section specifies what is visible to whom:",
        {
          list: [
            "A house sees, for each visit: the creator's name, their Instagram handle (with public link), their follower count, their contact email, and the content (photos and videos) they upload after the visit.",
            "A creator sees, for each offer: the house's name, address, category and the value of the credit granted. The house's private contact details (contact email, private number) are not exposed.",
            "Onboarding questionnaire answers are never shared with houses. They are used solely by the internal matching algorithm and by the Curato team.",
            "The Curato team (administrators) has access to all data, strictly for the purposes of operating and supporting the service.",
          ],
        },
      ],
    },
    {
      id: "conservation",
      title: "7. Retention periods",
      blocks: [
        "Your data is kept for the time strictly necessary to the purpose of the processing:",
        {
          list: [
            "Active accounts: for the duration of the relationship, then 12 months after account closure.",
            "Unsuccessful applications: 12 months from the decision (to allow a possible re-application).",
            "Launch event registrations: up to 6 months after the event takes place.",
            "Visit content (photos, videos): as long as the creator's account is active; the house benefits in parallel from 90 days of exclusive usage rights from the visit date, as per the terms of service.",
            "Technical logs and authentication data: 12 months.",
            "Accounting and invoicing documents (where applicable): 10 years, as required by Article L. 123-22 of the French Commercial Code.",
          ],
        },
        "At the end of these periods, data is deleted or irreversibly anonymised.",
      ],
    },
    {
      id: "droits",
      title: "8. Your rights",
      blocks: [
        "Under the GDPR and the French Data Protection Act, you have the following rights over your personal data:",
        {
          list: [
            "Right of access: confirm that your data is being processed and obtain a copy (Art. 15).",
            "Right to rectification: correct inaccurate or incomplete data (Art. 16).",
            "Right to erasure (\"right to be forgotten\"): request the deletion of your data under the conditions set out (Art. 17).",
            "Right to restriction of processing (Art. 18).",
            "Right to portability: receive your data in a structured, machine-readable format (Art. 20).",
            "Right to object: object to processing based on legitimate interest (Art. 21).",
            "Right to withdraw consent at any time for consent-based processing (Art. 7.3).",
            "Right to issue directives regarding the fate of your data after death (Art. 85 of the French Data Protection Act).",
          ],
        },
        `To exercise these rights, send your request to ${CONTACT_EMAIL} specifying the subject of your request. A response will be provided within one month, extendable by two months in case of complexity, in accordance with Article 12 GDPR.`,
        "If, after contacting us, you believe your rights are not being respected, you may lodge a complaint with the French Data Protection Authority (CNIL): 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.",
      ],
    },
    {
      id: "securite",
      title: "9. Security",
      blocks: [
        "Curato implements appropriate technical and organisational measures to protect your data against destruction, loss, alteration, disclosure or unauthorised access.",
        {
          list: [
            "Encryption of communications via HTTPS (TLS).",
            "Passwords stored in hashed form by our authentication provider (never in plain text).",
            "Database access control via row-level security policies.",
            "Administrative access restricted to authorised members of the Curato team.",
            "Rigorous selection of sub-processors and signed Data Processing Agreements.",
          ],
        },
        "No system is infallible. In the event of a data breach likely to result in a risk to your rights and freedoms, Curato will notify the CNIL within 72 hours and, where appropriate, the affected individuals, in accordance with Articles 33 and 34 GDPR.",
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies and local storage",
      blocks: [
        "The curatocollective.com site does not use cookies for audience measurement, advertising or profiling. Only the following are placed:",
        {
          list: [
            "Session cookies (strictly necessary): placed by our authentication provider Supabase to keep you signed in. Their use does not require prior consent (Art. 82 of the French Data Protection Act).",
            "Local storage (localStorage): used to remember your language preference (FR / EN / ES). No personal data is stored there.",
          ],
        },
        "If Curato were to later integrate audience-measurement or tracking tools, a consent banner compliant with CNIL recommendations would be put in place and this policy updated accordingly.",
      ],
    },
    {
      id: "mineurs",
      title: "11. Minors",
      blocks: [
        "The Curato service is strictly reserved for adults (18 years old or older). Creating an account or submitting an application implies that you attest to having reached this age.",
        "If we learn that an account belongs to a minor, that account will be closed and the associated data deleted as soon as possible.",
      ],
    },
    {
      id: "transferts",
      title: "12. Transfers outside the European Union",
      blocks: [
        "Some of our sub-processors (Vercel, Resend, Phyllo) are established in the United States. Data transfers outside the EU are framed by the safeguards provided by the GDPR:",
        {
          list: [
            "Membership of the Data Privacy Framework (DPF) where the provider is certified, or",
            "Standard contractual clauses adopted by the European Commission (decision 2021/914).",
          ],
        },
        "A copy of the applicable safeguards can be obtained on request at the address indicated in section 2.",
      ],
    },
    {
      id: "modifications",
      title: "13. Changes to this policy",
      blocks: [
        "Curato may amend this policy to reflect changes in the service, in sub-processors or in applicable regulations. The date of the last update appears at the top of the document.",
        "In the event of a substantial change (new purpose, new sub-processor impacting your rights), you will be informed by email or by a visible message on your next sign-in.",
      ],
    },
    {
      id: "loi",
      title: "14. Governing law and jurisdiction",
      blocks: [
        "This policy is governed by French law. Any dispute relating to its interpretation or performance shall be subject to the jurisdiction of the courts within the Paris Court of Appeal, subject to mandatory consumer protection rules.",
        "In the event of any discrepancy between the French version and any translation (English, Spanish), the French version shall prevail.",
      ],
    },
  ],
};

// ─── SPANISH (courtesy translation) ─────────────────────────────────────────

const es: PrivacyContent = {
  pageTitle: "Política de Privacidad",
  eyebrow: "Curato · Privacidad",
  lastUpdatedLabel: "Última actualización",
  lastUpdated: "22 de mayo de 2026",
  draftNoticeTitle: "Borrador",
  draftNoticeBody:
    "Esta política es un borrador pendiente de finalización. Se actualizará una vez constituida Curato Collective SAS y tras la revisión por un abogado especializado en RGPD. Los campos entre [corchetes] son marcadores. La versión francesa es la jurídicamente vinculante.",
  tocTitle: "Índice",
  sections: [
    {
      id: "preambule",
      title: "1. Preámbulo",
      blocks: [
        `La presente política de privacidad describe la manera en que ${COMPANY} (${STATUS_ES}), en adelante «Curato», recoge, utiliza, conserva y protege los datos personales de los usuarios del sitio curatocollective.com y de sus servicios asociados.`,
        "Curato es un ecosistema curado que pone en contacto a creadores de contenido con maisons de excepción en París (restaurantes, santuarios de belleza, retiros de bienestar, hoteles boutique). Los creadores reciben un crédito mensual en euros para descubrir estos lugares; las maisons reciben a visitantes que las han elegido sinceramente y obtienen a cambio contenido editorial publicado en las redes sociales de los creadores, con 90 días de derechos de uso exclusivos.",
        "Esta política se aplica a toda persona que visite el sitio, presente una candidatura, se inscriba a un evento, cree una cuenta (creador o maison) o interactúe con el servicio de cualquier manera.",
        "Al usar el servicio, reconoces haber leído esta política. El consentimiento explícito a ciertos tratamientos (en particular las respuestas al cuestionario de onboarding) se recoge por separado mediante una casilla dedicada.",
      ],
    },
    {
      id: "responsable",
      title: "2. Responsable del tratamiento",
      blocks: [
        "El responsable del tratamiento en el sentido del Reglamento General de Protección de Datos (RGPD) es:",
        {
          list: [
            `Denominación social: ${COMPANY} (${STATUS_ES})`,
            `Forma jurídica: Société par actions simplifiée (SAS) — sociedad francesa por acciones simplificada`,
            `Domicilio social: ${ADDRESS}`,
            `SIRET: ${SIRET}`,
            `RCS: ${RCS}`,
            `Directora de publicación: ${DIRECTOR}`,
            `Contacto (todas las solicitudes RGPD): ${CONTACT_EMAIL}`,
          ],
        },
        "Curato no está obligada, en esta fase, a designar un Delegado de Protección de Datos (DPO) en virtud del artículo 37 del RGPD. Cualquier solicitud relativa a tus datos personales puede dirigirse al correo electrónico indicado.",
        `Alojamiento del sitio: ${HOST}.`,
      ],
    },
    {
      id: "donnees",
      title: "3. Datos que recogemos",
      blocks: [
        "Curato solo recoge los datos estrictamente necesarios para las finalidades descritas en la sección 4. Los datos recogidos varían según el punto de contacto:",
        {
          list: [
            "Candidatura (creador o maison): nombre, correo electrónico, identificador de Instagram, sitio web (opcional), motivación en texto libre.",
            "Inscripción al evento de lanzamiento: nombre completo, correo electrónico, número de WhatsApp, perfil declarado, identificador de Instagram (opcional).",
            "Cuestionario de onboarding: respuestas a preguntas de preferencias (intereses, sensibilidades, tipo de contenido producido). El consentimiento se recoge explícitamente antes del envío.",
            "Cuenta de usuario: correo electrónico y contraseña (almacenada en forma hash por nuestro proveedor de autenticación).",
            "Perfil de creador: número de seguidores, crédito mensual asignado, historial de visitas.",
            "Contenido de visita: fotos y vídeos subidos por los creadores como prueba de visita; este contenido es visible para la maison correspondiente y para el equipo de Curato.",
            "Datos técnicos: registros de conexión, identificadores de sesión, dirección IP, tipo de navegador, fechas y horas de acceso, con fines de seguridad y funcionamiento del servicio.",
          ],
        },
        "Curato no recoge ningún dato sensible en el sentido del artículo 9 del RGPD (origen, opiniones, salud, orientación sexual, etc.). No se recogen ni almacenan datos bancarios: el crédito mensual es pre-asignado por Curato y no da lugar a ningún pago por parte del usuario.",
      ],
    },
    {
      id: "finalites",
      title: "4. Finalidades y bases legales",
      blocks: [
        "Cada tratamiento de datos personales se basa en una base legal conforme al artículo 6 del RGPD:",
        {
          list: [
            "Gestión de la candidatura y de la cuenta de usuario — ejecución del contrato (art. 6.1.b).",
            "Puesta en contacto entre creadores y maisons (matching) — ejecución del contrato (art. 6.1.b).",
            "Recomendaciones personalizadas a partir del cuestionario de onboarding — consentimiento explícito (art. 6.1.a), recogido mediante casilla dedicada.",
            "Envío de correos transaccionales (confirmación, bienvenida, restablecimiento de contraseña) — ejecución del contrato (art. 6.1.b).",
            "Respuestas a mensajes dirigidos a hello@curatocollective.com — interés legítimo (art. 6.1.f).",
            "Inscripción y confirmación al evento de lanzamiento — consentimiento (art. 6.1.a).",
            "Verificación automática de las publicaciones de visita mediante nuestro proveedor de análisis de redes sociales — ejecución del contrato (art. 6.1.b), precedida de un consentimiento explícito al conectar la cuenta de Instagram.",
            "Seguridad del servicio y prevención de abusos — interés legítimo (art. 6.1.f).",
            "Cumplimiento de obligaciones legales (contabilidad, requerimientos de autoridades) — obligación legal (art. 6.1.c).",
          ],
        },
        "Puedes retirar tu consentimiento en cualquier momento para los tratamientos que dependan de él, sin que ello afecte a la licitud de los tratamientos anteriores. La retirada del consentimiento al cuestionario de onboarding puede implicar la imposibilidad de recibir recomendaciones personalizadas.",
      ],
    },
    {
      id: "destinataires",
      title: "5. Destinatarios y encargados del tratamiento",
      blocks: [
        "Tus datos nunca se venden. Solo son accesibles para personas autorizadas dentro de Curato y para los proveedores técnicos (encargados del tratamiento conforme al artículo 28 del RGPD) listados a continuación, cuya intervención es estrictamente necesaria para el funcionamiento del servicio:",
        {
          list: [
            "Supabase (Supabase Inc.) — alojamiento de la base de datos y servicio de autenticación. Datos tratados: todos los datos de usuario. Región de tratamiento: Unión Europea.",
            "Vercel (Vercel Inc.) — alojamiento del sitio y de funciones serverless. Datos tratados: registros técnicos, peticiones HTTP. Ubicación: Estados Unidos y Unión Europea (según la región de ejecución).",
            "Resend (Resend Inc.) — envío de correos transaccionales. Datos tratados: correo electrónico, nombre, contenido del correo. Ubicación: Estados Unidos.",
            "Phyllo (Phyllo Inc.) — análisis de las publicaciones públicas en Instagram para verificar automáticamente la realidad de una visita y asociar el contenido publicado a la maison correspondiente. Datos tratados: identificador de Instagram, ID interno del creador, metadatos de las publicaciones públicas. Ubicación: Estados Unidos. Este tratamiento solo se activa para creadores que conectan voluntariamente su cuenta de Instagram, previo consentimiento explícito.",
          ],
        },
        "Cada encargado del tratamiento está vinculado a Curato por un acuerdo (Data Processing Agreement) que impone garantías equivalentes a las de esta política. La lista de encargados puede evolucionar; cualquier modificación sustancial se reflejará aquí.",
      ],
    },
    {
      id: "visibilite",
      title: "6. Visibilidad de los datos entre usuarios",
      blocks: [
        "El modelo de Curato se basa en la transparencia en la relación entre creadores y maisons. Esta sección detalla qué es visible para quién:",
        {
          list: [
            "Una maison ve, para cada visita: el nombre del creador, su identificador de Instagram (con enlace público), su número de seguidores, su correo de contacto, y el contenido (fotos y vídeos) que sube tras la visita.",
            "Un creador ve, para cada oferta: el nombre de la maison, su dirección, su categoría y el valor del crédito asignado. Los datos de contacto privados de la maison (correo del contacto, número privado) no se exponen.",
            "Las respuestas al cuestionario de onboarding nunca se comparten con las maisons. Se utilizan únicamente por el algoritmo interno de matching y por el equipo de Curato.",
            "El equipo de Curato (administradores) tiene acceso al conjunto de los datos con el único fin de operar y dar soporte al servicio.",
          ],
        },
      ],
    },
    {
      id: "conservation",
      title: "7. Plazos de conservación",
      blocks: [
        "Tus datos se conservan durante el tiempo estrictamente necesario para la finalidad del tratamiento:",
        {
          list: [
            "Cuentas activas: durante toda la duración de la relación, y 12 meses tras el cierre de la cuenta.",
            "Candidaturas no aceptadas: 12 meses desde la decisión (para permitir una posible nueva candidatura).",
            "Inscripciones al evento de lanzamiento: hasta 6 meses después de la celebración del evento.",
            "Contenido de visita (fotos, vídeos): mientras la cuenta del creador esté activa; la maison dispone en paralelo de 90 días de derechos de uso exclusivos desde la fecha de la visita, conforme a las condiciones generales.",
            "Registros técnicos y datos de autenticación: 12 meses.",
            "Documentos contables y de facturación (cuando proceda): 10 años, conforme al artículo L. 123-22 del Código de Comercio francés.",
          ],
        },
        "Al término de estos plazos, los datos se eliminan o se anonimizan de manera irreversible.",
      ],
    },
    {
      id: "droits",
      title: "8. Tus derechos",
      blocks: [
        "Conforme al RGPD y a la ley francesa «Informatique et Libertés», dispones de los siguientes derechos sobre tus datos personales:",
        {
          list: [
            "Derecho de acceso: obtener confirmación de que tus datos están siendo tratados y recibir copia (art. 15).",
            "Derecho de rectificación: corregir datos inexactos o incompletos (art. 16).",
            "Derecho de supresión («derecho al olvido»): solicitar la eliminación de tus datos en las condiciones previstas (art. 17).",
            "Derecho a la limitación del tratamiento (art. 18).",
            "Derecho a la portabilidad: recibir tus datos en un formato estructurado y legible por máquina (art. 20).",
            "Derecho de oposición: oponerte a un tratamiento basado en el interés legítimo (art. 21).",
            "Derecho a retirar tu consentimiento en cualquier momento, para los tratamientos que dependan de él (art. 7.3).",
            "Derecho a definir directrices sobre el destino de tus datos tras tu fallecimiento (art. 85 de la ley Informatique et Libertés).",
          ],
        },
        `Para ejercer estos derechos, envía tu solicitud a ${CONTACT_EMAIL} precisando el objeto de tu petición. Recibirás respuesta en el plazo de un mes, prorrogable dos meses en caso de complejidad, conforme al artículo 12 del RGPD.`,
        "Si tras contactarnos consideras que tus derechos no son respetados, puedes presentar una reclamación ante la autoridad francesa de protección de datos (CNIL): 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.",
      ],
    },
    {
      id: "securite",
      title: "9. Seguridad",
      blocks: [
        "Curato implementa medidas técnicas y organizativas apropiadas para proteger tus datos contra destrucción, pérdida, alteración, divulgación o acceso no autorizados.",
        {
          list: [
            "Cifrado de las comunicaciones mediante HTTPS (TLS).",
            "Contraseñas almacenadas en forma hash por nuestro proveedor de autenticación (nunca en claro).",
            "Control de acceso a la base de datos mediante reglas de seguridad a nivel de fila (Row Level Security).",
            "Acceso administrativo restringido a personas autorizadas dentro del equipo de Curato.",
            "Selección rigurosa de los encargados del tratamiento y firma de acuerdos correspondientes.",
          ],
        },
        "Ningún sistema es infalible. En caso de violación de datos que pueda generar un riesgo para tus derechos y libertades, Curato notificará a la CNIL en un plazo de 72 horas y, si procede, a las personas afectadas, conforme a los artículos 33 y 34 del RGPD.",
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies y almacenamiento local",
      blocks: [
        "El sitio curatocollective.com no utiliza cookies con fines de medición de audiencia, publicidad o perfilado. Solo se depositan los siguientes elementos:",
        {
          list: [
            "Cookies de sesión (estrictamente necesarias): depositadas por nuestro proveedor de autenticación Supabase para mantenerte conectado. Su uso no requiere consentimiento previo (art. 82 de la ley Informatique et Libertés).",
            "Almacenamiento local (localStorage): usado para recordar tu preferencia de idioma (FR / EN / ES). No se almacena en él ningún dato personal.",
          ],
        },
        "Si Curato integrase posteriormente herramientas de medición de audiencia o tracking, se implantaría un banner de consentimiento conforme a las recomendaciones de la CNIL y esta política se actualizaría en consecuencia.",
      ],
    },
    {
      id: "mineurs",
      title: "11. Menores",
      blocks: [
        "El servicio Curato está estrictamente reservado a personas mayores de edad (18 años cumplidos). Crear una cuenta o presentar una candidatura supone que declaras haber alcanzado dicha edad.",
        "Si tuviéramos conocimiento de que una cuenta pertenece a una persona menor, dicha cuenta sería cerrada y los datos asociados eliminados a la mayor brevedad.",
      ],
    },
    {
      id: "transferts",
      title: "12. Transferencias fuera de la Unión Europea",
      blocks: [
        "Algunos de nuestros encargados del tratamiento (Vercel, Resend, Phyllo) están establecidos en Estados Unidos. Las transferencias de datos fuera de la UE están enmarcadas por las garantías previstas por el RGPD:",
        {
          list: [
            "Adhesión al marco Data Privacy Framework (DPF) cuando el proveedor está certificado, o",
            "Firma de las cláusulas contractuales tipo adoptadas por la Comisión Europea (decisión 2021/914).",
          ],
        },
        "Se puede obtener copia de las garantías aplicables a petición en la dirección indicada en la sección 2.",
      ],
    },
    {
      id: "modifications",
      title: "13. Modificaciones de la política",
      blocks: [
        "Curato puede modificar esta política para reflejar la evolución del servicio, de los encargados del tratamiento o de la normativa aplicable. La fecha de última actualización figura en la parte superior del documento.",
        "En caso de modificación sustancial (nueva finalidad, nuevo encargado que impacte tus derechos), serás informado por correo electrónico o mediante un mensaje visible en tu próxima conexión.",
      ],
    },
    {
      id: "loi",
      title: "14. Ley aplicable y jurisdicción",
      blocks: [
        "Esta política se rige por el derecho francés. Toda controversia relativa a su interpretación o ejecución será competencia de los tribunales del ámbito de la Corte de Apelación de París, sin perjuicio de las normas imperativas de protección al consumidor.",
        "En caso de discrepancia entre la versión francesa y cualquier traducción (inglés, español), prevalecerá la versión francesa.",
      ],
    },
  ],
};

export const privacyContent: Record<Lang, PrivacyContent> = { fr, en, es };

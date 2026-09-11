// Los correos de Curato.
//
// Cada correo es un componente de React Email sobre la misma cáscara
// (src/emails/shell.tsx, entrega 4, 10 sexies). Aquí solo se renderizan y se
// mandan por Resend. Las firmas de estas funciones no cambian: quien las llama
// no se entera del cambio.
//
// El asunto dice la cosa entera y se entiende sin abrir el correo, con nombre
// propio y cifra cuando la hay. El remitente siempre es Curato, sin persona.

import { createElement, type ReactElement } from "react";
import { render } from "@react-email/render";
import {
  AlerteDemande,
  AutresCreneaux,
  DemandeDeclinee,
  DemandeEnvoyee,
  VisiteConfirmee,
  demandeDeclineeTexto,
  visiteConfirmeeTexto,
} from "@/emails/visitas";
import { CandidatureAcceptee, CandidatureRecue, Lancement, MotDePasse } from "@/emails/cuenta";
import { EngagementSigne, NouvelleMaison } from "@/emails/maison";
import { Aviso, MaisonValidee, maisonValideeTexto } from "@/emails/apporteur";
import { SeisHoras, StoriesManquantes, seisHorasTexto } from "@/emails/recordatorios";
import { SITE } from "@/emails/shell";

const FROM = "Curato <hello@curatocollective.com>";

type Attachment = { filename: string; content: string; content_type?: string };

async function sendEmail(
  to: string,
  subject: string,
  email: ReactElement,
  opts: { text?: string; attachments?: Attachment[] } = {}
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada en .env.local");
  const html = await render(email);
  // El texto plano lo leen los relojes y lo mira el filtro de spam. Los correos
  // con diseño propio lo traen escrito a mano; el resto se deriva del HTML.
  const text = opts.text ?? (await render(email, { plainText: true }));
  const payload: Record<string, unknown> = { from: FROM, to, subject, html, text };
  if (opts.attachments && opts.attachments.length > 0) payload.attachments = opts.attachments;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const PARIS = "Europe/Paris";
const jourDe = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", timeZone: PARIS });
const heureDe = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS });
const JOUR_EN_TETE = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;

// ── Candidatures ─────────────────────────────────────────────────────────────
export async function sendApplicationReceived(to: string, name: string, type: "creator" | "business") {
  return sendEmail(to, "Curato · Candidature reçue", createElement(CandidatureRecue, { name, type }));
}

type AcceptedOpts = { to: string; name: string; type: "creator" | "business" };

export async function sendApplicationAccepted(opts: AcceptedOpts) {
  const firstName = opts.name.split(" ")[0];
  return sendEmail(opts.to, `Bienvenue dans Curato, ${firstName}`, createElement(CandidatureAcceptee, opts));
}

// ── Lancement ────────────────────────────────────────────────────────────────
export async function sendLaunchEventConfirmation(to: string, name: string) {
  return sendEmail(to, "Curato · Votre inscription au lancement, Paris", createElement(Lancement, { name }));
}

// ── Visites ──────────────────────────────────────────────────────────────────
export async function sendReservationRequested(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  whenLabel: string;
  partySize: number;
}) {
  const { to, ...p } = opts;
  return sendEmail(to, `Demande envoyée à ${p.maisonName}`, createElement(DemandeEnvoyee, p));
}

export async function sendReservationAdminAlert(opts: {
  to: string;
  creatorName: string;
  creatorHandle: string | null;
  maisonName: string;
  whenLabel: string;
  partySize: number;
  note: string | null;
}) {
  const { to, ...p } = opts;
  return sendEmail(to, `Nouvelle demande : ${p.creatorName} chez ${p.maisonName}`, createElement(AlerteDemande, p));
}

/**
 * La visita confirmada. El asunto lleva casa, día y hora ("Maison Marceau vous
 * attend jeudi à 19:30"), y el cuerpo, la portada de la propia casa.
 */
export async function sendReservationConfirmed(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  address: string | null;
  whenLabel: string;
  googleUrl: string;
  ics: string;
  /** El instante de la visita, para el asunto. */
  start?: Date;
  partySize?: number;
  /** La portada de la maison, a sangre. */
  coverUrl?: string | null;
}) {
  const props = {
    maisonName: opts.maisonName,
    address: opts.address,
    whenLabel: opts.whenLabel,
    partySize: opts.partySize,
    coverUrl: opts.coverUrl ?? null,
    googleUrl: opts.googleUrl,
  };
  const asunto = opts.start
    ? `${opts.maisonName} vous attend ${jourDe(opts.start)} à ${heureDe(opts.start)}`
    : `${opts.maisonName} vous attend`;
  return sendEmail(opts.to, asunto, createElement(VisiteConfirmee, props), {
    text: visiteConfirmeeTexto(props),
    attachments: [
      { filename: "reservation-curato.ics", content: Buffer.from(opts.ics).toString("base64"), content_type: "text/calendar" },
    ],
  });
}

export async function sendReservationAlternatives(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  slots: { label: string; url: string }[];
}) {
  const { to, ...p } = opts;
  return sendEmail(to, `${p.maisonName} vous propose d'autres créneaux`, createElement(AutresCreneaux, p));
}

/**
 * La casa dice que no. El asunto dice casa y día ("Maison Marceau ne peut pas
 * vous recevoir jeudi"), nunca "Mise à jour de votre demande".
 */
export async function sendReservationDeclined(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  whenLabel: string;
}) {
  const { to, ...p } = opts;
  const jour = p.whenLabel.match(JOUR_EN_TETE)?.[1]?.toLowerCase();
  const asunto = jour ? `${p.maisonName} ne peut pas vous recevoir ${jour}` : `${p.maisonName} ne peut pas vous recevoir`;
  return sendEmail(to, asunto, createElement(DemandeDeclinee, p), { text: demandeDeclineeTexto(p) });
}

// ── Stories ──────────────────────────────────────────────────────────────────
/** A falta de seis horas del plazo, si las stories no han llegado. Una vez. */
export async function sendRecordatorioSeisHoras(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  whenLabel: string;
  horas: number;
}) {
  const { to, ...p } = opts;
  const asunto =
    p.horas === 6 ? "Il vous reste six heures pour publier" : `Il vous reste ${p.horas} heure${p.horas > 1 ? "s" : ""} pour publier`;
  return sendEmail(to, asunto, createElement(SeisHoras, p), { text: seisHorasTexto(p) });
}

/** A Curato: las visitas cuyo plazo acaba de vencer sin stories. */
export async function sendAvisoStoriesManquantes(opts: {
  to: string;
  visitas: { storyteller: string; maison: string; whenLabel: string }[];
}) {
  const n = opts.visitas.length;
  const asunto =
    n === 1
      ? `Stories manquantes : ${opts.visitas[0].storyteller} chez ${opts.visitas[0].maison}`
      : `Stories manquantes : ${n} visites`;
  return sendEmail(opts.to, asunto, createElement(StoriesManquantes, { visitas: opts.visitas }));
}

// ── Maisons ──────────────────────────────────────────────────────────────────
type MaisonCommitmentOpts = {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  maisonName: string;
  terms: string[];
  signatory: string;
  signedByLabel: string;
  whenLabel: string;
  dateLabel: string;
  confirmNote: string;
  pdfBase64: string;
  pdfFilename: string;
};

export async function sendMaisonCommitment(opts: MaisonCommitmentOpts) {
  const { to, subject, pdfBase64, pdfFilename, ...p } = opts;
  return sendEmail(to, subject, createElement(EngagementSigne, p), {
    attachments: [{ filename: pdfFilename, content: pdfBase64, content_type: "application/pdf" }],
  });
}

export async function sendMaisonJoinedAdminAlert(opts: {
  to: string;
  maisonName: string;
  signatory: string;
  whenLabel: string;
  planLabel: string;
}) {
  const { to, ...p } = opts;
  return sendEmail(to, `Nouvelle maison signée : ${p.maisonName}`, createElement(NouvelleMaison, p));
}

// ── Compte ───────────────────────────────────────────────────────────────────
// Por Resend y no por el correo de Supabase, que llegaba mal. El enlace es una
// acción de recuperación de Supabase que abre /auth/change-password.
export async function sendPasswordReset(to: string, resetUrl: string) {
  return sendEmail(to, "Curato · Choisissez un nouveau mot de passe", createElement(MotDePasse, { resetUrl }));
}

// ── Apporteurs ───────────────────────────────────────────────────────────────
export const RECRUITER_COMMISSION_LABEL = "448,50 € (149,50 €/mois pendant 3 mois)";

const first = (name: string) => (name || "").trim().split(" ")[0] || "";
const DASH = `${SITE}/dashboard`;
const ADMIN_RECRUITERS = `${SITE}/admin/recruiters`;

function aviso(p: { capital: string; titulo: string; parrafos: string[]; enlace?: { label: string; url: string } }) {
  return createElement(Aviso, { ...p, preview: p.parrafos[0] ?? p.titulo });
}

export async function sendRecruiterWelcome(to: string, o: { name: string; email: string; tempPassword: string }) {
  return sendEmail(
    to,
    `Bienvenue dans Curato, ${first(o.name)}`,
    aviso({
      capital: "Espace apporteur",
      titulo: `Bienvenue, ${first(o.name)}`,
      parrafos: [
        "Votre espace apporteur Curato est prêt. Connectez-vous, proposez des maisons et suivez vos commissions.",
        `Identifiant : ${o.email}`,
        `Mot de passe temporaire : ${o.tempPassword}`,
        "Vous choisirez un mot de passe personnel à la première connexion.",
      ],
      enlace: { label: "Accéder à mon espace", url: `${SITE}/auth/sign-in` },
    })
  );
}

// Un segundo rol en una cuenta que ya existe: sin contraseña nueva.
export async function sendRecruiterSecondRole(to: string, o: { name: string }) {
  return sendEmail(
    to,
    "Curato · Votre espace apporteur est activé",
    aviso({
      capital: "Espace apporteur",
      titulo: `Bonjour, ${first(o.name)}`,
      parrafos: [
        "Vous avez désormais aussi accès à l'espace apporteur de Curato, avec votre compte habituel.",
        "Connectez-vous comme d'habitude : le lien « Espaces » en haut de votre tableau de bord vous fait passer d'un espace à l'autre.",
      ],
      enlace: { label: "Accéder à mon espace", url: `${SITE}/auth/sign-in` },
    })
  );
}

export async function sendRecruiterProspectSubmitted(to: string, o: { recruiterName: string; maisonName: string }) {
  return sendEmail(
    to,
    `Prospect reçu : ${o.maisonName}`,
    aviso({
      capital: "En attente de validation",
      titulo: o.maisonName,
      parrafos: [
        `Bonjour ${first(o.recruiterName)}, nous avons bien reçu votre proposition.`,
        "Notre équipe la valide sous peu et vous recevrez un e-mail dès qu'elle le sera. D'ici là, merci de ne pas encore contacter la maison.",
      ],
      enlace: { label: "Voir mes prospects", url: DASH },
    })
  );
}

export async function sendAdminProspectSubmitted(to: string, o: { recruiterName: string; maisonName: string; maisonEmail: string | null }) {
  return sendEmail(
    to,
    `Prospect à valider : ${o.maisonName}`,
    aviso({
      capital: "Prospect à valider",
      titulo: o.maisonName,
      parrafos: [
        `${o.recruiterName} vient de proposer cette maison.`,
        `E-mail de la maison : ${o.maisonEmail || "non renseigné"}. Validez ou refusez depuis l'admin.`,
      ],
      enlace: { label: "Valider dans l'admin", url: ADMIN_RECRUITERS },
    })
  );
}

export async function sendRecruiterProspectDecision(
  to: string,
  o: { recruiterName: string; maisonName: string; decision: "approved" | "rejected" }
) {
  if (o.decision === "approved") {
    const p = { recruiterName: o.recruiterName, maisonName: o.maisonName };
    return sendEmail(to, `${o.maisonName} est validée · à vous de jouer`, createElement(MaisonValidee, p), {
      text: maisonValideeTexto(p),
    });
  }
  return sendEmail(
    to,
    `${o.maisonName} n'a pas été retenue`,
    aviso({
      capital: "Non retenue",
      titulo: o.maisonName,
      parrafos: [
        `Bonjour ${first(o.recruiterName)}, cette maison n'a pas pu être retenue : elle est déjà dans nos échanges, ou elle n'est pas éligible.`,
        "Merci de ne pas la contacter. Et n'hésitez pas à en proposer d'autres.",
      ],
      enlace: { label: "Proposer une maison", url: DASH },
    })
  );
}

export async function sendAdminProspectDecision(
  to: string,
  o: { recruiterName: string; maisonName: string; decision: "approved" | "rejected" }
) {
  const valide = o.decision === "approved";
  return sendEmail(
    to,
    `${o.maisonName} ${valide ? "validée" : "refusée"}`,
    aviso({
      capital: valide ? "Maison validée" : "Maison refusée",
      titulo: o.maisonName,
      parrafos: [`Vous avez ${valide ? "validé" : "refusé"} la maison ${o.maisonName}, proposée par ${o.recruiterName}.`],
    })
  );
}

export async function sendRecruiterMaisonSigned(to: string, o: { recruiterName: string; maisonName: string }) {
  return sendEmail(
    to,
    `${o.maisonName} a signé`,
    aviso({
      capital: "Maison signée",
      titulo: o.maisonName,
      parrafos: [
        `Bravo ${first(o.recruiterName)}, la maison que vous avez apportée vient de signer.`,
        `Votre commission : ${RECRUITER_COMMISSION_LABEL}, versée par virement au fil des paiements de la maison. Pensez à renseigner votre IBAN dans votre espace.`,
      ],
      enlace: { label: "Voir mes commissions", url: DASH },
    })
  );
}

export async function sendAdminRecruiterMaisonSigned(to: string, o: { recruiterName: string; maisonName: string }) {
  return sendEmail(
    to,
    `${o.maisonName} signée, apportée par ${o.recruiterName}`,
    aviso({
      capital: "Maison signée",
      titulo: o.maisonName,
      parrafos: [
        `La maison ${o.maisonName}, apportée par ${o.recruiterName}, vient de signer. Commission due : ${RECRUITER_COMMISSION_LABEL}.`,
      ],
    })
  );
}

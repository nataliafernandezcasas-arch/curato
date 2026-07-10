// Curato transactional emails
// Brand: dark editorial — warm charcoal bg, champagne (#CBB78F) accents, Georgia serif
// Voice: contemplative, intimate, exclusive. French-first, bilingual where needed.

const FROM = "Curato <hello@curatocollective.com>";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";

type Attachment = { filename: string; content: string; content_type?: string };

async function sendEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada en .env.local");
  const payload: Record<string, unknown> = { from: FROM, to, subject, html };
  if (attachments && attachments.length > 0) payload.attachments = attachments;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Brand palette ────────────────────────────────────────────────────────────
const C = {
  bg:        "#1C1A18",   // warm charcoal
  card:      "#242220",   // slightly lighter card surface
  border:    "#2E2B27",   // subtle border
  champagne: "#CBB78F",   // primary accent
  copper:    "#B56E2E",   // warm copper
  white:     "#F5F0E8",   // warm white body text
  muted:     "#7A7168",   // muted text
  faint:     "#4A4640",   // very muted
};

const FONT = `Georgia, 'Times New Roman', serif`;
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;

// ── Wordmark ─────────────────────────────────────────────────────────────────
function curatorWordmark() {
  // Simple text wordmark — "curato" in small caps feel via letter-spacing
  return `<span style="font-family:${FONT};font-size:18px;font-weight:400;color:${C.champagne};letter-spacing:0.35em;text-transform:lowercase;">curato</span>`;
}

// ── Email wrapper ─────────────────────────────────────────────────────────────
function wrap(content: string) {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:${FONT_SANS};">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

      <!-- Logo -->
      <tr><td style="padding:0 0 32px;text-align:left;">
        ${curatorWordmark()}
      </td></tr>

      <!-- Card -->
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.card};border:1px solid ${C.border};">
          ${content}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:28px 4px 0;">
        <p style="margin:0;font-family:${FONT_SANS};font-size:11px;color:${C.faint};letter-spacing:0.15px;">
          Curato · Paris · curatocollective.com
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

// ── 1. Application received ───────────────────────────────────────────────────
export async function sendApplicationReceived(to: string, name: string, type: "creator" | "business") {
  const isCreator = type === "creator";

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;font-weight:400;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Candidature reçue
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:28px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        Merci, ${name.split(" ")[0]}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Nous avons bien reçu votre candidature en tant que
        <span style="color:${C.white};">${isCreator ? "créateur · creator" : "maison · house"}</span>.
        Notre équipe examine chaque profil avec attention.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <div style="height:1px;background-color:${C.border};"></div>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.faint};line-height:1.7;font-style:italic;">
        Si votre candidature est retenue, vous recevrez un email de confirmation avec vos accès.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "Curato · Candidature reçue", html);
}

// ── 2. Application accepted ───────────────────────────────────────────────────
type AcceptedOpts = {
  to: string;
  name: string;
  type: "creator" | "business";
};

export async function sendApplicationAccepted(opts: AcceptedOpts) {
  const { to, name, type } = opts;
  const isCreator = type === "creator";
  const firstName = name.split(" ")[0];

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Accepté · Accepted
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:30px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.2;">
        Bienvenue dans Curato,<br/>${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        ${isCreator
          ? "Vous faites maintenant partie de notre réseau de créateurs. Découvrez les adresses sélectionnées et utilisez votre crédit mensuel pour vivre des expériences authentiques."
          : "Votre maison fait maintenant partie de l'écosystème Curato. Recevez des créateurs qui vous ont choisi, pas des campagnes."
        }
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr><td style="background-color:${C.champagne};">
          <a href="${SITE_URL}/auth/sign-in" style="display:inline-block;padding:14px 32px;font-family:${FONT_SANS};color:#1C1A18;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.25em;text-transform:uppercase;">
            Accéder
          </a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:12px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:11px;color:${C.faint};">
        Connectez-vous avec <span style="color:${C.muted};">${to}</span>
      </p>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <div style="height:1px;background-color:${C.border};"></div>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Jamais une campagne. Toujours une histoire.
      </p>
    </td></tr>
  `);

  return sendEmail(to, `Curato · Bienvenue, ${firstName}`, html);
}

// ── 3. Launch event confirmation ─────────────────────────────────────────────

export async function sendLaunchEventConfirmation(to: string, name: string) {
  const firstName = (name || "").split(" ")[0] || "invité";

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Vous êtes inscrit
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:30px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.2;">
        À bientôt,<br/>${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Nous avons bien enregistré votre inscription au lancement de Curato.
        Vous serez prévenu par email dès que la date est confirmée.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:10px;color:${C.faint};letter-spacing:0.3em;text-transform:uppercase;">Lancement</p>
          <p style="margin:12px 0 16px;font-family:${FONT};font-size:20px;font-weight:400;color:${C.white};">Paris</p>
          <div style="height:1px;background-color:${C.border};margin-bottom:14px;"></div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};font-style:italic;">Date confirmée prochainement</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Places limitées. La confirmation définitive vous sera envoyée avec tous les détails.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "Curato · Lancement Paris", html);
}

// ── 4. Reservation request received (storyteller) ─────────────────────────────
export async function sendReservationRequested(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  whenLabel: string;
  partySize: number;
}) {
  const { to, firstName, maisonName, whenLabel, partySize } = opts;

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Demande reçue · Request received
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:28px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        Bien reçu, ${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Votre demande de réservation a bien été transmise. Vous recevrez une confirmation très bientôt.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:10px;color:${C.faint};letter-spacing:0.3em;text-transform:uppercase;">Maison</p>
          <p style="margin:6px 0 16px;font-family:${FONT};font-size:20px;color:${C.white};">${maisonName}</p>
          <div style="height:1px;background-color:${C.border};margin-bottom:14px;"></div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};">${whenLabel} · ${partySize} pers.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Cette demande est en cours de validation. Rien n'est encore confirmé.
      </p>
    </td></tr>
  `);

  return sendEmail(to, `Curato · Demande envoyée, ${maisonName}`, html);
}

// ── 5. Reservation request — admin alert (Natalia) ────────────────────────────
export async function sendReservationAdminAlert(opts: {
  to: string;
  creatorName: string;
  creatorHandle: string | null;
  maisonName: string;
  whenLabel: string;
  partySize: number;
  note: string | null;
}) {
  const { to, creatorName, creatorHandle, maisonName, whenLabel, partySize, note } = opts;

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Nouvelle demande
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        ${creatorName}${creatorHandle ? ` <span style="color:${C.muted};">· @${creatorHandle}</span>` : ""}
      </h1>
    </td></tr>
    <tr><td style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:18px;color:${C.white};">${maisonName}</p>
          <p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:13px;color:${C.muted};">${whenLabel} · ${partySize} pers.</p>
          ${note ? `<div style="height:1px;background-color:${C.border};margin:6px 0 12px;"></div><p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};font-style:italic;">« ${note} »</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table cellpadding="0" cellspacing="0"><tr><td style="background-color:${C.champagne};">
        <a href="${SITE_URL}/admin/reservations" style="display:inline-block;padding:14px 32px;font-family:${FONT_SANS};color:#1C1A18;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.25em;text-transform:uppercase;">
          Gérer la demande
        </a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;"></td></tr>
  `);

  return sendEmail(to, `Curato · Nouvelle demande, ${maisonName}`, html);
}

// ── 6. Reservation confirmed (storyteller) — with calendar ────────────────────
export async function sendReservationConfirmed(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  address: string | null;
  whenLabel: string;
  googleUrl: string;
  ics: string;
}) {
  const { to, firstName, maisonName, address, whenLabel, googleUrl, ics } = opts;

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Confirmé · Confirmed
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:28px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        C'est confirmé, ${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Votre réservation est confirmée. Nous avons hâte de vous y retrouver.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};">
        <tr><td style="padding:24px 28px;">
          <p style="margin:6px 0 8px;font-family:${FONT};font-size:20px;color:${C.white};">${maisonName}</p>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};">${whenLabel}</p>
          ${address ? `<p style="margin:8px 0 0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};">${address}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table cellpadding="0" cellspacing="0"><tr><td style="background-color:${C.champagne};">
        <a href="${googleUrl}" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};color:#1C1A18;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.2em;text-transform:uppercase;">
          Ajouter à Google Calendar
        </a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:14px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;">
        Pour Apple Calendar / Outlook, ouvrez le fichier <span style="color:${C.muted};">reservation-curato.ics</span> joint à cet email.
      </p>
    </td></tr>
  `);

  const attachments = [
    {
      filename: "reservation-curato.ics",
      content: Buffer.from(ics).toString("base64"),
      content_type: "text/calendar",
    },
  ];

  return sendEmail(to, `Curato · Réservation confirmée, ${maisonName}`, html, attachments);
}

// ── 7. Reservation — alternative créneaux proposed (storyteller) ──────────────
export async function sendReservationAlternatives(opts: {
  to: string;
  firstName: string;
  maisonName: string;
  slots: { label: string; url: string }[];
}) {
  const { to, firstName, maisonName, slots } = opts;

  const slotRows = slots
    .map(
      (s) => `
      <tr><td style="padding:0 0 10px;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr><td style="border:1px solid ${C.border};">
          <a href="${s.url}" style="display:block;padding:14px 22px;font-family:${FONT_SANS};font-size:14px;color:${C.white};text-decoration:none;">
            <span style="color:${C.champagne};">→</span> ${s.label}
          </a>
        </td></tr></table>
      </td></tr>`
    )
    .join("");

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Autres créneaux
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        Un autre moment, ${firstName} ?
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Le créneau demandé chez <span style="color:${C.white};">${maisonName}</span> n'était pas disponible.
        Voici les disponibilités proposées, choisissez celle qui vous convient :
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${slotRows}
      </table>
    </td></tr>
    <tr><td style="padding:18px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Aucune ne convient ? Vous pouvez aussi proposer une autre date depuis votre espace.
      </p>
    </td></tr>
  `);

  return sendEmail(to, `Curato · Autres créneaux, ${maisonName}`, html);
}

// ── Maison commitment signed ──────────────────────────────────────────────────
// Sent to a maison right after they sign the commitment. Carries the signed
// agreement as a PDF attachment and repeats the terms in the body as a record.
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
  const termsHtml = opts.terms
    .map(
      (term, i) => `
      <tr><td style="padding:0 0 14px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td valign="top" style="padding-right:14px;font-family:${FONT};font-size:13px;color:${C.champagne};">${String(i + 1).padStart(2, "0")}</td>
          <td style="font-family:${FONT_SANS};font-size:14px;color:${C.white};line-height:1.6;">${term}</td>
        </tr></table>
      </td></tr>`
    )
    .join("");

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;font-weight:400;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        ${opts.heading}
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        ${opts.maisonName}
      </h1>
    </td></tr>
    <tr><td style="padding:18px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        ${opts.intro}
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <div style="height:1px;background-color:${C.border};"></div>
    </td></tr>
    <tr><td style="padding:26px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">${termsHtml}</table>
    </td></tr>
    <tr><td style="padding:14px 40px 0;">
      <div style="height:1px;background-color:${C.border};"></div>
    </td></tr>
    <tr><td style="padding:22px 40px 40px;">
      <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:11px;color:${C.faint};letter-spacing:0.15em;text-transform:uppercase;">
        ${opts.signedByLabel}
      </p>
      <p style="margin:0 0 14px;font-family:${FONT};font-size:20px;color:${C.white};">${opts.signatory}</p>
      <p style="margin:0 0 18px;font-family:${FONT_SANS};font-size:12px;color:${C.muted};">${opts.dateLabel}: ${opts.whenLabel}</p>
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        ${opts.confirmNote}
      </p>
    </td></tr>
  `);

  return sendEmail(opts.to, opts.subject, html, [
    { filename: opts.pdfFilename, content: opts.pdfBase64, content_type: "application/pdf" },
  ]);
}

// ── Password reset ────────────────────────────────────────────────────────────
// Sent via Resend (reliable) instead of Supabase's built-in auth email. The
// resetUrl is a Supabase recovery action link that lands on /auth/change-password.
export async function sendPasswordReset(to: string, resetUrl: string) {
  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;font-weight:400;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Réinitialisation
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        Nouveau mot de passe
      </h1>
    </td></tr>
    <tr><td style="padding:18px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Vous avez demandé à réinitialiser votre mot de passe Curato. Cliquez ci-dessous pour en choisir un nouveau. Ce lien expire dans 1 heure.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <a href="${resetUrl}" style="display:inline-block;font-family:${FONT_SANS};font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${C.bg};background-color:${C.champagne};text-decoration:none;padding:14px 28px;">
        Choisir un nouveau mot de passe
      </a>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "Curato · Réinitialisation de votre mot de passe", html);
}

// ── Admin alert: a maison opened its account (signed the commitment) ───────────
export async function sendMaisonJoinedAdminAlert(opts: {
  to: string;
  maisonName: string;
  signatory: string;
  whenLabel: string;
  planLabel: string;
}) {
  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;font-weight:400;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Nouvelle maison
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.25;">
        ${opts.maisonName}
      </h1>
    </td></tr>
    <tr><td style="padding:18px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        vient d'ouvrir son compte et de signer son engagement Curato.
      </p>
    </td></tr>
    <tr><td style="padding:26px 40px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${FONT_SANS};font-size:13px;color:${C.white};">
        <tr><td style="padding:6px 0;color:${C.muted};width:120px;">Signé par</td><td style="padding:6px 0;">${opts.signatory}</td></tr>
        <tr><td style="padding:6px 0;color:${C.muted};">Formule</td><td style="padding:6px 0;">${opts.planLabel}</td></tr>
        <tr><td style="padding:6px 0;color:${C.muted};">Date</td><td style="padding:6px 0;">${opts.whenLabel}</td></tr>
      </table>
    </td></tr>
  `);

  return sendEmail(opts.to, `Curato · Nouvelle maison signée : ${opts.maisonName}`, html);
}

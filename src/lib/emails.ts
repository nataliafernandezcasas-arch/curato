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

// ── 3. Launch event confirmation (22 juillet 2026, Paris) ────────────────────

const LAUNCH_EVENT = {
  title: "CURATO LAUNCH · PARIS",
  description: "Vous avez été sélectionné pour vivre en exclusivité le lancement de Curato à Paris.",
  location: "Paris, France — lieu confirmé à l'inscription",
  // 22 July 2026 19:00 CEST (UTC+2) → 17:00 UTC; 3h duration
  startUTC: "20260722T170000Z",
  endUTC:   "20260722T200000Z",
};

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function buildLaunchICS(attendeeEmail: string, attendeeName: string): string {
  const uid = `curato-launch-${Buffer.from(attendeeEmail.toLowerCase()).toString("hex")}@curatocollective.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Curato//Launch Event//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${LAUNCH_EVENT.startUTC}`,
    `DTEND:${LAUNCH_EVENT.endUTC}`,
    `SUMMARY:${icsEscape(LAUNCH_EVENT.title)}`,
    `DESCRIPTION:${icsEscape(LAUNCH_EVENT.description)}`,
    `LOCATION:${icsEscape(LAUNCH_EVENT.location)}`,
    "ORGANIZER;CN=Curato:mailto:hello@curatocollective.com",
    `ATTENDEE;CN=${icsEscape(attendeeName)};RSVP=TRUE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${attendeeEmail}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export async function sendLaunchEventConfirmation(to: string, name: string) {
  const firstName = (name || "").split(" ")[0] || "invité";
  const ics = buildLaunchICS(to, name || to);
  const icsB64 = Buffer.from(ics, "utf8").toString("base64");

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:10px;color:${C.champagne};letter-spacing:0.35em;text-transform:uppercase;">
        Vous êtes confirmé
      </p>
      <h1 style="margin:0;font-family:${FONT};font-size:30px;font-weight:400;color:${C.white};letter-spacing:0.02em;line-height:1.2;">
        À bientôt,<br/>${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;color:${C.muted};line-height:1.7;">
        Nous avons bien enregistré votre inscription au lancement de Curato.
        L'invitation au calendrier est jointe à cet email.
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:10px;color:${C.faint};letter-spacing:0.3em;text-transform:uppercase;">Save the date</p>
          <p style="margin:12px 0 4px;font-family:${FONT};font-size:20px;font-weight:400;color:${C.white};">Paris</p>
          <p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:11px;color:${C.muted};letter-spacing:0.2em;text-transform:uppercase;">mercredi</p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:40px;font-weight:400;color:${C.champagne};line-height:1;letter-spacing:0.02em;">22.07.2026</p>
          <div style="height:1px;background-color:${C.border};margin-bottom:14px;"></div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13px;color:${C.muted};">19h00 · Lieu confirmé prochainement</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.faint};line-height:1.7;font-style:italic;">
        Si le fichier .ics joint ne s'ouvre pas automatiquement, ajoutez-le manuellement depuis votre application Calendrier.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "Curato · Lancement Paris · 22 juillet", html, [
    {
      filename: "curato-launch-paris.ics",
      content: icsB64,
      content_type: "text/calendar; method=REQUEST; charset=UTF-8",
    },
  ]);
}

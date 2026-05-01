// Midi Pass transactional emails
// Brand compliance: Mon Palette 2026 — Purple (#825DC7), Lime (#C5E86C), Cream (#FFFDF1), Navy (#26213F)
// Typography: DM Sans via Google Fonts with system fallback
// Voice: Sage leads, Creator supports. Direct, close, LATAM-warm. No corporate fluff.

const FROM = "Midi Pass <pass@midi.io>";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pass.midi.io";

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

// Midi brand constants
const COLORS = {
  purple: "#825DC7",
  purpleDeep: "#6B1ABF",
  lime: "#C5E86C",
  purpleLight: "#F0E8FA",  // Light purple bg — soft lavender tint of Midi purple (main email bg)
  cream: "#FFFDF1",        // Warm white — card surface inside the email, text on dark buttons
  navy: "#26213F",
  navy70: "#5b576e",       // Navy at 70% for secondary text
  navy40: "#8c8998",       // Navy at 40% for captions
  border: "#dfd0f0",       // Purple-tinted border
};

// Inline Midi wordmark SVG (pure path data) — displays as purple on cream, lime on navy, etc.
// Takes a `fill` color hex to respect logo color rules.
function midiLogo(fill: string, widthPx = 96) {
  const h = Math.round(widthPx * (429 / 767)); // preserve aspect ratio
  return `<svg width="${widthPx}" height="${h}" viewBox="0 0 767 429" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <path d="M352.262 129.909C352.262 117.164 361.927 107.252 373.737 107.252C385.546 107.252 395.212 117.164 395.212 129.909C395.212 142.654 385.546 152.566 373.737 152.566C361.927 152.566 352.262 142.369 352.262 129.909ZM392.796 172.987V318.919H354.677V172.992H392.796V172.987Z" fill="${fill}"/>
    <path d="M584.423 129.909C584.423 117.164 594.087 107.252 605.899 107.252C617.708 107.252 627.371 117.164 627.371 129.909C627.371 142.654 617.708 152.566 605.899 152.566C594.087 152.566 584.423 142.369 584.423 129.909ZM624.958 172.987V318.919H586.836V172.992H624.958V172.987Z" fill="${fill}"/>
    <path d="M526.167 117.801H564.285V318.917H526.167V293.428C519.188 310.989 500.66 321.75 477.306 321.75C434.622 321.75 409.657 286.628 409.657 244.432C409.657 202.235 435.967 167.678 479.456 167.678C497.177 167.678 515.696 176.176 526.167 192.603V117.801ZM525.895 244.711C525.895 221.205 509.792 204.208 487.241 204.208C464.691 204.208 448.049 220.92 448.049 244.711C448.049 268.502 464.423 285.779 487.241 285.779C510.06 285.779 525.895 268.502 525.895 244.711Z" fill="${fill}"/>
    <path d="M678.701 298.437C678.701 310.127 670.126 318.915 658.643 318.915C647.156 318.915 638.826 310.127 638.826 298.437C638.826 286.747 647.396 277.874 658.643 277.874C669.885 277.874 678.701 286.663 678.701 298.437ZM673.608 298.437C673.608 289.564 667.138 282.822 658.647 282.822C650.157 282.822 643.847 288.968 643.847 298.437C643.847 307.31 650.317 313.967 658.647 313.967C666.977 313.967 673.608 307.911 673.608 298.437ZM661.479 300.911L668.19 309.188H662.206L655.896 300.742V309.188H650.964V286.832H660.101C664.792 286.832 667.7 289.48 667.7 293.916C667.7 298.864 664.141 300.489 661.47 300.916L661.479 300.911ZM655.896 291.611V297.329H659.775C661.635 297.329 662.772 296.306 662.772 294.344C662.772 292.381 661.635 291.611 659.775 291.611H655.896Z" fill="${fill}"/>
    <path d="M143.512 117.913H107.027V318.914H145.927C145.927 232.586 145.927 198.296 143.782 181.595L204.411 270.472L264.506 181.595C262.361 198.296 262.361 192.104 262.361 277.868H301.26V117.913H264.506L204.141 205.661L143.512 117.913Z" fill="${fill}"/>
    <path d="M340.078 277.874H301.178V318.915H340.078V277.874Z" fill="${fill}"/>
  </svg>`;
}

const FONT_STACK = `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

function wrap(content: string) {
  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${COLORS.purpleLight};font-family:${FONT_STACK};">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.purpleLight};padding:56px 20px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="padding:0 0 36px;text-align:left;">
        ${midiLogo(COLORS.purple, 72)}
      </td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;border:1px solid ${COLORS.border};">
          ${content}
        </table>
      </td></tr>
      <tr><td style="padding:28px 4px 0;">
        <p style="margin:0;font-family:${FONT_STACK};font-size:11px;font-weight:400;color:${COLORS.navy40};letter-spacing:0.2px;">
          Midi Technologies LLC &nbsp;·&nbsp; midi.io
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function sendApplicationReceived(to: string, name: string, type: "influencer" | "business") {
  const isInfluencer = type === "influencer";
  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <div style="display:inline-block;padding:6px 12px;background-color:${COLORS.lime};border-radius:999px;">
        <span style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:${COLORS.navy};letter-spacing:0.6px;text-transform:uppercase;">En revisión</span>
      </div>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <h1 style="margin:0;font-family:${FONT_STACK};font-size:28px;font-weight:300;color:${COLORS.navy};letter-spacing:-0.6px;line-height:1.2;">
        Hola, ${name}
      </h1>
    </td></tr>
    <tr><td style="padding:16px 40px 0;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:15px;font-weight:400;color:${COLORS.navy70};line-height:1.6;">
        Recibimos tu aplicación como <span style="color:${COLORS.navy};font-weight:500;">${isInfluencer ? 'creador' : 'comercio aliado'}</span>.
        Nuestro equipo está revisando tu perfil.
      </p>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <div style="height:1px;background-color:${COLORS.border};"></div>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:13px;font-weight:400;color:${COLORS.navy70};line-height:1.6;">
        Si eres aceptado, te llega un correo y un WhatsApp con acceso a la plataforma. Te avisamos pronto.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "Tu aplicación a Midi Pass está en revisión", html);
}

type AcceptedOpts = {
  to: string;
  name: string;
  type: "influencer" | "business";
  passUrl?: string;
  googlePayUrl?: string;
};

export async function sendApplicationAccepted(opts: AcceptedOpts) {
  const { to, name, type, passUrl, googlePayUrl } = opts;
  const isInfluencer = type === "influencer";
  const firstName = name.split(" ")[0];

  const walletBlock = isInfluencer && (passUrl || googlePayUrl) ? `
    <tr><td style="padding:0 40px 8px;">
      <p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:13px;font-weight:500;color:${COLORS.navy};letter-spacing:0.2px;text-transform:uppercase;">
        Tu Midi Pass
      </p>
      <p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:14px;font-weight:400;color:${COLORS.navy70};line-height:1.6;">
        Añádelo a tu wallet y muéstralo en cada visita al comercio.
      </p>
    </td></tr>
    ${passUrl ? `
    <tr><td style="padding:0 40px 12px;">
      <a href="${passUrl}" style="display:block;background-color:#0a0a0a;border-radius:14px;padding:14px 22px;text-decoration:none;box-shadow:0 2px 8px rgba(10,10,10,0.08);">
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
          <tr>
            <td valign="middle" style="padding-right:12px;line-height:0;">
              <img src="https://pass.midi.io/email-apple-logo.png" width="22" height="22" alt="Apple" style="display:block;border:0;outline:none;" />
            </td>
            <td valign="middle">
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;font-size:10px;font-weight:400;line-height:12px;letter-spacing:0.3px;">A&ntilde;adir a</div>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;font-size:17px;font-weight:600;line-height:20px;letter-spacing:-0.2px;">Apple&nbsp;Wallet</div>
            </td>
          </tr>
        </table>
      </a>
    </td></tr>` : ''}
    ${googlePayUrl ? `
    <tr><td style="padding:0 40px 8px;">
      <a href="${googlePayUrl}" style="display:block;background-color:#ffffff;border:1.5px solid #dadce0;border-radius:14px;padding:13.5px 22px;text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
          <tr>
            <td valign="middle" style="padding-right:12px;line-height:0;">
              <img src="https://pass.midi.io/email-google-logo.png" width="22" height="22" alt="Google" style="display:block;border:0;outline:none;" />
            </td>
            <td valign="middle">
              <div style="font-family:'Google Sans',Roboto,Arial,sans-serif;color:#5f6368;font-size:10px;font-weight:500;line-height:12px;letter-spacing:0.25px;">Guardar en</div>
              <div style="font-family:'Google Sans',Roboto,Arial,sans-serif;color:#1f1f1f;font-size:17px;font-weight:500;line-height:20px;letter-spacing:0.15px;">Google&nbsp;Wallet</div>
            </td>
          </tr>
        </table>
      </a>
    </td></tr>` : ''}
  ` : '';

  const benefitsBlock = isInfluencer ? `
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.purpleLight};border-radius:14px;">
        <tr><td style="padding:20px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;"><span style="font-family:${FONT_STACK};font-size:11px;font-weight:500;color:${COLORS.navy70};text-transform:uppercase;letter-spacing:0.8px;">Crédito mensual</span></td>
              <td style="padding:6px 0;text-align:right;"><span style="font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${COLORS.navy};">$1.500.000 COP</span></td>
            </tr>
            <tr>
              <td style="padding:6px 0;"><span style="font-family:${FONT_STACK};font-size:11px;font-weight:500;color:${COLORS.navy70};text-transform:uppercase;letter-spacing:0.8px;">Categorías</span></td>
              <td style="padding:6px 0;text-align:right;"><span style="font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${COLORS.navy};">Gastro · Beauty · Wellness · Hoteles</span></td>
            </tr>
            <tr>
              <td style="padding:6px 0;"><span style="font-family:${FONT_STACK};font-size:11px;font-weight:500;color:${COLORS.navy70};text-transform:uppercase;letter-spacing:0.8px;">Por visita</span></td>
              <td style="padding:6px 0;text-align:right;"><span style="font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${COLORS.navy};">3 stories ó 1 reel</span></td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  ` : '';

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <div style="display:inline-block;padding:6px 14px;background-color:${COLORS.lime};border-radius:999px;">
        <span style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:${COLORS.navy};letter-spacing:0.6px;text-transform:uppercase;">Aceptado</span>
      </div>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <h1 style="margin:0;font-family:${FONT_STACK};font-size:32px;font-weight:300;color:${COLORS.navy};letter-spacing:-0.8px;line-height:1.15;">
        Bienvenido<br/>a Midi Pass, ${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:18px 40px 0;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:15px;font-weight:400;color:${COLORS.navy70};line-height:1.6;">
        Ya eres ${isInfluencer ? 'parte de nuestra red de creadores' : 'comercio aliado'}. ${isInfluencer ? 'Accede al catálogo, reserva experiencias y paga con tu crédito mensual.' : 'Publica tu oferta y empieza a recibir creadores que traen audiencia real.'}
      </p>
    </td></tr>
    <tr><td style="padding:28px 40px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr><td style="background-color:${COLORS.purple};border-radius:12px;">
          <a href="${SITE_URL}/auth/sign-in" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};color:${COLORS.cream};font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
            Entrar a Midi Pass
          </a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:12px 40px 0;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:12px;font-weight:400;color:${COLORS.navy40};">
        Inicia sesión con <span style="color:${COLORS.navy70};font-weight:500;">${to}</span>
      </p>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <div style="height:1px;background-color:${COLORS.border};"></div>
    </td></tr>
    <tr><td style="padding:28px 40px 16px;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:13px;font-weight:500;color:${COLORS.navy};letter-spacing:0.2px;text-transform:uppercase;">
        ${isInfluencer ? 'Tu beneficio' : 'Siguiente paso'}
      </p>
    </td></tr>
    ${benefitsBlock}
    ${walletBlock}
    <tr><td style="padding:16px 40px 40px;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:12px;font-weight:400;color:${COLORS.navy40};line-height:1.6;">
        ¿Dudas? Escríbenos por WhatsApp. Estamos para ayudarte en cada visita.
      </p>
    </td></tr>
  `);

  return sendEmail(to, `Bienvenido a Midi Pass, ${firstName}`, html);
}

// ─────────────────────────────────────────────────────────
// Launch event (13 May 2026, Bogotá) — confirmation + .ics
// ─────────────────────────────────────────────────────────

const LAUNCH_EVENT = {
  title: "MIDI PASS LAUNCH",
  description: "Has sido seleccionado para vivir en exclusiva el lanzamiento de Midi Pass. Te esperamos en Amora Vida el miércoles 13 de mayo, 5:30 p.m.",
  location: "Amora Vida — Cr 12 # 98-87, Bogotá, Colombia",
  // 13 May 2026 17:30 Bogotá (UTC-5) → 22:30 UTC; 4h estimated.
  startUTC: "20260513T223000Z",
  endUTC: "20260514T023000Z",
};

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildLaunchICS(attendeeEmail: string, attendeeName: string): string {
  const uid = `launch-${Buffer.from(attendeeEmail.toLowerCase()).toString("hex")}@midi.io`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Midi Pass//Launch Event//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${LAUNCH_EVENT.startUTC}`,
    `DTEND:${LAUNCH_EVENT.endUTC}`,
    `SUMMARY:${icsEscape(LAUNCH_EVENT.title)}`,
    `DESCRIPTION:${icsEscape(LAUNCH_EVENT.description)}`,
    `LOCATION:${icsEscape(LAUNCH_EVENT.location)}`,
    "ORGANIZER;CN=Midi Pass:mailto:pass@midi.io",
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
  const firstName = (name || "").split(" ")[0] || "creador";

  const ics = buildLaunchICS(to, name || to);
  const icsB64 = Buffer.from(ics, "utf8").toString("base64");

  const html = wrap(`
    <tr><td style="padding:40px 40px 0;">
      <div style="display:inline-block;padding:6px 14px;background-color:${COLORS.lime};border-radius:999px;">
        <span style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:${COLORS.navy};letter-spacing:0.6px;text-transform:uppercase;">Estás dentro</span>
      </div>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <h1 style="margin:0;font-family:${FONT_STACK};font-size:32px;font-weight:300;color:${COLORS.navy};letter-spacing:-0.8px;line-height:1.15;">
        Nos vemos pronto,<br/>${firstName}.
      </h1>
    </td></tr>
    <tr><td style="padding:18px 40px 0;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:15px;font-weight:400;color:${COLORS.navy70};line-height:1.6;">
        Adjuntamos la invitación al calendario para que la guardes con un toque. Te esperamos en exclusiva en el lanzamiento de <span style="color:${COLORS.navy};font-weight:500;">Midi Pass</span>.
      </p>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.purpleLight};border-radius:14px;">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:11px;font-weight:600;color:${COLORS.navy70};letter-spacing:0.8px;text-transform:uppercase;">Save the date</p>
          <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:18px;font-weight:500;color:${COLORS.navy};letter-spacing:-0.2px;">Amora Vida</p>
          <p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:13px;font-weight:400;color:${COLORS.navy70};">miércoles</p>
          <p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:38px;font-weight:300;color:${COLORS.navy};letter-spacing:-1px;line-height:1;">13.05.2026</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.border};">
            <tr><td style="padding-top:14px;">
              <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:13px;color:${COLORS.navy70};">Cr 12 # 98-87</p>
              <p style="margin:0;font-family:${FONT_STACK};font-size:13px;color:${COLORS.navy70};">5:30 p.m.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 40px;">
      <p style="margin:0;font-family:${FONT_STACK};font-size:12px;font-weight:400;color:${COLORS.navy40};line-height:1.6;">
        Si el archivo .ics adjunto no se abre solo, puedes agregarlo manualmente desde tu app de calendario.
      </p>
    </td></tr>
  `);

  return sendEmail(to, "MIDI PASS LAUNCH · Estás dentro", html, [
    {
      filename: "midi-pass-launch.ics",
      content: icsB64,
      content_type: "text/calendar; method=REQUEST; charset=UTF-8",
    },
  ]);
}

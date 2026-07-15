import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import { sendRecruiterWelcome } from "@/lib/emails";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";
// Public host used for email image srcs and for fetching the guide PDF to
// attach. Hardcoded to the canonical prod host so assets resolve regardless of
// the deploy env (localhost/preview).
const ASSET_BASE = "https://www.curatocollective.com";

type EmailLang = "fr" | "en";

// Branded activation email for a new creator: darkened photo hero with the
// logo on the right, the login credentials, and a call to connect Instagram.
// The step-by-step guide is attached as a PDF (see fetchGuideBase64).
function creatorWelcomeEmail(lang: EmailLang, params: { firstName: string; handle: string; tempPassword: string }) {
  const { firstName, handle, tempPassword } = params;
  const t = lang === "en"
    ? {
        eyebrow: "Creator · Storyteller",
        h1: `Welcome,<br/>${firstName}.`,
        p1: "Your Curato space is ready. Here are your credentials to log in, then connect your Instagram account.",
        credsLabel: "Your credentials",
        handleLabel: "Handle",
        pwdLabel: "Temporary password",
        pwdNote: "You'll choose a personal password on your first login.",
        cta: "Access Curato",
        note: "Once logged in, click \"Connect Instagram\". The attached guide walks you through every step. Each month, you'll also receive an overview of how your engagement and visibility are growing with Curato.",
        sign: "Have a lovely day,<br/>Natalia",
      }
    : {
        eyebrow: "Créateur · Storyteller",
        h1: `Bienvenue,<br/>${firstName}.`,
        p1: "Ton espace Curato est prêt. Voici tes identifiants pour te connecter, puis relier ton compte Instagram.",
        credsLabel: "Tes identifiants",
        handleLabel: "Handle",
        pwdLabel: "Mot de passe temporaire",
        pwdNote: "Tu choisiras un mot de passe personnel à la première connexion.",
        cta: "Accéder à Curato",
        note: "Une fois connecté·e, clique sur « Connecter Instagram ». Le guide en pièce jointe t'explique tout, étape par étape. Chaque mois, tu recevras aussi un aperçu de l'évolution de ton engagement et de ta visibilité grâce à Curato.",
        sign: "Belle journée,<br/>Natalia",
      };

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#2b2b28;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2b2b28;"><tr><td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#1A1A1A;">
  <tr><td style="padding:0;position:relative;height:210px;background-color:#111;">
    <img src="${ASSET_BASE}/email-activation-bg.jpg" width="600" height="210" alt="" style="display:block;width:100%;height:210px;object-fit:cover;opacity:0.5;"/>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;height:210px;"><tr><td align="right" valign="middle" style="padding-right:64px;">
      <img src="${ASSET_BASE}/logo-curato-simple.png" alt="curato" height="30" style="display:block;height:30px;width:auto;"/>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:26px 46px 6px;"><p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">${t.eyebrow}</p></td></tr>
  <tr><td style="padding:8px 46px 22px;"><h1 style="margin:0;font-size:31px;font-weight:400;color:#F0EBE0;letter-spacing:0.02em;line-height:1.15;">${t.h1}</h1></td></tr>
  <tr><td style="padding:0 46px;"><p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#9a8f7f;">${t.p1}</p></td></tr>
  <tr><td style="padding:0 46px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;"><tr><td style="padding:22px 26px;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#5a5040;">${t.credsLabel}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#5a5040;">${t.handleLabel}</p>
      <p style="margin:0 0 18px;font-size:17px;font-weight:400;color:#CBB78F;">@${handle}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#5a5040;">${t.pwdLabel}</p>
      <p style="margin:0 0 14px;font-size:17px;font-weight:400;color:#CBB78F;letter-spacing:0.1em;">${tempPassword}</p>
      <p style="margin:0;font-size:11px;color:#4a4030;line-height:1.6;">${t.pwdNote}</p>
    </td></tr></table>
  </td></tr>
  <tr><td align="right" style="padding:0 64px 26px;"><a href="${ASSET_BASE}/auth/sign-in" style="display:inline-block;background-color:#CBB78F;color:#1A1A1A;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;padding:15px 32px;text-decoration:none;font-family:Georgia,serif;">${t.cta}</a></td></tr>
  <tr><td style="padding:0 46px 40px;"><p style="margin:0;font-size:13px;line-height:1.75;color:#6f6558;">${t.note}<br/><br/>${t.sign}</p></td></tr>
  <tr><td style="background-color:#141414;padding:22px 46px;"><p style="margin:0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#4a4030;">Paris · Sur invitation · <a href="${ASSET_BASE}" style="color:#4a4030;text-decoration:none;">curatocollective.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

// Pulls the connect-Instagram guide PDF (served from /guides) and returns it as
// base64 so it can be attached. Best-effort: a failure just omits the attachment.
async function fetchGuideBase64(lang: EmailLang): Promise<string | null> {
  try {
    const res = await fetch(`${ASSET_BASE}/guides/curato-connect-instagram-${lang}.pdf`);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

function welcomeEmail(params: {
  name: string;
  type: "creator" | "maison";
  identifier: string; // handle for creators, email for maisons
  tempPassword: string;
}) {
  const { name, type, identifier, tempPassword } = params;
  const firstName = name.split(" ")[0];
  const isCreator = type === "creator";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Curato</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1A1A;font-family:Georgia,'Times New Roman',Times,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <tr>
        <td style="padding:0;position:relative;height:280px;overflow:hidden;background-color:#111;">
          <img src="${BASE}/hero-floral.jpeg" alt="" width="600" style="display:block;width:100%;height:280px;object-fit:cover;opacity:0.45;" />
          <table width="100%" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;right:0;bottom:0;height:280px;">
            <tr><td align="center" valign="middle">
              <img src="${BASE}/logo-curato-simple.png" alt="curato" height="20" style="display:block;" />
            </td></tr>
          </table>
        </td>
      </tr>

      <tr><td style="background:linear-gradient(to bottom,#111 0%,#1A1A1A 100%);height:40px;"></td></tr>

      <tr><td style="background-color:#1A1A1A;padding:0 48px 14px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">
          ${isCreator ? "Créateur · Creator" : "Maison partenaire"}
        </p>
      </td></tr>

      <tr><td style="background-color:#1A1A1A;padding:14px 48px 40px;">
        <h1 style="margin:0;font-size:34px;font-weight:300;letter-spacing:0.25em;text-transform:uppercase;color:#F0EBE0;line-height:1.15;">
          Bienvenue,<br />${firstName}.
        </h1>
      </td></tr>

      <tr><td style="background-color:#1A1A1A;padding:0 48px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background-color:#2a2a2a;"></td></tr></table>
      </td></tr>

      <tr><td style="background-color:#1A1A1A;padding:32px 48px 28px;">
        <p style="margin:0;font-size:15px;font-weight:300;line-height:1.75;color:#7a7060;">
          ${isCreator
            ? "Votre accès à l'écosystème Curato est prêt. Votre crédit mensuel vous attend — explorez les adresses sélectionnées à Paris."
            : "Votre maison rejoint le carnet Curato. Des créateurs parisiens vous découvriront prochainement."
          }
        </p>
      </td></tr>

      <tr><td style="background-color:#1A1A1A;padding:0 48px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#5a5040;">Vos identifiants</p>
            <p style="margin:0 0 6px;font-size:12px;color:#5a5040;letter-spacing:0.05em;">
              ${isCreator ? "Handle" : "Email"}
            </p>
            <p style="margin:0 0 22px;font-size:17px;font-weight:300;color:#CBB78F;letter-spacing:0.05em;">
              ${isCreator ? `@${identifier}` : `<a href="mailto:${identifier}" style="color:#CBB78F;text-decoration:none;">${identifier}</a>`}
            </p>
            <p style="margin:0 0 6px;font-size:12px;color:#5a5040;letter-spacing:0.05em;">Mot de passe temporaire</p>
            <p style="margin:0 0 16px;font-size:17px;font-weight:300;color:#CBB78F;letter-spacing:0.12em;">${tempPassword}</p>
            <p style="margin:0;font-size:11px;color:#4a4030;line-height:1.6;">
              Vous serez invité·e à choisir un mot de passe personnel à la première connexion.
            </p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="background-color:#1A1A1A;padding:0 48px 52px;">
        <a href="${BASE}/auth/sign-in" style="display:inline-block;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;color:#1A1A1A;background-color:#CBB78F;padding:16px 36px;text-decoration:none;">
          Accéder à Curato
        </a>
      </td></tr>

      <tr><td style="background-color:#141414;padding:28px 48px;">
        <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#4a4030;">Paris · Sur invitation · <a href="${BASE}" style="color:#4a4030;text-decoration:none;">curatocollective.com</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const ok = await isAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, name, email, handle, followers, monthly_credit } = body;
  const emailLang: EmailLang = body.lang === "en" ? "en" : "fr";

  if (!type || !name || !email) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const emailLc = email.toLowerCase().trim();
  const tempPassword = `Curato${Math.floor(100000 + Math.random() * 900000)}!`;

  // 1. Create or update Supabase Auth user
  const cleanHandle = (handle || "").replace("@", "").trim().toLowerCase() ||
    name.toLowerCase().replace(/\s+/g, "").slice(0, 20);

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: emailLc,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { force_password_change: true, handle: cleanHandle },
  });

  let userId: string | null = authData?.user?.id ?? null;

  if (authErr) {
    // User might already exist — find and update
    const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listData?.users?.find((u) => u.email === emailLc);
    if (existing) {
      userId = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        user_metadata: { force_password_change: true, handle: cleanHandle },
      });
    } else {
      return NextResponse.json({ error: `Error creando usuario: ${authErr.message}` }, { status: 500 });
    }
  }

  // 2. Create DB record
  if (type === "creator") {
    const { error: dbErr } = await supabase.from("creators").upsert({
      full_name: name,
      email: emailLc,
      handle: cleanHandle,
      stage: "active",
      monthly_credit_cop: Number(monthly_credit) || 300,
      credit_used_cop: 0,
      followers: Number(followers) || 0,
      ...(userId ? { owner_id: userId } : {}),
    }, { onConflict: "email" });

    if (dbErr) return NextResponse.json({ error: `Error DB: ${dbErr.message}` }, { status: 500 });

  } else if (type === "maison") {
    const { error: dbErr } = await supabase.from("comercios").upsert({
      name,
      email: emailLc,
      contact_name: name,
      stage: "activo",
      ...(userId ? { owner_id: userId } : {}),
    }, { onConflict: "email" });

    if (dbErr) return NextResponse.json({ error: `Error DB: ${dbErr.message}` }, { status: 500 });
  } else if (type === "recruiter") {
    const { error: dbErr } = await supabase.from("recruiters").upsert({
      full_name: name,
      email: emailLc,
      ...(userId ? { owner_id: userId } : {}),
    }, { onConflict: "email" });

    if (dbErr) return NextResponse.json({ error: `Error DB: ${dbErr.message}` }, { status: 500 });
  }

  // 3. Send welcome email
  try {
    const firstName = name.split(" ")[0];
    if (type === "creator") {
      // New creators get the branded activation email in the chosen language,
      // with the connect-Instagram guide attached (best-effort).
      const guide = await fetchGuideBase64(emailLang);
      await resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: emailLc,
        subject: emailLang === "en" ? `Welcome to Curato, ${firstName}.` : `Bienvenue dans Curato, ${firstName}.`,
        html: creatorWelcomeEmail(emailLang, { firstName, handle: cleanHandle, tempPassword }),
        attachments: guide
          ? [{
              filename: emailLang === "en" ? "Curato - Connect Instagram.pdf" : "Curato - Connecter Instagram.pdf",
              content: guide,
            }]
          : undefined,
      });
    } else if (type === "recruiter") {
      await sendRecruiterWelcome(emailLc, { name, email: emailLc, tempPassword });
    } else {
      await resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: emailLc,
        subject: `Bienvenue dans Curato, ${firstName}.`,
        html: welcomeEmail({ name, type: "maison", identifier: emailLc, tempPassword }),
      });
    }
  } catch (emailErr) {
    console.error("Email error:", emailErr);
    // Don't fail — user is created, email is cosmetic
  }

  return NextResponse.json({ ok: true, tempPassword });
}

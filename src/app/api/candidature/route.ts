import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE = "https://curatocollective.com";

function confirmationEmail(name: string, typeLabel: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Curato</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1A1A;font-family:Georgia,'Times New Roman',Times,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- Hero image with overlay effect -->
        <tr>
          <td style="padding:0;position:relative;height:320px;overflow:hidden;background-color:#111;background-image:url('${BASE}/hero-floral.jpeg');background-size:cover;background-position:center;">
            <img src="${BASE}/hero-floral.jpeg" alt="" width="600" style="display:block;width:100%;height:320px;object-fit:cover;object-position:center;opacity:0.55;" />
            <!-- Logo centered over image -->
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0;">
                    <img src="${BASE}/logo-curato-simple.png" alt="curato" height="14" style="display:block;height:14px;width:auto;" />
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Dark gradient bridge -->
        <tr>
          <td style="background:linear-gradient(to bottom,#111 0%,#1A1A1A 100%);height:40px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#1A1A1A;padding:0 48px 16px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Candidature reçue</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1A1A1A;padding:16px 48px 40px;">
            <h1 style="margin:0;font-size:34px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#F0EBE0;line-height:1.1;">
              Merci,<br />${name}.
            </h1>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="background-color:#1A1A1A;padding:0 48px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background-color:#2a2a2a;"></td></tr></table>
          </td>
        </tr>

        <!-- Text -->
        <tr>
          <td style="background-color:#1A1A1A;padding:36px 48px 20px;">
            <p style="margin:0;font-size:16px;font-weight:300;line-height:1.8;color:#7a7060;">
              Nous avons bien reçu votre candidature en tant que<br />
              <span style="color:#CBB78F;">${typeLabel}</span>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1A1A1A;padding:0 48px 48px;">
            <p style="margin:0;font-size:16px;font-weight:300;line-height:1.8;color:#7a7060;">
              Chaque candidature est étudiée manuellement avec soin.<br />
              Nous vous contacterons prochainement.
            </p>
          </td>
        </tr>

        <!-- Photo strip -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:0;line-height:0;">
                  <img src="${BASE}/Background Image 7.jpeg" alt="" width="300" style="display:block;width:100%;height:180px;object-fit:cover;opacity:0.7;" />
                </td>
                <td width="50%" style="padding:0;line-height:0;">
                  <img src="${BASE}/Background Image 3.jpeg" alt="" width="300" style="display:block;width:100%;height:180px;object-fit:cover;opacity:0.7;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#141414;padding:32px 48px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#3a3028;">Paris · Sur invitation</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function notificationEmail(name: string, typeLabel: string, email: string, instagram?: string, website?: string, message?: string) {
  const rows = [
    { label: "Type", value: typeLabel },
    { label: "Email", value: `<a href="mailto:${email}" style="color:#CBB78F;text-decoration:none;">${email}</a>` },
    ...(instagram ? [{ label: "Instagram", value: instagram }] : []),
    ...(website ? [{ label: "Site web", value: `<a href="${website}" style="color:#CBB78F;text-decoration:none;">${website}</a>` }] : []),
    ...(message ? [{ label: "Message", value: message }] : []),
  ];

  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:12px 0;border-top:1px solid #2e2e2e;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#5a5040;width:110px;vertical-align:top;padding-right:20px;">${r.label}</td>
      <td style="padding:12px 0;border-top:1px solid #2e2e2e;font-size:15px;font-weight:300;color:#9a9080;line-height:1.6;">${r.value}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Curato — Nouvelle candidature</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1A1A;font-family:Georgia,'Times New Roman',Times,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- Thin image bar -->
        <tr>
          <td style="padding:0;line-height:0;">
            <img src="${BASE}/Background Image 8.jpeg" alt="" width="600" style="display:block;width:100%;height:120px;object-fit:cover;object-position:center;opacity:0.5;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#1A1A1A;padding:40px 48px 16px;">
            <img src="${BASE}/logo-curato-simple.png" alt="curato" height="12" style="display:block;height:12px;width:auto;margin-bottom:36px;" />
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Nouvelle candidature</p>
            <h1 style="margin:0 0 32px;font-size:26px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#F0EBE0;">${name}</h1>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#141414;padding:28px 48px;margin-top:32px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#3a3028;">Paris · Sur invitation</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const { type, name, email, instagram, website, message } = await req.json();

  const typeLabel = type === "creator" ? "Créateur · Créatrice" : "Maison · Commerce";
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error: dbError } = await supabase.from("applications").insert({
    type,
    name,
    email: normalizedEmail,
    instagram: instagram || null,
    website: website || null,
    message: message || null,
  });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  try {
    await Promise.all([
      resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: normalizedEmail,
        subject: "Votre candidature a bien été reçue — Curato",
        html: confirmationEmail(name, typeLabel),
      }),
      resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: "hello@curatocollective.com",
        subject: `Nouvelle candidature — ${typeLabel} — ${name}`,
        html: notificationEmail(name, typeLabel, normalizedEmail, instagram, website, message),
      }),
    ]);
  } catch (emailErr) {
    console.error("Email send error:", emailErr);
  }

  return NextResponse.json({ ok: true });
}

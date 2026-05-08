import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

function confirmationEmail(name: string, typeLabel: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Curato</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1A1A;font-family:Georgia,'Times New Roman',Times,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:56px;">
              <img src="https://curatocollective.com/logo-curato-simple.png" alt="curato" height="13" style="display:block;height:13px;width:auto;" />
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding-bottom:28px;">
              <span style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;font-weight:300;">Candidature reçue</span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #2e2e2e;">
              <h1 style="margin:0;font-size:36px;font-weight:300;letter-spacing:0.22em;text-transform:uppercase;color:#F0EBE0;line-height:1.1;">
                Merci,<br />${name}.
              </h1>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:36px;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:20px;">
              <p style="margin:0;font-size:16px;font-weight:300;line-height:1.75;color:#9a9080;">
                Nous avons bien reçu votre candidature en tant que
                <span style="color:#CBB78F;font-weight:300;">${typeLabel}</span>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:48px;">
              <p style="margin:0;font-size:16px;font-weight:300;line-height:1.75;color:#9a9080;">
                Chaque candidature est étudiée manuellement avec soin.<br />
                Nous vous contacterons prochainement.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background-color:#2e2e2e;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td>
              <p style="margin:0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#5a5040;font-weight:300;">
                Paris · Sur invitation
              </p>
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
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A1A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:48px;">
              <img src="https://curatocollective.com/logo-curato-simple.png" alt="curato" height="13" style="display:block;height:13px;width:auto;" />
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding-bottom:20px;">
              <span style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Nouvelle candidature</span>
            </td>
          </tr>

          <!-- Name -->
          <tr>
            <td style="padding-bottom:40px;border-bottom:1px solid #2e2e2e;">
              <h1 style="margin:0;font-size:28px;font-weight:300;letter-spacing:0.22em;text-transform:uppercase;color:#F0EBE0;">
                ${name}
              </h1>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:8px;"></td></tr>

          <!-- Data table -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rowsHtml}
              </table>
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

  // Insert into Supabase
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

  // Send emails
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

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE = "https://curatocollective.com";

function acceptedEmail(name: string, type: string, handle: string, tempPassword: string) {
  const isCreator = type === "creator";
  const firstName = name.split(" ")[0];
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
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <!-- Hero -->
      <tr>
        <td style="padding:0;position:relative;height:300px;overflow:hidden;background-color:#111;">
          <img src="${BASE}/hero-floral.jpeg" alt="" width="600" style="display:block;width:100%;height:300px;object-fit:cover;object-position:center;opacity:0.5;" />
          <table width="100%" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;right:0;bottom:0;height:300px;">
            <tr><td align="center" valign="middle" style="height:300px;">
              <img src="${BASE}/logo-curato-simple.png" alt="curato" height="22" style="display:block;height:22px;width:auto;" />
            </td></tr>
          </table>
        </td>
      </tr>

      <!-- Bridge -->
      <tr><td style="background:linear-gradient(to bottom,#111 0%,#1A1A1A 100%);height:40px;"></td></tr>

      <!-- Badge -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px 16px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">Candidature acceptée</p>
      </td></tr>

      <!-- Heading -->
      <tr><td style="background-color:#1A1A1A;padding:16px 48px 40px;">
        <h1 style="margin:0;font-size:36px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:#F0EBE0;line-height:1.1;">
          Bienvenue,<br />${firstName}.
        </h1>
      </td></tr>

      <!-- Divider -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background-color:#2a2a2a;"></td></tr></table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background-color:#1A1A1A;padding:36px 48px 20px;">
        <p style="margin:0;font-size:16px;font-weight:300;line-height:1.7;color:#7a7060;">
          Votre candidature en tant que <span style="color:#CBB78F;">${isCreator ? "créateur · créatrice" : "maison partenaire"}</span> a été acceptée.<br /><br />
          ${isCreator
            ? "Vous faites désormais partie de l'écosystème Curato. Votre crédit mensuel vous attend."
            : "Votre maison rejoint le carnet Curato. Des créateurs parisiens vous découvriront prochainement."
          }
        </p>
      </td></tr>

      <!-- Credentials -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#7a7060;">Vos identifiants</p>
            <p style="margin:0 0 8px;font-size:13px;color:#5a5040;">Identifiant</p>
            <p style="margin:0 0 20px;font-size:18px;font-weight:300;color:#CBB78F;letter-spacing:0.05em;">@${handle || name.toLowerCase().replace(/\s+/g, "")}</p>
            <p style="margin:0 0 8px;font-size:13px;color:#5a5040;">Mot de passe temporaire</p>
            <p style="margin:0;font-size:18px;font-weight:300;color:#CBB78F;letter-spacing:0.1em;">${tempPassword}</p>
            <p style="margin:12px 0 0;font-size:11px;color:#5a5040;">Vous serez invité·e à changer votre mot de passe à la première connexion.</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px 48px;">
        <a href="${BASE}/auth/sign-in" style="display:inline-block;font-family:Georgia,'Times New Roman',Times,serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#1A1A1A;background-color:#CBB78F;padding:16px 32px;text-decoration:none;">
          Accéder à Curato
        </a>
      </td></tr>

      <!-- Photo strip -->
      <tr><td style="padding:0;">
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
      </td></tr>

      <!-- Footer -->
      <tr><td style="background-color:#141414;padding:32px 48px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">Paris · Sur invitation</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function rejectedEmail(name: string, type: string) {
  const firstName = name.split(" ")[0];
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
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <!-- Hero -->
      <tr>
        <td style="padding:0;position:relative;height:300px;overflow:hidden;background-color:#111;">
          <img src="${BASE}/hero-floral.jpeg" alt="" width="600" style="display:block;width:100%;height:300px;object-fit:cover;object-position:center;opacity:0.35;" />
          <table width="100%" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;right:0;bottom:0;height:300px;">
            <tr><td align="center" valign="middle" style="height:300px;">
              <img src="${BASE}/logo-curato-simple.png" alt="curato" height="22" style="display:block;height:22px;width:auto;" />
            </td></tr>
          </table>
        </td>
      </tr>

      <!-- Bridge -->
      <tr><td style="background:linear-gradient(to bottom,#111 0%,#1A1A1A 100%);height:40px;"></td></tr>

      <!-- Badge -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px 16px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Candidature</p>
      </td></tr>

      <!-- Heading -->
      <tr><td style="background-color:#1A1A1A;padding:16px 48px 40px;">
        <h1 style="margin:0;font-size:36px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:#F0EBE0;line-height:1.1;">
          Merci,<br />${firstName}.
        </h1>
      </td></tr>

      <!-- Divider -->
      <tr><td style="background-color:#1A1A1A;padding:0 48px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background-color:#2a2a2a;"></td></tr></table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background-color:#1A1A1A;padding:36px 48px 48px;">
        <p style="margin:0;font-size:16px;font-weight:300;line-height:1.7;color:#7a7060;">
          Nous avons étudié votre candidature avec soin.<br /><br />
          À ce stade, nous ne sommes pas en mesure de vous accueillir dans l'écosystème Curato. Les places sont très limitées et chaque sélection est faite manuellement.<br /><br />
          <span style="color:#5a5040;">Nous vous souhaitons la meilleure suite.</span>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background-color:#141414;padding:32px 48px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">Paris · Sur invitation</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function PATCH(request: NextRequest) {
  const ok = await isAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: app } = await supabase
    .from("applications")
    .select("name, email, type, instagram, website")
    .eq("id", id)
    .single();

  // Update application status
  const { error: statusErr } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  if (statusErr) return NextResponse.json({ error: statusErr.message }, { status: 500 });

  if (status === "approved" && app) {
    const handle = ((app as any).instagram || "").replace("@", "").trim().toLowerCase() ||
      app.name.toLowerCase().replace(/\s+/g, "");
    const tempPassword = `Curato${Math.floor(100000 + Math.random() * 900000)}!`;

    // Create Supabase auth user with temp password
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { force_password_change: true, handle },
    });

    // If user already exists, update their password
    if (authErr && authData === null) {
      console.error("createUser error:", authErr.message);
    }

    // Create creator or comercio record
    if (app.type === "creator") {
      const { error: creatorErr } = await supabase.from("creators").upsert({
        full_name: app.name,
        email: app.email,
        handle,
        stage: "active",
        monthly_credit_cop: 300,
        credit_used_cop: 0,
      }, { onConflict: "email" });
      if (creatorErr) console.error("Creator upsert error:", creatorErr);
    } else if (app.type === "business") {
      const { error: comercioErr } = await supabase.from("comercios").upsert({
        name: app.name,
        email: app.email,
        contact_name: app.name,
        stage: "activo",
        website_url: (app as any).website || null,
      }, { onConflict: "email" });
      if (comercioErr) console.error("Comercio upsert error:", comercioErr);
    }

    // Send acceptance email with credentials
    try {
      await resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: app.email,
        subject: `Bienvenue dans Curato, ${app.name.split(" ")[0]}.`,
        html: acceptedEmail(app.name, app.type, handle, tempPassword),
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }
  } else if (status === "rejected" && app?.email && app?.name) {
    try {
      await resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: app.email,
        subject: `Votre candidature Curato — ${app.name.split(" ")[0]}`,
        html: rejectedEmail(app.name, app.type),
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}

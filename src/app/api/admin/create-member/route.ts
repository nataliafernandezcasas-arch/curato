import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com";

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
              ${isCreator ? `@${identifier}` : identifier}
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
        <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#4a4030;">Paris · Sur invitation · curatocollective.com</p>
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
  }

  // 3. Send welcome email
  try {
    await resend.emails.send({
      from: "Curato <hello@curatocollective.com>",
      to: emailLc,
      subject: `Bienvenue dans Curato, ${name.split(" ")[0]}.`,
      html: welcomeEmail({
        name,
        type: type === "maison" ? "maison" : "creator",
        identifier: type === "creator" ? cleanHandle : emailLc,
        tempPassword,
      }),
    });
  } catch (emailErr) {
    console.error("Email error:", emailErr);
    // Don't fail — user is created, email is cosmetic
  }

  return NextResponse.json({ ok: true, tempPassword });
}

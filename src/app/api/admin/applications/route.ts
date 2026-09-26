import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccessCode } from "@/lib/emails";
import { isAdmin } from "@/lib/admin/auth";
import { suggestedBudgetEUR } from "@/lib/credits";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE = "https://curatocollective.com";


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

  const { id, status, followers, budget } = await request.json();
  if (!id || !["approved", "rejected", "deleted", "pending"].includes(status)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  // Monthly budget in EUR: use the value the admin set, else derive it from the
  // follower count (Micro 500 / Nano 750 / Mid 1000 / Macro 3000).
  const monthlyBudget =
    typeof budget === "number" && budget >= 0
      ? budget
      : suggestedBudgetEUR(typeof followers === "number" ? followers : 0);

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

  if (status === "deleted" || status === "pending") {
    return NextResponse.json({ ok: true });
  }

  if (status === "approved" && app) {
    const handle = ((app as any).instagram || "").replace("@", "").trim().toLowerCase() ||
      app.name.toLowerCase().replace(/\s+/g, "");
    // La contraseña de la cuenta se crea aleatoria y no se comunica: la
    // persona entra con su código de bienvenida y fija la suya. Antes se le
    // mandaba una contraseña provisional por correo, que es justo lo que no
    // hay que hacer.
    const tempPassword = `Curato-${crypto.randomUUID()}`;
    const accessCode = String(Math.floor(100000 + Math.random() * 900000));
    const accessCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create Supabase auth user with temp password
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { force_password_change: true, handle },
    });

    // If user already exists, find them and update their password
    if (authErr) {
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = listData?.users?.find((u) => u.email === app.email);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password: tempPassword,
          user_metadata: { force_password_change: true, handle },
        });
      } else {
        console.error("createUser error:", authErr.message);
      }
    }

    // Create creator or comercio record
    if (app.type === "creator") {
      const { error: creatorErr } = await supabase.from("creators").upsert({
        full_name: app.name,
        email: app.email,
        handle,
        stage: "active",
        monthly_credit_cop: monthlyBudget,
        credit_used_cop: 0,
        ...(followers != null ? { followers } : {}),
      }, { onConflict: "email" });
      if (creatorErr) console.error("Creator upsert error:", creatorErr);
    } else if (app.type === "business" || app.type === "maison") {
      const { error: comercioErr } = await supabase.from("comercios").upsert({
        name: app.name,
        email: app.email,
        contact_name: app.name,
        stage: "activo",
        website_url: (app as any).website || null,
      }, { onConflict: "email" });
      if (comercioErr) console.error("Comercio upsert error:", comercioErr);
    }

    // El código de bienvenida, guardado antes de mandarlo: si el correo falla,
    // el código sigue siendo válido y se puede reenviar.
    const { error: codeErr } = await supabase
      .from("applications")
      .update({
        access_code: accessCode,
        access_code_expires_at: accessCodeExpiresAt.toISOString(),
        access_code_attempts: 0,
      })
      .eq("id", id);
    if (codeErr) console.error("access code save error:", codeErr);

    try {
      await sendAccessCode({ to: app.email, code: accessCode, expiresAt: accessCodeExpiresAt });
    } catch (emailErr) {
      console.error("Access code email failed:", emailErr);
      return NextResponse.json({ ok: true, emailSent: false, code: accessCode });
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

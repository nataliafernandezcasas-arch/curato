import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PORTFOLIO_BUCKET,
  PORTFOLIO_MIN,
  PORTFOLIO_MAX,
  PORTFOLIO_MAX_BYTES,
  isAllowedImage,
} from "@/lib/candidature-portfolio";

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
            <table width="100%" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;right:0;bottom:0;height:320px;">
              <tr>
                <td align="center" valign="middle" style="padding:0;height:320px;">
                  <img src="${BASE}/logo-curato-simple.png" alt="curato" height="22" style="display:block;height:22px;width:auto;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Dark gradient bridge -->
        <tr>
          <td style="background:linear-gradient(to bottom,#111 0%,#1A1A1A 100%);height:40px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#1A1A1A;padding:0 48px 16px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Candidature reçue</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1A1A1A;padding:16px 48px 40px;">
            <h1 style="margin:0;font-size:34px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:#F0EBE0;line-height:1.1;">
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
            <p style="margin:0;font-size:16px;font-weight:300;line-height:1.625;color:#7a7060;">
              Nous avons bien reçu votre candidature en tant que<br />
              <span style="color:#CBB78F;">${typeLabel}</span>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1A1A1A;padding:36px 48px 20px;">
            <p style="margin:0;font-size:16px;font-weight:300;line-height:1.625;color:#7a7060;">
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
            <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">Paris · Sur invitation</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function notificationEmail(name: string, typeLabel: string, email: string, instagram?: string, website?: string, message?: string, photoStyle?: string, photoCount?: number, applicationId?: string) {
  const rows = [
    { label: "Type", value: typeLabel },
    { label: "Email", value: `<a href="mailto:${email}" style="color:#CBB78F;text-decoration:none;">${email}</a>` },
    ...(instagram ? [{ label: "Instagram", value: instagram }] : []),
    ...(website ? [{ label: "Site web", value: `<a href="${website}" style="color:#CBB78F;text-decoration:none;">${website}</a>` }] : []),
    ...(message ? [{ label: "Message", value: message }] : []),
    ...(photoStyle ? [{ label: "Regard", value: photoStyle }] : []),
    // The photographs live in a private bucket, so the email carries a count and
    // a way in rather than links that would either leak or expire.
    ...(photoCount
      ? [{
          label: "Portfolio",
          value: applicationId
            ? `${photoCount} photographie${photoCount > 1 ? "s" : ""} · <a href="${BASE}/admin/applications/${applicationId}" style="color:#CBB78F;text-decoration:none;">Voir la candidature</a>`
            : `${photoCount} photographie${photoCount > 1 ? "s" : ""}`,
        }]
      : []),
  ];

  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:12px 0;border-top:1px solid #2e2e2e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#5a5040;width:110px;vertical-align:top;padding-right:20px;">${r.label}</td>
      <td style="padding:12px 0;border-top:1px solid #2e2e2e;font-size:15px;font-weight:300;color:#9a9080;line-height:1.625;">${r.value}</td>
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
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#9a8a6a;">Nouvelle candidature</p>
            <h1 style="margin:0 0 32px;font-size:26px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:#F0EBE0;">${name}</h1>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#141414;padding:28px 48px;margin-top:32px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#CBB78F;">Paris · Sur invitation</p>
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
  // Multipart, not JSON: a creator application now carries photographs.
  const formData = await req.formData();
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  const type = str("type");
  const name = str("name");
  const email = str("email");
  const instagram = str("instagram");
  const website = str("website");
  const message = str("message");
  const photoStyle = str("photo_style");
  const age_confirmed = formData.get("age_confirmed") === "true";
  const terms_accepted = formData.get("terms_accepted") === "true";
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!type || !name || !email) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  // RGPD: 18+ attestation required (declared in /privacidad section 11).
  if (age_confirmed !== true) {
    return NextResponse.json(
      { error: "Vous devez avoir 18 ans révolus pour candidater." },
      { status: 400 }
    );
  }

  // Express acceptance of Terms required (declared in /condiciones section 3).
  if (terms_accepted !== true) {
    return NextResponse.json(
      { error: "Vous devez accepter les Conditions Générales pour candidater." },
      { status: 400 }
    );
  }

  // A creator is judged on their eye, so the portfolio is not optional for them.
  // A maison sends no photographs and is not asked for any.
  if (type === "creator") {
    if (!photoStyle) {
      return NextResponse.json(
        { error: "Décrivez votre regard en quelques mots." },
        { status: 400 }
      );
    }
    if (photos.length < PORTFOLIO_MIN || photos.length > PORTFOLIO_MAX) {
      return NextResponse.json(
        { error: `Joignez entre ${PORTFOLIO_MIN} et ${PORTFOLIO_MAX} photographies.` },
        { status: 400 }
      );
    }
    for (const photo of photos) {
      if (!isAllowedImage(photo.type)) {
        return NextResponse.json(
          { error: "Format non accepté. JPEG, PNG ou WEBP." },
          { status: 400 }
        );
      }
      if (photo.size > PORTFOLIO_MAX_BYTES) {
        return NextResponse.json(
          { error: "Une des photographies est trop lourde." },
          { status: 400 }
        );
      }
    }
  }

  const typeLabel = type === "creator" ? "Créateur · Créatrice" : "Maison · Commerce";
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: inserted, error: dbError } = await supabase
    .from("applications")
    .insert({
      type,
      name,
      email: normalizedEmail,
      instagram: instagram || null,
      website: website || null,
      message: message || null,
      photo_style: photoStyle,
    })
    .select("id")
    .single();

  if (dbError || !inserted) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json({ error: dbError?.message ?? "Erreur" }, { status: 500 });
  }

  // The application is saved before the photographs are. If a file fails to
  // upload we would rather hold an application with a thin portfolio than lose
  // the candidature altogether, so a failure here is logged, not fatal.
  const applicationId = inserted.id as string;
  const uploadedPaths: string[] = [];

  if (photos.length > 0) {
    const admin = createAdminClient();
    for (const [i, photo] of photos.entries()) {
      const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
      const path = `${applicationId}/${String(i + 1).padStart(2, "0")}.${ext}`;
      const { error: uploadError } = await admin.storage
        .from(PORTFOLIO_BUCKET)
        .upload(path, Buffer.from(await photo.arrayBuffer()), {
          contentType: photo.type,
          upsert: true,
        });
      if (uploadError) {
        console.error("Portfolio upload error:", uploadError);
        continue;
      }
      uploadedPaths.push(path);
    }

    if (uploadedPaths.length > 0) {
      await admin
        .from("applications")
        .update({ portfolio_paths: uploadedPaths })
        .eq("id", applicationId);
    }
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
        html: notificationEmail(
          name, typeLabel, normalizedEmail,
          instagram ?? undefined, website ?? undefined, message ?? undefined,
          photoStyle ?? undefined, uploadedPaths.length, applicationId
        ),
      }),
    ]);
  } catch (emailErr) {
    console.error("Email send error:", emailErr);
  }

  return NextResponse.json({ ok: true });
}

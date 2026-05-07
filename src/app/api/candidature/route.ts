import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { type, name, email } = await req.json();

  const typeLabel = type === "creator" ? "Créateur · Créatrice" : "Maison · Commerce";

  try {
    await Promise.all([
      // Confirmation to applicant
      resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: email,
        subject: "Votre candidature a bien été reçue",
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1E1E1E; padding: 48px 32px;">
            <img src="https://curatocollective.com/logo-curato-simple.png" alt="curato" style="height: 12px; margin-bottom: 40px;" />
            <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #9a8a6a; margin-bottom: 24px;">Candidature reçue</p>
            <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 24px;">Merci, ${name}.</h1>
            <p style="font-size: 16px; font-weight: 300; line-height: 1.7; color: #4a4a4a; margin-bottom: 16px;">
              Nous avons bien reçu votre candidature en tant que <strong style="font-weight: 400;">${typeLabel}</strong>.
            </p>
            <p style="font-size: 16px; font-weight: 300; line-height: 1.7; color: #4a4a4a; margin-bottom: 40px;">
              Chaque candidature est étudiée manuellement avec soin. Nous vous contacterons prochainement.
            </p>
            <hr style="border: none; border-top: 1px solid #e8e0d0; margin-bottom: 32px;" />
            <p style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #9a8a6a;">Paris · Sur invitation</p>
          </div>
        `,
      }),

      // Notification to team
      resend.emails.send({
        from: "Curato <hello@curatocollective.com>",
        to: "hello@curatocollective.com",
        subject: `Nouvelle candidature — ${typeLabel} — ${name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1E1E1E; padding: 48px 32px;">
            <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #9a8a6a; margin-bottom: 24px;">Nouvelle candidature</p>
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 32px;">${name}</h1>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-top: 1px solid #e8e0d0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #9a8a6a; width: 120px;">Type</td><td style="padding: 10px 0; border-top: 1px solid #e8e0d0; font-size: 15px; font-weight: 300;">${typeLabel}</td></tr>
              <tr><td style="padding: 10px 0; border-top: 1px solid #e8e0d0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #9a8a6a;">Email</td><td style="padding: 10px 0; border-top: 1px solid #e8e0d0; font-size: 15px; font-weight: 300;"><a href="mailto:${email}" style="color: #CBB78F;">${email}</a></td></tr>
            </table>
          </div>
        `,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}

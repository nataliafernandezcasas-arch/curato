import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "Curato <hello@curatocollective.com>",
      to: "hello@curatocollective.com",
      replyTo: email,
      subject: `Curato · Demande de visite — ${name}`,
      html: `
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Message :</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ error: "Email error" }, { status: 500 });
  }
}

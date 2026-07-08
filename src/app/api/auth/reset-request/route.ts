import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordReset } from "@/lib/emails";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.curatocollective.com";

// Password reset request. Resolves a handle/email to the account email, then
// generates a Supabase recovery link and delivers it via Resend (reliable),
// instead of Supabase's rate-limited built-in auth email. Always returns ok so
// we never leak which accounts exist.
export async function POST(request: NextRequest) {
  try {
    const { handle } = (await request.json()) as { handle?: string };
    if (!handle) return NextResponse.json({ ok: true });

    const admin = createAdminClient();
    const clean = handle.trim().toLowerCase().replace(/^@/, "");

    // Resolve to an email: creator handle → comercio email → raw email.
    let email: string | null = null;
    const { data: creator } = await admin.from("creators").select("email").ilike("handle", clean).maybeSingle();
    if (creator?.email) email = creator.email;
    if (!email && clean.includes("@")) {
      const { data: comercio } = await admin.from("comercios").select("email").ilike("email", clean).maybeSingle();
      email = comercio?.email || clean;
    }
    if (!email) return NextResponse.json({ ok: true });

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/auth/callback?next=/auth/change-password` },
    });
    // No auth user for this email (or other error) — stay silent.
    const link = data?.properties?.action_link;
    if (error || !link) return NextResponse.json({ ok: true });

    try {
      await sendPasswordReset(email, link);
    } catch (mailErr) {
      console.error("Password reset email failed:", mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Never leak details on the reset path.
    return NextResponse.json({ ok: true });
  }
}

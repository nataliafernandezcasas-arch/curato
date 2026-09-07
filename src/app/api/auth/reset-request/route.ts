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
    });
    // No auth user for this email (or other error) — stay silent.
    // Don't send Supabase's own action_link: it bounces through /auth/v1/verify,
    // which hands the session back in the URL *fragment* (#access_token=...).
    // A fragment never reaches the server, so /auth/callback saw no code and no
    // token_hash and fell through to /auth/sign-in. Build the link ourselves from
    // the hashed token instead, so the callback verifies it server-side.
    const hashedToken = data?.properties?.hashed_token;
    if (error || !hashedToken) return NextResponse.json({ ok: true });
    const link =
      `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}` +
      `&type=recovery&next=${encodeURIComponent("/auth/change-password")}`;

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

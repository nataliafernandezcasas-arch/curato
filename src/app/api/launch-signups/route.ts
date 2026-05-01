import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLaunchEventConfirmation } from "@/lib/emails";

const VALID_PROFILES = ["creator", "merchant", "curious"] as const;
type Profile = (typeof VALID_PROFILES)[number];

function isProfile(v: unknown): v is Profile {
  return typeof v === "string" && (VALID_PROFILES as readonly string[]).includes(v);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, whatsapp, profile, instagram_handle, source } = body;

    if (!full_name || !email || !whatsapp || !isProfile(profile)) {
      return NextResponse.json({ error: "Faltan datos. Revisa los campos obligatorios." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const supabase = createAdminClient();

    const { error: insertError } = await supabase.from("launch_event_signups").insert({
      full_name: String(full_name).trim(),
      email: normalizedEmail,
      whatsapp: String(whatsapp).trim(),
      profile,
      instagram_handle: instagram_handle ? String(instagram_handle).trim().replace(/^@/, "") : null,
      source: source ? String(source).slice(0, 32) : null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Ya estás registrado con ese email." }, { status: 409 });
      }
      return NextResponse.json({ error: "No pudimos guardar tu registro. Intenta de nuevo." }, { status: 500 });
    }

    // Best-effort email + calendar invite. Don't fail the signup if it errors.
    try {
      await sendLaunchEventConfirmation(normalizedEmail, String(full_name).trim());
    } catch {
      // swallow; signup is already persisted and visible in /admin/lanzamiento
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

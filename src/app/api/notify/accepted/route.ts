import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationAccepted } from "@/lib/emails";
import { createMember } from "@/lib/passkit/client";

// Called by the CRM (Sales/midi-crm) when Isa clicks "Aprobar" on a creator.
// Orchestrates: create PassKit member -> persist URLs -> send acceptance email with Wallet buttons.
//
// Auth: shared secret in x-internal-key header. NEVER expose this endpoint publicly without it.

export async function POST(request: NextRequest) {
  try {
    const internalKey = request.headers.get("x-internal-key");
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected || internalKey !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { creatorId, comercioId, type } = await request.json();

    // Comercios path: just send the acceptance email (no pass yet).
    if (type === "business" || comercioId) {
      const id = comercioId;
      if (!id) return NextResponse.json({ error: "comercioId requerido" }, { status: 400 });
      const supabase = createAdminClient();
      const { data: comercio, error } = await supabase
        .from("comercios")
        .select("email, contact_name, name")
        .eq("id", id)
        .single();
      if (error || !comercio?.email) {
        return NextResponse.json({ error: "Comercio no encontrado o sin email" }, { status: 404 });
      }
      await sendApplicationAccepted({
        to: comercio.email,
        name: comercio.contact_name || comercio.name,
        type: "business",
      });
      return NextResponse.json({ success: true });
    }

    // Creators path: PassKit + email
    if (!creatorId) {
      return NextResponse.json({ error: "creatorId requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: creator, error: readErr } = await supabase
      .from("creators")
      .select("id, full_name, handle, email, passkit_member_id, pass_url, google_pay_url")
      .eq("id", creatorId)
      .single();

    if (readErr || !creator) {
      return NextResponse.json({ error: "Creator no encontrado" }, { status: 404 });
    }
    if (!creator.email || !creator.full_name) {
      return NextResponse.json({ error: "Creator sin email o full_name — completar antes de aprobar" }, { status: 400 });
    }

    let passUrl = creator.pass_url;
    let googlePayUrl = creator.google_pay_url;
    let memberId = creator.passkit_member_id;

    // Idempotency: if we already have a pass for this creator, reuse it.
    if (!passUrl || !memberId) {
      const result = await createMember({
        externalId: creator.id,
        displayName: creator.full_name,
        instagramHandle: creator.handle || "",
        email: creator.email,
      });
      passUrl = result.passUrl;
      googlePayUrl = result.googlePayUrl;
      memberId = result.memberId;

      const { error: writeErr } = await supabase
        .from("creators")
        .update({
          passkit_member_id: memberId,
          pass_url: passUrl,
          google_pay_url: googlePayUrl,
          pass_created_at: new Date().toISOString(),
        })
        .eq("id", creator.id);

      if (writeErr) {
        console.error("Failed to persist pass URLs:", writeErr);
        return NextResponse.json({ error: "Pass creado pero no se guardó en DB", passUrl, googlePayUrl }, { status: 500 });
      }
    }

    await sendApplicationAccepted({
      to: creator.email,
      name: creator.full_name,
      type: "creator",
    });

    return NextResponse.json({ success: true, passUrl, googlePayUrl, memberId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("notify/accepted error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

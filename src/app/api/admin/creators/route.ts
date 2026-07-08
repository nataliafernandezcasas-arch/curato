import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";

// Admin-only: edit a creator (keyed by email). All fields optional; only the
// ones provided are updated. `archive: true` soft-removes a profile
// (stage = 'archived'). Email itself is not editable (login identity + route key).
export async function PATCH(request: NextRequest) {
  const ok = await isAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const email: string | undefined = body.email;
  if (!email) return NextResponse.json({ error: "email manquant" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.archive === true) update.stage = "archived";
  else if (typeof body.stage === "string" && body.stage) update.stage = body.stage;
  if (typeof body.full_name === "string") update.full_name = body.full_name.trim();
  if (typeof body.handle === "string") update.handle = body.handle.trim().replace(/^@/, "") || null;
  if (body.followers !== undefined && body.followers !== null && !isNaN(Number(body.followers))) {
    update.followers = Number(body.followers);
  }
  if (body.monthly_credit_cop != null && !isNaN(Number(body.monthly_credit_cop))) {
    update.monthly_credit_cop = Number(body.monthly_credit_cop);
  }
  if (typeof body.hidden_from_roster === "boolean") {
    update.hidden_from_roster = body.hidden_from_roster;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("creators").update(update).eq("email", email.toLowerCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

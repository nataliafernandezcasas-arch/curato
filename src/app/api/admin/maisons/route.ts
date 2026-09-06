import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Fields an admin may edit on a maison. Whitelisted so a stray key can't touch
// generated/system columns.
const EDITABLE = new Set([
  "name",
  "email",
  "arrondissement",
  "address",
  "description",
  "website_url",
  "subscription_plan",
  "category_id",
]);

// Admin-only maison actions. Three shapes, kept on one route:
//   1. { id, comingSoon }                      → toggle the "Prochainement" teaser
//   2. { id, action: "sign", signed, signatory? } → mark signed / un-sign
//   3. { id, action: "update", fields }        → edit maison details
//
// "Signed" drives catalogue visibility: is_reservable is generated from
// partnership_stage = 'signed'. Signing here sets that AND the commitment_*
// fields so the admin label and the public catalogue stay in sync.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    comingSoon?: boolean;
    action?: string;
    signed?: boolean;
    signatory?: string;
    fields?: Record<string, unknown>;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }
  const admin = createAdminClient();

  // 2. Sign / un-sign
  if (body.action === "sign") {
    if (typeof body.signed !== "boolean") {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }
    const update = body.signed
      ? {
          partnership_stage: "signed",
          commitment_accepted_at: new Date().toISOString(),
          commitment_signatory: (body.signatory || "").trim() || "Curato (admin)",
          commitment_date: new Date().toISOString().slice(0, 10),
        }
      : {
          partnership_stage: "contract_sent",
          commitment_accepted_at: null,
          commitment_signatory: null,
          commitment_date: null,
        };
    const { error } = await admin.from("comercios").update(update).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, signed: body.signed });
  }

  // 3. Edit details
  if (body.action === "update") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.fields || {})) {
      if (EDITABLE.has(k)) clean[k] = typeof v === "string" && v.trim() === "" ? null : v;
    }
    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
    }
    const { error } = await admin.from("comercios").update(clean).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 1. Coming-soon toggle (default / legacy shape)
  if (typeof body.comingSoon !== "boolean") {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }
  const { error } = await admin.from("comercios").update({ coming_soon: body.comingSoon }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, comingSoon: body.comingSoon });
}

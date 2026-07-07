import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin-only: toggle a maison's "coming soon" state. When true, the maison
// shows in the directory as a blurred "Prochainement" teaser (details hidden).
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id, comingSoon } = (await request.json()) as { id?: string; comingSoon?: boolean };
  if (!id || typeof comingSoon !== "boolean") {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("comercios").update({ coming_soon: comingSoon }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, comingSoon });
}

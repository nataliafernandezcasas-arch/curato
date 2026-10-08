import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { creditoDelMes, mesDeParis } from "@/lib/credito";

/** El crédito del storyteller este mes: el mensual, lo comprometido y lo que queda. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id")
    .or(filtroDeUsuario(user))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!creator) return NextResponse.json({ error: "creator" }, { status: 404 });

  return NextResponse.json(await creditoDelMes(admin, creator.id as string, mesDeParis(new Date())));
}

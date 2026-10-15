import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";

/** El storyteller terminó (o saltó) el recorrido de la app: no se le vuelve a enseñar. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { error } = await createAdminClient()
    .from("creators")
    .update({ guia_completada_at: new Date().toISOString() })
    .or(filtroDeUsuario(user));
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

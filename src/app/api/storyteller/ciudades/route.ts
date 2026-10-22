import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";

/**
 * Dónde está basado el storyteller: una ciudad o varias (migración 056). Las
 * trae de su candidatura al ser aceptado, y las cambia desde su perfil.
 */
async function yo() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("creators")
    .select("id, cities")
    .or(filtroDeUsuario(user))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { admin, creador: data as { id: string; cities: string[] | null } } : null;
}

export async function GET() {
  const c = await yo();
  if (!c) return NextResponse.json({ error: "creator" }, { status: 404 });
  return NextResponse.json({ cities: c.creador.cities ?? [] });
}

export async function PATCH(request: NextRequest) {
  const c = await yo();
  if (!c) return NextResponse.json({ error: "creator" }, { status: 404 });
  const { cities } = (await request.json().catch(() => ({}))) as { cities?: unknown };
  if (!Array.isArray(cities)) return NextResponse.json({ error: "datos" }, { status: 400 });
  const limpias = [
    ...new Set(cities.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean)),
  ].slice(0, 6);
  const { error } = await c.admin.from("creators").update({ cities: limpias.length ? limpias : null }).eq("id", c.creador.id);
  if (error) return NextResponse.json({ error: "migracion" }, { status: 503 });
  return NextResponse.json({ ok: true, cities: limpias });
}

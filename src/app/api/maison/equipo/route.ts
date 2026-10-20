import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { filtroDeCasa } from "@/lib/casa";
import { sendInvitacionEquipo } from "@/lib/emails";
import { SITE_URL } from "@/lib/site";

type Admin = ReturnType<typeof createAdminClient>;
const MAX_EQUIPO = 10;

/**
 * El equipo de una casa (migración 055): más personas con su propio correo
 * que ven el mismo tablero. Lo ven todos; solo la cuenta de la casa añade o
 * quita a alguien.
 */
async function contexto() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: casa } = await admin
    .from("comercios")
    .select("id, name, email, owner_id")
    .or(await filtroDeCasa(admin, user))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!casa) return null;
  // La cuenta de la casa: la suya por cuenta o correo, no por equipo.
  const { data: propia } = await admin.from("comercios").select("id").eq("id", casa.id).or(filtroDeUsuario(user)).maybeSingle();
  return { user, admin, casa, esTitular: Boolean(propia) };
}

/** El enlace para entrar: elegir contraseña si la cuenta es nueva. */
async function enlace(admin: Admin, email: string, nueva: boolean) {
  if (!nueva) return `${SITE_URL}/auth/sign-in`;
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const token = data?.properties?.hashed_token;
  return token
    ? `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(token)}&type=recovery&next=${encodeURIComponent("/auth/change-password")}`
    : `${SITE_URL}/auth/sign-in`;
}

export async function GET() {
  const c = await contexto();
  if (!c) return NextResponse.json({ error: "maison" }, { status: 403 });
  const { data, error } = await c.admin
    .from("maison_equipo")
    .select("id, email, nombre, user_id, created_at")
    .eq("comercio_id", c.casa.id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "migracion" }, { status: 503 });
  return NextResponse.json({ titular: c.casa.email, esTitular: c.esTitular, equipo: data ?? [] });
}

export async function POST(request: NextRequest) {
  const c = await contexto();
  if (!c) return NextResponse.json({ error: "maison" }, { status: 403 });
  if (!c.esTitular) return NextResponse.json({ error: "titular" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; nombre?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 80) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });
  if (email === (c.casa.email ?? "").toLowerCase()) return NextResponse.json({ error: "titular" }, { status: 409 });

  const { count } = await c.admin.from("maison_equipo").select("id", { count: "exact", head: true }).eq("comercio_id", c.casa.id);
  if ((count ?? 0) >= MAX_EQUIPO) return NextResponse.json({ error: "lleno" }, { status: 409 });

  // La cuenta: la suya si ya existe; si no, una nueva sin contraseña, que
  // elige con el enlace del correo.
  let nueva = false;
  const { data: link } = await c.admin.auth.admin.generateLink({ type: "recovery", email });
  let userId = link?.user?.id ?? null;
  if (!userId) {
    const { data: creada, error } = await c.admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !creada.user) return NextResponse.json({ error: "cuenta" }, { status: 500 });
    userId = creada.user.id;
    nueva = true;
  }

  const { error } = await c.admin
    .from("maison_equipo")
    .upsert({ comercio_id: c.casa.id, email, nombre: nombre || null, user_id: userId }, { onConflict: "comercio_id,email" });
  if (error) return NextResponse.json({ error: "migracion" }, { status: 503 });

  try {
    await sendInvitacionEquipo(email, { maison: c.casa.name as string, url: await enlace(c.admin, email, nueva), nueva });
  } catch (e) {
    console.error("equipo: invitación no enviada", e);
  }
  return NextResponse.json({ ok: true, nueva });
}

export async function DELETE(request: NextRequest) {
  const c = await contexto();
  if (!c) return NextResponse.json({ error: "maison" }, { status: 403 });
  if (!c.esTitular) return NextResponse.json({ error: "titular" }, { status: 403 });
  const { id } = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof id !== "string") return NextResponse.json({ error: "datos" }, { status: 400 });
  // Quita el acceso a la casa; la cuenta de esa persona sigue.
  const { error } = await c.admin.from("maison_equipo").delete().eq("id", id).eq("comercio_id", c.casa.id);
  if (error) return NextResponse.json({ error: "migracion" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

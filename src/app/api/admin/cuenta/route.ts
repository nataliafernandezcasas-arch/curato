import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;
type Cuerpo = { tipo?: unknown; id?: unknown; accion?: unknown };

/**
 * Reiniciar o suprimir una cuenta desde el admin (Natalia, 2026-10-15).
 *
 * Reiniciar deja a la persona como recién aprobada, con sus visitas intactas:
 * vuelve a ver la bienvenida, la encuesta, la guía, y a conectar Instagram y
 * hacer su perfil (storyteller), o a firmar el compromiso (casa).
 *
 * Suprimir lo borra todo: visitas, créditos, la ficha, sus solicitudes y su
 * usuario. El usuario no se borra si es de admin_users: quien administra no se
 * queda fuera por borrar su ficha de prueba.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { tipo, id, accion } = ((await request.json().catch(() => ({}))) ?? {}) as Cuerpo;
  if ((tipo !== "storyteller" && tipo !== "maison") || typeof id !== "string" || (accion !== "reiniciar" && accion !== "suprimir")) {
    return NextResponse.json({ error: "datos" }, { status: 400 });
  }
  const admin = createAdminClient();
  try {
    if (tipo === "storyteller") {
      if (accion === "reiniciar") await reiniciarStoryteller(admin, id);
      else await suprimirStoryteller(admin, id);
    } else {
      if (accion === "reiniciar") await reiniciarCasa(admin, id);
      else await suprimirCasa(admin, id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin cuenta:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "server" }, { status: 500 });
  }
}

function ok<T extends { error: { message: string } | null }>(r: T, paso: string): T {
  if (r.error) throw new Error(`${paso}: ${r.error.message}`);
  return r;
}

async function reiniciarStoryteller(admin: Admin, id: string) {
  ok(
    await admin
      .from("creators")
      .update({
        welcome_completed_at: null,
        onboarding_survey_completed_at: null,
        portrait_urls: null,
        own_bio: null,
        instagram_connected: false,
        phyllo_connected_at: null,
      })
      .eq("id", id),
    "creators"
  );
  ok(await admin.from("creator_survey_responses").delete().eq("creator_id", id), "encuesta");
  // Columnas de migraciones posteriores: si no existen, se sigue.
  await admin.from("creators").update({ guia_completada_at: null }).eq("id", id);
  await admin.from("creators").update({ style_paths: null }).eq("id", id);
}

async function reiniciarCasa(admin: Admin, id: string) {
  ok(
    await admin
      .from("comercios")
      .update({ commitment_accepted_at: null, commitment_signatory: null, partnership_stage: "prospect" })
      .eq("id", id),
    "comercios"
  );
}

/** Las visitas, y los créditos que cuelgan de ellas. */
async function borrarVisitas(admin: Admin, columna: "creator_id" | "venue_id", id: string) {
  const { data } = ok(await admin.from("reservations").select("id").eq(columna, id), "visitas");
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length) {
    ok(await admin.from("credit_transactions").delete().in("reservation_id", ids), "créditos");
    ok(await admin.from("reservations").delete().in("id", ids), "visitas");
  }
}

/** El usuario de la app, salvo que sea de admin_users. */
async function borrarUsuario(admin: Admin, userId: string | null) {
  if (!userId) return;
  const { data: esAdmin } = await admin.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (esAdmin) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error && !/not.?found/i.test(error.message)) throw new Error(`usuario: ${error.message}`);
}

async function suprimirStoryteller(admin: Admin, id: string) {
  const { data: c } = ok(await admin.from("creators").select("email, owner_id").eq("id", id).maybeSingle(), "creators");
  if (!c) return;
  await borrarVisitas(admin, "creator_id", id);
  ok(await admin.from("credit_transactions").delete().eq("creator_id", id), "créditos");
  ok(await admin.from("creators").delete().eq("id", id), "ficha");
  if (c.email) ok(await admin.from("applications").delete().ilike("email", c.email as string), "solicitudes");
  await borrarUsuario(admin, (c.owner_id as string | null) ?? null);
}

async function suprimirCasa(admin: Admin, id: string) {
  const { data: m } = ok(await admin.from("comercios").select("email, owner_id").eq("id", id).maybeSingle(), "comercios");
  if (!m) return;
  await borrarVisitas(admin, "venue_id", id);
  ok(await admin.from("comercios").delete().eq("id", id), "ficha");
  if (m.email) ok(await admin.from("applications").delete().ilike("email", m.email as string), "solicitudes");
  await borrarUsuario(admin, (m.owner_id as string | null) ?? null);
}

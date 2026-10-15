import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendPasswordReset } from "@/lib/emails";
import { SITE_URL } from "@/lib/site";

type Admin = ReturnType<typeof createAdminClient>;

/** El enlace para elegir contraseña, el mismo del «mot de passe oublié». */
async function enlace(admin: Admin, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const token = data?.properties?.hashed_token;
  if (error || !token || !data.user) return null;
  return {
    userId: data.user.id,
    url: `${SITE_URL}/auth/callback?token_hash=${encodeURIComponent(token)}&type=recovery&next=${encodeURIComponent("/auth/change-password")}`,
  };
}

/**
 * Añadir una persona al admin (Natalia, 2026-10-15). Con su correo: si ya
 * tiene cuenta de Curato, se le da acceso; si no, se le crea y le llega un
 * correo para elegir su contraseña. Entra por la app o por la web con ese
 * correo y va directa al admin.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { email: bruto } = ((await request.json().catch(() => ({}))) ?? {}) as { email?: unknown };
  const email = typeof bruto === "string" ? bruto.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });

  const admin = createAdminClient();
  let nueva = false;
  let link = await enlace(admin, email);
  if (!link) {
    const { error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    nueva = true;
    link = await enlace(admin, email);
  }
  if (!link) return NextResponse.json({ error: "link" }, { status: 500 });

  const { data: { user: yo } } = await (await createClient()).auth.getUser();
  const { error } = await admin
    .from("admin_users")
    .upsert({ user_id: link.userId, added_by: yo?.id ?? null }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Una cuenta nueva no tiene contraseña: le llega el correo para elegirla.
  if (nueva) {
    try {
      await sendPasswordReset(email, link.url);
    } catch (e) {
      console.error("admin nuevo: correo no enviado", e);
    }
  }
  return NextResponse.json({ ok: true, nueva });
}

/** Quitar el acceso al admin. La cuenta sigue; solo deja de ser admin. */
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { userId } = ((await request.json().catch(() => ({}))) ?? {}) as { userId?: unknown };
  if (typeof userId !== "string") return NextResponse.json({ error: "datos" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin.from("admin_users").select("user_id", { count: "exact", head: true });
  // Nunca se queda el admin sin nadie.
  if ((count ?? 0) <= 1) return NextResponse.json({ error: "ultimo" }, { status: 409 });
  const { error } = await admin.from("admin_users").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

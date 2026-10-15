import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Administradores from "./administradores";

export const dynamic = "force-dynamic";

/** Quién entra al admin, y añadir o quitar a alguien. */
export default async function AdministradoresPage() {
  if (!(await isAdmin())) return notFound();
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("user_id, added_at").order("added_at");
  const lista = await Promise.all(
    (data ?? []).map(async (a) => {
      const { data: u } = await admin.auth.admin.getUserById(a.user_id as string);
      return {
        userId: a.user_id as string,
        email: u.user?.email ?? "—",
        desde: a.added_at as string,
        ultima: u.user?.last_sign_in_at ?? null,
      };
    })
  );
  return (
    <main className="mx-auto max-w-[720px] px-5 py-14">
      <p className="mb-3 font-serif text-[11px] uppercase tracking-[0.35em] text-champagne/60">Accès</p>
      <h1 className="mb-10 font-serif text-[32px] font-light uppercase tracking-[0.15em] text-white">Administrateurs</h1>
      <Administradores lista={lista} />
    </main>
  );
}

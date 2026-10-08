import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountDeletionAlert } from "@/lib/emails";

const ADMIN_INBOX = "hello@curatocollective.com";

/**
 * Borrar la cuenta propia, desde Réglages.
 *
 * Lo que se puede hacer en el acto se hace en el acto: nadie vuelve a entrar con
 * esta cuenta, el teléfono deja de recibir avisos, el storyteller sale del
 * tablero de las casas y el IBAN del apporteur desaparece.
 *
 * Lo demás no se puede borrar de un golpe, porque las visitas y los créditos
 * apuntan a la persona con ON DELETE RESTRICT: son el historial de la otra parte
 * y, a veces, contabilidad. Eso lo termina el equipo, que recibe un correo y
 * tiene la petición en account_deletion_requests (migración 039).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const email = user.email.toLowerCase();

  // Primero, que conste. Si no consta, no se cierra nada: una cuenta cerrada
  // sin rastro es una cuenta cuyos datos nadie se acuerda de borrar.
  const { error: constancia } = await admin
    .from("account_deletion_requests")
    .insert({ user_id: user.id, email });
  if (constancia) {
    console.error("account delete: request not recorded:", constancia);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Lo que se ve y lo que avisa, fuera ya. Cada uno por su lado: que falle uno
  // no tiene que dejar los otros sin hacer.
  const pasos = await Promise.all([
    admin.from("device_tokens").delete().eq("user_id", user.id),
    admin.from("creators").update({ hidden_from_roster: true }).eq("email", email),
    admin.from("recruiters").update({ iban: null }).eq("email", email),
  ]);
  for (const { error } of pasos) if (error) console.error("account delete: step failed:", error);

  // Y la puerta. Soft delete: Supabase anonimiza el usuario y lo deja sin
  // acceso, pero la fila sigue ahí para las claves foráneas que apuntan a ella
  // (quién confirmó una visita, quién apuntó un crédito).
  const { error: cierre } = await admin.auth.admin.deleteUser(user.id, true);
  if (cierre) {
    console.error("account delete: auth user not deleted:", cierre);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  try {
    await sendAccountDeletionAlert(ADMIN_INBOX, { email });
  } catch (mailErr) {
    console.error("account delete: admin alert failed:", mailErr);
  }

  return NextResponse.json({ ok: true });
}

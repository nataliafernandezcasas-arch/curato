import { NextResponse, after, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { pendientesDe } from "@/lib/pendientes";
import { avisar, AVISOS } from "@/lib/push/avisos";

/**
 * Cuántas demandas esperan respuesta, para la cifra de la barra de abajo.
 *
 * Con `?icono=1`, además pone esa cifra en el icono del teléfono. El icono solo
 * cambia cuando llega un aviso, y una demanda que caduca sin respuesta no manda
 * ninguno: sin esto el número del icono se quedaría alto para siempre. La
 * pantalla lo pide solo cuando la cifra cambia, no en cada página.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ n: 0 }, { status: 401 });

  const admin = createAdminClient();
  const { data: maison } = await admin
    .from("comercios")
    .select("id, email, owner_id")
    .or(filtroDeUsuario(user))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!maison) return NextResponse.json({ n: 0 });

  const n = await pendientesDe(admin, maison.id);
  if (request.nextUrl.searchParams.get("icono")) {
    after(() => avisar({ ownerId: maison.owner_id ?? null, email: maison.email ?? null }, AVISOS.insignia(n)));
  }
  return NextResponse.json({ n }, { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { graphConfigurado } from "@/lib/instagram-graph";
import { actualizarInstagram, REFRESCO_MS, type Resultado } from "@/lib/instagram-recientes";

// Cada vuelta trabaja como mucho esto, y lo que falte lo hace la hora siguiente.
const PRESUPUESTO_MS = 45_000;
export const maxDuration = 60;

/**
 * Instagram al día, sin tocar nada a mano: seguidores y últimas publicaciones
 * de cada storyteller (src/lib/instagram-recientes.ts).
 *
 * La llama cada hora el mismo workflow de GitHub que los recordatorios, con el
 * mismo CRON_SECRET. En cada vuelta se miran, primero los que nunca se miraron
 * y luego los más antiguos, los que llevan más de veinte horas sin mirar: cada
 * storyteller se actualiza una vez al día, sin pasar del tiempo de Vercel ni
 * del límite de la API de Instagram (200 llamadas por hora).
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET?.replace(/\s+/g, "");
  if (!secreto) return NextResponse.json({ error: "CRON_SECRET no configurado." }, { status: 500 });
  const recibida = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  if (recibida !== secreto) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  if (!graphConfigurado()) {
    return NextResponse.json({ ok: true, omitido: "Falta META_IG_USER_ID o META_ACCESS_TOKEN en Vercel." });
  }

  const inicio = Date.now();
  const admin = createAdminClient();
  const limite = new Date(inicio - REFRESCO_MS).toISOString();
  const { data, error } = await admin
    .from("creators")
    .select("id, handle, phyllo_account_id, instagram_synced_at")
    .eq("stage", "active")
    .not("handle", "is", null)
    .or(`instagram_synced_at.is.null,instagram_synced_at.lt.${limite}`)
    .order("instagram_synced_at", { ascending: true, nullsFirst: true })
    .limit(150);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cuenta: Partial<Record<Resultado, number>> = {};
  let hechos = 0;
  for (const c of data ?? []) {
    if (Date.now() - inicio > PRESUPUESTO_MS) break;
    const r = await actualizarInstagram(admin, c);
    cuenta[r] = (cuenta[r] ?? 0) + 1;
    hechos++;
    // Con el token caído o el límite alcanzado, el resto fallaría igual.
    if (r === "token" || r === "limite") break;
  }

  return NextResponse.json({ ok: true, pendientes: data?.length ?? 0, hechos, resultados: cuenta });
}

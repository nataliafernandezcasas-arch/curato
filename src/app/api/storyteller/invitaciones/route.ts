import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";

// Una invitación se muestra en el carnet durante 30 días.
const VIGENCIA_DIAS = 30;

/**
 * Las casas que han vuelto a invitar a este storyteller (migración 057), las
 * más recientes primero. Desaparece la de una casa en cuanto vuelve a reservar
 * en ella después de la invitación.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ invitaciones: [] }, { status: 401 });

  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id")
    .or(filtroDeUsuario(user))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!creator) return NextResponse.json({ invitaciones: [] });

  const desde = new Date(Date.now() - VIGENCIA_DIAS * 24 * 3600 * 1000).toISOString();
  const { data: filas, error } = await admin
    .from("maison_invitaciones")
    .select("comercio_id, created_at")
    .eq("creator_id", creator.id)
    .gte("created_at", desde)
    .order("created_at", { ascending: false });
  if (error || !filas?.length) return NextResponse.json({ invitaciones: [] });

  // Una por casa: la más reciente.
  const porCasa = new Map<string, string>();
  for (const f of filas) if (!porCasa.has(f.comercio_id as string)) porCasa.set(f.comercio_id as string, f.created_at as string);
  const ids = [...porCasa.keys()];

  const [{ data: casas }, { data: reservas }] = await Promise.all([
    admin.from("comercios").select("id, name, arrondissement, photos").in("id", ids).eq("stage", "activo"),
    admin.from("reservations").select("venue_id, created_at").eq("creator_id", creator.id).in("venue_id", ids).gte("created_at", desde),
  ]);

  const invitaciones = (casas ?? [])
    .filter((c) => !(reservas ?? []).some((r) => r.venue_id === c.id && (r.created_at as string) > (porCasa.get(c.id as string) as string)))
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      arrondissement: (c.arrondissement as string | null) ?? null,
      photo: ((c.photos as string[] | null) ?? [])[0] ?? null,
      invitedAt: porCasa.get(c.id as string) as string,
    }))
    .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));

  return NextResponse.json({ invitaciones });
}

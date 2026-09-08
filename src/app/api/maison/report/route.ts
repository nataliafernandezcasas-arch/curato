import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "content-proofs";
// El compromiso de Curato con cada casa: cinco visitas garantizadas al mes.
const MINIMO_MENSUAL = 5;

/**
 * El informe mensual de una maison.
 *
 * Es la razón por la que una casa paga 299 € al mes, y hasta ahora no existía
 * en ninguna parte: se archivaban capturas de las stories y no se guardaba una
 * sola cifra, así que nadie podía decirle a cuánta gente llegó.
 *
 * Se agrega al vuelo desde las reservas. No hace falta tabla nueva: un mes de
 * una casa son unas pocas filas, y precalcularlo solo añadiría una copia del
 * dato que se puede quedar vieja.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    // "2026-09", o el mes en curso.
    const mes = request.nextUrl.searchParams.get("month");
    const hoy = new Date();
    const [anio, numMes] = mes
      ? mes.split("-").map(Number)
      : [hoy.getFullYear(), hoy.getMonth() + 1];
    if (!anio || !numMes || numMes < 1 || numMes > 12) {
      return NextResponse.json({ error: "Mois invalide." }, { status: 400 });
    }
    const desde = new Date(Date.UTC(anio, numMes - 1, 1));
    const hasta = new Date(Date.UTC(anio, numMes, 1));

    const { data: reservas } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, content_photo_paths, content_rights_expires_at, reach_views, reach_accounts, reach_interactions")
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .gte("slot_start", desde.toISOString())
      .lt("slot_start", hasta.toISOString())
      .order("slot_start", { ascending: true });

    const filas = reservas ?? [];

    const creatorIds = [...new Set(filas.map((r) => r.creator_id))];
    const { data: creators } = creatorIds.length
      ? await admin.from("creators").select("id, full_name, handle, followers").in("id", creatorIds)
      : { data: [] as { id: string; full_name: string | null; handle: string | null; followers: number | null }[] };
    const porId = new Map((creators ?? []).map((c) => [c.id, c]));

    // Las fotografías siguen muriendo a los 90 días, como el derecho de uso.
    const ahora = Date.now();
    const galeria: string[] = [];
    for (const r of filas) {
      const vigente = r.content_rights_expires_at
        ? new Date(r.content_rights_expires_at).getTime() > ahora
        : false;
      if (!vigente) continue;
      for (const path of (r.content_photo_paths as string[] | null) ?? []) {
        const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) galeria.push(data.signedUrl);
      }
    }

    const suma = (campo: "reach_views" | "reach_accounts" | "reach_interactions") =>
      filas.reduce((total, r) => total + ((r[campo] as number | null) ?? 0), 0);

    return NextResponse.json({
      maison: maison.name,
      month: `${anio}-${String(numMes).padStart(2, "0")}`,
      visits: filas.length,
      guaranteed: MINIMO_MENSUAL,
      // Debajo del mínimo la casa tiene derecho al mes siguiente gratis. Es
      // contractual, así que se dice, no se esconde.
      belowMinimum: filas.length < MINIMO_MENSUAL,
      reach: {
        accounts: suma("reach_accounts"),
        views: suma("reach_views"),
        interactions: suma("reach_interactions"),
        // Cuántas visitas han declarado ya sus cifras: sin esto, un mes con
        // portée baja parece un mal mes cuando solo faltan datos.
        declared: filas.filter((r) => r.reach_accounts != null).length,
      },
      storytellers: filas.map((r) => {
        const c = porId.get(r.creator_id);
        return {
          name: c?.full_name ?? c?.handle ?? "",
          handle: c?.handle ?? null,
          followers: c?.followers ?? null,
          date: r.slot_start,
          accounts: (r.reach_accounts as number | null) ?? null,
        };
      }),
      gallery: galeria,
    });
  } catch (err) {
    console.error("maison report error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

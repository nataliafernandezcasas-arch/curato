import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { retratoDeCada } from "@/lib/creator-portrait";
import { ABONO_MENSUAL, CPM_REFERENCIA, costeDelMes, costePorMilVistas, costePorVisita, mesDe, mesesHasta, tasaDeInteraccion, valorPublicitario } from "@/lib/valor";

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
      .or(filtroDeUsuario(user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
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

    // Seis meses de golpe: el del informe y los cinco de antes, para la
    // evolución. El informe en sí es solo el último.
    const meses = mesesHasta(`${anio}-${String(numMes).padStart(2, "0")}`, 6);
    const [a0, m0] = meses[0].split("-").map(Number);
    const desdeEvolucion = new Date(Date.UTC(a0, m0 - 1, 1));
    const { data: todas } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, credits_cost, content_photo_paths, content_rights_expires_at, reach_views, reach_accounts, reach_interactions")
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .gte("slot_start", desdeEvolucion.toISOString())
      .lt("slot_start", hasta.toISOString())
      .order("slot_start", { ascending: true });

    const filas = (todas ?? []).filter((r) => new Date(r.slot_start as string) >= desde);
    const num = (v: unknown) => (typeof v === "number" ? v : 0);

    const creatorIds = [...new Set(filas.map((r) => r.creator_id))];
    const { data: creators } = creatorIds.length
      ? await admin.from("creators").select("id, full_name, handle, followers, portrait_urls").in("id", creatorIds)
      : { data: [] as { id: string; full_name: string | null; handle: string | null; followers: number | null; portrait_urls: string[] | null }[] };
    const porId = new Map((creators ?? []).map((c) => [c.id, c]));
    const retratos = await retratoDeCada(admin, creators ?? []);

    // Las fotos de cada visita, para verlas y para descargarlas en su
    // tamaño original. Siguen muriendo a los 90 días, como el derecho de uso.
    const ahora = Date.now();
    const fotosDe = async (r: (typeof filas)[number]) => {
      const vigente = r.content_rights_expires_at ? new Date(r.content_rights_expires_at as string).getTime() > ahora : false;
      if (!vigente) return [];
      const c = porId.get(r.creator_id);
      const base = (c?.handle || c?.full_name || "curato").replace(/[^\w-]+/g, "-");
      const fotos: { url: string; download: string }[] = [];
      let n = 0;
      for (const path of (r.content_photo_paths as string[] | null) ?? []) {
        n++;
        const ext = path.split(".").pop() || "jpg";
        const [ver, bajar] = await Promise.all([
          admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60),
          admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60, { download: `${base}-${n}.${ext}` }),
        ]);
        if (ver.data?.signedUrl && bajar.data?.signedUrl) fotos.push({ url: ver.data.signedUrl, download: bajar.data.signedUrl });
      }
      return fotos;
    };

    const suma = (campo: "reach_views" | "reach_accounts" | "reach_interactions") =>
      filas.reduce((total, r) => total + num(r[campo]), 0);
    const vistas = suma("reach_views");
    const ofrecido = filas.reduce((t, r) => t + num(r.credits_cost), 0);
    const coste = costeDelMes(ofrecido);

    const storytellers = await Promise.all(
      filas.map(async (r) => {
        const c = porId.get(r.creator_id);
        const cuentas = (r.reach_accounts as number | null) ?? null;
        const interacciones = (r.reach_interactions as number | null) ?? null;
        return {
          id: r.id as string,
          name: c?.full_name ?? c?.handle ?? "",
          handle: c?.handle ?? null,
          portrait: retratos.get(r.creator_id) ?? null,
          followers: c?.followers ?? null,
          date: r.slot_start,
          accounts: cuentas,
          views: (r.reach_views as number | null) ?? null,
          interactions: interacciones,
          engagement: tasaDeInteraccion(interacciones, cuentas),
          rightsExpiresAt: (r.content_rights_expires_at as string | null) ?? null,
          photos: await fotosDe(r),
        };
      })
    );

    return NextResponse.json({
      maison: maison.name,
      month: meses[meses.length - 1],
      visits: filas.length,
      guaranteed: MINIMO_MENSUAL,
      // Debajo del mínimo la casa tiene derecho al mes siguiente gratis. Es
      // contractual, así que se dice, no se esconde.
      belowMinimum: filas.length < MINIMO_MENSUAL,
      reach: {
        accounts: suma("reach_accounts"),
        views: vistas,
        interactions: suma("reach_interactions"),
        engagement: tasaDeInteraccion(suma("reach_interactions"), suma("reach_accounts")),
        // Cuántas visitas han declarado ya sus cifras: sin esto, un mes con
        // portée baja parece un mal mes cuando solo faltan datos.
        declared: filas.filter((r) => r.reach_accounts != null).length,
      },
      // Lo que vale y lo que costó: la pregunta de «¿me compensa?».
      value: {
        equivalent: valorPublicitario(vistas),
        cpm: CPM_REFERENCIA,
        subscription: ABONO_MENSUAL,
        offered: ofrecido,
        cost: coste,
        perVisit: costePorVisita(coste, filas.length),
        perThousandViews: costePorMilVistas(coste, vistas),
      },
      // Los seis últimos meses, del más antiguo al de este informe.
      evolution: meses.map((m) => {
        const delMes = (todas ?? []).filter((r) => mesDe(r.slot_start as string) === m);
        return {
          month: m,
          visits: delMes.length,
          accounts: delMes.reduce((t, r) => t + num(r.reach_accounts), 0),
          views: delMes.reduce((t, r) => t + num(r.reach_views), 0),
        };
      }),
      storytellers,
      gallery: storytellers.flatMap((st) => st.photos.map((f) => ({ ...f, name: st.name, until: st.rightsExpiresAt }))),
    });
  } catch (err) {
    console.error("maison report error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

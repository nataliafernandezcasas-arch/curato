import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeCasa } from "@/lib/casa";

const BUCKET = "content-proofs";
// Un año de visitas: más atrás, las fotos ya no son de la casa desde hace mucho.
const MESES = 12;

/**
 * La biblioteca de contenido de una casa: todas las visitas con fotos del
 * último año, la más reciente primero.
 *
 * Las fotos solo se entregan mientras dura la exclusividad de 90 días, como en
 * el informe: después siguen siendo del storyteller. De una visita vencida
 * queda la ficha (quién, cuándo, cuántas fotos), sin las fotos.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(await filtroDeCasa(admin, user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const desde = new Date();
    desde.setMonth(desde.getMonth() - MESES);
    const { data: filas } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, content_photo_paths, content_rights_expires_at")
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .gte("slot_start", desde.toISOString())
      .order("slot_start", { ascending: false });

    const conFotos = (filas ?? []).filter((r) => ((r.content_photo_paths as string[] | null) ?? []).length > 0);
    const ids = [...new Set(conFotos.map((r) => r.creator_id as string))];
    const { data: creators } = ids.length
      ? await admin.from("creators").select("id, full_name, handle").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; handle: string | null }[] };
    const porId = new Map((creators ?? []).map((c) => [c.id, c]));

    const ahora = Date.now();
    const visitas = await Promise.all(
      conFotos.map(async (r) => {
        const c = porId.get(r.creator_id);
        const caduca = (r.content_rights_expires_at as string | null) ?? null;
        const vigente = caduca ? new Date(caduca).getTime() > ahora : false;
        const paths = (r.content_photo_paths as string[] | null) ?? [];
        const base = (c?.handle || c?.full_name || "curato").replace(/[^\w-]+/g, "-");
        const fotos: { url: string; download: string }[] = [];
        if (vigente) {
          let n = 0;
          for (const path of paths) {
            n++;
            const ext = path.split(".").pop() || "jpg";
            const [ver, bajar] = await Promise.all([
              admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60),
              admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60, { download: `${base}-${n}.${ext}` }),
            ]);
            if (ver.data?.signedUrl && bajar.data?.signedUrl) fotos.push({ url: ver.data.signedUrl, download: bajar.data.signedUrl });
          }
        }
        return {
          id: r.id as string,
          creatorId: r.creator_id as string,
          name: c?.full_name ?? c?.handle ?? "",
          handle: c?.handle ?? null,
          date: r.slot_start as string,
          rightsExpiresAt: caduca,
          vigente,
          // Los días que le quedan a la exclusividad, contados aquí y no en el
          // teléfono, cuya hora puede estar mal.
          diasQuedan: vigente && caduca ? Math.ceil((new Date(caduca).getTime() - ahora) / (24 * 3600 * 1000)) : 0,
          total: paths.length,
          fotos,
        };
      })
    );

    return NextResponse.json({ visitas });
  } catch (err) {
    console.error("maison/contenus:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

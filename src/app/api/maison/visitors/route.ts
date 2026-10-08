import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { retratoDeCada } from "@/lib/creator-portrait";

const BUCKET = "content-proofs";

// Creators who visited THIS maison, with the photos they uploaded, while the
// 90-day usage rights are still valid.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(filtroDeUsuario(user))
      .eq("stage", "activo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const nowIso = new Date().toISOString();
    const { data: reservations } = await admin
      .from("reservations")
      .select("id, creator_id, slot_start, content_photo_paths, content_rights_expires_at")
      .eq("venue_id", maison.id)
      .eq("status", "completed")
      .not("content_photo_paths", "is", null)
      .gt("content_rights_expires_at", nowIso)
      .order("slot_start", { ascending: false });

    const rows = reservations ?? [];
    const creatorIds = [...new Set(rows.map((r) => r.creator_id))];
    const { data: creators } = await admin
      .from("creators")
      .select("id, full_name, handle, portrait_urls")
      .in("id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);
    const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));
    // La cara de quien vino, junto a sus fotos.
    const retratos = await retratoDeCada(admin, creators ?? []);

    const visitors = await Promise.all(
      rows.map(async (r) => {
        const paths: string[] = r.content_photo_paths ?? [];
        const photos: string[] = [];
        for (const p of paths) {
          const { data } = await admin.storage.from(BUCKET).createSignedUrl(p, 3600);
          if (data?.signedUrl) photos.push(data.signedUrl);
        }
        const c = creatorMap.get(r.creator_id);
        return {
          id: r.id as string,
          creator: (c?.full_name as string | null) || (c?.handle ? `@${c.handle}` : "—"),
          handle: (c?.handle as string | null) ?? null,
          portrait: retratos.get(r.creator_id) ?? null,
          visitDate: r.slot_start as string,
          rightsExpiresAt: (r.content_rights_expires_at as string | null) ?? null,
          photos,
        };
      })
    );

    // Only show visits that actually have viewable photos.
    return NextResponse.json({ visitors: visitors.filter((v) => v.photos.length > 0) });
  } catch (err) {
    console.error("Maison visitors error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

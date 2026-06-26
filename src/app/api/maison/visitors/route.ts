import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
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
      .select("id, full_name, handle")
      .in("id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);
    const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));

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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "content-proofs";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// List the signed-in creator's reservations with maison names + signed photo
// URLs (generated server-side because the content bucket is private).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!creator) return NextResponse.json({ visits: [] });

    const { data: reservations } = await admin
      .from("reservations")
      .select("id, venue_id, slot_start, status, content_photo_paths, content_rights_expires_at")
      .eq("creator_id", creator.id)
      .order("slot_start", { ascending: false });

    const rows = reservations ?? [];
    const venueIds = [...new Set(rows.map((r) => r.venue_id))];
    const { data: venues } = await admin.from("comercios").select("id, name").in("id", venueIds);
    const venueName = new Map((venues ?? []).map((v) => [v.id, v.name as string]));

    const visits = await Promise.all(
      rows.map(async (r) => {
        const paths: string[] = r.content_photo_paths ?? [];
        const photos: string[] = [];
        for (const p of paths) {
          const { data } = await admin.storage.from(BUCKET).createSignedUrl(p, 3600);
          if (data?.signedUrl) photos.push(data.signedUrl);
        }
        return {
          id: r.id as string,
          maison: venueName.get(r.venue_id) ?? "—",
          slotStart: r.slot_start as string,
          status: r.status as string,
          photos,
          rightsExpiresAt: (r.content_rights_expires_at as string | null) ?? null,
        };
      })
    );

    return NextResponse.json({ visits });
  } catch (err) {
    console.error("my-visits error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Creator marks a reservation as visited and (optionally) uploads HD photos.
// Photos are stored in a private bucket; the maison gets 90 days of access.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const form = await request.formData();
    const reservationId = form.get("reservationId") as string | null;
    const files = form.getAll("files") as File[];
    if (!reservationId) {
      return NextResponse.json({ error: "Réservation manquante." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the reservation belongs to this creator.
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

    const { data: reservation } = await admin
      .from("reservations")
      .select("id, creator_id, status, content_photo_paths, visited_at")
      .eq("id", reservationId)
      .maybeSingle();
    if (!reservation || reservation.creator_id !== creator.id) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    // At least 2 photos are required on the first upload (logging the visit).
    const existing: string[] = reservation.content_photo_paths ?? [];
    const incoming = files.filter((f) => f && typeof f.arrayBuffer === "function");
    if (existing.length === 0 && incoming.length < 2) {
      return NextResponse.json({ error: "Au moins 2 photos sont requises." }, { status: 400 });
    }

    // Upload provided photos.
    const newPaths: string[] = [];
    for (const file of incoming) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `reservations/${reservationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) {
        console.error("Visit photo upload error:", upErr);
        continue;
      }
      newPaths.push(path);
    }

    const allPaths = [...(reservation.content_photo_paths ?? []), ...newPaths];
    const now = new Date();

    const update: Record<string, unknown> = {
      status: "completed",
      visited_at: reservation.visited_at ?? now.toISOString(),
    };
    if (newPaths.length > 0) {
      update.content_photo_paths = allPaths;
      update.content_uploaded_at = now.toISOString();
      update.content_rights_expires_at = new Date(now.getTime() + NINETY_DAYS_MS).toISOString();
    }

    const { error: updErr } = await admin.from("reservations").update(update).eq("id", reservationId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Return short-lived signed URLs for immediate display.
    const urls: string[] = [];
    for (const p of allPaths) {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(p, 3600);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }

    return NextResponse.json({ ok: true, photos: urls, count: allPaths.length });
  } catch (err) {
    console.error("Reservation visit error:", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}

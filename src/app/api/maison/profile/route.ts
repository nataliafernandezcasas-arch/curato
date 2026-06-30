import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "maison-photos";

// Resolve the maison (active comercio) behind the signed-in user.
async function getMaison(adminClient: ReturnType<typeof createAdminClient>, userId: string, email: string) {
  const { data } = await adminClient
    .from("comercios")
    .select("id, name, description, photos, website_url, contact_instagram, arrondissement, address, category_id")
    .or(`owner_id.eq.${userId},email.eq.${email.toLowerCase()}`)
    .maybeSingle();
  return data;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const maison = await getMaison(admin, user.id, user.email || "");
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    return NextResponse.json({
      name: maison.name,
      description: maison.description ?? "",
      photos: maison.photos ?? [],
      website: maison.website_url ?? "",
      instagram: maison.contact_instagram ?? "",
      arrondissement: maison.arrondissement ?? null,
      address: maison.address ?? null,
      categoryId: maison.category_id ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Update the description/links, and/or reorder the photos.
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const body = await request.json();
    const admin = createAdminClient();
    const maison = await getMaison(admin, user.id, user.email || "");
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const update: Record<string, unknown> = {};

    if ("description" in body || "website" in body || "instagram" in body) {
      update.description = (body.description || "").slice(0, 2000);
      update.website_url = (body.website || "").trim().slice(0, 300) || null;
      update.contact_instagram = (body.instagram || "").trim().slice(0, 100) || null;
    }

    // Reorder: only permute existing photos, never inject new URLs.
    let photos: string[] | undefined;
    if (Array.isArray(body.photos)) {
      const current: string[] = maison.photos ?? [];
      const known = new Set(current);
      const reordered = (body.photos as string[]).filter((u) => known.has(u));
      for (const u of current) if (!reordered.includes(u)) reordered.push(u);
      update.photos = reordered;
      photos = reordered;
    }

    if (Object.keys(update).length) {
      await admin.from("comercios").update(update).eq("id", maison.id);
    }
    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Upload one or more public catalogue photos.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const maison = await getMaison(admin, user.id, user.email || "");
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const form = await request.formData();
    const files = (form.getAll("files") as File[]).filter((f) => f && typeof f.arrayBuffer === "function");

    const newUrls: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `maisons/${maison.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) {
        console.error("Maison photo upload error:", upErr);
        continue;
      }
      const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) newUrls.push(data.publicUrl);
    }

    const photos = [...(maison.photos ?? []), ...newUrls];
    await admin.from("comercios").update({ photos }).eq("id", maison.id);
    return NextResponse.json({ ok: true, photos });
  } catch (err) {
    console.error("Maison profile POST error:", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}

// Remove a photo by URL.
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { url } = await request.json();
    const admin = createAdminClient();
    const maison = await getMaison(admin, user.id, user.email || "");
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const photos = (maison.photos ?? []).filter((p: string) => p !== url);
    await admin.from("comercios").update({ photos }).eq("id", maison.id);

    // Best-effort: remove the object from storage too.
    const marker = `/${BUCKET}/`;
    const idx = (url as string).indexOf(marker);
    if (idx !== -1) {
      const path = (url as string).slice(idx + marker.length);
      await admin.storage.from(BUCKET).remove([path]);
    }

    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

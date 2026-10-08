import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDe } from "@/lib/identidad";
import { traducirDescripcion, type Idioma } from "@/lib/traducir";

const IDIOMAS: Idioma[] = ["fr", "en", "es"];
const COLUMNA: Record<Idioma, "description" | "description_en" | "description_es"> = {
  fr: "description",
  en: "description_en",
  es: "description_es",
};

// El idioma en que escribe la casa (migración 042). Aparte y tolerante: sin la
// columna, la consulta falla y se supone el francés, en vez de romper el perfil.
async function idiomaDe(adminClient: ReturnType<typeof createAdminClient>, id: string): Promise<Idioma> {
  const { data, error } = await adminClient.from("comercios").select("description_lang").eq("id", id).maybeSingle();
  const l = !error && data ? (data as { description_lang?: string | null }).description_lang : null;
  return l === "en" || l === "es" ? l : "fr";
}

const BUCKET = "maison-photos";

// Resolve the maison (active comercio) behind the signed-in user.
async function getMaison(adminClient: ReturnType<typeof createAdminClient>, userId: string, email: string) {
  const { data } = await adminClient
    .from("comercios")
    .select("id, name, description, description_en, description_es, photos, website_url, contact_instagram, arrondissement, address, category_id")
    .or(filtroDe(userId, email))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
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
      descriptionEn: maison.description_en ?? "",
      descriptionEs: maison.description_es ?? "",
      descriptionLang: await idiomaDe(admin, maison.id),
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

    let traducidas: Partial<Record<Idioma, string>> | null = {};
    let fuente: Idioma | null = null;
    if ("description" in body || "website" in body || "instagram" in body) {
      const textos: Record<Idioma, string> = {
        fr: (body.description || "").slice(0, 2000),
        en: (body.descriptionEn || "").slice(0, 2000),
        es: (body.descriptionEs || "").slice(0, 2000),
      };
      // La casa escribe en un idioma; los que la pantalla pide traducir (los que
      // están vacíos, o los que no retocó cuando cambió su texto) los pone Claude.
      fuente = IDIOMAS.includes(body.descriptionLang) ? (body.descriptionLang as Idioma) : "fr";
      const pedidos = Array.isArray(body.traducir)
        ? (body.traducir as unknown[]).filter((l): l is Idioma => IDIOMAS.includes(l as Idioma) && l !== fuente)
        : [];
      if (pedidos.length) {
        traducidas = await traducirDescripcion(textos[fuente], fuente, pedidos);
        for (const [l, t] of Object.entries(traducidas ?? {})) textos[l as Idioma] = t.slice(0, 2000);
      }
      for (const l of IDIOMAS) update[COLUMNA[l]] = l === "fr" ? textos.fr : textos[l] || null;
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
      // Aparte, por si la migración 042 aún no está: sin la columna, lo demás
      // ya se guardó.
      if (fuente) await admin.from("comercios").update({ description_lang: fuente }).eq("id", maison.id);
    }
    return NextResponse.json({
      ok: true,
      photos,
      // Lo que quedó guardado, traducciones incluidas, para que la pantalla lo enseñe.
      description: update.description,
      descriptionEn: update.description_en ?? "",
      descriptionEs: update.description_es ?? "",
      // null si se pidió traducir y no se pudo: la pantalla lo dice.
      traduccionFallida: traducidas === null,
    });
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

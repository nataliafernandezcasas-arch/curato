import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDossiers } from "@/lib/storyteller-dossier";
import {
  BIO_MAX,
  PORTRAIT_BUCKET,
  PORTRAIT_MAX,
  PORTRAIT_MAX_BYTES,
  isAllowedImage,
  signPortraits,
} from "@/lib/creator-portrait";

/**
 * El retrato y la frase que el storyteller elige enseñar a las casas (16b).
 *
 * GET devuelve lo guardado y, además, su dossier tal como lo ve una maison,
 * para que pueda mirarse desde fuera antes de decidir qué cambiar.
 * POST sube una foto y devuelve su ruta, sin guardarla todavía en el perfil:
 * eso lo hace PATCH, con el botón Enregistrer, porque la pantalla deja editar
 * sin guardar.
 */

async function elCreador() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) } as const;

  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id, portrait_urls, own_bio")
    .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
    .maybeSingle();
  if (!creator) return { error: NextResponse.json({ error: "Accès réservé aux storytellers." }, { status: 403 }) } as const;

  return { admin, creator } as const;
}

// Una ruta vale solo si está dentro de la carpeta de este creador. Sin esto,
// alguien podría poner en su perfil la foto de otra persona.
function esSuya(path: unknown, creatorId: string): path is string {
  return typeof path === "string" && path.startsWith(`${creatorId}/`) && !path.includes("..");
}

export async function GET() {
  try {
    const r = await elCreador();
    if ("error" in r) return r.error;
    const { admin, creator } = r;

    const paths = ((creator.portrait_urls as string[] | null) ?? []).slice(0, PORTRAIT_MAX);
    const [urls, dossiers] = await Promise.all([signPortraits(admin, paths), buildDossiers(admin, [creator.id])]);
    const dossier = dossiers.get(creator.id) ?? null;

    return NextResponse.json({
      portraits: paths.map((path, i) => ({ path, url: urls[i] })).filter((p) => p.url),
      bio: (creator.own_bio as string | null) ?? "",
      // Sin retrato propio, la casa ve la foto de Instagram: se enseña como tal.
      inherited: paths.length === 0 ? dossier?.portrait ?? null : null,
      dossier,
    });
  } catch (err) {
    console.error("Perfil GET error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const r = await elCreador();
    if ("error" in r) return r.error;
    const { admin, creator } = r;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucune photo." }, { status: 400 });
    if (!isAllowedImage(file.type)) return NextResponse.json({ error: "format" }, { status: 415 });
    if (file.size > PORTRAIT_MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 413 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type.startsWith("image/hei") ? "heic" : "jpg";
    const path = `${creator.id}/${randomUUID()}.${ext}`;
    const { error } = await admin.storage
      .from(PORTRAIT_BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) {
      console.error("Portrait upload error:", error);
      return NextResponse.json({ error: "upload" }, { status: 500 });
    }

    const [url] = await signPortraits(admin, [path]);
    return NextResponse.json({ path, url });
  } catch (err) {
    console.error("Perfil POST error:", err);
    return NextResponse.json({ error: "upload" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const r = await elCreador();
    if ("error" in r) return r.error;
    const { admin, creator } = r;

    const body = (await request.json()) as { portraits?: unknown; bio?: unknown };
    const portraits = Array.isArray(body.portraits) ? body.portraits : [];
    if (portraits.length > PORTRAIT_MAX || !portraits.every((p) => esSuya(p, creator.id))) {
      return NextResponse.json({ error: "Portraits invalides." }, { status: 400 });
    }
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    if (bio.length > BIO_MAX) return NextResponse.json({ error: "Phrase trop longue." }, { status: 400 });

    const { error } = await admin
      .from("creators")
      .update({ portrait_urls: portraits, own_bio: bio || null })
      .eq("id", creator.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Lo que ya no está en el perfil se borra del bucket: una cara que la
    // persona ha quitado no se queda guardada por si acaso.
    const antes = ((creator.portrait_urls as string[] | null) ?? []).filter((p) => esSuya(p, creator.id));
    const quitadas = antes.filter((p) => !portraits.includes(p));
    if (quitadas.length) await admin.storage.from(PORTRAIT_BUCKET).remove(quitadas);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Perfil PATCH error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

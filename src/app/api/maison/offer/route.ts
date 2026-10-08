import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDe } from "@/lib/identidad";
import { enRango, rangoDe } from "@/lib/oferta";
import { agendaDe } from "@/lib/agenda";

const BUCKET = "maison-menus";

async function getMaison(admin: ReturnType<typeof createAdminClient>, userId: string, email: string) {
  const { data } = await admin
    .from("comercios")
    .select("id, category_id, availability, blocked_slots, services, menu_urls")
    .or(filtroDe(userId, email))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// El importe de la oferta (migración 043). Aparte y tolerante: sin la columna,
// la consulta falla y la oferta sale vacía, en vez de romper la pantalla.
async function ofertaDe(admin: ReturnType<typeof createAdminClient>, id: string): Promise<number | null> {
  const { data, error } = await admin.from("comercios").select("offer_eur").eq("id", id).maybeSingle();
  return !error && data ? ((data as { offer_eur?: number | null }).offer_eur ?? null) : null;
}

// El tipo de agenda (migración 044), aparte y tolerante como la oferta: sin la
// columna, la casa usa el modo de su categoría.
async function agendaGuardada(admin: ReturnType<typeof createAdminClient>, id: string): Promise<unknown> {
  const { data, error } = await admin.from("comercios").select("agenda").eq("id", id).maybeSingle();
  return !error && data ? (data as { agenda?: unknown }).agenda ?? null : null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const admin = createAdminClient();
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });
    return NextResponse.json({
      availability: m.availability ?? [],
      blockedSlots: m.blocked_slots ?? [],
      services: m.services ?? [],
      offerEur: await ofertaDe(admin, m.id),
      agenda: agendaDe(await agendaGuardada(admin, m.id), m.category_id as string | null),
      // Entre cuánto y cuánto puede ofrecer, según su categoría.
      offerRange: rangoDe(m.category_id as string | null),
      menuUrls: m.menu_urls ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Save availability / blocked slots / services (any subset provided).
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const body = await request.json();
    const admin = createAdminClient();
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const update: Record<string, unknown> = {};
    if (Array.isArray(body.availability)) {
      update.availability = body.availability
        .filter((w: { day: number; start: string; end: string }) => typeof w?.day === "number" && w.start && w.end)
        // Varias franjas por día (dos servicios): se ordenan por día y hora.
        .sort((a: { day: number; start: string }, b: { day: number; start: string }) => a.day - b.day || a.start.localeCompare(b.start))
        .slice(0, 40);
    }
    if (Array.isArray(body.blockedSlots)) {
      update.blocked_slots = body.blockedSlots
        .filter((b: { date: string }) => typeof b?.date === "string")
        .slice(0, 365);
    }
    if (Array.isArray(body.services)) {
      update.services = body.services
        .filter((s: { name: string }) => (s?.name || "").trim())
        .map((s: { name: string; description?: string; price?: string }) => ({
          name: String(s.name).slice(0, 120),
          description: String(s.description || "").slice(0, 400),
          price: String(s.price || "").slice(0, 40),
        }))
        .slice(0, 40);
    }
    if (Object.keys(update).length) await admin.from("comercios").update(update).eq("id", m.id);
    // La agenda va aparte: si la migración 044 aún no está, lo demás se guarda
    // y la pantalla lo dice.
    if (body.agenda && typeof body.agenda === "object") {
      const agenda = agendaDe(body.agenda, m.category_id as string | null);
      const { error } = await admin.from("comercios").update({ agenda }).eq("id", m.id);
      if (error) return NextResponse.json({ error: "agenda" }, { status: 500 });
    }
    // El importe va aparte: si la migración 043 aún no está, lo demás se guarda.
    if ("offerEur" in body) {
      const rango = rangoDe(m.category_id as string | null);
      const n = Number(body.offerEur);
      if (body.offerEur !== null && !enRango(n, rango)) {
        return NextResponse.json({ error: "range", ...rango }, { status: 400 });
      }
      const offer_eur = body.offerEur === null ? null : n;
      const { error } = await admin.from("comercios").update({ offer_eur }).eq("id", m.id);
      if (error) return NextResponse.json({ error: "offer" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Los formatos y el peso que admite el bucket (migración 023): veinte megas.
const MENU_TIPOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MENU_MAX_BYTES = 20 * 1024 * 1024;

/**
 * La carta o el folleto de la casa, en dos pasos.
 *
 * Antes el archivo pasaba por aquí, y Vercel corta cualquier petición de más
 * de 4,5 MB: una carta en PDF casi siempre pesa más, y la subida fallaba sin
 * decir nada. Ahora el archivo va directo del teléfono al almacenamiento:
 *
 *   1. `{ subir: [{ type, size }] }` → un permiso firmado por archivo;
 *   2. el navegador sube cada archivo con su permiso;
 *   3. `{ paths: [...] }` → se añaden a la casa.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
    const admin = createAdminClient();
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "maison" }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as {
      subir?: { type?: string; size?: number }[];
      paths?: unknown;
    };

    if (Array.isArray(body.subir)) {
      const permisos = [];
      for (const f of body.subir.slice(0, 10)) {
        const ext = MENU_TIPOS[(f.type ?? "").toLowerCase()];
        if (!ext) return NextResponse.json({ error: "format" }, { status: 415 });
        if (!f.size || f.size > MENU_MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 413 });
        const path = `maisons/${m.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) {
          console.error("Menu signed URL error:", error);
          return NextResponse.json({ error: "upload" }, { status: 500 });
        }
        permisos.push({ path: data.path, token: data.token });
      }
      return NextResponse.json({ permisos });
    }

    // Solo rutas de su propia carpeta: llegan del navegador.
    const carpeta = `maisons/${m.id}/`;
    const paths = Array.isArray(body.paths)
      ? body.paths.filter((p): p is string => typeof p === "string" && p.startsWith(carpeta) && !p.includes(".."))
      : [];
    if (paths.length === 0) return NextResponse.json({ error: "paths" }, { status: 400 });
    const nuevas = paths.map((p) => admin.storage.from(BUCKET).getPublicUrl(p).data.publicUrl).filter(Boolean);
    const menuUrls = [...(m.menu_urls ?? []), ...nuevas.filter((u) => !(m.menu_urls ?? []).includes(u))];
    await admin.from("comercios").update({ menu_urls: menuUrls }).eq("id", m.id);
    return NextResponse.json({ ok: true, menuUrls });
  } catch (err) {
    console.error("Menu POST error:", err);
    return NextResponse.json({ error: "upload" }, { status: 500 });
  }
}

// Remove a menu file by URL.
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const { url } = await request.json();
    const admin = createAdminClient();
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const menuUrls = (m.menu_urls ?? []).filter((u: string) => u !== url);
    await admin.from("comercios").update({ menu_urls: menuUrls }).eq("id", m.id);
    const marker = `/${BUCKET}/`;
    const idx = (url as string).indexOf(marker);
    if (idx !== -1) await admin.storage.from(BUCKET).remove([(url as string).slice(idx + marker.length)]);
    return NextResponse.json({ ok: true, menuUrls });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

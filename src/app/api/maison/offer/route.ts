import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "maison-menus";

async function getMaison(admin: ReturnType<typeof createAdminClient>, userId: string, email: string) {
  const { data } = await admin
    .from("comercios")
    .select("id, availability, blocked_slots, services, menu_urls")
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
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });
    return NextResponse.json({
      availability: m.availability ?? [],
      blockedSlots: m.blocked_slots ?? [],
      services: m.services ?? [],
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Upload a menu file (PDF / image).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const admin = createAdminClient();
    const m = await getMaison(admin, user.id, user.email || "");
    if (!m) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const form = await request.formData();
    const files = (form.getAll("files") as File[]).filter((f) => f && typeof f.arrayBuffer === "function");
    const newUrls: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `maisons/${m.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });
      if (upErr) { console.error("Menu upload error:", upErr); continue; }
      const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) newUrls.push(data.publicUrl);
    }
    const menuUrls = [...(m.menu_urls ?? []), ...newUrls];
    await admin.from("comercios").update({ menu_urls: menuUrls }).eq("id", m.id);
    return NextResponse.json({ ok: true, menuUrls });
  } catch (err) {
    console.error("Menu POST error:", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
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

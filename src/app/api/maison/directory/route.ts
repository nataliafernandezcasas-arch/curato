import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The Curato maison directory: every signed venue (is_reservable = true), so a
// maison can browse the other houses in the collective and see their profiles.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();

    // Only a maison may browse the directory.
    const { data: self } = await admin
      .from("comercios")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!self) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    // Prefer the coming_soon-aware query; fall back to the old shape if the
    // column isn't there yet (migration 025 pending) so the directory keeps working.
    const primary = await admin
      .from("comercios")
      .select("id, name, photos, description, description_en, description_es, website_url, contact_instagram, arrondissement, address, category_id, is_reservable, coming_soon")
      .or("is_reservable.eq.true,coming_soon.eq.true")
      .order("name");
    let data: unknown[] | null = primary.data;
    if (primary.error) {
      const fb = await admin
        .from("comercios")
        .select("id, name, photos, description, description_en, description_es, website_url, contact_instagram, arrondissement, address, category_id, is_reservable")
        .eq("is_reservable", true)
        .order("name");
      data = fb.data;
    }

    type Row = {
      id: string; name: string | null; photos: string[] | null;
      description: string | null; description_en: string | null; description_es: string | null;
      website_url: string | null; contact_instagram: string | null;
      arrondissement: string | null; address: string | null; category_id: string | null;
      is_reservable: boolean | null; coming_soon: boolean | null;
    };

    const real: Record<string, unknown>[] = [];
    const teasers: Record<string, unknown>[] = [];

    for (const m of (data ?? []) as Row[]) {
      if (m.id === self.id) continue;

      // A hidden maison appears only as a blurred "coming soon" teaser: its
      // name and details are withheld, keeping just the category / area hint and
      // one photo (blurred client-side) so it reads as a real house on the way.
      if (m.coming_soon) {
        teasers.push({
          id: m.id,
          comingSoon: true,
          name: "",
          photos: (m.photos ?? []).slice(0, 1),
          description: "", descriptionEn: "", descriptionEs: "",
          website: "", instagram: "",
          arrondissement: m.arrondissement ?? null,
          address: null,
          categoryId: m.category_id ?? null,
        });
        continue;
      }

      // Regular directory entry: signed maison with a started profile.
      if (m.is_reservable && ((m.photos?.length ?? 0) > 0 || (m.description || "").trim().length > 0)) {
        real.push({
          id: m.id,
          comingSoon: false,
          name: m.name || "",
          photos: m.photos ?? [],
          description: m.description ?? "",
          descriptionEn: m.description_en ?? "",
          descriptionEs: m.description_es ?? "",
          website: m.website_url ?? "",
          instagram: m.contact_instagram ?? "",
          arrondissement: m.arrondissement ?? null,
          address: m.address ?? null,
          categoryId: m.category_id ?? null,
        });
      }
    }

    // Real houses first, teasers after.
    return NextResponse.json({ maisons: [...real, ...teasers] });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

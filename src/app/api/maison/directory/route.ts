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

    const { data } = await admin
      .from("comercios")
      .select("id, name, photos, description, description_en, description_es, website_url, contact_instagram, arrondissement, address, category_id")
      .eq("is_reservable", true)
      .order("name");

    // Show other maisons that have started a profile (a photo or a description).
    const maisons = (data ?? [])
      .filter((m) => m.id !== self.id && ((m.photos?.length ?? 0) > 0 || (m.description || "").trim().length > 0))
      .map((m) => ({
        id: m.id as string,
        name: (m.name as string) || "",
        photos: (m.photos as string[] | null) ?? [],
        description: (m.description as string | null) ?? "",
        descriptionEn: (m.description_en as string | null) ?? "",
        descriptionEs: (m.description_es as string | null) ?? "",
        website: (m.website_url as string | null) ?? "",
        instagram: (m.contact_instagram as string | null) ?? "",
        arrondissement: (m.arrondissement as string | null) ?? null,
        address: (m.address as string | null) ?? null,
        categoryId: (m.category_id as string | null) ?? null,
      }));

    return NextResponse.json({ maisons });
  } catch {
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

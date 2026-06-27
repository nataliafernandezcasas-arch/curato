import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Content-type survey slugs → display labels (FR).
const CONTENT_LABELS: Record<string, string> = {
  food: "Food",
  hotel_reviews: "Hôtels",
  wellness: "Bien-être",
  fashion_adjacent: "Mode",
  lifestyle: "Lifestyle",
  travel: "Voyage",
};

// Roster of signed storytellers, visible to a logged-in maison: name, handle,
// follower count, and the kind of content they make (from the onboarding survey).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();

    // Only a maison (active comercio) may see the roster.
    const { data: maison } = await admin
      .from("comercios")
      .select("id, name")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    // Signed / accepted creators.
    const { data: creators } = await admin
      .from("creators")
      .select("id, full_name, handle, followers")
      .eq("stage", "active")
      .order("followers", { ascending: false, nullsFirst: false });

    const rows = creators ?? [];
    const ids = rows.map((c) => c.id);

    // Content type from the onboarding survey (answer is a JSONB array of slugs).
    const { data: responses } = await admin
      .from("creator_survey_responses")
      .select("creator_id, answer")
      .eq("question_slug", "content_type")
      .in("creator_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const contentByCreator = new Map<string, string[]>();
    for (const r of responses ?? []) {
      const slugs = Array.isArray(r.answer) ? (r.answer as string[]) : [];
      contentByCreator.set(
        r.creator_id,
        slugs.map((s) => CONTENT_LABELS[s] ?? s).filter(Boolean)
      );
    }

    const roster = rows.map((c) => ({
      id: c.id as string,
      name: (c.full_name as string | null) || (c.handle ? `@${c.handle}` : "—"),
      handle: (c.handle as string | null) ?? null,
      followers: (c.followers as number | null) ?? null,
      content: contentByCreator.get(c.id) ?? [],
    }));

    return NextResponse.json({ maison: maison.name, roster });
  } catch (err) {
    console.error("Maison roster error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

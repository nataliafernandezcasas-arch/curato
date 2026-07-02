import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloProfile } from "@/lib/phyllo/client";

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
      .select("id, full_name, handle, followers, followers_count, engagement_rate, instagram_connected, phyllo_account_id")
      .eq("stage", "active")
      .order("followers", { ascending: false, nullsFirst: false });

    // Only real signed creators: must have a name or an Instagram handle
    // (filters out empty/incomplete creator rows).
    const rows = (creators ?? []).filter(
      (c) => (c.full_name && c.full_name.trim()) || (c.handle && c.handle.trim())
    );
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

    // Profile photos live in Phyllo, not our DB. Fetch them for connected
    // creators in parallel; best-effort, so a slow/absent Phyllo just yields no
    // photo (the UI falls back to an initials monogram). Non-connected demo
    // creators have no photo source at all.
    const avatarById = new Map<string, string>();
    await Promise.all(
      rows
        .filter((c) => c.instagram_connected && c.phyllo_account_id)
        .map(async (c) => {
          try {
            const accounts = await getPhylloAccounts(c.phyllo_account_id as string);
            const account = accounts?.data?.[0];
            if (!account?.id) return;
            const profileRes = await getPhylloProfile(account.id);
            const img = profileRes?.data?.[0]?.image_url;
            if (typeof img === "string" && img) avatarById.set(c.id as string, img);
          } catch {
            /* leave photo empty */
          }
        })
    );

    const roster = rows.map((c) => {
      const er = c.engagement_rate as number | null;
      return {
        id: c.id as string,
        name: (c.full_name as string | null) || (c.handle ? `@${c.handle}` : "—"),
        handle: (c.handle as string | null) ?? null,
        // Prefer the live Phyllo count when we have one; otherwise the survey figure.
        followers: (c.followers_count as number | null) ?? (c.followers as number | null) ?? null,
        content: contentByCreator.get(c.id) ?? [],
        igConnected: Boolean(c.instagram_connected),
        // engagement_rate is stored as a fraction (0.05 = 5%); expose the %.
        engagement: er != null ? Math.round(er * 1000) / 10 : null,
        avatar: avatarById.get(c.id as string) ?? null,
      };
    });

    return NextResponse.json({ maison: maison.name, roster });
  } catch (err) {
    console.error("Maison roster error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

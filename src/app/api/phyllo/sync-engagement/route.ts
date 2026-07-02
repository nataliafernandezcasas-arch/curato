import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloProfile, getPhylloContents, summarizeMetrics } from "@/lib/phyllo/client";

// Called right after the Phyllo Connect SDK reports an account connected.
// Pulls the connected account's profile (followers + engagement) and stores it
// on the creator. The raw Phyllo response is logged so we can confirm the exact
// field names in sandbox before relying on them.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id, phyllo_account_id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();

    if (!creator?.phyllo_account_id) {
      return NextResponse.json({ error: "Compte Phyllo introuvable." }, { status: 404 });
    }

    // 1. Find the connected account(s) for this Phyllo user.
    const accounts = await getPhylloAccounts(creator.phyllo_account_id);
    const account = accounts?.data?.[0];
    if (!account?.id) {
      return NextResponse.json({ error: "Aucun compte connecté pour le moment." }, { status: 404 });
    }

    // 2. Pull the profile (followers, photo, bio) and recent content (engagement).
    const [profileRes, contentsRes] = await Promise.all([
      getPhylloProfile(account.id),
      getPhylloContents(account.id, 50),
    ]);
    const profile = profileRes?.data?.[0] ?? profileRes;
    const contents = contentsRes?.data ?? [];

    const now = new Date().toISOString();
    const { engagementRate, metrics } = summarizeMetrics(profile, contents, now);

    const update: Record<string, unknown> = {
      instagram_connected: true,
      phyllo_connected_at: now,
    };
    if (typeof metrics.followers === "number") update.followers_count = metrics.followers;
    if (typeof engagementRate === "number") {
      update.engagement_rate = engagementRate;
      update.engagement_rate_updated_at = now;
    }

    await admin.from("creators").update(update).eq("id", creator.id);

    return NextResponse.json({ ok: true, engagement_rate: engagementRate, metrics });
  } catch (err) {
    console.error("Phyllo sync-engagement error:", err);
    return NextResponse.json({ error: "Erreur lors de la synchronisation." }, { status: 500 });
  }
}

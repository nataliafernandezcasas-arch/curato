import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloProfile } from "@/lib/phyllo/client";

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

    // 2. Pull the profile (followers + engagement).
    const profileRes = await getPhylloProfile(account.id);
    console.log("Phyllo profile raw:", JSON.stringify(profileRes).slice(0, 1200));
    const profile = profileRes?.data?.[0] ?? profileRes;

    // Field names confirmed against the sandbox response on first connection;
    // we read a few likely shapes defensively.
    const followers =
      profile?.reputation?.follower_count ??
      profile?.follower_count ??
      null;
    const engagementRate =
      profile?.engagement?.engagement_rate ??
      profile?.engagement_rate ??
      profile?.reputation?.engagement_rate ??
      null;

    const update: Record<string, unknown> = {
      instagram_connected: true,
      phyllo_connected_at: new Date().toISOString(),
    };
    if (typeof followers === "number") update.followers_count = followers;
    if (typeof engagementRate === "number") {
      // Phyllo may return a percentage (e.g. 4.2) or a fraction (0.042).
      update.engagement_rate = engagementRate > 1 ? engagementRate / 100 : engagementRate;
      update.engagement_rate_updated_at = new Date().toISOString();
    }

    await admin.from("creators").update(update).eq("id", creator.id);

    return NextResponse.json({
      ok: true,
      followers: followers ?? null,
      engagement_rate: update.engagement_rate ?? null,
    });
  } catch (err) {
    console.error("Phyllo sync-engagement error:", err);
    return NextResponse.json({ error: "Erreur lors de la synchronisation." }, { status: 500 });
  }
}

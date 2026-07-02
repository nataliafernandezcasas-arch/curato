import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPhylloAccounts, getPhylloProfile, getPhylloContents, summarizeMetrics } from "@/lib/phyllo/client";

// A maison opens a storyteller card and wants the full picture — reach,
// engagement, photo, bio — to judge whether the profile will bring visibility.
// We fetch it live from Phyllo on demand (no per-roster fan-out, no stored blob).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();

    // Only a maison may see a storyteller's metrics.
    const { data: maison } = await admin
      .from("comercios")
      .select("id")
      .or(`owner_id.eq.${user.id},email.eq.${(user.email || "").toLowerCase()}`)
      .maybeSingle();
    if (!maison) return NextResponse.json({ error: "Accès réservé aux maisons." }, { status: 403 });

    const { data: creator } = await admin
      .from("creators")
      .select("id, full_name, handle, instagram_connected, phyllo_account_id, engagement_rate")
      .eq("id", id)
      .eq("stage", "active")
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

    if (!creator.instagram_connected || !creator.phyllo_account_id) {
      return NextResponse.json({ connected: false, metrics: null });
    }

    // Resolve the connected Instagram account, then pull profile + content.
    const accounts = await getPhylloAccounts(creator.phyllo_account_id);
    const account = accounts?.data?.[0];
    if (!account?.id) return NextResponse.json({ connected: false, metrics: null });

    const [profileRes, contentsRes] = await Promise.all([
      getPhylloProfile(account.id),
      getPhylloContents(account.id, 50),
    ]);
    const profile = profileRes?.data?.[0] ?? profileRes;
    const contents = contentsRes?.data ?? [];
    const { metrics } = summarizeMetrics(profile, contents, new Date().toISOString());

    return NextResponse.json({ connected: true, metrics });
  } catch (err) {
    console.error("Storyteller metrics error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

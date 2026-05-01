import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log("Phyllo webhook received:", event, JSON.stringify(data).slice(0, 200));

    const supabase = createAdminClient();

    // Handle content events
    if (event === "CONTENTS.ADDED" || event === "CONTENTS.UPDATED") {
      const accountId = data?.account?.id;
      const content = data?.content;

      if (!accountId || !content) return NextResponse.json({ ok: true });

      // Find the creator by their Phyllo account ID
      const { data: creator } = await supabase
        .from("creators")
        .select("id, email")
        .eq("phyllo_account_id", accountId)
        .single();

      if (!creator) {
        console.log("No creator found for Phyllo account:", accountId);
        return NextResponse.json({ ok: true });
      }

      // Find pending visits for this creator
      const { data: pendingVisits } = await supabase
        .from("visits")
        .select("id, comercio_id, offers(title, comercios(name))")
        .eq("creator_id", creator.id)
        .eq("status", "content_pending")
        .order("created_at", { ascending: false });

      if (!pendingVisits || pendingVisits.length === 0) {
        console.log("No pending visits for creator:", creator.email);
        return NextResponse.json({ ok: true });
      }

      // Check if content mentions the business or @midi
      const caption = (content.title || "") + " " + (content.description || "");
      const captionLower = caption.toLowerCase();
      const contentUrl = content.url || content.media_url || "";
      const contentType = content.type || "post"; // post, story, reel

      // Try to match with a pending visit
      for (const visit of pendingVisits) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const visitAny = visit as any;
        const bizName = visitAny.offers?.comercios?.name || "";
        const offerTitle = visitAny.offers?.title || "";

        const mentionsMidi = captionLower.includes("midi") || captionLower.includes("@midi");
        const mentionsBusiness = bizName && captionLower.includes(bizName.toLowerCase());

        if (mentionsMidi || mentionsBusiness) {
          // Match found -- update visit
          const proofUrls = [contentUrl].filter(Boolean);

          await supabase
            .from("visits")
            .update({
              status: "content_submitted",
              content_submitted_at: new Date().toISOString(),
              content_proof_urls: proofUrls,
              content_notes: `Auto-verificado via Phyllo. Tipo: ${contentType}. Caption match: ${mentionsMidi ? "@midi" : bizName}`,
              content_verified: true,
            })
            .eq("id", visit.id);

          console.log(`Visit ${visit.id} auto-verified for creator ${creator.email}`);
          break; // Only match one visit per content
        }
      }
    }

    // Handle account connection events
    if (event === "ACCOUNTS.CONNECTED") {
      const accountId = data?.account?.id;
      const userId = data?.user?.id;

      if (userId) {
        // Update creator's instagram_connected flag
        await supabase
          .from("creators")
          .update({ instagram_connected: true, phyllo_account_id: accountId })
          .eq("phyllo_account_id", userId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Phyllo webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to webhooks
  }
}

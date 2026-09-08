import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log("Phyllo webhook received:", event, JSON.stringify(data).slice(0, 200));

    const supabase = createAdminClient();

    // Handle account connection events
    if (event === "ACCOUNTS.CONNECTED") {
      const userId = data?.user?.id;

      if (userId) {
        // OJO con el nombre de la columna: `phyllo_account_id` guarda el **user
        // id** de Phyllo, no el id de la cuenta. Lo usa así todo el código
        // (getPhylloAccounts lo manda como user_id, createSDKToken igual).
        //
        // Este webhook lo sobrescribía con el accountId, así que la primera vez
        // que Phyllo avisaba de una conexión, el creador perdía su user id y
        // sus métricas dejaban de cargar en silencio: las llamadas seguían
        // saliendo bien, solo que preguntando por un id que no era el suyo.
        await supabase
          .from("creators")
          .update({ instagram_connected: true, phyllo_connected_at: new Date().toISOString() })
          .eq("phyllo_account_id", userId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Phyllo webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to webhooks
  }
}

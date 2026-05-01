import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  // 1. Approved creator?
  const { data: creator } = await admin
    .from("creators")
    .select("id, owner_id, stage")
    .eq("email", emailLc)
    .in("stage", ["verified", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (creator) {
    if (!creator.owner_id) {
      await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
    }
    redirect("/dashboard/influencer");
  }

  // 2. Approved comercio?
  const { data: comercio } = await admin
    .from("comercios")
    .select("id, name, owner_id, qr_code, stage")
    .eq("email", emailLc)
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (comercio) {
    const updates: Record<string, string> = {};
    if (!comercio.owner_id) updates.owner_id = user.id;
    if (!comercio.qr_code) {
      updates.qr_code = `MIDI-${(comercio.name || "BIZ").toUpperCase().replace(/\s+/g, "").slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    if (Object.keys(updates).length > 0) {
      await admin.from("comercios").update(updates).eq("id", comercio.id);
    }
    redirect("/dashboard/business");
  }

  redirect("/auth/sign-in?error=not_approved");
}

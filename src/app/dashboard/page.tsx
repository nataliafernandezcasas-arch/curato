import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  // 1. Match against ANY creator row for this email (newest first). Migration
  //    009 introduced `partnership_stage` (enum) alongside the legacy `stage`
  //    text column. Imports from Notion arrive with partnership_stage='prospect'
  //    and stage=NULL, so the old `stage IN ('verified','active')` filter
  //    would block them entirely. We let everyone through except declined.
  const { data: creator } = await admin
    .from("creators")
    .select("id, owner_id, stage, partnership_stage, onboarding_survey_completed_at")
    .eq("email", emailLc)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (creator && creator.partnership_stage !== "declined") {
    // Always sync owner_id with the current auth session. The earlier
    // `!creator.owner_id` check only re-linked when NULL — if a stale
    // user.id was set (e.g. an orphaned auth user that shares the email),
    // server actions using the user client + `.eq("owner_id", user.id)`
    // wouldn't find the row and would fail with `creator_not_found`.
    if (creator.owner_id !== user.id) {
      await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
    }
    // First-time creators run through the onboarding survey before reaching
    // the personalised feed. Re-routing here (server-side) keeps the gate
    // tight even if a user types /dashboard/influencer in their URL bar.
    if (!creator.onboarding_survey_completed_at) {
      redirect("/onboarding/survey");
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
      updates.qr_code = `CURATO-${(comercio.name || "MAISON").toUpperCase().replace(/\s+/g, "").slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    if (Object.keys(updates).length > 0) {
      await admin.from("comercios").update(updates).eq("id", comercio.id);
    }
    redirect("/dashboard/business");
  }

  redirect("/auth/sign-in?error=not_approved");
}

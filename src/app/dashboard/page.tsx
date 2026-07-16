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
    .select("id, owner_id, stage, partnership_stage, welcome_completed_at, onboarding_survey_completed_at")
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
    // First-time creators must complete the welcome flow (10-slide dossier +
    // explicit T&C / Privacy acceptance) before anything else. Without this
    // gate they could land on the survey or the feed having never seen the
    // model or accepted the contracts, which is also an RGPD problem.
    if (!creator.welcome_completed_at) {
      redirect("/onboarding/welcome");
    }
    // Then they take the onboarding survey before reaching the feed. Both
    // gates are enforced server-side here so URL-typing doesn't bypass them.
    if (!creator.onboarding_survey_completed_at) {
      redirect("/onboarding/survey");
    }
    redirect("/dashboard/storyteller");
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
    // First-login commitment: the maison must sign the 3-month / 299 €/month
    // agreement before reaching the dashboard. Defensive — if the column isn't
    // there yet (migration pending), the query errors and we let them through.
    const { data: commit, error: commitErr } = await admin
      .from("comercios")
      .select("commitment_accepted_at")
      .eq("id", comercio.id)
      .maybeSingle();
    if (!commitErr && commit && !commit.commitment_accepted_at) {
      redirect("/onboarding/maison");
    }
    redirect("/dashboard/business");
  }

  // 3. Recruiter? (commission-based maison sourcing)
  const { data: recruiter } = await admin
    .from("recruiters")
    .select("id, owner_id")
    .eq("email", emailLc)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recruiter) {
    if (recruiter.owner_id !== user.id) {
      await admin.from("recruiters").update({ owner_id: user.id }).eq("id", recruiter.id);
    }
    // First-login commitment: the recruiter must sign the programme (accept +
    // lieu + date) before the dashboard. Defensive — if the column isn't there
    // yet (migration pending), the query errors and we let them through.
    const { data: rc, error: rcErr } = await admin
      .from("recruiters")
      .select("commitment_accepted_at")
      .eq("id", recruiter.id)
      .maybeSingle();
    if (!rcErr && rc && !rc.commitment_accepted_at) {
      redirect("/onboarding/recruiter");
    }
    redirect("/dashboard/recruiter");
  }

  redirect("/auth/sign-in?error=not_approved");
}

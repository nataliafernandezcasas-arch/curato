import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WelcomeClient from "./welcome-client";

export const dynamic = "force-dynamic";

// /onboarding/welcome — first-login flow for new creators.
//
// Server-side guard:
//   • Must be authenticated (else → /auth/sign-in).
//   • Must match a non-declined creator row by email/owner_id.
//   • If already completed (welcome_completed_at IS NOT NULL) → forward to
//     the next gate (survey if pending, otherwise the influencer feed).
//
// We deliberately use the admin client for the creator lookup because
// freshly-created auth users may not have owner_id linked yet (the same
// pattern the survey page uses). The server action that closes the flow
// runs the same lookup and writes the three acceptance timestamps.
export default async function OnboardingWelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const { data: creator } = await admin
    .from("creators")
    .select("id, owner_id, partnership_stage, welcome_completed_at, onboarding_survey_completed_at")
    .or(`owner_id.eq.${user.id},email.eq.${emailLc}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!creator) redirect("/auth/sign-in?error=not_approved");
  if (creator.partnership_stage === "declined") {
    redirect("/auth/sign-in?error=not_approved");
  }

  // Sync owner_id if needed (same pattern as /dashboard and /onboarding/survey).
  if (creator.owner_id !== user.id) {
    await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
  }

  // Already finished the welcome? Forward to the next pending gate.
  if (creator.welcome_completed_at) {
    if (!creator.onboarding_survey_completed_at) {
      redirect("/onboarding/survey");
    }
    redirect("/dashboard/influencer");
  }

  return <WelcomeClient />;
}

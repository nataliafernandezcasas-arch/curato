import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SurveyClient, { type SurveyQuestion } from "./survey-client";

export const dynamic = "force-dynamic";

export default async function OnboardingSurveyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/auth/sign-in");

  // Look up the creator row owned by this auth user. We use the admin client
  // because brand-new sign-ins may not have owner_id set yet on the creators
  // row — the /dashboard router sets it on first visit, but if the user
  // bookmarks /onboarding/survey directly we want to handle the link by
  // email as a fallback.
  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  let { data: creator } = await admin
    .from("creators")
    .select("id, owner_id, onboarding_survey_completed_at, partnership_stage, stage")
    .or(`owner_id.eq.${user.id},email.eq.${emailLc}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Block declined creators outright.
  if (creator?.partnership_stage === "declined") {
    redirect("/auth/sign-in?error=not_approved");
  }

  if (!creator) {
    redirect("/auth/sign-in?error=not_approved");
  }

  // Link owner_id on first visit if it wasn't set already.
  if (!creator.owner_id) {
    await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
    creator = { ...creator, owner_id: user.id };
  }

  // Already done? Send them to the feed.
  if (creator.onboarding_survey_completed_at) {
    redirect("/dashboard/influencer");
  }

  // Load active questions ordered by position.
  const { data: questionsRaw } = await admin
    .from("survey_questions")
    .select("id, position, slug, question_text_es, question_text_fr, question_text_en, question_type, options, is_required")
    .eq("active", true)
    .order("position", { ascending: true });

  const questions = (questionsRaw ?? []) as SurveyQuestion[];

  if (questions.length === 0) {
    // No questions seeded — skip the survey, mark completed, send to feed.
    await admin
      .from("creators")
      .update({ onboarding_survey_completed_at: new Date().toISOString() })
      .eq("id", creator.id);
    redirect("/dashboard/influencer");
  }

  return <SurveyClient questions={questions} />;
}

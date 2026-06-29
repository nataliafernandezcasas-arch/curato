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

  // Always sync owner_id with the current auth session. Re-linking only
  // when NULL leaves stale links pointing to orphaned auth users, which
  // breaks the submit server action (it does `.eq("owner_id", user.id)`
  // and returns `creator_not_found` on mismatch).
  if (creator.owner_id !== user.id) {
    await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
    creator = { ...creator, owner_id: user.id };
  }

  // Already done? Send them to the feed.
  if (creator.onboarding_survey_completed_at) {
    redirect("/dashboard/storyteller");
  }

  // Load active questions ordered by position. We capture the error so
  // we can surface it instead of silently swallowing — earlier versions
  // auto-completed the survey when this query returned empty, which
  // poisoned `onboarding_survey_completed_at` whenever the query failed
  // for any reason (env vars, network, RLS, …) and made the bug
  // unrecoverable without a manual SQL reset.
  const { data: questionsRaw, error: questionsErr } = await admin
    .from("survey_questions")
    .select("id, position, slug, question_text_es, question_text_fr, question_text_en, question_type, options, is_required")
    .eq("active", true)
    .order("position", { ascending: true });

  if (questionsErr) {
    console.error("[onboarding/survey] survey_questions query failed", {
      message: questionsErr.message,
      details: questionsErr.details,
      hint: questionsErr.hint,
      code: questionsErr.code,
    });
  }

  const questions = (questionsRaw ?? []) as SurveyQuestion[];

  // No questions OR query failed → show error UI. Do NOT auto-complete
  // the survey. The user can retry by refreshing once the underlying
  // issue is fixed.
  if (questions.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-deep flex items-center justify-center px-5">
        <div className="text-center max-w-[480px]">
          <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-copper/50 mb-5">
            Quelque chose ne va pas
          </p>
          <h1 className="font-serif text-[24px] md:text-[28px] font-light text-white leading-tight mb-4 tracking-wide">
            L&apos;enquête n&apos;est pas disponible pour le moment.
          </h1>
          <p className="font-serif text-[13px] font-light text-white/40 leading-relaxed tracking-wide">
            {questionsErr
              ? `Erreur : ${questionsErr.message}`
              : "Aucune question active n'a été trouvée. Réessayez dans un instant."}
          </p>
          <p className="font-serif text-[11px] font-light text-white/25 mt-6 tracking-wide">
            (debug: questionsRaw={JSON.stringify(questionsRaw)?.slice(0, 200)})
          </p>
        </div>
      </div>
    );
  }

  return <SurveyClient questions={questions} />;
}

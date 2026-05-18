"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// answers: { [question_slug]: string[] }  — array of selected option values
export type SurveyAnswers = Record<string, string[]>;

export async function submitSurvey(answers: SurveyAnswers): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  // User client — used for the auth check and for the responses upsert
  // (RLS on creator_survey_responses allows the creator to write their own
  // rows via owner_id = auth.uid()).
  const supabase = await createClient();

  // 1. Auth check.
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: "not_authenticated" };
  }

  // 2. Find the creator row owned by this auth user.
  const { data: creator, error: creatorErr } = await supabase
    .from("creators")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (creatorErr || !creator) {
    return { ok: false, error: "creator_not_found" };
  }

  // 3. Build payload — one row per (creator, question_slug). JSONB answer
  //    is always an array so the matching algo can do uniform set ops.
  const rows = Object.entries(answers)
    .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
    .map(([question_slug, vals]) => ({
      creator_id: creator.id,
      question_slug,
      answer: vals,            // jsonb column accepts arrays directly
      answered_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return { ok: false, error: "no_answers" };
  }

  // 4. Upsert via user client — RLS limits writes to the creator's own row.
  //    The UNIQUE (creator_id, question_slug) constraint from migration 010
  //    makes re-submission idempotent.
  const { error: insertErr } = await supabase
    .from("creator_survey_responses")
    .upsert(rows, { onConflict: "creator_id,question_slug" });

  if (insertErr) {
    console.error("[submitSurvey] upsert failed", {
      message: insertErr.message,
      details: insertErr.details,
      hint: insertErr.hint,
      code: insertErr.code,
      creator_id: creator.id,
      row_count: rows.length,
    });
    return { ok: false, error: `upsert:${insertErr.code ?? "?"}:${insertErr.message}` };
  }

  // 5. Flip the completion flag. The creators table only allows admin writes
  //    (per migration 009 policy "creators admin write"), so we use the
  //    service-role client to bypass RLS here — gated by the fact that we
  //    already verified `creator.owner_id === user.id` above.
  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("creators")
    .update({ onboarding_survey_completed_at: new Date().toISOString() })
    .eq("id", creator.id);

  if (updateErr) {
    console.error("[submitSurvey] completion flag update failed", {
      message: updateErr.message,
      details: updateErr.details,
      hint: updateErr.hint,
      code: updateErr.code,
      creator_id: creator.id,
    });
    // Responses were saved; surfacing this lets the client retry the
    // completed_at flip without re-submitting answers.
    return { ok: false, error: `flag:${updateErr.code ?? "?"}:${updateErr.message}` };
  }

  return { ok: true };
}

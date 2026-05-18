"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// answers: { [question_slug]: string[] }  — array of selected option values
export type SurveyAnswers = Record<string, string[]>;

export async function submitSurvey(answers: SurveyAnswers): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  // 1. Auth check — uses the user client to read the session cookie.
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.email) {
    return { ok: false, error: "not_authenticated" };
  }

  // 2. Lookup the creator via ADMIN client — same pattern as page.tsx.
  //    Using the user client + .eq("owner_id", user.id) only works when
  //    creators.owner_id is perfectly in sync with the current session,
  //    which fails as soon as an orphaned auth user pollutes the row.
  //    Admin lookup matches by owner_id OR email, then we validate
  //    ownership in code before doing anything destructive.
  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();
  const { data: creator, error: creatorErr } = await admin
    .from("creators")
    .select("id, owner_id, email, partnership_stage")
    .or(`owner_id.eq.${user.id},email.eq.${emailLc}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (creatorErr) {
    console.error("[submitSurvey] creator lookup failed", creatorErr);
    return { ok: false, error: `lookup:${creatorErr.code ?? "?"}:${creatorErr.message}` };
  }

  if (!creator) {
    return {
      ok: false,
      error: `creator_not_found:user=${user.id.slice(0, 8)}:email=${emailLc}`,
    };
  }

  // Security: the matched creator's email must equal the session email.
  // (If a malicious user somehow had a session whose user.id matched
  // someone else's owner_id, the email check stops them.)
  if ((creator.email ?? "").toLowerCase() !== emailLc) {
    return { ok: false, error: "email_mismatch" };
  }

  if (creator.partnership_stage === "declined") {
    return { ok: false, error: "declined" };
  }

  // 3. Auto-heal owner_id if it drifted (same logic as page.tsx).
  if (creator.owner_id !== user.id) {
    await admin.from("creators").update({ owner_id: user.id }).eq("id", creator.id);
  }

  // 4. Build payload — one row per (creator, question_slug). JSONB answer
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

  // 5. Upsert via admin client — bypasses RLS but is gated by the
  //    email-match security check above.
  const { error: insertErr } = await admin
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

  // 6. Flip the completion flag.
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
    return { ok: false, error: `flag:${updateErr.code ?? "?"}:${updateErr.message}` };
  }

  return { ok: true };
}

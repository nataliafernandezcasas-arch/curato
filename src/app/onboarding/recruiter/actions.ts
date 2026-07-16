"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Records a recruiter's signature of the programme: acceptance, name, place and
// date. Gates access to the recruiter dashboard (see /dashboard routing).
export async function signRecruiterCommitment(input: {
  accepted: boolean;
  signatory: string;
  place: string;
  date: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const signatory = (input.signatory || "").trim();
  const place = (input.place || "").trim();
  const date = (input.date || "").trim();
  if (!input.accepted) return { ok: false, error: "must_accept" };
  if (signatory.length < 2) return { ok: false, error: "must_sign" };
  if (!place) return { ok: false, error: "must_place" };
  if (!date) return { ok: false, error: "must_date" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "not_authenticated" };

  const admin = createAdminClient();
  const { data: recruiter } = await admin
    .from("recruiters")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recruiter) return { ok: false, error: "recruiter_not_found" };

  const { error } = await admin
    .from("recruiters")
    .update({
      commitment_accepted_at: new Date().toISOString(),
      commitment_signatory: signatory,
      commitment_place: place,
      commitment_date: date,
    })
    .eq("id", recruiter.id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("signRecruiterCommitment update error", error);
    return { ok: false, error: "db_update_failed" };
  }

  return { ok: true };
}

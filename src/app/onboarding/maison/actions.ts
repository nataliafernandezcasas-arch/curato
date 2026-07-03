"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Closes the maison commitment step:
//   - Verifies the current user is an active maison (comercio)
//   - Verifies the terms were accepted and a signature name was typed
//   - Records the acceptance timestamp, the typed signatory, and the plan
//
// The 3-month / 299 €/month terms are shown to the maison in the client; here we
// just record that they signed. Returns { ok } or { ok:false, error } so the
// client can surface a code without leaking internals.
export async function signCommitment(input: {
  accepted: boolean;
  signatory: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const signatory = (input.signatory || "").trim();
  if (!input.accepted) return { ok: false, error: "must_accept" };
  if (signatory.length < 2) return { ok: false, error: "must_sign" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "not_authenticated" };

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const { data: comercio } = await admin
    .from("comercios")
    .select("id")
    .eq("email", emailLc)
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comercio) return { ok: false, error: "maison_not_found" };

  const { error: updateErr } = await admin
    .from("comercios")
    .update({
      commitment_accepted_at: new Date().toISOString(),
      commitment_signatory: signatory,
      subscription_plan: "monthly_299",
    })
    .eq("id", comercio.id);

  if (updateErr) {
    // eslint-disable-next-line no-console
    console.error("signCommitment update error", updateErr);
    return { ok: false, error: "db_update_failed" };
  }

  return { ok: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Closes the /onboarding/welcome flow:
//   - Verifies the current user is a Creator
//   - Verifies both T&C and Privacy Policy are explicitly accepted
//   - Writes the three timestamp columns (welcome / terms / privacy)
//
// Returns { ok: true } on success or { ok: false, error: <code> } on any
// failure. The client surfaces the error code so we can diagnose drop-offs
// without leaking implementation details to the user.
export async function completeWelcome(input: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.termsAccepted || !input.privacyAccepted) {
    return { ok: false, error: "must_accept_both" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "not_authenticated" };

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();
  const now = new Date().toISOString();

  // Match by email (newest first) — same logic as /dashboard/page.tsx. The
  // creator row may have been imported from Notion before this user existed,
  // so we don't assume owner_id is linked yet.
  const { data: creator } = await admin
    .from("creators")
    .select("id")
    .eq("email", emailLc)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!creator) return { ok: false, error: "creator_not_found" };

  const { error: updateErr } = await admin
    .from("creators")
    .update({
      welcome_completed_at: now,
      terms_accepted_at: now,
      privacy_accepted_at: now,
    })
    .eq("id", creator.id);

  if (updateErr) {
    // eslint-disable-next-line no-console
    console.error("completeWelcome update error", updateErr);
    return { ok: false, error: "db_update_failed" };
  }

  return { ok: true };
}

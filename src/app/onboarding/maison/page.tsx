import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CommitmentClient from "./commitment-client";

export const dynamic = "force-dynamic";

// /onboarding/maison — first-login commitment signature for maisons.
//
// Server-side guard:
//   • Must be authenticated (else → /auth/sign-in).
//   • Must match an active comercio by email (else → not approved).
//   • If already signed (commitment_accepted_at set) → straight to the dashboard.
//
// Defensive: if the commitment column doesn't exist yet (migration not run),
// we don't block the maison — we send them to the dashboard.
export default async function MaisonCommitmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const { data: comercio } = await admin
    .from("comercios")
    .select("id, name")
    .eq("email", emailLc)
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comercio) redirect("/auth/sign-in?error=not_approved");

  const { data: commit, error: commitErr } = await admin
    .from("comercios")
    .select("commitment_accepted_at")
    .eq("id", comercio.id)
    .maybeSingle();

  // Column missing (migration pending) or already signed → skip the step.
  if (commitErr || commit?.commitment_accepted_at) {
    redirect("/dashboard/business");
  }

  return <CommitmentClient maisonName={comercio.name || ""} />;
}

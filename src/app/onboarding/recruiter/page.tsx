import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import RecruiterCommitmentClient from "./recruiter-commitment-client";

export const dynamic = "force-dynamic";

// /onboarding/recruiter — first-login dossier + signature for recruiters.
// Guard: authenticated + matches a recruiter by email. Already signed → skip to
// the dashboard. If the commitment column is missing (migration pending), don't
// block — send them to the dashboard.
export default async function RecruiterCommitmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const { data: recruiter, error } = await admin
    .from("recruiters")
    .select("id, full_name, commitment_accepted_at")
    .eq("email", emailLc)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recruiter) redirect("/auth/sign-in?error=not_approved");
  if (error || recruiter.commitment_accepted_at) redirect("/dashboard/recruiter");

  return <RecruiterCommitmentClient recruiterName={recruiter.full_name || ""} />;
}

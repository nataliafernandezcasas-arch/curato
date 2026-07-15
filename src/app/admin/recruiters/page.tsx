import { createAdminClient } from "@/lib/supabase/admin";
import RecruitersClient from "./recruiters-client";

export const dynamic = "force-dynamic";

export default async function AdminRecruitersPage() {
  const admin = createAdminClient();

  const { data: recruiters } = await admin
    .from("recruiters")
    .select("id, full_name, email, iban, created_at")
    .order("created_at", { ascending: false });

  const { data: prospects } = await admin
    .from("recruiter_prospects")
    .select("id, maison_name, maison_email, notes, status, created_at, recruiter_id")
    .order("created_at", { ascending: false });

  // Derive "signed" by matching the maison email against a comercio that has
  // accepted its commitment.
  const emails = (prospects || [])
    .map((p) => (p.maison_email || "").toLowerCase())
    .filter(Boolean);
  const signedSet = new Set<string>();
  if (emails.length) {
    const { data: signed } = await admin
      .from("comercios")
      .select("email, commitment_accepted_at")
      .in("email", emails);
    for (const c of signed || []) {
      if (c.commitment_accepted_at) signedSet.add((c.email || "").toLowerCase());
    }
  }

  const nameById = new Map((recruiters || []).map((r) => [r.id, r.full_name || r.email]));

  const items = (prospects || []).map((p) => ({
    id: p.id,
    maison_name: p.maison_name,
    maison_email: p.maison_email,
    notes: p.notes,
    status: signedSet.has((p.maison_email || "").toLowerCase()) ? "signed" : p.status,
    recruiter: nameById.get(p.recruiter_id) || "—",
    recruiter_id: p.recruiter_id,
    created_at: p.created_at,
  }));

  return <RecruitersClient items={items} recruiters={recruiters || []} />;
}

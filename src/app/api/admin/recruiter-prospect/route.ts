import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import { sendRecruiterProspectDecision, sendAdminProspectDecision } from "@/lib/emails";

export const dynamic = "force-dynamic";

const ADMIN_INBOX = "hello@curatocollective.com";

// Admin validates or rejects a recruiter's submitted maison prospect. Approval
// is what reserves the maison for that recruiter and lets them contact it.
export async function POST(request: NextRequest) {
  const ok = await isAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, action } = await request.json();
  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pull the prospect + its recruiter so we can notify both sides.
  const { data: prospect } = await admin
    .from("recruiter_prospects")
    .select("id, maison_name, recruiter_id")
    .eq("id", id)
    .maybeSingle();
  if (!prospect) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await admin
    .from("recruiter_prospects")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { data: recruiter } = await admin
      .from("recruiters")
      .select("full_name, email")
      .eq("id", prospect.recruiter_id)
      .maybeSingle();
    if (recruiter?.email) {
      const recruiterName = recruiter.full_name || recruiter.email;
      const decision = action === "approve" ? "approved" : "rejected";
      await sendRecruiterProspectDecision(recruiter.email, { recruiterName, maisonName: prospect.maison_name, decision });
      await sendAdminProspectDecision(ADMIN_INBOX, { recruiterName, maisonName: prospect.maison_name, decision });
    }
  } catch (e) {
    console.error("recruiter decision email failed:", e);
  }

  return NextResponse.json({ ok: true });
}

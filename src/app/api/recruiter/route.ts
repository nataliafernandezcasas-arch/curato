import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRecruiterProspectSubmitted, sendAdminProspectSubmitted } from "@/lib/emails";

export const dynamic = "force-dynamic";

const ADMIN_INBOX = "hello@curatocollective.com";

// Commission: 50% of the 299 €/month subscription, over the first 3 paid months.
const MONTHLY = 299;
const RATE = 0.5;
const MONTHS = 3;
const PER_MAISON = MONTHLY * RATE * MONTHS; // 448,50 €

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findRecruiter(admin: any, user: { id: string; email: string }) {
  const { data } = await admin
    .from("recruiters")
    .select("id, owner_id, full_name, email, iban")
    .or(`owner_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const recruiter = await findRecruiter(admin, { id: user.id, email: user.email });
  if (!recruiter) return NextResponse.json({ error: "not_recruiter" }, { status: 404 });
  if (recruiter.owner_id !== user.id) {
    await admin.from("recruiters").update({ owner_id: user.id }).eq("id", recruiter.id);
  }

  const { data: prospects } = await admin
    .from("recruiter_prospects")
    .select("id, maison_name, maison_email, notes, status, created_at")
    .eq("recruiter_id", recruiter.id)
    .order("created_at", { ascending: false });

  // Derive the "signed" state by matching the maison email against a comercio
  // that has accepted its commitment — no manual bookkeeping needed.
  const emails = (prospects || [])
    .map((p: { maison_email: string | null }) => (p.maison_email || "").toLowerCase())
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

  const items = (prospects || []).map(
    (p: { id: string; maison_name: string; maison_email: string | null; notes: string | null; status: string; created_at: string }) => ({
      ...p,
      effectiveStatus: signedSet.has((p.maison_email || "").toLowerCase()) ? "signed" : p.status,
    })
  );
  const signedCount = items.filter((i: { effectiveStatus: string }) => i.effectiveStatus === "signed").length;

  return NextResponse.json({
    recruiter: { full_name: recruiter.full_name, email: recruiter.email, iban: recruiter.iban || "" },
    prospects: items,
    earnings: { signedCount, perMaison: PER_MAISON, total: signedCount * PER_MAISON },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const recruiter = await findRecruiter(admin, { id: user.id, email: user.email });
  if (!recruiter) return NextResponse.json({ error: "not_recruiter" }, { status: 404 });

  const body = await request.json();

  if (body.action === "add_prospect") {
    const name = (body.maison_name || "").trim();
    if (name.length < 2) return NextResponse.json({ error: "missing_name" }, { status: 400 });
    const maisonEmail = (body.maison_email || "").trim().toLowerCase() || null;
    const { error } = await admin.from("recruiter_prospects").insert({
      recruiter_id: recruiter.id,
      maison_name: name,
      maison_email: maisonEmail,
      notes: (body.notes || "").trim() || null,
      status: "pending",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify the recruiter (confirmation) and the admin (to validate). Best-effort.
    try {
      const recruiterName = recruiter.full_name || recruiter.email;
      await sendRecruiterProspectSubmitted(recruiter.email, { recruiterName, maisonName: name });
      await sendAdminProspectSubmitted(ADMIN_INBOX, { recruiterName, maisonName: name, maisonEmail });
    } catch (e) {
      console.error("recruiter prospect email failed:", e);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_iban") {
    const iban = (body.iban || "").replace(/\s+/g, "").toUpperCase();
    const { error } = await admin.from("recruiters").update({ iban: iban || null }).eq("id", recruiter.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}

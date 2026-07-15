import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Billing/subscription info for the logged-in maison. Payments are handled
// manually for now, so this is informational: plan, trial status, key dates.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: comercio } = await admin
    .from("comercios")
    .select("name, commitment_accepted_at, subscription_plan")
    .eq("email", user.email.toLowerCase())
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comercio) return NextResponse.json({ error: "not_maison" }, { status: 404 });

  return NextResponse.json({
    name: comercio.name,
    signedAt: comercio.commitment_accepted_at,
    plan: comercio.subscription_plan || "monthly_299",
    monthly: 299,
    trialDays: 15,
  });
}

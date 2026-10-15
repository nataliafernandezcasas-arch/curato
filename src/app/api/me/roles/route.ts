import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Which Curato spaces the logged-in account can access. One email = one login;
// a person can hold several roles (e.g. a storyteller who is also a recruiter),
// and the dashboards use this to offer a switch between their spaces.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ storyteller: false, maison: false, recruiter: false, admin: false });

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const [creatorRes, comercioRes, recruiterRes, adminRes] = await Promise.all([
    admin.from("creators").select("id, partnership_stage").eq("email", emailLc).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("comercios").select("id").eq("email", emailLc).eq("stage", "activo").limit(1).maybeSingle(),
    admin.from("recruiters").select("id").eq("email", emailLc).limit(1).maybeSingle(),
    admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  return NextResponse.json({
    storyteller: !!creatorRes.data && creatorRes.data.partnership_stage !== "declined",
    maison: !!comercioRes.data,
    recruiter: !!recruiterRes.data,
    // Quien está en admin_users ve el enlace al admin en el menú de la app.
    admin: !!adminRes.data,
  });
}

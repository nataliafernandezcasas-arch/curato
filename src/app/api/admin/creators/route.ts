import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";

export async function PATCH(request: NextRequest) {
  const ok = await isAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { email, monthly_credit_cop } = await request.json();

  if (!email || monthly_credit_cop == null || isNaN(Number(monthly_credit_cop))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("creators")
    .update({ monthly_credit_cop: Number(monthly_credit_cop) })
    .eq("email", email.toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

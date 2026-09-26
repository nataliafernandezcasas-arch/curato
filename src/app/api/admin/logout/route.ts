import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin/auth";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/admin", SITE_URL), { status: 303 });
}

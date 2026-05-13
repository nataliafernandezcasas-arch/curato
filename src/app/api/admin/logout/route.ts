import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin/auth";

export async function POST() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL || "https://curatocollective.com"), { status: 303 });
}

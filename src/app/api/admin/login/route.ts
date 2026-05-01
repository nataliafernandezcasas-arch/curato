import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminPass, ADMIN_COOKIE } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const expected = getAdminPass();
  if (!expected) {
    return NextResponse.json({ error: "Admin no configurado." }, { status: 500 });
  }

  let body: { pass?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.pass || body.pass !== expected) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const c = await cookies();
  c.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  return NextResponse.json({ success: true });
}

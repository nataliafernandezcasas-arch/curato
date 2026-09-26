import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminPass, mismoTexto, nuevaSesion, ADMIN_COOKIE } from "@/lib/admin/auth";

// Cinco intentos por dirección cada cuarto de hora. Vive en memoria del
// proceso, así que no es una muralla, pero convierte el probar contraseñas a
// mano en algo inútil. Antes no había ningún límite.
const INTENTOS = new Map<string, { n: number; hasta: number }>();
const MAXIMO = 5;
const VENTANA_MS = 15 * 60 * 1000;

function deQuien(request: NextRequest): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocido";
}

export async function POST(request: NextRequest) {
  const expected = getAdminPass();
  if (!expected) {
    return NextResponse.json({ error: "Admin no configurado." }, { status: 500 });
  }

  const quien = deQuien(request);
  const ahora = Date.now();
  const previo = INTENTOS.get(quien);
  if (previo && previo.hasta > ahora && previo.n >= MAXIMO) {
    const minutos = Math.ceil((previo.hasta - ahora) / 60000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${minutos} min.` }, { status: 429 });
  }

  let body: { pass?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.pass || !mismoTexto(body.pass, expected)) {
    const cuenta = previo && previo.hasta > ahora ? previo.n + 1 : 1;
    INTENTOS.set(quien, { n: cuenta, hasta: ahora + VENTANA_MS });
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const sesion = nuevaSesion();
  if (!sesion) {
    return NextResponse.json({ error: "Admin no configurado." }, { status: 500 });
  }
  INTENTOS.delete(quien);

  const c = await cookies();
  c.set(ADMIN_COOKIE, sesion.valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sesion.maxAge,
  });

  return NextResponse.json({ success: true });
}

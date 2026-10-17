import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leerCaptura } from "@/lib/leer-captura";

// Leer la imagen tarda unos segundos.
export const maxDuration = 60;

const TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;
// La pantalla manda la captura ya reducida; Vercel corta a 4,5 MB.
const MAX_BASE64 = 4_000_000;

/**
 * Lee las cifras de una captura de las estadísticas de una story. No guarda
 * nada: rellena el formulario y el storyteller lo revisa y lo guarda.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { imagen?: unknown; tipo?: unknown } | null;
  const imagen = typeof body?.imagen === "string" ? body.imagen : "";
  const tipo = TIPOS.find((t) => t === body?.tipo);
  if (!imagen || !tipo || imagen.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(imagen)) {
    return NextResponse.json({ error: "imagen" }, { status: 400 });
  }

  const cifras = await leerCaptura(imagen, tipo);
  if (!cifras) return NextResponse.json({ error: "lectura" }, { status: 502 });
  return NextResponse.json({ cifras });
}

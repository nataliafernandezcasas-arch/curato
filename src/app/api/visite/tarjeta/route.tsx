import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contenidoDelQR, mostrarCodigo } from "@/lib/check-in";
import { asegurarCodigo, matrizQR, tarjetaValida } from "@/lib/codigo-visita";
import { SITE_URL } from "@/lib/site";

const BURDEOS = "#2B0709";
const CHAMPAGNE = "#CBB78F";
const TINTA = "#F5EFE4";
const ANCHO = 600;
const ALTO = 720;
const QR = 360;

/**
 * La tarjeta del código de una visita, como imagen, para el correo que sale
 * una hora antes: el mismo QR en champagne sobre burdeos, con la flor, que la
 * pantalla del código en la app. Un correo no pinta SVG ni ejecuta nada, así
 * que el QR va dibujado en la imagen.
 *
 * El enlace lleva una firma (src/lib/codigo-visita.ts): el correo no tiene
 * sesión, y sin la firma cualquiera podría pedir el código de otra visita.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("r") ?? "";
  const firma = request.nextUrl.searchParams.get("f") ?? "";
  if (!id || !tarjetaValida(id, firma)) return new Response("No", { status: 403 });

  const admin = createAdminClient();
  const { data: reserva } = await admin
    .from("reservations")
    .select("id, status, visit_code")
    .eq("id", id)
    .maybeSingle();
  if (!reserva || (reserva.status !== "confirmed" && reserva.status !== "completed")) {
    return new Response("No", { status: 404 });
  }
  const codigo = await asegurarCodigo(admin, reserva.id as string, (reserva.visit_code as string | null) ?? null);
  if (!codigo) return new Response("No", { status: 500 });

  const m = matrizQR(contenidoDelQR(codigo));
  const n = m.length;
  const lado = Math.floor(QR / n);
  // Cada fila, en tramos seguidos de módulos oscuros: muchos menos elementos
  // que un cuadrado por módulo.
  const tramos: { fila: number; desde: number; largo: number }[] = [];
  m.forEach((fila, y) => {
    let x = 0;
    while (x < n) {
      if (!fila[x]) {
        x++;
        continue;
      }
      const desde = x;
      while (x < n && fila[x]) x++;
      tramos.push({ fila: y, desde, largo: x - desde });
    }
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: ANCHO,
          height: ALTO,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BURDEOS,
          position: "relative",
        }}
      >
        {/* La flor de la tarjeta de Curato, abajo a la izquierda. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${SITE_URL}/carte-visite-curato.png`}
          alt=""
          width={340}
          height={340}
          style={{
            position: "absolute",
            left: -40,
            bottom: -40,
            opacity: 0.55,
            objectFit: "cover",
            // El mismo fundido que la flor de la pantalla (flor-de-fondo.tsx).
            maskImage: "radial-gradient(circle at 30% 70%, black 35%, transparent 72%)",
          }}
        />
        <div style={{ display: "flex", position: "relative", width: lado * n, height: lado * n }}>
          {tramos.map((t, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: t.fila * lado,
                left: t.desde * lado,
                width: t.largo * lado,
                height: lado,
                backgroundColor: CHAMPAGNE,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 44, letterSpacing: 10, color: TINTA }}>
          {mostrarCodigo(codigo)}
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: ALTO,
      // Es el código de una visita: que no lo guarde nadie entre medias.
      headers: { "Cache-Control": "private, max-age=3600" },
    }
  );
}

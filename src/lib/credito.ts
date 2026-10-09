import type { createAdminClient } from "@/lib/supabase/admin";
import { parisParts } from "@/lib/availability";

type Admin = ReturnType<typeof createAdminClient>;

// Las visitas que gastan crédito: las pedidas (el crédito queda apartado hasta
// que la casa decide), las confirmadas y las hechas. Una rechazada, cancelada o
// caducada lo devuelve sola, porque deja de contar.
// Una cancelada con menos de 24 h y un no show lo gastan igual (migración 046):
// es la regla que el storyteller acepta al confirmar su visita.
const GASTAN = ["pending_review", "confirmed", "completed"];
const GASTAN_SI_TARDE = ["cancelled", "no_show"];

/** "2026-10": el mes de París de una fecha. */
export function mesDeParis(fecha: string | Date): string {
  return parisParts(fecha).ymd.slice(0, 7);
}

/**
 * El crédito de un storyteller en un mes: su crédito mensual, lo comprometido
 * en visitas de ese mes (por el día de la visita) y lo que le queda.
 *
 * Se calcula cada vez a partir de las reservas, en vez de llevar un contador:
 * así se reinicia solo cada mes y una visita que se cae devuelve su importe
 * sin que nadie tenga que acordarse.
 */
export async function creditoDelMes(
  admin: Admin,
  creatorId: string,
  mes: string,
  excluirReserva?: string
): Promise<{ mensual: number; usado: number; restante: number }> {
  const [anio, m] = mes.split("-").map(Number);
  // Un día de margen a cada lado: el mes se decide luego con la hora de París.
  const desde = new Date(Date.UTC(anio, m - 1, 1) - 86400000).toISOString();
  const hasta = new Date(Date.UTC(anio, m, 1) + 86400000).toISOString();

  const [{ data: creador }, reservas] = await Promise.all([
    admin.from("creators").select("monthly_credit_cop").eq("id", creatorId).maybeSingle(),
    reservasDelMes(admin, creatorId, desde, hasta),
  ]);

  const mensual = (creador?.monthly_credit_cop as number | null) ?? 0;
  const usado = reservas
    .filter((r) => r.id !== excluirReserva && mesDeParis(r.slot_start as string) === mes)
    .reduce((total, r) => total + ((r.credits_cost as number | null) ?? 0), 0);
  return { mensual, usado, restante: Math.max(mensual - usado, 0) };
}

type Fila = { id: string; slot_start: string; credits_cost: number | null; status: string; cancelada_tarde?: boolean | null };

/**
 * Las reservas que cuentan. Con la migración 046, también las canceladas tarde
 * y los no show; sin ella, como antes.
 */
async function reservasDelMes(admin: Admin, creatorId: string, desde: string, hasta: string): Promise<Fila[]> {
  const conTarde = await admin
    .from("reservations")
    .select("id, slot_start, credits_cost, status, cancelada_tarde")
    .eq("creator_id", creatorId)
    .in("status", [...GASTAN, ...GASTAN_SI_TARDE])
    .gte("slot_start", desde)
    .lt("slot_start", hasta);
  if (!conTarde.error) {
    return ((conTarde.data ?? []) as Fila[]).filter(
      (r) => GASTAN.includes(r.status) || r.status === "no_show" || (r.status === "cancelled" && r.cancelada_tarde)
    );
  }
  const { data } = await admin
    .from("reservations")
    .select("id, slot_start, credits_cost, status")
    .eq("creator_id", creatorId)
    .in("status", [...GASTAN, "no_show"])
    .gte("slot_start", desde)
    .lt("slot_start", hasta);
  return (data ?? []) as Fila[];
}

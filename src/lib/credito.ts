import type { createAdminClient } from "@/lib/supabase/admin";
import { parisParts } from "@/lib/availability";

type Admin = ReturnType<typeof createAdminClient>;

// Las visitas que gastan crédito: las pedidas (el crédito queda apartado hasta
// que la casa decide), las confirmadas y las hechas. Una rechazada, cancelada o
// caducada lo devuelve sola, porque deja de contar.
const GASTAN = ["pending_review", "confirmed", "completed"];

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

  const [{ data: creador }, { data: reservas }] = await Promise.all([
    admin.from("creators").select("monthly_credit_cop").eq("id", creatorId).maybeSingle(),
    admin
      .from("reservations")
      .select("id, slot_start, credits_cost, status")
      .eq("creator_id", creatorId)
      .in("status", GASTAN)
      .gte("slot_start", desde)
      .lt("slot_start", hasta),
  ]);

  const mensual = (creador?.monthly_credit_cop as number | null) ?? 0;
  const usado = (reservas ?? [])
    .filter((r) => r.id !== excluirReserva && mesDeParis(r.slot_start as string) === mes)
    .reduce((total, r) => total + ((r.credits_cost as number | null) ?? 0), 0);
  return { mensual, usado, restante: Math.max(mensual - usado, 0) };
}

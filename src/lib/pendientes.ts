import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cuántas demandas tiene una casa por responder: las pendientes cuya fecha no
 * ha pasado. Las caducadas se ven en Demandes, pero ya no se pueden contestar,
 * así que no cuentan. Es la cifra del icono de la app y de la barra de abajo.
 */
export async function pendientesDe(admin: SupabaseClient, venueId: string): Promise<number> {
  const { count, error } = await admin
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .eq("status", "pending_review")
    .gte("slot_start", new Date().toISOString());
  if (error) {
    console.error("[curato] no se pudieron contar las demandas:", error.message);
    return 0;
  }
  return count ?? 0;
}

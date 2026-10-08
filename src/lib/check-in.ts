import { parisParts } from "@/lib/availability";

// El registro de la visita en sala. El storyteller enseña el código de su
// visita y la casa lo escanea (migración 040). Aquí vive la lógica pura: el
// código, lo que lleva el QR y cuál es la visita de hoy. Las rutas solo leen y
// escriben.

/** "k7m 4qx", "K7M-4QX" o "k7m4qx" son el mismo código: K7M4QX. */
export function normalizarCodigo(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

// Sin O ni 0, sin I ni 1: dicho en voz alta o tecleado con prisa, no se
// confunden. Treinta y dos signos a la sexta son mil millones de códigos.
const SIGNOS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LARGO = 6;

export function esCodigoDeVisita(codigo: string): boolean {
  return new RegExp(`^[${SIGNOS}]{${LARGO}}$`).test(codigo);
}

/** Un código nuevo para una visita. */
export function nuevoCodigoDeVisita(azar: () => number = Math.random): string {
  let codigo = "";
  for (let i = 0; i < LARGO; i++) codigo += SIGNOS[Math.floor(azar() * SIGNOS.length)];
  return codigo;
}

/** K7M4QX se enseña como K7M 4QX: se lee de un vistazo y se teclea sin error. */
export function mostrarCodigo(codigo: string): string {
  return esCodigoDeVisita(codigo) ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : codigo;
}

// Lo que lleva el QR. No es una URL a propósito: si alguien lo escanea con la
// cámara del teléfono no abre nada, solo lo entiende el Scanner de la casa.
const PREFIJO_QR = "CURATO-VISITE:";

export function contenidoDelQR(codigo: string): string {
  return PREFIJO_QR + codigo;
}

/** El código que hay dentro de un QR leído, o null si no es de Curato. */
export function codigoDelQR(texto: string): string | null {
  const limpio = texto.trim();
  const crudo = limpio.toUpperCase().startsWith(PREFIJO_QR) ? limpio.slice(PREFIJO_QR.length) : limpio;
  const codigo = normalizarCodigo(crudo);
  return esCodigoDeVisita(codigo) ? codigo : null;
}

export type ReservaParaVisita = {
  id: string;
  slot_start: string;
  slot_end: string | null;
  status: string;
  visited_at: string | null;
};

/**
 * La visita de hoy de un storyteller en una casa: una reserva confirmada (o ya
 * terminada, para decir que estaba registrada) cuyo día es hoy en París. Un
 * hotel vale desde el día de llegada hasta el de salida.
 */
export function visitaDeHoy(reservas: ReservaParaVisita[], ahora: Date = new Date()): ReservaParaVisita | null {
  const hoy = parisParts(ahora).ymd;
  const validas = reservas.filter((r) => {
    if (r.status !== "confirmed" && r.status !== "completed") return false;
    const desde = parisParts(r.slot_start).ymd;
    const hasta = r.slot_end ? parisParts(r.slot_end).ymd : desde;
    return desde <= hoy && hoy <= hasta;
  });
  // Si hubiera dos, la que aún no está registrada y la más próxima a ahora.
  validas.sort(
    (a, b) =>
      Number(Boolean(a.visited_at)) - Number(Boolean(b.visited_at)) ||
      Math.abs(new Date(a.slot_start).getTime() - ahora.getTime()) - Math.abs(new Date(b.slot_start).getTime() - ahora.getTime())
  );
  return validas[0] ?? null;
}

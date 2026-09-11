import { parisParts } from "@/lib/availability";

// El registro de la visita en sala (pantalla 27). Aquí vive la lógica pura: el
// código de la casa y cuál es la visita de hoy. Las rutas solo leen y escriben.

/** "mrc 418", "MRC-418" o "Mrc418" son el mismo código: MRC418. */
export function normalizarCodigo(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function esCodigoValido(codigo: string): boolean {
  return /^[A-Z]{3}\d{3}$/.test(codigo);
}

/** MRC418 se enseña como MRC 418: se lee de un vistazo y se teclea sin error. */
export function mostrarCodigo(codigo: string): string {
  return esCodigoValido(codigo) ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : codigo;
}

// Palabras que no dicen qué casa es: "Maison Marceau" es Marceau.
const GENERICAS = new Set(["MAISON", "HOTEL", "LE", "LA", "LES", "L", "DE", "DU", "DES", "CHEZ", "RESTAURANT", "CAFE", "SPA", "ATELIER"]);

/** Tres letras que recuerdan a la casa: las consonantes de su palabra propia. */
export function letrasDe(nombre: string): string {
  const palabras = normalizarCodigo(nombre.replace(/['’\-]/g, " ").replace(/\s+/g, "_"))
    .split(/[^A-Z]+/)
    .filter(Boolean);
  const propias = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((p) => p && !GENERICAS.has(p));
  const base = (propias[0] ?? palabras[0] ?? "CUR").replace(/[^A-Z]/g, "");
  const consonantes = base.replace(/[AEIOUY]/g, "");
  const letras = (consonantes.length >= 3 ? consonantes : base + "XXX").slice(0, 3);
  return letras.padEnd(3, "X");
}

/** Un código nuevo: tres letras de la casa y tres cifras. */
export function nuevoCodigo(nombre: string, azar: () => number = Math.random): string {
  return `${letrasDe(nombre)}${100 + Math.floor(azar() * 900)}`;
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

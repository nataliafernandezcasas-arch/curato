import { describe, expect, it } from "vitest";
import { esCodigoValido, letrasDe, mostrarCodigo, normalizarCodigo, nuevoCodigo, visitaDeHoy, type ReservaParaVisita } from "./check-in";

describe("el código de la casa", () => {
  it("toma las consonantes de la palabra propia, no de Maison ni de Le", () => {
    expect(letrasDe("Maison Marceau")).toBe("MRC");
    expect(letrasDe("Le Comptoir du Marais")).toBe("CMP");
    // Con menos de tres consonantes, completa con la propia palabra: TOU.
    expect(letrasDe("Hôtel de la Tour")).toBe("TOU");
  });

  it("siempre da tres letras, aunque el nombre sea corto o raro", () => {
    expect(letrasDe("Ô")).toHaveLength(3);
    expect(letrasDe("")).toHaveLength(3);
    expect(letrasDe("Atelier Sainte-Anne")).toMatch(/^[A-Z]{3}$/);
  });

  it("un código nuevo son tres letras y tres cifras", () => {
    expect(nuevoCodigo("Maison Marceau", () => 0.318)).toBe("MRC386");
    expect(esCodigoValido(nuevoCodigo("Maison Marceau"))).toBe(true);
  });

  it("acepta el código escrito de cualquier manera", () => {
    expect(normalizarCodigo("mrc 418")).toBe("MRC418");
    expect(normalizarCodigo(" MRC-418 ")).toBe("MRC418");
    expect(esCodigoValido(normalizarCodigo("mrc418"))).toBe(true);
    expect(esCodigoValido("MRC41")).toBe(false);
    expect(esCodigoValido("418MRC")).toBe(false);
  });

  it("se enseña con un espacio entre letras y cifras", () => {
    expect(mostrarCodigo("MRC418")).toBe("MRC 418");
    expect(mostrarCodigo("raro")).toBe("raro");
  });
});

describe("la visita de hoy", () => {
  const ahora = new Date("2026-10-22T18:00:00.000Z"); // jueves 22, 20:00 en París
  const r = (p: Partial<ReservaParaVisita>): ReservaParaVisita => ({
    id: "r",
    slot_start: "2026-10-22T17:30:00.000Z",
    slot_end: null,
    status: "confirmed",
    visited_at: null,
    ...p,
  });

  it("encuentra la reserva confirmada de hoy", () => {
    expect(visitaDeHoy([r({ id: "hoy" })], ahora)?.id).toBe("hoy");
  });

  it("no vale una reserva de ayer ni una pendiente o rechazada", () => {
    expect(visitaDeHoy([r({ slot_start: "2026-10-21T17:30:00.000Z" })], ahora)).toBeNull();
    expect(visitaDeHoy([r({ status: "pending_review" })], ahora)).toBeNull();
    expect(visitaDeHoy([r({ status: "declined" })], ahora)).toBeNull();
  });

  it("usa el día de París: las 00:30 del viernes en París aún no son jueves", () => {
    const viernesTemprano = new Date("2026-10-22T22:30:00.000Z"); // viernes 23, 00:30 en París
    expect(visitaDeHoy([r({})], viernesTemprano)).toBeNull();
  });

  it("un hotel vale desde la llegada hasta la salida", () => {
    const estancia = r({ id: "hotel", slot_start: "2026-10-20T13:00:00.000Z", slot_end: "2026-10-23T13:00:00.000Z" });
    expect(visitaDeHoy([estancia], ahora)?.id).toBe("hotel");
  });

  it("si ya estaba terminada, la encuentra para decir que estaba registrada", () => {
    const hecha = r({ id: "hecha", status: "completed", visited_at: "2026-10-22T17:40:00.000Z" });
    expect(visitaDeHoy([hecha], ahora)?.visited_at).toBe("2026-10-22T17:40:00.000Z");
  });

  it("entre dos del mismo día, prefiere la que aún no está registrada", () => {
    const registrada = r({ id: "a", visited_at: "2026-10-22T12:00:00.000Z", slot_start: "2026-10-22T11:00:00.000Z" });
    const pendiente = r({ id: "b", slot_start: "2026-10-22T17:30:00.000Z" });
    expect(visitaDeHoy([registrada, pendiente], ahora)?.id).toBe("b");
  });
});

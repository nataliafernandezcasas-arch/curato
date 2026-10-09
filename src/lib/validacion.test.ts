import { describe, expect, it } from "vitest";
import { bloqueaReservas, porteeCompleta, sumarCifras } from "./validacion";

const c = (path: string, v: number | null = 100) => ({ path, views: v, accounts: v, interactions: v });

describe("la portée de cada story", () => {
  it("completa: dos stories, cada una con sus tres cifras (cero vale)", () => {
    expect(porteeCompleta(["a", "b"], [c("a"), c("b", 0)])).toBe(true);
  });
  it("incompleta si falta una story, una cifra o hay menos de dos", () => {
    expect(porteeCompleta(["a", "b"], [c("a")])).toBe(false);
    expect(porteeCompleta(["a", "b"], [c("a"), c("b", null)])).toBe(false);
    expect(porteeCompleta(["a"], [c("a")])).toBe(false);
  });
  it("la suma es lo que lee el informe de la casa", () => {
    expect(sumarCifras([c("a", 10), c("b", 5)])).toEqual({ views: 15, accounts: 15, interactions: 15 });
  });
});

describe("no reservar hasta entregar", () => {
  const ahora = new Date("2026-10-20T12:00:00Z");
  const r = { status: "completed", slot_start: "2026-10-15T19:00:00Z", content_photo_paths: ["a", "b"], reach_stories: [c("a")] };

  it("una visita pasada sin todas las cifras bloquea", () => {
    expect(bloqueaReservas(r, ahora)).toBe(true);
    expect(bloqueaReservas({ ...r, status: "confirmed", content_photo_paths: [], reach_stories: null }, ahora)).toBe(true);
  });
  it("entregada, futura, cancelada o anterior al cambio, no", () => {
    expect(bloqueaReservas({ ...r, reach_stories: [c("a"), c("b")] }, ahora)).toBe(false);
    expect(bloqueaReservas({ ...r, slot_start: "2026-10-25T19:00:00Z" }, ahora)).toBe(false);
    expect(bloqueaReservas({ ...r, status: "cancelled" }, ahora)).toBe(false);
    expect(bloqueaReservas({ ...r, slot_start: "2026-09-15T19:00:00Z" }, ahora)).toBe(false);
  });
});

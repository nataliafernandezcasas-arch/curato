import { describe, expect, it } from "vitest";
import { ANTELACION_MIN_H, demasiadoPronto } from "./availability";

describe("demasiadoPronto", () => {
  const ahora = Date.parse("2026-10-17T14:59:00Z");
  it("rechaza una visita que empieza dentro de un minuto", () => {
    expect(demasiadoPronto("2026-10-17T15:00:00Z", ahora)).toBe(true);
  });
  it("acepta una con la antelación mínima", () => {
    const luego = new Date(ahora + ANTELACION_MIN_H * 3600_000).toISOString();
    expect(demasiadoPronto(luego, ahora)).toBe(false);
  });
});

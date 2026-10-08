import { describe, expect, it } from "vitest";
import { CATEGORIA, enRango, rangoDe } from "./oferta";
import { mesDeParis } from "./credito";

describe("la oferta de la casa", () => {
  it("cada categoría tiene su rango", () => {
    expect(rangoDe(CATEGORIA.hotel)).toEqual({ min: 300, max: 500 });
    expect(rangoDe(CATEGORIA.gastronomia)).toEqual({ min: 150, max: 200 });
    expect(rangoDe(CATEGORIA.wellness)).toEqual({ min: 75, max: 100 });
    expect(rangoDe(CATEGORIA.belleza)).toEqual({ min: 75, max: 100 });
  });

  it("solo vale un importe entero dentro del rango", () => {
    const r = rangoDe(CATEGORIA.gastronomia);
    expect(enRango(150, r)).toBe(true);
    expect(enRango(200, r)).toBe(true);
    expect(enRango(149, r)).toBe(false);
    expect(enRango(201, r)).toBe(false);
    expect(enRango(175.5, r)).toBe(false);
  });

  it("el mes del crédito es el de París", () => {
    // 22:30 UTC del 31 de octubre son las 23:30 en París: todavía octubre.
    expect(mesDeParis("2026-10-31T22:30:00.000Z")).toBe("2026-10");
    // Una hora después, en París ya es 1 de noviembre.
    expect(mesDeParis("2026-10-31T23:30:00.000Z")).toBe("2026-11");
  });
});

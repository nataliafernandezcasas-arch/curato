import { describe, expect, it } from "vitest";
import { mesDe, mesesHasta, tasaDeInteraccion } from "./informe-casa";

describe("informe de la casa", () => {
  it("la tasa de interacción, en porcentaje con un decimal", () => {
    expect(tasaDeInteraccion(344, 4020)).toBe(8.6);
    expect(tasaDeInteraccion(null, 4020)).toBeNull();
    expect(tasaDeInteraccion(10, 0)).toBeNull();
  });
  it("los meses, en la hora de París y en orden", () => {
    expect(mesDe("2026-10-31T23:30:00Z")).toBe("2026-11");
    expect(mesesHasta("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

import { describe, expect, it } from "vitest";
import { costeDelMes, costePorMilVistas, costePorVisita, mesDe, mesesHasta, tasaDeInteraccion, valorPublicitario } from "./valor";

describe("valor", () => {
  it("el equivalente publicitario sale del coste por mil vistas", () => {
    expect(valorPublicitario(15030, 12)).toBe(180);
    expect(valorPublicitario(0)).toBe(0);
  });
  it("el coste del mes suma la suscripción y lo ofrecido", () => {
    expect(costeDelMes(600)).toBe(899);
    expect(costePorVisita(899, 3)).toBe(300);
    expect(costePorVisita(899, 0)).toBeNull();
    expect(costePorMilVistas(899, 15030)).toBe(59.8);
    expect(costePorMilVistas(899, 0)).toBeNull();
  });
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

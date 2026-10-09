import { describe, expect, it } from "vitest";
import { firmaTarjeta, matrizQR, tarjetaValida } from "./codigo-visita";

describe("la tarjeta del código en el correo", () => {
  it("la firma vale para su visita y no para otra", () => {
    process.env.CALENDAR_SECRET = "prueba";
    expect(tarjetaValida("a", firmaTarjeta("a"))).toBe(true);
    expect(tarjetaValida("b", firmaTarjeta("a"))).toBe(false);
  });

  it("el QR es una matriz cuadrada de módulos", () => {
    const m = matrizQR("CURATO-VISITE:K7M4QX");
    expect(m.length).toBeGreaterThan(20);
    expect(m.every((fila) => fila.length === m.length)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { phylloDePrueba, seguidoresCreibles } from "./storyteller-dossier";

describe("los seguidores que ve la casa", () => {
  it("la cifra de Phyllo, si es creíble", () => {
    expect(seguidoresCreibles(12000, 10000, false)).toBe(12000);
  });
  it("la declarada, si Phyllo devuelve mucho menos (cifras de prueba)", () => {
    expect(seguidoresCreibles(85, 15000, false)).toBe(15000);
  });
  it("con Phyllo en pruebas manda la del admin, aunque Phyllo dé otra creíble", () => {
    expect(seguidoresCreibles(85, 71000, true)).toBe(71000);
    expect(seguidoresCreibles(60000, 71000, true)).toBe(71000);
    // Sin cifra del admin, lo que haya.
    expect(seguidoresCreibles(85, null, true)).toBe(85);
  });
  it("Staging y sandbox son pruebas; la URL de producción no", () => {
    expect(phylloDePrueba(undefined)).toBe(true);
    expect(phylloDePrueba("https://api.staging.getphyllo.com")).toBe(true);
    expect(phylloDePrueba("https://api.getphyllo.com")).toBe(false);
  });
  it("sin Phyllo, la declarada; sin nada, nada", () => {
    expect(seguidoresCreibles(null, 15000)).toBe(15000);
    expect(seguidoresCreibles(null, null)).toBeNull();
  });
});

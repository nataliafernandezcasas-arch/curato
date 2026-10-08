import { describe, expect, it } from "vitest";
import { seguidoresCreibles } from "./storyteller-dossier";

describe("los seguidores que ve la casa", () => {
  it("la cifra de Phyllo, si es creíble", () => {
    expect(seguidoresCreibles(12000, 10000)).toBe(12000);
  });
  it("la declarada, si Phyllo devuelve mucho menos (cifras de prueba)", () => {
    expect(seguidoresCreibles(85, 15000)).toBe(15000);
  });
  it("sin Phyllo, la declarada; sin nada, nada", () => {
    expect(seguidoresCreibles(null, 15000)).toBe(15000);
    expect(seguidoresCreibles(null, null)).toBeNull();
  });
});

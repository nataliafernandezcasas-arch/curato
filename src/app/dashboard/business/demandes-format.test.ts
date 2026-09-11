import { describe, expect, it } from "vitest";
import { capitalizar, claveDia, compacto, dia, enLetra, hora, nombrePila, porcentaje } from "./demandes-format";

describe("los formatos de demandes", () => {
  it("los números pequeños van en letra y en femenino", () => {
    expect(enLetra(3, "fr", true)).toBe("Trois");
    expect(enLetra(1, "fr")).toBe("une");
    expect(enLetra(1, "es")).toBe("una");
    expect(enLetra(0, "fr")).toBe("aucune");
    expect(enLetra(12, "fr")).toBe("12");
  });

  it("las cifras grandes, compactas: 142 K", () => {
    expect(compacto(142000, "fr")).toBe("142 K");
    expect(compacto(142000, "en")).toBe("142 K");
  });

  it("el porcentaje, a la francesa o a la inglesa", () => {
    expect(porcentaje(4.2, "fr")).toMatch(/^4,2\s%$/);
    expect(porcentaje(4.2, "en")).toBe("4.2%");
  });

  it("el día no sale como '13 Sunday' en inglés", () => {
    const iso = "2026-09-13T17:30:00.000Z";
    expect(dia(iso, "en", false)).toBe("Sunday 13");
    expect(dia(iso, "fr", false)).toBe("Dimanche 13");
    expect(dia(iso, "fr", true)).toBe("Dimanche 13 septembre");
    expect(dia(iso, "es", true)).toBe("Domingo 13 de septiembre");
  });

  it("la hora, en París y sin cero delante en inglés", () => {
    expect(hora("2026-09-13T17:30:00.000Z", "fr")).toBe("19:30");
    expect(hora("2026-09-13T17:30:00.000Z", "en")).toMatch(/^7:30\sPM$/);
  });

  it("dos demandas del mismo día en París comparten clave", () => {
    expect(claveDia("2026-09-13T20:00:00.000Z")).toBe(claveDia("2026-09-13T09:00:00.000Z"));
    expect(claveDia("2026-09-13T22:30:00.000Z")).toBe("2026-09-14");
  });

  it("el nombre de pila y la mayúscula", () => {
    expect(nombrePila("Tereza Bolkvadze")).toBe("Tereza");
    expect(nombrePila("@terezab")).toBe("terezab");
    expect(capitalizar("jeudi")).toBe("Jeudi");
  });
});

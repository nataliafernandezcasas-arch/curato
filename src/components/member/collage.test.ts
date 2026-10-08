import { describe, expect, it } from "vitest";
import { piezasDelCollage } from "./collage";

// Cuántas celdas de la cuadrícula de dos columnas ocupa cada pieza.
const CELDAS = { alta: 2, pequena: 1, ancha: 2 } as const;

describe("el collage", () => {
  it("una pieza por foto", () => {
    for (let n = 0; n <= 13; n++) expect(piezasDelCollage(n)).toHaveLength(n);
  });

  it("nunca deja un hueco: las celdas ocupadas llenan siempre filas enteras", () => {
    for (let n = 1; n <= 13; n++) {
      const celdas = piezasDelCollage(n).reduce((s, p) => s + CELDAS[p], 0);
      expect(celdas % 2).toBe(0);
    }
  });
});

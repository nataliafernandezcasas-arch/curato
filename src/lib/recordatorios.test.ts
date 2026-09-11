import { describe, expect, it } from "vitest";
import { esCorreoDePrueba, horasQueQuedan, queToca } from "./recordatorios";

const ahora = new Date("2026-10-23T12:00:00.000Z");
const visita = (horasPasadas: number, extra: Partial<{ recordatorio_6h_at: string | null; aviso_plazo_at: string | null }> = {}) => ({
  slot_start: new Date(ahora.getTime() - horasPasadas * 3600000).toISOString(),
  recordatorio_6h_at: null,
  aviso_plazo_at: null,
  ...extra,
});

describe("qué toca con una visita sin stories", () => {
  it("antes de las 18 horas, nada", () => {
    expect(queToca(visita(2), ahora)).toBeNull();
    expect(queToca(visita(17.9), ahora)).toBeNull();
  });

  it("entre las 18 y las 24, el recordatorio", () => {
    expect(queToca(visita(18), ahora)).toBe("recordatorio");
    expect(queToca(visita(23.9), ahora)).toBe("recordatorio");
  });

  it("el recordatorio sale una sola vez", () => {
    expect(queToca(visita(20, { recordatorio_6h_at: "2026-10-23T08:00:00.000Z" }), ahora)).toBeNull();
  });

  it("entre las 24 y las 72, el aviso a Curato, una vez", () => {
    expect(queToca(visita(24), ahora)).toBe("vencida");
    expect(queToca(visita(71), ahora)).toBe("vencida");
    expect(queToca(visita(30, { aviso_plazo_at: "2026-10-23T06:00:00.000Z" }), ahora)).toBeNull();
  });

  it("pasadas las 72 horas ya no se avisa", () => {
    expect(queToca(visita(72), ahora)).toBeNull();
    expect(queToca(visita(200), ahora)).toBeNull();
  });
});

describe("las horas que quedan", () => {
  it("se redondean hacia arriba y nunca bajan de cero", () => {
    expect(horasQueQuedan(visita(18).slot_start, ahora)).toBe(6);
    expect(horasQueQuedan(visita(20.5).slot_start, ahora)).toBe(4);
    expect(horasQueQuedan(visita(30).slot_start, ahora)).toBe(0);
  });
});

describe("las cuentas de prueba", () => {
  it("no reciben correos", () => {
    expect(esCorreoDePrueba("apercu@curato.test")).toBe(true);
    expect(esCorreoDePrueba(null)).toBe(true);
    expect(esCorreoDePrueba("tereza@gmail.com")).toBe(false);
  });
});

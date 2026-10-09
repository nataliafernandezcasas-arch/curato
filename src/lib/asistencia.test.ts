import { describe, expect, it } from "vitest";
import { asistenciaConfirmada, avisosQueTocan, cancelacionTardia, pideConfirmacion, type ReservaAntes } from "./asistencia";

const H = 3600 * 1000;
const visita = new Date("2026-10-20T19:00:00Z");
const antes = (h: number) => new Date(visita.getTime() - h * H);
const base = (o: Partial<ReservaAntes> = {}): ReservaAntes => ({
  status: "confirmed",
  slot_start: visita.toISOString(),
  created_at: antes(72).toISOString(),
  asistencia_confirmada_at: null,
  aviso_confirmar_at: null,
  recordatorio_confirmar_at: null,
  correo_qr_at: null,
  aviso_qr_at: null,
  ...o,
});

describe("confirmar la asistencia", () => {
  it("se pide a quien reservó con más de 24 h; quien reservó el mismo día ya está confirmado", () => {
    expect(pideConfirmacion(base())).toBe(true);
    expect(asistenciaConfirmada(base({ created_at: antes(5).toISOString() }))).toBe(true);
  });

  it("se pide a falta de 24 h, no antes", () => {
    expect(avisosQueTocan(base(), antes(30))).toEqual([]);
    expect(avisosQueTocan(base(), antes(23))).toEqual(["pedir"]);
  });

  it("se recuerda a falta de 6 h si no contestó, una sola vez", () => {
    const pedida = base({ aviso_confirmar_at: antes(24).toISOString() });
    expect(avisosQueTocan(pedida, antes(5))).toEqual(["recordar"]);
    expect(avisosQueTocan({ ...pedida, recordatorio_confirmar_at: antes(5).toISOString() }, antes(4))).toEqual([]);
  });

  it("si la casa aceptó tarde, dentro de las 6 h, un solo aviso", () => {
    expect(avisosQueTocan(base(), antes(3))).toEqual(["pedir"]);
    expect(avisosQueTocan(base({ aviso_confirmar_at: antes(3).toISOString() }), antes(2))).toEqual([]);
  });

  it("quien ya confirmó no recibe nada de esto", () => {
    expect(avisosQueTocan(base({ asistencia_confirmada_at: antes(30).toISOString() }), antes(5))).toEqual([]);
  });
});

describe("el código QR", () => {
  const confirmada = base({ asistencia_confirmada_at: antes(30).toISOString() });

  it("el correo una hora antes y el aviso quince minutos antes", () => {
    expect(avisosQueTocan(confirmada, antes(1.5))).toEqual([]);
    expect(avisosQueTocan(confirmada, antes(0.9))).toEqual(["correoQR"]);
    expect(avisosQueTocan({ ...confirmada, correo_qr_at: "x" }, antes(0.2))).toEqual(["avisoQR"]);
  });

  it("una visita que no está confirmada por la casa no recibe nada", () => {
    expect(avisosQueTocan({ ...confirmada, status: "pending_review" }, antes(0.2))).toEqual([]);
  });

  it("pasada media hora de la visita, ya no", () => {
    expect(avisosQueTocan(confirmada, new Date(visita.getTime() + 40 * 60 * 1000))).toEqual([]);
  });
});

describe("cancelar", () => {
  it("con más de 24 h es gratis; con menos, se pierde el crédito", () => {
    expect(cancelacionTardia(base(), antes(30))).toBe(false);
    expect(cancelacionTardia(base(), antes(10))).toBe(true);
  });
  it("una demanda que la casa aún no aceptó se cancela gratis", () => {
    expect(cancelacionTardia(base({ status: "pending_review" }), antes(2))).toBe(false);
  });
});

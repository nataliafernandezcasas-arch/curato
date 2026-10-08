import { describe, expect, it } from "vitest";
import { queTocaDerechos } from "./derechos";

const ahora = new Date("2026-10-23T12:00:00.000Z");
const DIA = 24 * 3600000;
// diasQueQuedan negativo: la exclusividad venció hace ese tiempo.
const reserva = (
  diasQueQuedan: number,
  extra: Partial<{ aviso_derechos_7d_at: string | null; aviso_derechos_fin_at: string | null }> = {}
) => ({
  content_rights_expires_at: new Date(ahora.getTime() + diasQueQuedan * DIA).toISOString(),
  aviso_derechos_7d_at: null,
  aviso_derechos_fin_at: null,
  ...extra,
});
const YA = "2026-10-20T08:00:00.000Z";

describe("qué toca con los derechos de una reserva", () => {
  it("sin fecha de fin, o con más de siete días por delante, nada", () => {
    expect(queTocaDerechos({ content_rights_expires_at: null, aviso_derechos_7d_at: null, aviso_derechos_fin_at: null }, ahora).enviar).toBeNull();
    expect(queTocaDerechos(reserva(30), ahora).enviar).toBeNull();
    expect(queTocaDerechos(reserva(7.01), ahora).enviar).toBeNull();
  });

  it("en los últimos siete días, el primer aviso, una vez", () => {
    expect(queTocaDerechos(reserva(7), ahora)).toEqual({ enviar: "7d", saltarSieteDias: false });
    expect(queTocaDerechos(reserva(0.01), ahora).enviar).toBe("7d");
    expect(queTocaDerechos(reserva(5, { aviso_derechos_7d_at: YA }), ahora).enviar).toBeNull();
  });

  it("el día del fin, el segundo aviso, una vez", () => {
    expect(queTocaDerechos(reserva(0, { aviso_derechos_7d_at: YA }), ahora)).toEqual({ enviar: "fin", saltarSieteDias: false });
    expect(queTocaDerechos(reserva(-1, { aviso_derechos_7d_at: YA }), ahora).enviar).toBe("fin");
    expect(queTocaDerechos(reserva(-1, { aviso_derechos_7d_at: YA, aviso_derechos_fin_at: YA }), ahora).enviar).toBeNull();
  });

  it("vencida la exclusividad, el de los siete días ya no sale: se marca y se salta", () => {
    expect(queTocaDerechos(reserva(-0.5), ahora)).toEqual({ enviar: "fin", saltarSieteDias: true });
  });

  it("pasados tres días del fin ya no se avisa: no hay ráfaga al desplegar", () => {
    expect(queTocaDerechos(reserva(-3.01), ahora)).toEqual({ enviar: null, saltarSieteDias: false });
    expect(queTocaDerechos(reserva(-200), ahora).enviar).toBeNull();
  });
});

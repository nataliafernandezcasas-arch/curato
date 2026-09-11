import { describe, expect, it } from "vitest";
import { isOpenSlot, parisParts, parisToIso } from "./availability";

describe("la hora de París", () => {
  it("parisToIso da el instante exacto en verano (UTC+2)", () => {
    expect(parisToIso("2026-09-16", "12:30")).toBe("2026-09-16T10:30:00.000Z");
  });

  it("y en invierno (UTC+1)", () => {
    expect(parisToIso("2026-12-03", "19:00")).toBe("2026-12-03T18:00:00.000Z");
  });

  it("parisParts deshace lo que hace parisToIso", () => {
    const p = parisParts(parisToIso("2026-10-22", "19:30"));
    expect(p).toEqual({ ymd: "2026-10-22", hm: "19:30", dow: 4 });
  });
});

describe("una franja abierta", () => {
  const horario = [
    { day: 4, start: "19:00", end: "22:00" }, // jueves por la noche
  ];

  it("dentro del horario, sí", () => {
    expect(isOpenSlot(parisToIso("2026-10-22", "19:30"), horario, [])).toBe(true);
  });

  it("a la hora de cierre, no: la franja empieza antes de cerrar", () => {
    expect(isOpenSlot(parisToIso("2026-10-22", "22:00"), horario, [])).toBe(false);
  });

  it("otro día de la semana, no", () => {
    expect(isOpenSlot(parisToIso("2026-10-23", "19:30"), horario, [])).toBe(false);
  });

  it("un día bloqueado, no", () => {
    expect(isOpenSlot(parisToIso("2026-10-22", "19:30"), horario, [{ date: "2026-10-22" }])).toBe(false);
  });

  it("una casa sin horario acepta cualquier hora", () => {
    expect(isOpenSlot(parisToIso("2026-10-22", "03:00"), [], [])).toBe(true);
  });
});
